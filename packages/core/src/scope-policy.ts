export interface ScopePolicy {
  tenantId: string;
  allowedConnections: {
    [connection: string]: {
      scopes: string[];
    };
  };
}

export interface ScopePolicyViolation {
  tenantId: string;
  connection: string;
  requestedScopes: string[];
  allowedScopes: string[];
  deniedScopes: string[];
}

export class ScopePolicyEngine {
  private policies: Map<string, ScopePolicy> = new Map();

  register(policy: ScopePolicy): void {
    this.policies.set(policy.tenantId, policy);
  }

  getPolicy(tenantId: string): ScopePolicy | null {
    return this.policies.get(tenantId) ?? null;
  }

  validate(
    tenantId: string,
    connection: string,
    requestedScopes: string[]
  ): { allowed: boolean; violation?: ScopePolicyViolation } {
    const policy = this.policies.get(tenantId);

    if (!policy) {
      return {
        allowed: false,
        violation: {
          tenantId,
          connection,
          requestedScopes,
          allowedScopes: [],
          deniedScopes: requestedScopes,
        },
      };
    }

    const connectionPolicy = policy.allowedConnections[connection];

    if (!connectionPolicy) {
      return {
        allowed: false,
        violation: {
          tenantId,
          connection,
          requestedScopes,
          allowedScopes: [],
          deniedScopes: requestedScopes,
        },
      };
    }

    const allowedScopes = connectionPolicy.scopes;
    const deniedScopes = requestedScopes.filter(
      (s) => !allowedScopes.includes(s)
    );

    if (deniedScopes.length > 0) {
      return {
        allowed: false,
        violation: {
          tenantId,
          connection,
          requestedScopes,
          allowedScopes,
          deniedScopes,
        },
      };
    }

    return { allowed: true };
  }
}

export const globalScopePolicyEngine = new ScopePolicyEngine();
