import { TenantClaims } from "./tenant-jwt";
import { globalScopePolicyEngine } from "./scope-policy";

export interface VaultTokenRequest {
  connection: string;
  scopes: string[];
  claims: TenantClaims;
}

export interface VaultTokenResponse {
  accessToken: string;
  connection: string;
  tenantId: string;
  scopes: string[];
  expiresAt?: number;
}

export interface VaultError {
  code:
    | "POLICY_VIOLATION"
    | "CONNECTION_NOT_ALLOWED"
    | "TOKEN_EXCHANGE_FAILED"
    | "TENANT_MISMATCH";
  message: string;
  tenantId: string;
  connection: string;
}

export type VaultResult =
  | { success: true; data: VaultTokenResponse }
  | { success: false; error: VaultError };

export async function tenantScopedVault(
  request: VaultTokenRequest,
  tokenExchangeFn: (
    connection: string,
    scopes: string[]
  ) => Promise<string>
): Promise<VaultResult> {
  const { connection, scopes, claims } = request;
  const { tenantId, allowedConnections } = claims;

  // Step 1 — check connection is allowed for this tenant
  if (!allowedConnections.includes(connection)) {
    return {
      success: false,
      error: {
        code: "CONNECTION_NOT_ALLOWED",
        message: `Tenant ${tenantId} is not permitted to use connection: ${connection}`,
        tenantId,
        connection,
      },
    };
  }

  // Step 2 — validate scopes against tenant policy
  const { allowed, violation } = globalScopePolicyEngine.validate(
    tenantId,
    connection,
    scopes
  );

  if (!allowed && violation) {
    return {
      success: false,
      error: {
        code: "POLICY_VIOLATION",
        message: `Tenant ${tenantId} requested denied scopes on ${connection}: ${violation.deniedScopes.join(", ")}`,
        tenantId,
        connection,
      },
    };
  }

  // Step 3 — exchange token via Auth0 Token Vault
  try {
    const accessToken = await tokenExchangeFn(connection, scopes);

    return {
      success: true,
      data: {
        accessToken,
        connection,
        tenantId,
        scopes,
        expiresAt: Date.now() + 3600 * 1000,
      },
    };
  } catch (err: any) {
    return {
      success: false,
      error: {
        code: "TOKEN_EXCHANGE_FAILED",
        message: err?.message ?? "Token exchange failed",
        tenantId,
        connection,
      },
    };
  }
}
