// Tenant JWT middleware
export {
  withTenantContext,
  getTenantClaims,
} from "./tenant-jwt";

export type {
  TenantClaims,
  VaultGuardConfig,
} from "./tenant-jwt";

// Scope policy engine
export {
  ScopePolicyEngine,
  globalScopePolicyEngine,
} from "./scope-policy";

export type {
  ScopePolicy,
  ScopePolicyViolation,
} from "./scope-policy";

// Tenant scoped vault
export {
  tenantScopedVault,
} from "./vault";

export type {
  VaultTokenRequest,
  VaultTokenResponse,
  VaultError,
  VaultResult,
} from "./vault";

// Audit logger
export {
  AuditLogger,
  globalAuditLogger,
  consoleAuditWriter,
} from "./audit";

export type {
  AuditEntry,
  AuditAction,
  AuditWriter,
} from "./audit";
