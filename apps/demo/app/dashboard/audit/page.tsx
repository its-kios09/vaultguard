"use client";

import { useState, useEffect } from "react";

type AuditEntry = {
  id: string;
  timestamp: string;
  tenantId: string;
  action: string;
  connection: string;
  scopesRequested: string[];
  scopesGranted: string[];
  stepUpRequired: boolean;
  success: boolean;
  errorCode?: string;
  agentId: string;
};

const MOCK_EVENTS: AuditEntry[] = [
  { id: "1", timestamp: new Date(Date.now() - 2000).toISOString(), tenantId: "DEMO-001", action: "VAULT_TOKEN_GRANTED", connection: "google-oauth2", scopesRequested: ["calendar.events.write"], scopesGranted: ["calendar.events.write"], stepUpRequired: false, success: true, agentId: "ollama-local" },
  { id: "2", timestamp: new Date(Date.now() - 14000).toISOString(), tenantId: "DEMO-001", action: "VAULT_TOKEN_GRANTED", connection: "slack", scopesRequested: ["chat:write"], scopesGranted: ["chat:write"], stepUpRequired: false, success: true, agentId: "ollama-local" },
  { id: "3", timestamp: new Date(Date.now() - 60000).toISOString(), tenantId: "DEMO-001", action: "STEP_UP_INITIATED", connection: "github", scopesRequested: ["repo"], scopesGranted: [], stepUpRequired: true, success: false, agentId: "ollama-local" },
  { id: "4", timestamp: new Date(Date.now() - 180000).toISOString(), tenantId: "DEMO-001", action: "VAULT_TOKEN_DENIED", connection: "gmail", scopesRequested: ["gmail.delete"], scopesGranted: [], stepUpRequired: false, success: false, errorCode: "POLICY_VIOLATION", agentId: "ollama-local" },
  { id: "5", timestamp: new Date(Date.now() - 480000).toISOString(), tenantId: "DEMO-001", action: "CROSS_TENANT_ATTEMPT", connection: "google-oauth2", scopesRequested: ["calendar.events.write"], scopesGranted: [], stepUpRequired: false, success: false, errorCode: "CROSS_TENANT_ATTEMPT", agentId: "ollama-local" },
  { id: "6", timestamp: new Date(Date.now() - 600000).toISOString(), tenantId: "DEMO-001", action: "VAULT_TOKEN_GRANTED", connection: "slack", scopesRequested: ["chat:write", "channels:read"], scopesGranted: ["chat:write", "channels:read"], stepUpRequired: false, success: true, agentId: "ollama-local" },
  { id: "7", timestamp: new Date(Date.now() - 720000).toISOString(), tenantId: "DEMO-001", action: "STEP_UP_APPROVED", connection: "github", scopesRequested: ["repo"], scopesGranted: ["repo"], stepUpRequired: true, success: true, agentId: "ollama-local" },
];

const NEW_EVENTS: Omit<AuditEntry, "id" | "timestamp">[] = [
  { tenantId: "DEMO-001", action: "VAULT_TOKEN_GRANTED", connection: "google-oauth2", scopesRequested: ["calendar.readonly"], scopesGranted: ["calendar.readonly"], stepUpRequired: false, success: true, agentId: "ollama-local" },
  { tenantId: "DEMO-001", action: "CROSS_TENANT_ATTEMPT", connection: "slack", scopesRequested: ["chat:write"], scopesGranted: [], stepUpRequired: false, success: false, errorCode: "CROSS_TENANT_ATTEMPT", agentId: "ollama-local" },
  { tenantId: "DEMO-001", action: "VAULT_TOKEN_DENIED", connection: "gmail", scopesRequested: ["gmail.send"], scopesGranted: [], stepUpRequired: false, success: false, errorCode: "POLICY_VIOLATION", agentId: "ollama-local" },
  { tenantId: "DEMO-001", action: "STEP_UP_INITIATED", connection: "github", scopesRequested: ["repo"], scopesGranted: [], stepUpRequired: true, success: false, agentId: "ollama-local" },
];

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function getActionColor(action: string, success: boolean) {
  if (action === "CROSS_TENANT_ATTEMPT") return "#ff6b6b";
  if (action === "VAULT_TOKEN_DENIED") return "#ff6b6b";
  if (action === "STEP_UP_INITIATED") return "#e8a838";
  if (action === "STEP_UP_APPROVED") return "#4caf7d";
  if (success) return "#4caf7d";
  return "#ff6b6b";
}

function getActionBg(action: string, success: boolean) {
  if (action === "CROSS_TENANT_ATTEMPT") return "rgba(255,107,107,0.08)";
  if (action === "VAULT_TOKEN_DENIED") return "rgba(255,107,107,0.04)";
  if (action === "STEP_UP_INITIATED") return "rgba(232,168,56,0.04)";
  if (action === "STEP_UP_APPROVED") return "rgba(76,175,125,0.04)";
  if (success) return "transparent";
  return "rgba(255,107,107,0.04)";
}

export default function AuditPage() {
  const [events, setEvents] = useState<AuditEntry[]>(MOCK_EVENTS);
  const [live, setLive] = useState(true);
  const [filter, setFilter] = useState("ALL");
  const [newCount, setNewCount] = useState(0);

  useEffect(() => {
    if (!live) return;
    let idx = 0;
    const interval = setInterval(() => {
      const template = NEW_EVENTS[idx % NEW_EVENTS.length];
      const entry: AuditEntry = {
        ...template,
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
      };
      setEvents((prev) => [entry, ...prev.slice(0, 49)]);
      setNewCount((n) => n + 1);
      idx++;
    }, 4000);
    return () => clearInterval(interval);
  }, [live]);

  const filtered = filter === "ALL" ? events : events.filter((e) => {
    if (filter === "GRANTED") return e.action === "VAULT_TOKEN_GRANTED";
    if (filter === "DENIED") return e.action === "VAULT_TOKEN_DENIED";
    if (filter === "THREATS") return e.action === "CROSS_TENANT_ATTEMPT";
    if (filter === "STEPUP") return e.action.includes("STEP_UP");
    return true;
  });

  return (
    <>
      <style>{`
        .audit-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; }
        .audit-title { font-size: 26px; font-weight: 700; letter-spacing: -0.8px; color: #f0eeff; }
        .audit-sub { font-size: 14px; color: rgba(255,255,255,0.35); margin-top: 4px; }
        .live-toggle { display: flex; align-items: center; gap: 8px; cursor: pointer; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; padding: 8px 14px; transition: all 0.2s; }
        .live-toggle:hover { border-color: rgba(124,92,255,0.3); }
        .live-dot { width: 7px; height: 7px; border-radius: 50%; background: #ff6b6b; }
        .live-dot.active { background: #4caf7d; animation: pulse 1.5s infinite; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        .live-label { font-size: 12px; font-family: "DM Mono", monospace; color: rgba(255,255,255,0.5); letter-spacing: 0.05em; }
        .filters { display: flex; gap: 8px; margin-bottom: 20px; flex-wrap: wrap; }
        .filter-btn { font-family: "DM Mono", monospace; font-size: 11px; padding: 6px 14px; border-radius: 100px; border: 1px solid rgba(255,255,255,0.08); background: transparent; color: rgba(255,255,255,0.4); cursor: pointer; transition: all 0.15s; letter-spacing: 0.05em; }
        .filter-btn:hover { border-color: rgba(124,92,255,0.3); color: #a090ff; }
        .filter-btn.active { background: rgba(124,92,255,0.12); border-color: rgba(124,92,255,0.3); color: #a090ff; }
        .audit-table { background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.07); border-radius: 16px; overflow: hidden; }
        .audit-table-header { display: grid; grid-template-columns: 100px 180px 140px 160px 1fr 80px; gap: 12px; padding: 12px 20px; border-bottom: 1px solid rgba(255,255,255,0.05); }
        .audit-th { font-size: 11px; font-family: "DM Mono", monospace; color: rgba(255,255,255,0.25); letter-spacing: 0.08em; text-transform: uppercase; }
        .audit-row { display: grid; grid-template-columns: 100px 180px 140px 160px 1fr 80px; gap: 12px; padding: 14px 20px; border-bottom: 1px solid rgba(255,255,255,0.04); align-items: center; transition: background 0.15s; }
        .audit-row:last-child { border-bottom: none; }
        .audit-row:hover { background: rgba(255,255,255,0.02); }
        .audit-row.new-entry { animation: slideIn 0.3s ease-out; }
        @keyframes slideIn { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
        .audit-cell { font-size: 12px; font-family: "DM Mono", monospace; color: rgba(255,255,255,0.4); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .audit-action-cell { display: flex; align-items: center; gap: 6px; }
        .audit-action-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
        .audit-action-text { font-size: 12px; font-family: "DM Mono", monospace; font-weight: 500; }
        .audit-scopes { display: flex; gap: 4px; flex-wrap: wrap; }
        .audit-scope-tag { font-size: 10px; font-family: "DM Mono", monospace; padding: 2px 6px; border-radius: 4px; background: rgba(124,92,255,0.08); color: #a090ff; border: 1px solid rgba(124,92,255,0.15); }
        .audit-scope-tag.denied { background: rgba(255,107,107,0.08); color: #ff9090; border-color: rgba(255,107,107,0.2); }
        .audit-status { font-size: 10px; font-family: "DM Mono", monospace; font-weight: 600; padding: 3px 8px; border-radius: 100px; text-align: center; }
        .status-ok { background: rgba(76,175,125,0.12); color: #4caf7d; border: 1px solid rgba(76,175,125,0.2); }
        .status-fail { background: rgba(255,107,107,0.12); color: #ff6b6b; border: 1px solid rgba(255,107,107,0.2); }
        .status-warn { background: rgba(232,168,56,0.12); color: #e8a838; border: 1px solid rgba(232,168,56,0.2); }
        .new-badge { display: inline-flex; align-items: center; gap: 4px; background: rgba(76,175,125,0.12); border: 1px solid rgba(76,175,125,0.2); color: #4caf7d; font-family: "DM Mono", monospace; font-size: 10px; padding: 3px 8px; border-radius: 100px; }
      `}</style>

      <div className="audit-header">
        <div>
          <div className="audit-title">Audit Log</div>
          <div className="audit-sub">
            Tenant DEMO-001 · {events.length} events · immutable per-tenant log
          </div>
        </div>
        <div style={{display:'flex', alignItems:'center', gap:'12px'}}>
          {newCount > 0 && (
            <span className="new-badge">+{newCount} new</span>
          )}
          <div className="live-toggle" onClick={() => { setLive(!live); setNewCount(0); }}>
            <div className={`live-dot ${live ? "active" : ""}`} />
            <span className="live-label">{live ? "LIVE" : "PAUSED"}</span>
          </div>
        </div>
      </div>

      <div className="filters">
        {["ALL", "GRANTED", "DENIED", "THREATS", "STEPUP"].map((f) => (
          <button key={f} className={`filter-btn ${filter === f ? "active" : ""}`} onClick={() => setFilter(f)}>
            {f}
          </button>
        ))}
      </div>

      <div className="audit-table">
        <div className="audit-table-header">
          <div className="audit-th">Time</div>
          <div className="audit-th">Action</div>
          <div className="audit-th">Connection</div>
          <div className="audit-th">Agent</div>
          <div className="audit-th">Scopes</div>
          <div className="audit-th">Status</div>
        </div>

        {filtered.map((e, i) => {
          const color = getActionColor(e.action, e.success);
          const isNew = i === 0 && live;
          const statusClass = e.action.includes("STEP_UP_INITIATED") ? "status-warn" : e.success ? "status-ok" : "status-fail";
          const statusLabel = e.action.includes("STEP_UP_INITIATED") ? "PENDING" : e.success ? "OK" : "DENIED";

          return (
            <div key={e.id} className={`audit-row ${isNew ? "new-entry" : ""}`} style={{background: getActionBg(e.action, e.success)}}>
              <div className="audit-cell">{formatTime(e.timestamp)}</div>
              <div className="audit-action-cell">
                <div className="audit-action-dot" style={{background: color}} />
                <span className="audit-action-text" style={{color}}>{e.action}</span>
              </div>
              <div className="audit-cell">{e.connection}</div>
              <div className="audit-cell">{e.agentId}</div>
              <div className="audit-scopes">
                {(e.success ? e.scopesGranted : e.scopesRequested).map((s) => (
                  <span key={s} className={`audit-scope-tag ${!e.success ? "denied" : ""}`}>{s}</span>
                ))}
                {e.errorCode && (
                  <span className="audit-scope-tag denied">{e.errorCode}</span>
                )}
              </div>
              <div>
                <span className={`audit-status ${statusClass}`}>{statusLabel}</span>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
