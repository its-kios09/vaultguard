import Link from "next/link";
import {
  Card,
  CardHeader,
  CardBody,
  MetricCard,
  PageHeader,
  ScopeTag,
  StatusBadge,
  SectionLabel,
} from "@/components/ui";

const METRICS = [
  { label: "Vault Requests",      value: "1,284", delta: "+24 today",              color: "purple" as const },
  { label: "Tokens Granted",      value: "1,271", delta: "98.9% success rate",     color: "green"  as const },
  { label: "Threats Blocked",     value: "13",    delta: "cross-tenant attempts",  color: "red"    as const },
  { label: "Active Connections",  value: "3",     delta: "Google · Slack · GitHub" },
];

const CONNECTIONS = [
  { icon: "🗓", name: "Google Calendar", scopes: "calendar.events.write · calendar.readonly", status: "connected"    as const },
  { icon: "💬", name: "Slack",           scopes: "chat:write · channels:read",                status: "connected"    as const },
  { icon: "🐙", name: "GitHub",          scopes: "repo · pull_requests",                      status: "connected"    as const },
  { icon: "✉️", name: "Gmail",           scopes: "gmail.send",                                status: "pending"      as const },
];

const POLICIES = [
  { conn: "Google Calendar", scopes: ["events.write", "readonly"] },
  { conn: "Slack",           scopes: ["chat:write", "channels:read"] },
  { conn: "GitHub",          scopes: ["repo", "pr:read"] },
  { conn: "Gmail",           scopes: ["send"] },
];

const AUDIT_EVENTS = [
  { dot: "success", action: "VAULT_TOKEN_GRANTED",  meta: "google-oauth2 · calendar.events.write", time: "2s ago"  },
  { dot: "success", action: "VAULT_TOKEN_GRANTED",  meta: "slack · chat:write",                    time: "14s ago" },
  { dot: "stepup",  action: "STEP_UP_INITIATED",    meta: "github · repo · high-stakes action",    time: "1m ago"  },
  { dot: "denied",  action: "VAULT_TOKEN_DENIED",   meta: "POLICY_VIOLATION · gmail.delete",       time: "3m ago"  },
  { dot: "denied",  action: "CROSS_TENANT_ATTEMPT", meta: "agent tried tenant-002 vault",          time: "8m ago"  },
];

const THREATS = [
  { title: "Cross-tenant vault attempt blocked",   desc: "agent-id:ollama-local · tried accessing tenant-002 google-oauth2 token · blocked at SDK layer", time: "8m ago"  },
  { title: "Policy violation — scope denied",      desc: "agent requested gmail.delete · not in tenant allow-list · request rejected",                    time: "3m ago"  },
  { title: "Step-up auth timeout",                 desc: "user did not approve github repo access within 60s · action cancelled",                         time: "12m ago" },
];

const DOT_COLORS: Record<string, string> = {
  success: "var(--accent-green)",
  denied:  "var(--accent-red)",
  stepup:  "var(--accent-amber)",
};

export default function DashboardPage() {
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
        subtitle="Tenant DEMO-001 · Auth0 Token Vault · VaultGuard SDK v0.1.0"
      />

      {/* Metrics */}
      <div className="grid-4" style={{ marginBottom: "32px" }}>
        {METRICS.map((m) => (
          <MetricCard key={m.label} {...m} />
        ))}
      </div>

      {/* Row 1 */}
      <div className="grid-2" style={{ marginBottom: "20px" }}>
        <Card>
          <CardHeader
            title="Connected Accounts"
            action={<Link href="/dashboard/connections" className="card-action">Manage →</Link>}
          />
          <CardBody>
            {CONNECTIONS.map((c) => (
              <div className="conn-item" key={c.name}>
                <div className="conn-left">
                  <div className="conn-icon">{c.icon}</div>
                  <div>
                    <div className="conn-name">{c.name}</div>
                    <div className="conn-scopes-text">{c.scopes}</div>
                  </div>
                </div>
                <StatusBadge status={c.status} />
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
            {POLICIES.map((p) => (
              <div className="policy-row" key={p.conn}>
                <div className="policy-conn">{p.conn}</div>
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
            {AUDIT_EVENTS.map((a, i) => (
              <div className="audit-item" key={i}>
                <div className="audit-dot" style={{ background: DOT_COLORS[a.dot] }} />
                <div style={{ flex: 1 }}>
                  <div className="audit-action">{a.action}</div>
                  <div className="audit-meta">{a.meta}</div>
                </div>
                <div className="audit-time">{a.time}</div>
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
            {THREATS.map((t, i) => (
              <div className="threat-item" key={i}>
                <div style={{ fontSize: "14px", marginTop: "1px" }}>⚠</div>
                <div style={{ flex: 1 }}>
                  <div className="threat-title">{t.title}</div>
                  <div className="threat-desc">{t.desc}</div>
                </div>
                <div className="threat-time">{t.time}</div>
              </div>
            ))}
          </CardBody>
        </Card>
      </div>
    </>
  );
}
