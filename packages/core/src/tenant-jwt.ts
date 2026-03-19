import { NextRequest, NextResponse } from "next/server";

export interface TenantClaims {
  tenantId: string;
  subTenantId?: string;
  agentScopes: string[];
  allowedConnections: string[];
}

export interface VaultGuardConfig {
  resolveTenant: (req: NextRequest) => Promise<TenantClaims | null>;
  publicPaths?: string[];
}

export function withTenantContext(config: VaultGuardConfig) {
  return async function middleware(req: NextRequest): Promise<NextResponse> {
    const isPublic = config.publicPaths?.some((p) =>
      req.nextUrl.pathname.startsWith(p)
    );

    if (isPublic) return NextResponse.next();

    const claims = await config.resolveTenant(req);

    if (!claims) {
      return NextResponse.json(
        { error: "Tenant not found", code: "TENANT_UNRESOLVED" },
        { status: 403 }
      );
    }

    const res = NextResponse.next();
    res.headers.set("x-tenant-id", claims.tenantId);
    res.headers.set("x-agent-scopes", claims.agentScopes.join(","));
    res.headers.set("x-allowed-connections", claims.allowedConnections.join(","));

    if (claims.subTenantId) {
      res.headers.set("x-sub-tenant-id", claims.subTenantId);
    }

    return res;
  };
}

export function getTenantClaims(req: Request): TenantClaims {
  const tenantId = req.headers.get("x-tenant-id");

  if (!tenantId) {
    throw new Error(
      "VaultGuard: tenantId missing from request. Is withTenantContext middleware configured?"
    );
  }

  return {
    tenantId,
    subTenantId: req.headers.get("x-sub-tenant-id") ?? undefined,
    agentScopes: req.headers.get("x-agent-scopes")?.split(",") ?? [],
    allowedConnections: req.headers.get("x-allowed-connections")?.split(",") ?? [],
  };
}
