import Link from "next/link";
import { auth0 } from "@/lib/auth0";
import { prisma } from "@/lib/prisma";
import {
  Card,
  CardHeader,
  CardBody,
  MetricCard,
  PageHeader,
  ScopeTag,
  StatusBadge,
} from "@/components/ui";

const DOT_COLORS: Record<string, string> = {
  VAULT_TOKEN_GRANTED:  "var(--accent-green)",
  VAULT_TOKEN_DENIED:   "var(--accent-red)",
  STEP_UP_INITIATED:    "var(--accent-amber)",
  STEP_UP_APPROVED:     "var(--accent-green)",
  CROSS_TENANT_ATTEMPT: "var(--accent-red)",
};

const CONNECTION_ICONS: Record<string, string> = {
  "google-oauth2": "🗓",
  slack:           "💬",
  github:          "🐙",
  gmail:           "✉️",
  spotify:         "🎵",
  notion:          "📝",
};

function timeAgo(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

export default async function DashboardPage() {
  const session = await auth0.getSession();
  const tenantId = "demo-001";

  const [
    totalRequests,
    tokensGranted,
    threatsBlocked,
    activeConnections,
    recentAudit,
    connections,
    policies,
  ] = await Promise.all([
    prisma.auditLog.count({ where: { tenantId } }),
    prisma.auditLog.count({ where: { tenantId, action: "VAULT_TOKEN_GRANTED", success: true } }),
    prisma.auditLog.count({ where: { tenantId, action: { in: ["CROSS_TENANT_ATTEMPT", "VAULT_TOKEN_DENIED"] } } }),
    prisma.tenantConnection.count({ where: { tenantId, status: "connected" } }),
    prisma.auditLog.findMany({ where: { tenantId }, orderBy: { timestamp: "desc" }, take: 5 }),
    prisma.tenantConnection.findMany({ where: { tenantId }, orderBy: { provider: "asc" } }),
    prisma.scopePolicy.findMany({ where: { tenantId }, orderBy: { connection: "asc" } }),
  ]);

  const successRate = totalRequests > 0
    ? ((tokensGranted / totalRequests) * 100).toFixed(1)
    : "0.0";

  const threats = await prisma.auditLog.findMany({
    where: { tenantId, action: { in: ["CROSS_TENANT_ATTEMPT", "VAULT_TOKEN_DENIED", "POLICY_VIOLATION"] } },
    orderBy: { timestamp: "desc" },
    take: 3,
  });

  return (
    <>
      <style>{`
        .conn-item { display: flex; align-items: center; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.04); }
        .conn-item:last-child { border-bottom: none; }
        .conn-left { display: flex; align-items: center; gap: 12px; }
        .conn-icon { width: 36px; height: 36px; border-radius: 9px; display: flex; align-items: center; justify-content: center; font-size: 16px; border: 1px solid var(--border-base); background: var(--bg-surface); }
        .conn-name { font-size: 14px; font-weight: 500; color: var(--text-primary); }
        .conn-scopes-text { font-size: 11px; color: var(--text-muted); font-family: var(--font-mono); margin-top: 2px; }
        .policy-row { display: flex; align-items: center; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.04); }
        .policy-row:last-child { border-bottom: none; }
        .policy-conn { font-size: 13px; font-weight: 500; color: var(--text-primary); }
        .policy-scopes { display: flex; gap: 6px; flex-wrap: wrap; justify-content: flex-end; }
        .audit-item { display: flex; align-items: flex-start; gap: 12px; padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.04); }
        .audit-item:last-child { border-bottom: none; }
        .audit-dot { width: 8px; height: 8px; border-radius: 50%; margin-top: 5px; flex-shrink: 0; }
        .audit-action { font-size: 13px; font-weight: 500; color: var(--text-primary); margin-bottom: 3px; font-family: var(--font-mono); }
        .audit-meta { font-size: 11px; color: var(--text-muted); font-family: var(--font-mono); }
        .audit-time { font-size: 11px; color: var(--text-hint); font-family: var(--font-mono); margin-left: auto; white-space: nowrap; flex-shrink: 0; }
        .threat-item { display: flex; align-items: flex-start; gap: 12px; padding: 14px 16px; background: var(--bg-red); border: 1px solid var(--border-red); border-radius: var(--radius-md); margin-bottom: 10px; }
        .threat-item:last-child { margin-bottom: 0; }
        .threat-title { font-size: 13px; font-weight: 600; color: var(--accent-red); margin-bottom: 3px; }
        .threat-desc { font-size: 12px; color: var(--text-muted); font-family: var(--font-mono); line-height: 1.5; }
        .threat-time { font-size: 11px; color: rgba(255,107,107,0.4); font-family: var(--font-mono); margin-left: auto; white-space: nowrap; flex-shrink: 0; }
      `}</style>

      <PageHeader
        title="Overview"
        subtitle={`${session?.user.email} · Auth0 Token Vault · VaultGuard SDK v0.1.0`}
      />

      {/* Metrics from real DB */}
      <div className="grid-4" style={{ marginBottom: "32px" }}>
        <MetricCard
          label="Vault Requests"
          value={totalRequests.toLocaleString()}
          delta="total requests"
          color="purple"
        />
        <MetricCard
          label="Tokens Granted"
          value={tokensGranted.toLocaleString()}
          delta={`${successRate}% success rate`}
          color="green"
        />
        <MetricCard
          label="Threats Blocked"
          value={threatsBlocked.toLocaleString()}
          delta="cross-tenant attempts"
          color="red"
        />
        <MetricCard
          label="Active Connections"
          value={activeConnections.toLocaleString()}
          delta={connections.filter(c => c.status === "connected").map(c => c.provider).join(" · ")}
        />
      </div>

      {/* Row 1 */}
      <div className="grid-2" style={{ marginBottom: "20px" }}>
        <Card>
          <CardHeader
            title="Connected Accounts"
            action={<Link href="/dashboard/connections" className="card-action">Manage →</Link>}
          />
          <CardBody>
            {connections.map((c) => (
              <div className="conn-item" key={c.id}>
                <div className="conn-left">
                  <div className="conn-icon">{CONNECTION_ICONS[c.provider] ?? "🔗"}</div>
                  <div>
                    <div className="conn-name">{c.provider}</div>
                    <div className="conn-scopes-text">
                      {c.scopesGranted.join(" · ") || "no scopes"}
                    </div>
                  </div>
                </div>
                <StatusBadge status={c.status as "connected" | "disconnected" | "connecting" | "pending"} />
              </div>
            ))}
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Scope Policy"
            action={<Link href="/dashboard/policy" className="card-action">Edit →</Link>}
          />
          <CardBody>
            {policies.map((p) => (
              <div className="policy-row" key={p.id}>
                <div className="policy-conn">{p.connection}</div>
                <div className="policy-scopes">
                  {p.scopes.map((s) => <ScopeTag key={s} scope={s} />)}
                </div>
              </div>
            ))}
          </CardBody>
        </Card>
      </div>

      {/* Row 2 */}
      <div className="grid-2">
        <Card>
          <CardHeader
            title="Recent Audit Events"
            action={<Link href="/dashboard/audit" className="card-action">View all →</Link>}
          />
          <CardBody>
            {recentAudit.map((a) => (
              <div className="audit-item" key={a.id}>
                <div
                  className="audit-dot"
                  style={{ background: DOT_COLORS[a.action] ?? "var(--text-muted)" }}
                />
                <div style={{ flex: 1 }}>
                  <div className="audit-action">{a.action}</div>
                  <div className="audit-meta">
                    {a.connection} · {a.scopesRequested.join(", ")}
                    {a.errorCode ? ` · ${a.errorCode}` : ""}
                  </div>
                </div>
                <div className="audit-time">{timeAgo(a.timestamp.toISOString())}</div>
              </div>
            ))}
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Threat Detection"
            action={<Link href="/dashboard/threats" className="card-action">View all →</Link>}
          />
          <CardBody>
            {threats.length === 0 ? (
              <div style={{ color: "var(--text-muted)", fontSize: "13px", padding: "12px 0" }}>
                No threats detected
              </div>
            ) : (
              threats.map((t) => (
                <div className="threat-item" key={t.id}>
                  <div style={{ fontSize: "14px", marginTop: "1px" }}>⚠</div>
                  <div style={{ flex: 1 }}>
                    <div className="threat-title">{t.action.replace(/_/g, " ")}</div>
                    <div className="threat-desc">
                      {t.connection} · {t.scopesRequested.join(", ")}
                      {t.errorCode ? ` · ${t.errorCode}` : ""}
                    </div>
                  </div>
                  <div className="threat-time">{timeAgo(t.timestamp.toISOString())}</div>
                </div>
              ))
            )}
          </CardBody>
        </Card>
      </div>
    </>
  );
}
