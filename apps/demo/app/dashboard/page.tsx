export default function DashboardPage() {
  return (
    <>
      <style>{`
        .overview-header { margin-bottom: 32px; }
        .overview-title { font-size: 26px; font-weight: 700; letter-spacing: -0.8px; color: #f0eeff; margin-bottom: 6px; }
        .overview-sub { font-size: 14px; color: rgba(255,255,255,0.35); font-weight: 400; }
        .metrics-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 32px; }
        .metric-card { background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.07); border-radius: 14px; padding: 24px; transition: border-color 0.2s; }
        .metric-card:hover { border-color: rgba(124,92,255,0.3); }
        .metric-label { font-size: 12px; color: rgba(255,255,255,0.35); font-weight: 500; letter-spacing: 0.04em; margin-bottom: 12px; text-transform: uppercase; font-family: "DM Mono", monospace; }
        .metric-value { font-size: 36px; font-weight: 700; letter-spacing: -1.5px; color: #f0eeff; font-family: "DM Mono", monospace; margin-bottom: 6px; }
        .metric-value.purple { color: #7c5cff; }
        .metric-value.green { color: #4caf7d; }
        .metric-value.red { color: #ff6b6b; }
        .metric-delta { font-size: 12px; color: rgba(255,255,255,0.25); }
        .dash-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
        .dash-card { background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.07); border-radius: 16px; overflow: hidden; }
        .dash-card-header { display: flex; align-items: center; justify-content: space-between; padding: 20px 24px 16px; border-bottom: 1px solid rgba(255,255,255,0.05); }
        .dash-card-title { font-size: 14px; font-weight: 600; color: #f0eeff; letter-spacing: -0.2px; }
        .dash-card-action { font-size: 12px; color: #7c5cff; text-decoration: none; font-weight: 500; }
        .dash-card-action:hover { color: #9b8fff; }
        .dash-card-body { padding: 20px 24px; }
        .connection-item { display: flex; align-items: center; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.04); }
        .connection-item:last-child { border-bottom: none; }
        .connection-left { display: flex; align-items: center; gap: 12px; }
        .connection-icon { width: 36px; height: 36px; border-radius: 9px; display: flex; align-items: center; justify-content: center; font-size: 16px; border: 1px solid rgba(255,255,255,0.08); background: rgba(255,255,255,0.03); }
        .connection-name { font-size: 14px; font-weight: 500; color: #f0eeff; }
        .connection-scopes { font-size: 11px; color: rgba(255,255,255,0.3); font-family: "DM Mono", monospace; margin-top: 2px; }
        .status-badge { font-size: 10px; font-weight: 600; padding: 3px 8px; border-radius: 100px; letter-spacing: 0.05em; font-family: "DM Mono", monospace; }
        .status-connected { background: rgba(76,175,125,0.12); color: #4caf7d; border: 1px solid rgba(76,175,125,0.2); }
        .status-pending { background: rgba(232,168,56,0.12); color: #e8a838; border: 1px solid rgba(232,168,56,0.2); }
        .audit-item { display: flex; align-items: flex-start; gap: 12px; padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.04); }
        .audit-item:last-child { border-bottom: none; }
        .audit-dot { width: 8px; height: 8px; border-radius: 50%; margin-top: 5px; flex-shrink: 0; }
        .audit-dot-success { background: #4caf7d; }
        .audit-dot-denied { background: #ff6b6b; }
        .audit-dot-stepup { background: #e8a838; }
        .audit-action { font-size: 13px; font-weight: 500; color: #f0eeff; margin-bottom: 3px; }
        .audit-meta { font-size: 11px; color: rgba(255,255,255,0.3); font-family: "DM Mono", monospace; }
        .audit-time { font-size: 11px; color: rgba(255,255,255,0.2); font-family: "DM Mono", monospace; margin-left: auto; white-space: nowrap; flex-shrink: 0; }
        .policy-row { display: flex; align-items: center; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.04); }
        .policy-row:last-child { border-bottom: none; }
        .policy-connection { font-size: 13px; font-weight: 500; color: #f0eeff; }
        .policy-scopes-list { display: flex; gap: 6px; flex-wrap: wrap; justify-content: flex-end; }
        .scope-tag { font-size: 10px; font-family: "DM Mono", monospace; padding: 2px 7px; border-radius: 4px; background: rgba(124,92,255,0.1); color: #a090ff; border: 1px solid rgba(124,92,255,0.2); }
        .threat-item { display: flex; align-items: flex-start; gap: 12px; padding: 14px 16px; background: rgba(255,107,107,0.04); border: 1px solid rgba(255,107,107,0.12); border-radius: 10px; margin-bottom: 10px; }
        .threat-item:last-child { margin-bottom: 0; }
        .threat-title { font-size: 13px; font-weight: 600; color: #ff6b6b; margin-bottom: 3px; }
        .threat-desc { font-size: 12px; color: rgba(255,255,255,0.35); font-family: "DM Mono", monospace; line-height: 1.5; }
        .threat-time { font-size: 11px; color: rgba(255,107,107,0.4); font-family: "DM Mono", monospace; margin-left: auto; white-space: nowrap; flex-shrink: 0; }
        @media (max-width: 900px) {
          .metrics-grid { grid-template-columns: repeat(2, 1fr); }
          .dash-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="overview-header">
        <div className="overview-title">Overview</div>
        <div className="overview-sub">Tenant DEMO-001 · Auth0 Token Vault · VaultGuard SDK v0.1.0</div>
      </div>

      <div className="metrics-grid">
        {[
          { label: "Vault Requests", value: "1,284", delta: "+24 today", cls: "purple" },
          { label: "Tokens Granted", value: "1,271", delta: "98.9% success rate", cls: "green" },
          { label: "Threats Blocked", value: "13", delta: "cross-tenant attempts", cls: "red" },
          { label: "Active Connections", value: "3", delta: "Google · Slack · GitHub", cls: "" },
        ].map((m) => (
          <div className="metric-card" key={m.label}>
            <div className="metric-label">{m.label}</div>
            <div className={`metric-value ${m.cls}`}>{m.value}</div>
            <div className="metric-delta">{m.delta}</div>
          </div>
        ))}
      </div>

      <div className="dash-grid">
        <div className="dash-card">
          <div className="dash-card-header">
            <div className="dash-card-title">Connected Accounts</div>
            <a href="/dashboard/connections" className="dash-card-action">Manage →</a>
          </div>
          <div className="dash-card-body">
            {[
              { icon: "🗓", name: "Google Calendar", scopes: "calendar.events.write · calendar.readonly", status: "connected" },
              { icon: "💬", name: "Slack", scopes: "chat:write · channels:read", status: "connected" },
              { icon: "🐙", name: "GitHub", scopes: "repo · pull_requests", status: "connected" },
              { icon: "✉️", name: "Gmail", scopes: "gmail.send", status: "pending" },
            ].map((c) => (
              <div className="connection-item" key={c.name}>
                <div className="connection-left">
                  <div className="connection-icon">{c.icon}</div>
                  <div>
                    <div className="connection-name">{c.name}</div>
                    <div className="connection-scopes">{c.scopes}</div>
                  </div>
                </div>
                <span className={`status-badge ${c.status === "connected" ? "status-connected" : "status-pending"}`}>
                  {c.status.toUpperCase()}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="dash-card">
          <div className="dash-card-header">
            <div className="dash-card-title">Scope Policy</div>
            <a href="/dashboard/policy" className="dash-card-action">Edit →</a>
          </div>
          <div className="dash-card-body">
            {[
              { conn: "Google Calendar", scopes: ["events.write", "readonly"] },
              { conn: "Slack", scopes: ["chat:write", "channels:read"] },
              { conn: "GitHub", scopes: ["repo", "pr:read"] },
              { conn: "Gmail", scopes: ["send"] },
            ].map((p) => (
              <div className="policy-row" key={p.conn}>
                <div className="policy-connection">{p.conn}</div>
                <div className="policy-scopes-list">
                  {p.scopes.map((s) => (
                    <span className="scope-tag" key={s}>{s}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="dash-grid">
        <div className="dash-card">
          <div className="dash-card-header">
            <div className="dash-card-title">Recent Audit Events</div>
            <a href="/dashboard/audit" className="dash-card-action">View all →</a>
          </div>
          <div className="dash-card-body">
            {[
              { dot: "success", action: "VAULT_TOKEN_GRANTED", meta: "google-oauth2 · calendar.events.write", time: "2s ago" },
              { dot: "success", action: "VAULT_TOKEN_GRANTED", meta: "slack · chat:write", time: "14s ago" },
              { dot: "stepup", action: "STEP_UP_INITIATED", meta: "github · repo · high-stakes action", time: "1m ago" },
              { dot: "denied", action: "VAULT_TOKEN_DENIED", meta: "POLICY_VIOLATION · gmail.delete", time: "3m ago" },
              { dot: "denied", action: "CROSS_TENANT_ATTEMPT", meta: "agent tried tenant-002 vault", time: "8m ago" },
            ].map((a, i) => (
              <div className="audit-item" key={i}>
                <div className={`audit-dot audit-dot-${a.dot}`} />
                <div style={{flex:1}}>
                  <div className="audit-action">{a.action}</div>
                  <div className="audit-meta">{a.meta}</div>
                </div>
                <div className="audit-time">{a.time}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="dash-card">
          <div className="dash-card-header">
            <div className="dash-card-title">Threat Detection</div>
            <a href="/dashboard/threats" className="dash-card-action">View all →</a>
          </div>
          <div className="dash-card-body">
            {[
              { title: "Cross-tenant vault attempt blocked", desc: "agent-id:ollama-local · tried accessing tenant-002 google-oauth2 token · blocked at SDK layer", time: "8m ago" },
              { title: "Policy violation — scope denied", desc: "agent requested gmail.delete · not in tenant allow-list · request rejected", time: "3m ago" },
              { title: "Step-up auth timeout", desc: "user did not approve github repo access within 60s · action cancelled", time: "12m ago" },
            ].map((t, i) => (
              <div className="threat-item" key={i}>
                <div style={{fontSize:'14px', marginTop:'1px'}}>⚠</div>
                <div style={{flex:1}}>
                  <div className="threat-title">{t.title}</div>
                  <div className="threat-desc">{t.desc}</div>
                </div>
                <div className="threat-time">{t.time}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
