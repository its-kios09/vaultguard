"use client";

import { useState, useEffect } from "react";

type Threat = {
  id: string;
  timestamp: string;
  type: "CROSS_TENANT_ATTEMPT" | "POLICY_VIOLATION" | "STEP_UP_TIMEOUT" | "INVALID_CONNECTION" | "SCOPE_ESCALATION";
  severity: "CRITICAL" | "HIGH" | "MEDIUM";
  agentId: string;
  tenantId: string;
  targetTenantId?: string;
  connection: string;
  scopesRequested: string[];
  blockedAt: string;
  description: string;
};

const INITIAL_THREATS: Threat[] = [
  {
    id: "1",
    timestamp: new Date(Date.now() - 8 * 60000).toISOString(),
    type: "CROSS_TENANT_ATTEMPT",
    severity: "CRITICAL",
    agentId: "ollama-local",
    tenantId: "DEMO-001",
    targetTenantId: "DEMO-002",
    connection: "google-oauth2",
    scopesRequested: ["calendar.events.write"],
    blockedAt: "SDK · tenantScopedVault()",
    description: "Agent attempted to request vault token belonging to tenant DEMO-002. Blocked before Auth0 was contacted.",
  },
  {
    id: "2",
    timestamp: new Date(Date.now() - 3 * 60000).toISOString(),
    type: "POLICY_VIOLATION",
    severity: "HIGH",
    agentId: "ollama-local",
    tenantId: "DEMO-001",
    connection: "gmail",
    scopesRequested: ["gmail.delete"],
    blockedAt: "SDK · ScopePolicyEngine",
    description: "Agent requested gmail.delete scope which is not in tenant DEMO-001 allow-list. Request rejected at policy layer.",
  },
  {
    id: "3",
    timestamp: new Date(Date.now() - 12 * 60000).toISOString(),
    type: "STEP_UP_TIMEOUT",
    severity: "MEDIUM",
    agentId: "ollama-local",
    tenantId: "DEMO-001",
    connection: "github",
    scopesRequested: ["repo"],
    blockedAt: "CIBA · step-up auth",
    description: "User did not approve high-stakes GitHub repo access within 60 seconds. Action was cancelled automatically.",
  },
  {
    id: "4",
    timestamp: new Date(Date.now() - 28 * 60000).toISOString(),
    type: "SCOPE_ESCALATION",
    severity: "HIGH",
    agentId: "ollama-local",
    tenantId: "DEMO-001",
    connection: "slack",
    scopesRequested: ["admin"],
    blockedAt: "SDK · ScopePolicyEngine",
    description: "Agent attempted to request Slack admin scope — a dangerous escalation beyond approved scopes. Blocked immediately.",
  },
  {
    id: "5",
    timestamp: new Date(Date.now() - 45 * 60000).toISOString(),
    type: "INVALID_CONNECTION",
    severity: "MEDIUM",
    agentId: "ollama-local",
    tenantId: "DEMO-001",
    connection: "stripe",
    scopesRequested: ["charges:write"],
    blockedAt: "SDK · TenantJWT middleware",
    description: "Agent requested connection to Stripe which is not in tenant DEMO-001 allowed connections list.",
  },
];

const NEW_THREATS: Omit<Threat, "id" | "timestamp">[] = [
  {
    type: "CROSS_TENANT_ATTEMPT",
    severity: "CRITICAL",
    agentId: "ollama-local",
    tenantId: "DEMO-001",
    targetTenantId: "DEMO-003",
    connection: "slack",
    scopesRequested: ["chat:write"],
    blockedAt: "SDK · tenantScopedVault()",
    description: "Agent attempted to access DEMO-003 Slack token. Blocked at SDK layer before Auth0 contact.",
  },
  {
    type: "POLICY_VIOLATION",
    severity: "HIGH",
    agentId: "ollama-local",
    tenantId: "DEMO-001",
    connection: "github",
    scopesRequested: ["delete_repo"],
    blockedAt: "SDK · ScopePolicyEngine",
    description: "Agent requested delete_repo scope — marked dangerous and not in tenant allow-list.",
  },
];

const SEVERITY_COLORS = {
  CRITICAL: { color: "#ff6b6b", bg: "rgba(255,107,107,0.08)", border: "rgba(255,107,107,0.2)" },
  HIGH: { color: "#e8a838", bg: "rgba(232,168,56,0.08)", border: "rgba(232,168,56,0.2)" },
  MEDIUM: { color: "#5b8fff", bg: "rgba(91,143,255,0.08)", border: "rgba(91,143,255,0.2)" },
};

const TYPE_LABELS = {
  CROSS_TENANT_ATTEMPT: "Cross-tenant attempt",
  POLICY_VIOLATION: "Policy violation",
  STEP_UP_TIMEOUT: "Step-up timeout",
  INVALID_CONNECTION: "Invalid connection",
  SCOPE_ESCALATION: "Scope escalation",
};

function formatTime(iso: string) {
  const d = new Date(iso);
  const diff = Math.floor((Date.now() - d.getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

export default function ThreatsPage() {
  const [threats, setThreats] = useState<Threat[]>(INITIAL_THREATS);
  const [live, setLive] = useState(true);
  const [selected, setSelected] = useState<Threat | null>(null);
  const [filter, setFilter] = useState("ALL");

  useEffect(() => {
    if (!live) return;
    let idx = 0;
    const interval = setInterval(() => {
      const template = NEW_THREATS[idx % NEW_THREATS.length];
      const entry: Threat = {
        ...template,
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
      };
      setThreats((prev) => [entry, ...prev.slice(0, 29)]);
      idx++;
    }, 8000);
    return () => clearInterval(interval);
  }, [live]);

  const filtered = filter === "ALL"
    ? threats
    : threats.filter((t) => t.severity === filter || t.type === filter);

  const criticalCount = threats.filter((t) => t.severity === "CRITICAL").length;
  const highCount = threats.filter((t) => t.severity === "HIGH").length;
  const mediumCount = threats.filter((t) => t.severity === "MEDIUM").length;

  return (
    <>
      <style>{`
        .threats-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 24px; }
        .threats-title { font-size: 26px; font-weight: 700; letter-spacing: -0.8px; color: #f0eeff; margin-bottom: 6px; }
        .threats-sub { font-size: 14px; color: rgba(255,255,255,0.35); }
        .live-toggle { display: flex; align-items: center; gap: 8px; cursor: pointer; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; padding: 8px 14px; transition: all 0.2s; }
        .live-toggle:hover { border-color: rgba(124,92,255,0.3); }
        .live-dot { width: 7px; height: 7px; border-radius: 50%; }
        .live-dot.active { background: #ff6b6b; animation: pulse 1s infinite; }
        .live-dot.inactive { background: rgba(255,255,255,0.2); }
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(0.8)} }
        .live-label { font-size: 12px; font-family: "DM Mono", monospace; color: rgba(255,255,255,0.5); letter-spacing: 0.05em; }
        .threat-metrics { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 24px; }
        .threat-metric { border-radius: 14px; padding: 20px 24px; border: 1px solid; }
        .threat-metric-num { font-size: 32px; font-weight: 700; font-family: "DM Mono", monospace; letter-spacing: -1px; margin-bottom: 4px; }
        .threat-metric-label { font-size: 12px; font-family: "DM Mono", monospace; letter-spacing: 0.05em; }
        .filters { display: flex; gap: 8px; margin-bottom: 20px; flex-wrap: wrap; }
        .filter-btn { font-family: "DM Mono", monospace; font-size: 11px; padding: 6px 14px; border-radius: 100px; border: 1px solid rgba(255,255,255,0.08); background: transparent; color: rgba(255,255,255,0.4); cursor: pointer; transition: all 0.15s; letter-spacing: 0.05em; }
        .filter-btn:hover { border-color: rgba(124,92,255,0.3); color: #a090ff; }
        .filter-btn.active { background: rgba(124,92,255,0.12); border-color: rgba(124,92,255,0.3); color: #a090ff; }
        .threats-layout { display: grid; grid-template-columns: 1fr 380px; gap: 20px; }
        .threats-list { display: flex; flex-direction: column; gap: 10px; }
        .threat-card { border-radius: 12px; padding: 18px 20px; border: 1px solid; cursor: pointer; transition: all 0.15s; }
        .threat-card:hover { filter: brightness(1.1); }
        .threat-card.selected { outline: 2px solid rgba(124,92,255,0.5); }
        .threat-card.new-entry { animation: slideIn 0.3s ease-out; }
        @keyframes slideIn { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
        .threat-card-top { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 10px; }
        .threat-card-left { display: flex; align-items: center; gap: 10px; }
        .threat-type-label { font-size: 13px; font-weight: 600; }
        .threat-card-time { font-size: 11px; font-family: "DM Mono", monospace; color: rgba(255,255,255,0.3); }
        .severity-badge { font-size: 9px; font-family: "DM Mono", monospace; font-weight: 700; padding: 2px 7px; border-radius: 4px; letter-spacing: 0.08em; }
        .threat-card-desc { font-size: 12px; color: rgba(255,255,255,0.4); line-height: 1.55; margin-bottom: 12px; }
        .threat-card-meta { display: flex; gap: 8px; flex-wrap: wrap; }
        .meta-tag { font-size: 10px; font-family: "DM Mono", monospace; padding: 2px 8px; border-radius: 4px; background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.3); border: 1px solid rgba(255,255,255,0.08); }
        .threat-detail { background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.07); border-radius: 16px; padding: 24px; position: sticky; top: 80px; height: fit-content; }
        .detail-title { font-size: 14px; font-weight: 600; color: #f0eeff; margin-bottom: 20px; letter-spacing: -0.2px; }
        .detail-row { display: flex; flex-direction: column; gap: 4px; margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px solid rgba(255,255,255,0.05); }
        .detail-row:last-child { border-bottom: none; margin-bottom: 0; padding-bottom: 0; }
        .detail-label { font-size: 10px; font-family: "DM Mono", monospace; color: rgba(255,255,255,0.25); letter-spacing: 0.08em; text-transform: uppercase; }
        .detail-value { font-size: 13px; font-family: "DM Mono", monospace; color: #f0eeff; }
        .detail-value.red { color: #ff6b6b; }
        .detail-value.amber { color: #e8a838; }
        .detail-desc { font-size: 13px; color: rgba(255,255,255,0.5); line-height: 1.6; }
        .empty-detail { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 200px; color: rgba(255,255,255,0.2); font-size: 13px; text-align: center; gap: 8px; }
        @media (max-width: 900px) {
          .threats-layout { grid-template-columns: 1fr; }
          .threat-metrics { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="threats-header">
        <div>
          <div className="threats-title">Threat Detection</div>
          <div className="threats-sub">
            Real-time feed of blocked cross-tenant attempts, policy violations, and escalations
          </div>
        </div>
        <div className="live-toggle" onClick={() => setLive(!live)}>
          <div className={`live-dot ${live ? "active" : "inactive"}`} />
          <span className="live-label">{live ? "LIVE" : "PAUSED"}</span>
        </div>
      </div>

      {/* Metrics */}
      <div className="threat-metrics">
        <div className="threat-metric" style={{background: SEVERITY_COLORS.CRITICAL.bg, borderColor: SEVERITY_COLORS.CRITICAL.border}}>
          <div className="threat-metric-num" style={{color: SEVERITY_COLORS.CRITICAL.color}}>{criticalCount}</div>
          <div className="threat-metric-label" style={{color: SEVERITY_COLORS.CRITICAL.color}}>CRITICAL</div>
        </div>
        <div className="threat-metric" style={{background: SEVERITY_COLORS.HIGH.bg, borderColor: SEVERITY_COLORS.HIGH.border}}>
          <div className="threat-metric-num" style={{color: SEVERITY_COLORS.HIGH.color}}>{highCount}</div>
          <div className="threat-metric-label" style={{color: SEVERITY_COLORS.HIGH.color}}>HIGH</div>
        </div>
        <div className="threat-metric" style={{background: SEVERITY_COLORS.MEDIUM.bg, borderColor: SEVERITY_COLORS.MEDIUM.border}}>
          <div className="threat-metric-num" style={{color: SEVERITY_COLORS.MEDIUM.color}}>{mediumCount}</div>
          <div className="threat-metric-label" style={{color: SEVERITY_COLORS.MEDIUM.color}}>MEDIUM</div>
        </div>
      </div>

      {/* Filters */}
      <div className="filters">
        {["ALL", "CRITICAL", "HIGH", "MEDIUM", "CROSS_TENANT_ATTEMPT", "POLICY_VIOLATION"].map((f) => (
          <button key={f} className={`filter-btn ${filter === f ? "active" : ""}`} onClick={() => setFilter(f)}>
            {f.replace(/_/g, " ")}
          </button>
        ))}
      </div>

      <div className="threats-layout">
        {/* List */}
        <div className="threats-list">
          {filtered.map((t, i) => {
            const s = SEVERITY_COLORS[t.severity];
            return (
              <div
                key={t.id}
                className={`threat-card ${selected?.id === t.id ? "selected" : ""} ${i === 0 && live ? "new-entry" : ""}`}
                style={{background: s.bg, borderColor: s.border}}
                onClick={() => setSelected(t)}
              >
                <div className="threat-card-top">
                  <div className="threat-card-left">
                    <span className="threat-type-label" style={{color: s.color}}>
                      {TYPE_LABELS[t.type]}
                    </span>
                    <span className="severity-badge" style={{background: s.bg, color: s.color, border: `1px solid ${s.border}`}}>
                      {t.severity}
                    </span>
                  </div>
                  <span className="threat-card-time">{formatTime(t.timestamp)}</span>
                </div>
                <div className="threat-card-desc">{t.description}</div>
                <div className="threat-card-meta">
                  <span className="meta-tag">{t.connection}</span>
                  <span className="meta-tag">{t.blockedAt}</span>
                  {t.targetTenantId && <span className="meta-tag">→ {t.targetTenantId}</span>}
                  {t.scopesRequested.map((s) => (
                    <span key={s} className="meta-tag">{s}</span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Detail panel */}
        <div className="threat-detail">
          {selected ? (
            <>
              <div className="detail-title">Threat detail</div>
              <div className="detail-row">
                <div className="detail-label">Type</div>
                <div className="detail-value red">{selected.type}</div>
              </div>
              <div className="detail-row">
                <div className="detail-label">Severity</div>
                <div className="detail-value" style={{color: SEVERITY_COLORS[selected.severity].color}}>{selected.severity}</div>
              </div>
              <div className="detail-row">
                <div className="detail-label">Timestamp</div>
                <div className="detail-value">{new Date(selected.timestamp).toLocaleString()}</div>
              </div>
              <div className="detail-row">
                <div className="detail-label">Tenant</div>
                <div className="detail-value">{selected.tenantId}</div>
              </div>
              {selected.targetTenantId && (
                <div className="detail-row">
                  <div className="detail-label">Target tenant</div>
                  <div className="detail-value red">{selected.targetTenantId}</div>
                </div>
              )}
              <div className="detail-row">
                <div className="detail-label">Agent</div>
                <div className="detail-value">{selected.agentId}</div>
              </div>
              <div className="detail-row">
                <div className="detail-label">Connection</div>
                <div className="detail-value">{selected.connection}</div>
              </div>
              <div className="detail-row">
                <div className="detail-label">Scopes requested</div>
                <div className="detail-value red">{selected.scopesRequested.join(", ")}</div>
              </div>
              <div className="detail-row">
                <div className="detail-label">Blocked at</div>
                <div className="detail-value amber">{selected.blockedAt}</div>
              </div>
              <div className="detail-row">
                <div className="detail-label">Description</div>
                <div className="detail-desc">{selected.description}</div>
              </div>
            </>
          ) : (
            <div className="empty-detail">
              <span style={{fontSize:'24px'}}>🛡️</span>
              <span>Select a threat to see details</span>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
