export type AuditAction =
  | "VAULT_TOKEN_REQUESTED"
  | "VAULT_TOKEN_GRANTED"
  | "VAULT_TOKEN_DENIED"
  | "STEP_UP_INITIATED"
  | "STEP_UP_APPROVED"
  | "STEP_UP_DENIED"
  | "POLICY_VIOLATION_ATTEMPTED"
  | "CROSS_TENANT_ATTEMPT";

export interface AuditEntry {
  id: string;
  timestamp: string;
  tenantId: string;
  subTenantId?: string;
  agentId: string;
  userId?: string;
  action: AuditAction;
  connection: string;
  scopesRequested: string[];
  scopesGranted: string[];
  stepUpRequired: boolean;
  success: boolean;
  errorCode?: string;
  metadata?: Record<string, unknown>;
}

export type AuditWriter = (entry: AuditEntry) => Promise<void>;

export class AuditLogger {
  private writers: AuditWriter[] = [];

  addWriter(writer: AuditWriter): void {
    this.writers.push(writer);
  }

  async log(entry: Omit<AuditEntry, "id" | "timestamp">): Promise<void> {
    const full: AuditEntry = {
      ...entry,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
    };

    await Promise.allSettled(this.writers.map((w) => w(full)));
  }

  async logVaultRequest(params: {
    tenantId: string;
    subTenantId?: string;
    agentId: string;
    userId?: string;
    connection: string;
    scopesRequested: string[];
    scopesGranted: string[];
    stepUpRequired: boolean;
    success: boolean;
    errorCode?: string;
  }): Promise<void> {
    await this.log({
      ...params,
      action: params.success ? "VAULT_TOKEN_GRANTED" : "VAULT_TOKEN_DENIED",
    });
  }

  async logCrossTenantAttempt(params: {
    tenantId: string;
    agentId: string;
    targetTenantId: string;
    connection: string;
  }): Promise<void> {
    await this.log({
      tenantId: params.tenantId,
      agentId: params.agentId,
      action: "CROSS_TENANT_ATTEMPT",
      connection: params.connection,
      scopesRequested: [],
      scopesGranted: [],
      stepUpRequired: false,
      success: false,
      errorCode: "CROSS_TENANT_ATTEMPT",
      metadata: {
        targetTenantId: params.targetTenantId,
      },
    });
  }
}

export const globalAuditLogger = new AuditLogger();

// Console writer — used in development
export const consoleAuditWriter: AuditWriter = async (entry) => {
  console.log(
    `[VaultGuard Audit] ${entry.timestamp} | ${entry.tenantId} | ${entry.action} | ${entry.connection} | success:${entry.success}`
  );
};
