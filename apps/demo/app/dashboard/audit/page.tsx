"use client";

import { useState, useEffect } from "react";
import { FilterBar, LiveToggle, PageHeader } from "@/components/ui";

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
  errorCode?: string | null;
  agentId: string;
};

const FILTERS = ["ALL", "GRANTED", "DENIED", "THREATS", "STEPUP"];

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function getActionColor(action: string, success: boolean) {
  if (action === "CROSS_TENANT_ATTEMPT") return "#ff6b6b";
  if (action === "VAULT_TOKEN_DENIED")   return "#ff6b6b";
  if (action === "STEP_UP_INITIATED")    return "#e8a838";
  if (action === "STEP_UP_APPROVED")     return "#4caf7d";
  if (success)                            return "#4caf7d";
  return "#ff6b6b";
}

function getRowBg(action: string, success: boolean) {
  if (action === "CROSS_TENANT_ATTEMPT") return "rgba(255,107,107,0.06)";
  if (action === "VAULT_TOKEN_DENIED")   return "rgba(255,107,107,0.03)";
  if (action === "STEP_UP_INITIATED")    return "rgba(232,168,56,0.03)";
  if (success)                            return "transparent";
  return "rgba(255,107,107,0.03)";
}

function getStatusClass(action: string, success: boolean) {
  if (action.includes("STEP_UP_INITIATED")) return "status-warn";
  return success ? "status-ok" : "status-fail";
}

function getStatusLabel(action: string, success: boolean) {
  if (action.includes("STEP_UP_INITIATED")) return "PENDING";
  return success ? "OK" : "DENIED";
}

export default function AuditPage() {
  const [events, setEvents] = useState<AuditEntry[]>([]);
  const [live, setLive] = useState(true);
  const [filter, setFilter] = useState("ALL");
  const [newCount, setNewCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!live) return;

    const es = new EventSource("/api/v1/audit/stream");

    es.onmessage = (e) => {
      const data = JSON.parse(e.data);

      if (data.type === "initial") {
        setEvents(data.logs);
        setLoading(false);
      } else if (data.type === "new") {
        setEvents((prev) => [data.log, ...prev.slice(0, 49)]);
        setNewCount((n) => n + 1);
      }
    };

    es.onerror = () => {
      es.close();
      setLoading(false);
    };

    return () => es.close();
  }, [live]);

  // When paused load via REST
  useEffect(() => {
    if (live) return;
    fetch("/api/v1/audit")
      .then((r) => r.json())
      .then((data) => { setEvents(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [live]);

  const filtered = filter === "ALL" ? events : events.filter((e) => {
    if (filter === "GRANTED") return e.action === "VAULT_TOKEN_GRANTED";
    if (filter === "DENIED")  return e.action === "VAULT_TOKEN_DENIED";
    if (filter === "THREATS") return e.action === "CROSS_TENANT_ATTEMPT";
    if (filter === "STEPUP")  return e.action.includes("STEP_UP");
    return true;
  });

  return (
    <>
      <style>{`
        .audit-table { background: var(--bg-surface); border: 1px solid var(--border-base); border-radius: var(--radius-xl); overflow: hidden; }
        .audit-table-header { display: grid; grid-template-columns: 90px 200px 140px 140px 1fr 80px; gap: 12px; padding: 12px 20px; border-bottom: 1px solid rgba(255,255,255,0.05); }
        .audit-th { font-size: 11px; font-family: var(--font-mono); color: var(--text-muted); letter-spacing: 0.08em; text-transform: uppercase; }
        .audit-row { display: grid; grid-template-columns: 90px 200px 140px 140px 1fr 80px; gap: 12px; padding: 13px 20px; border-bottom: 1px solid rgba(255,255,255,0.04); align-items: center; transition: background 0.15s; }
        .audit-row:last-child { border-bottom: none; }
        .audit-row:hover { background: rgba(255,255,255,0.02) !important; }
        .audit-row.new-entry { animation: slideIn 0.3s ease-out; }
        @keyframes slideIn { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
        .audit-cell { font-size: 12px; font-family: var(--font-mono); color: var(--text-muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .audit-action-cell { display: flex; align-items: center; gap: 6px; }
        .audit-action-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
        .audit-action-text { font-size: 12px; font-family: var(--font-mono); font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .audit-scopes { display: flex; gap: 4px; flex-wrap: wrap; }
        .audit-scope-tag { font-size: 10px; font-family: var(--font-mono); padding: 2px 6px; border-radius: 4px; background: var(--bg-purple); color: var(--accent-purple-light); border: 1px solid var(--border-purple); }
        .audit-scope-tag.denied { background: var(--bg-red); color: #ff9090; border-color: var(--border-red); }
        .audit-status { font-size: 10px; font-family: var(--font-mono); font-weight: 600; padding: 3px 8px; border-radius: var(--radius-pill); text-align: center; }
        .status-ok   { background: var(--bg-green);  color: var(--accent-green);  border: 1px solid var(--border-green); }
        .status-fail { background: var(--bg-red);    color: var(--accent-red);    border: 1px solid var(--border-red); }
        .status-warn { background: var(--bg-amber);  color: var(--accent-amber);  border: 1px solid var(--border-amber); }
        .new-badge { display: inline-flex; align-items: center; gap: 4px; background: var(--bg-green); border: 1px solid var(--border-green); color: var(--accent-green); font-family: var(--font-mono); font-size: 10px; padding: 3px 8px; border-radius: var(--radius-pill); }
        .loading-row { padding: 40px; text-align: center; color: var(--text-muted); font-size: 13px; font-family: var(--font-mono); }
      `}</style>

      <PageHeader
        title="Audit Log"
        subtitle={`Tenant DEMO-001 · ${events.length} events · immutable per-tenant log`}
        action={
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            {newCount > 0 && (
              <span className="new-badge">+{newCount} new</span>
            )}
            <LiveToggle
              live={live}
              onToggle={() => { setLive(!live); setNewCount(0); }}
              dotColor="var(--accent-green)"
            />
          </div>
        }
      />

      <FilterBar
        filters={FILTERS}
        active={filter}
        onChange={setFilter}
      />

      <div className="audit-table">
        <div className="audit-table-header">
          <div className="audit-th">Time</div>
          <div className="audit-th">Action</div>
          <div className="audit-th">Connection</div>
          <div className="audit-th">Agent</div>
          <div className="audit-th">Scopes</div>
          <div className="audit-th">Status</div>
        </div>

        {loading ? (
          <div className="loading-row">Loading audit events...</div>
        ) : filtered.length === 0 ? (
          <div className="loading-row">No events found</div>
        ) : (
          filtered.map((e, i) => {
            const color = getActionColor(e.action, e.success);
            const isNew = i === 0 && live && newCount > 0;

            return (
              <div
                key={e.id}
                className={`audit-row ${isNew ? "new-entry" : ""}`}
                style={{ background: getRowBg(e.action, e.success) }}
              >
                <div className="audit-cell">{formatTime(e.timestamp)}</div>
                <div className="audit-action-cell">
                  <div className="audit-action-dot" style={{ background: color }} />
                  <span className="audit-action-text" style={{ color }}>{e.action}</span>
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
                  <span className={`audit-status ${getStatusClass(e.action, e.success)}`}>
                    {getStatusLabel(e.action, e.success)}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </>
  );
}
