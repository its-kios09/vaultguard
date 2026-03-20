"use client";

import { useState } from "react";

type Connection = {
  id: string;
  name: string;
  icon: string;
  provider: string;
  availableScopes: { id: string; label: string; description: string; dangerous?: boolean }[];
  enabledScopes: string[];
  connected: boolean;
};

const INITIAL_CONNECTIONS: Connection[] = [
  {
    id: "google-oauth2",
    name: "Google Calendar",
    icon: "🗓",
    provider: "google-oauth2",
    connected: true,
    availableScopes: [
      { id: "calendar.readonly", label: "calendar.readonly", description: "Read calendar events" },
      { id: "calendar.events.write", label: "calendar.events.write", description: "Create and edit events" },
      { id: "calendar.events.delete", label: "calendar.events.delete", description: "Delete calendar events", dangerous: true },
    ],
    enabledScopes: ["calendar.readonly", "calendar.events.write"],
  },
  {
    id: "slack",
    name: "Slack",
    icon: "💬",
    provider: "slack",
    connected: true,
    availableScopes: [
      { id: "chat:write", label: "chat:write", description: "Send messages" },
      { id: "channels:read", label: "channels:read", description: "View channel list" },
      { id: "files:write", label: "files:write", description: "Upload files", dangerous: true },
      { id: "admin", label: "admin", description: "Full workspace admin", dangerous: true },
    ],
    enabledScopes: ["chat:write", "channels:read"],
  },
  {
    id: "github",
    name: "GitHub",
    icon: "🐙",
    provider: "github",
    connected: true,
    availableScopes: [
      { id: "repo:read", label: "repo:read", description: "Read repository contents" },
      { id: "repo", label: "repo", description: "Full repository access", dangerous: true },
      { id: "pull_requests", label: "pull_requests", description: "Create and manage PRs" },
      { id: "delete_repo", label: "delete_repo", description: "Delete repositories", dangerous: true },
    ],
    enabledScopes: ["repo:read", "pull_requests"],
  },
  {
    id: "gmail",
    name: "Gmail",
    icon: "✉️",
    provider: "gmail",
    connected: false,
    availableScopes: [
      { id: "gmail.send", label: "gmail.send", description: "Send emails" },
      { id: "gmail.readonly", label: "gmail.readonly", description: "Read emails" },
      { id: "gmail.delete", label: "gmail.delete", description: "Delete emails", dangerous: true },
      { id: "gmail.modify", label: "gmail.modify", description: "Modify email labels" },
    ],
    enabledScopes: ["gmail.send"],
  },
];

export default function PolicyPage() {
  const [connections, setConnections] = useState<Connection[]>(INITIAL_CONNECTIONS);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  function toggleScope(connId: string, scopeId: string) {
    setConnections((prev) =>
      prev.map((c) => {
        if (c.id !== connId) return c;
        const has = c.enabledScopes.includes(scopeId);
        return {
          ...c,
          enabledScopes: has
            ? c.enabledScopes.filter((s) => s !== scopeId)
            : [...c.enabledScopes, scopeId],
        };
      })
    );
    setSaved(false);
  }

  async function handleSave() {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 800));
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <>
      <style>{`
        .policy-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 32px; }
        .policy-title { font-size: 26px; font-weight: 700; letter-spacing: -0.8px; color: #f0eeff; margin-bottom: 6px; }
        .policy-sub { font-size: 14px; color: rgba(255,255,255,0.35); max-width: 520px; line-height: 1.6; }
        .save-btn { font-family: "DM Sans", sans-serif; font-size: 14px; font-weight: 600; padding: 10px 24px; border-radius: 9px; border: none; cursor: pointer; transition: all 0.2s; }
        .save-btn.idle { background: #7c5cff; color: #fff; }
        .save-btn.idle:hover { background: #6344ee; transform: translateY(-1px); }
        .save-btn.saving { background: rgba(124,92,255,0.4); color: rgba(255,255,255,0.5); cursor: not-allowed; }
        .save-btn.saved { background: rgba(76,175,125,0.2); color: #4caf7d; border: 1px solid rgba(76,175,125,0.3); }
        .policy-grid { display: flex; flex-direction: column; gap: 16px; }
        .policy-card { background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.07); border-radius: 16px; overflow: hidden; transition: border-color 0.2s; }
        .policy-card:hover { border-color: rgba(124,92,255,0.2); }
        .policy-card-header { display: flex; align-items: center; justify-content: space-between; padding: 20px 24px; border-bottom: 1px solid rgba(255,255,255,0.05); }
        .policy-card-left { display: flex; align-items: center; gap: 12px; }
        .policy-card-icon { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 18px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); }
        .policy-card-name { font-size: 15px; font-weight: 600; color: #f0eeff; letter-spacing: -0.2px; }
        .policy-card-provider { font-size: 11px; font-family: "DM Mono", monospace; color: rgba(255,255,255,0.3); margin-top: 2px; }
        .conn-status { font-size: 10px; font-family: "DM Mono", monospace; font-weight: 600; padding: 3px 10px; border-radius: 100px; }
        .conn-connected { background: rgba(76,175,125,0.12); color: #4caf7d; border: 1px solid rgba(76,175,125,0.2); }
        .conn-disconnected { background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.3); border: 1px solid rgba(255,255,255,0.08); }
        .policy-card-body { padding: 20px 24px; }
        .scopes-label { font-size: 11px; font-family: "DM Mono", monospace; color: rgba(255,255,255,0.25); letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 14px; }
        .scopes-grid { display: flex; flex-direction: column; gap: 10px; }
        .scope-row { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.06); background: rgba(255,255,255,0.01); transition: all 0.15s; cursor: pointer; }
        .scope-row:hover { border-color: rgba(124,92,255,0.25); background: rgba(124,92,255,0.03); }
        .scope-row.enabled { border-color: rgba(124,92,255,0.25); background: rgba(124,92,255,0.05); }
        .scope-row.dangerous { border-color: rgba(255,107,107,0.15); }
        .scope-row.dangerous:hover { border-color: rgba(255,107,107,0.3); background: rgba(255,107,107,0.03); }
        .scope-row.dangerous.enabled { border-color: rgba(255,107,107,0.3); background: rgba(255,107,107,0.06); }
        .scope-left { display: flex; align-items: center; gap: 10px; }
        .scope-name { font-size: 13px; font-family: "DM Mono", monospace; font-weight: 500; color: #f0eeff; }
        .scope-desc { font-size: 12px; color: rgba(255,255,255,0.35); margin-top: 2px; }
        .dangerous-tag { font-size: 9px; font-family: "DM Mono", monospace; color: #ff9090; background: rgba(255,107,107,0.1); border: 1px solid rgba(255,107,107,0.2); padding: 1px 6px; border-radius: 4px; letter-spacing: 0.05em; }
        .scope-toggle { width: 36px; height: 20px; border-radius: 100px; border: none; cursor: pointer; transition: all 0.2s; position: relative; flex-shrink: 0; }
        .scope-toggle.on { background: #7c5cff; }
        .scope-toggle.on.dangerous { background: #e85555; }
        .scope-toggle.off { background: rgba(255,255,255,0.1); }
        .scope-toggle::after { content: ''; position: absolute; width: 14px; height: 14px; border-radius: 50%; background: white; top: 3px; transition: left 0.2s; }
        .scope-toggle.on::after { left: 19px; }
        .scope-toggle.off::after { left: 3px; }
        .policy-info { background: rgba(124,92,255,0.06); border: 1px solid rgba(124,92,255,0.15); border-radius: 12px; padding: 16px 20px; margin-bottom: 24px; display: flex; gap: 12px; align-items: flex-start; }
        .policy-info-text { font-size: 13px; color: rgba(255,255,255,0.45); line-height: 1.6; }
        .policy-info-text strong { color: #a090ff; font-weight: 500; }
      `}</style>

      <div className="policy-header">
        <div>
          <div className="policy-title">Scope Policy</div>
          <div className="policy-sub">
            Define exactly which OAuth connections and scopes your AI agents are permitted to use.
            Agents cannot request beyond what is enabled here — even if the underlying provider supports it.
          </div>
        </div>
        <button
          className={`save-btn ${saving ? "saving" : saved ? "saved" : "idle"}`}
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? "Saving..." : saved ? "✓ Saved" : "Save policy"}
        </button>
      </div>

      <div className="policy-info">
        <span style={{fontSize:'16px', marginTop:'1px'}}>ℹ</span>
        <div className="policy-info-text">
          This policy is enforced by <strong>VaultGuard's ScopePolicy engine</strong> before any Auth0 Token Vault call is made.
          Disabled scopes are rejected at the SDK layer — they never reach Auth0.
          <strong> Dangerous scopes</strong> are highlighted in red and should only be enabled when strictly necessary.
        </div>
      </div>

      <div className="policy-grid">
        {connections.map((conn) => (
          <div className="policy-card" key={conn.id}>
            <div className="policy-card-header">
              <div className="policy-card-left">
                <div className="policy-card-icon">{conn.icon}</div>
                <div>
                  <div className="policy-card-name">{conn.name}</div>
                  <div className="policy-card-provider">{conn.provider}</div>
                </div>
              </div>
              <span className={`conn-status ${conn.connected ? "conn-connected" : "conn-disconnected"}`}>
                {conn.connected ? "CONNECTED" : "NOT CONNECTED"}
              </span>
            </div>
            <div className="policy-card-body">
              <div className="scopes-label">Available scopes</div>
              <div className="scopes-grid">
                {conn.availableScopes.map((scope) => {
                  const enabled = conn.enabledScopes.includes(scope.id);
                  return (
                    <div
                      key={scope.id}
                      className={`scope-row ${enabled ? "enabled" : ""} ${scope.dangerous ? "dangerous" : ""}`}
                      onClick={() => toggleScope(conn.id, scope.id)}
                    >
                      <div className="scope-left">
                        <div>
                          <div style={{display:'flex', alignItems:'center', gap:'8px'}}>
                            <span className="scope-name">{scope.label}</span>
                            {scope.dangerous && <span className="dangerous-tag">DANGEROUS</span>}
                          </div>
                          <div className="scope-desc">{scope.description}</div>
                        </div>
                      </div>
                      <button
                        className={`scope-toggle ${enabled ? "on" : "off"} ${scope.dangerous && enabled ? "dangerous" : ""}`}
                        onClick={(e) => { e.stopPropagation(); toggleScope(conn.id, scope.id); }}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
