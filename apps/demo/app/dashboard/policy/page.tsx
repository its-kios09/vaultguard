"use client";

import { useState, useEffect } from "react";
import { PageHeader, InfoBanner } from "@/components/ui";

type ScopePolicy = {
  id: string;
  tenantId: string;
  connection: string;
  scopes: string[];
};

const AVAILABLE_SCOPES: Record<string, { id: string; label: string; description: string; dangerous?: boolean }[]> = {
  "google-oauth2": [
    { id: "calendar.readonly",      label: "calendar.readonly",      description: "Read calendar events" },
    { id: "calendar.events.write",  label: "calendar.events.write",  description: "Create and edit events" },
    { id: "calendar.events.delete", label: "calendar.events.delete", description: "Delete calendar events", dangerous: true },
  ],
  slack: [
    { id: "chat:write",   label: "chat:write",   description: "Send messages" },
    { id: "channels:read", label: "channels:read", description: "View channel list" },
    { id: "files:write",  label: "files:write",  description: "Upload files", dangerous: true },
    { id: "admin",        label: "admin",        description: "Full workspace admin", dangerous: true },
  ],
  github: [
    { id: "repo:read",     label: "repo:read",     description: "Read repository contents" },
    { id: "repo",          label: "repo",          description: "Full repository access", dangerous: true },
    { id: "pull_requests", label: "pull_requests", description: "Create and manage PRs" },
    { id: "delete_repo",   label: "delete_repo",   description: "Delete repositories", dangerous: true },
  ],
  gmail: [
    { id: "gmail.send",     label: "gmail.send",     description: "Send emails" },
    { id: "gmail.readonly", label: "gmail.readonly", description: "Read emails" },
    { id: "gmail.delete",   label: "gmail.delete",   description: "Delete emails", dangerous: true },
    { id: "gmail.modify",   label: "gmail.modify",   description: "Modify email labels" },
  ],
};

const PROVIDER_NAMES: Record<string, string> = {
  "google-oauth2": "Google Calendar",
  slack:           "Slack",
  github:          "GitHub",
  gmail:           "Gmail",
};

const PROVIDER_ICONS: Record<string, string> = {
  "google-oauth2": "🗓",
  slack:           "💬",
  github:          "🐙",
  gmail:           "✉️",
};

export default function PolicyPage() {
  const [policies, setPolicies] = useState<ScopePolicy[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    fetch("/api/v1/policy")
      .then((r) => r.json())
      .then((data) => { setPolicies(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  function toggleScope(connection: string, scopeId: string) {
    setPolicies((prev) =>
      prev.map((p) => {
        if (p.connection !== connection) return p;
        const has = p.scopes.includes(scopeId);
        return { ...p, scopes: has ? p.scopes.filter((s) => s !== scopeId) : [...p.scopes, scopeId] };
      })
    );
    setDirty(true);
    setSaved(false);
  }

  async function handleSave() {
    setSaving(true);
    await Promise.all(
      policies.map((p) =>
        fetch("/api/v1/policy", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ connection: p.connection, scopes: p.scopes }),
        })
      )
    );
    setSaving(false);
    setSaved(true);
    setDirty(false);
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <>
      <style>{`
        .policy-header-row { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 24px; }
        .save-btn { font-family: var(--font-sans); font-size: 14px; font-weight: 600; padding: 10px 24px; border-radius: 9px; border: none; cursor: pointer; transition: all 0.2s; white-space: nowrap; }
        .save-idle { background: var(--accent-purple); color: #fff; }
        .save-idle:hover { background: #6344ee; transform: translateY(-1px); }
        .save-saving { background: rgba(124,92,255,0.4); color: rgba(255,255,255,0.5); cursor: not-allowed; }
        .save-saved { background: var(--bg-green); color: var(--accent-green); border: 1px solid var(--border-green); }
        .save-disabled { background: rgba(255,255,255,0.05); color: var(--text-muted); cursor: not-allowed; }
        .policy-grid { display: flex; flex-direction: column; gap: 16px; }
        .policy-card { background: var(--bg-surface); border: 1px solid var(--border-base); border-radius: var(--radius-xl); overflow: hidden; transition: border-color 0.2s; }
        .policy-card:hover { border-color: rgba(124,92,255,0.2); }
        .policy-card-header { display: flex; align-items: center; justify-content: space-between; padding: 20px 24px; border-bottom: 1px solid rgba(255,255,255,0.05); }
        .policy-card-left { display: flex; align-items: center; gap: 12px; }
        .policy-card-icon { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 18px; background: rgba(255,255,255,0.03); border: 1px solid var(--border-base); }
        .policy-card-name { font-size: 15px; font-weight: 600; color: var(--text-primary); letter-spacing: -0.2px; }
        .policy-card-provider { font-size: 11px; font-family: var(--font-mono); color: var(--text-muted); margin-top: 2px; }
        .enabled-count { font-size: 11px; font-family: var(--font-mono); color: var(--accent-purple-light); background: var(--bg-purple); border: 1px solid var(--border-purple); padding: 3px 8px; border-radius: var(--radius-pill); }
        .policy-card-body { padding: 20px 24px; }
        .scopes-label { font-size: 11px; font-family: var(--font-mono); color: var(--text-muted); letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 14px; }
        .scopes-grid { display: flex; flex-direction: column; gap: 10px; }
        .scope-row { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; border-radius: var(--radius-md); border: 1px solid var(--border-base); background: rgba(255,255,255,0.01); transition: all 0.15s; cursor: pointer; }
        .scope-row:hover { border-color: var(--border-purple); background: var(--bg-purple); }
        .scope-row.enabled { border-color: var(--border-purple); background: var(--bg-purple); }
        .scope-row.dangerous:hover { border-color: var(--border-red); background: var(--bg-red); }
        .scope-row.dangerous.enabled { border-color: var(--border-red); background: var(--bg-red); }
        .scope-name { font-size: 13px; font-family: var(--font-mono); font-weight: 500; color: var(--text-primary); }
        .scope-desc { font-size: 12px; color: var(--text-muted); margin-top: 2px; }
        .dangerous-tag { font-size: 9px; font-family: var(--font-mono); color: var(--accent-red); background: var(--bg-red); border: 1px solid var(--border-red); padding: 1px 6px; border-radius: 4px; letter-spacing: 0.05em; margin-left: 8px; }
        .scope-toggle { width: 36px; height: 20px; border-radius: 100px; border: none; cursor: pointer; transition: all 0.2s; position: relative; flex-shrink: 0; }
        .toggle-on { background: var(--accent-purple); }
        .toggle-on-danger { background: var(--accent-red); }
        .toggle-off { background: rgba(255,255,255,0.1); }
        .scope-toggle::after { content: ''; position: absolute; width: 14px; height: 14px; border-radius: 50%; background: white; top: 3px; transition: left 0.2s; }
        .toggle-on::after, .toggle-on-danger::after { left: 19px; }
        .toggle-off::after { left: 3px; }
        .loading-state { padding: 60px; text-align: center; color: var(--text-muted); font-family: var(--font-mono); font-size: 13px; }
      `}</style>

      <div className="policy-header-row">
        <div>
          <div style={{fontSize:'26px', fontWeight:700, letterSpacing:'-0.8px', color:'var(--text-primary)', marginBottom:'6px'}}>Scope Policy</div>
          <div style={{fontSize:'14px', color:'var(--text-secondary)', lineHeight:1.6, maxWidth:'520px'}}>
            Define exactly which OAuth connections and scopes your AI agents are permitted to use.
            Agents cannot request beyond what is enabled here.
          </div>
        </div>
        <button
          className={`save-btn ${saving ? "save-saving" : saved ? "save-saved" : dirty ? "save-idle" : "save-disabled"}`}
          onClick={handleSave}
          disabled={saving || !dirty}
        >
          {saving ? "Saving..." : saved ? "✓ Saved" : "Save policy"}
        </button>
      </div>

      <InfoBanner>
        This policy is enforced by <strong>VaultGuard's ScopePolicy engine</strong> before any Auth0 Token Vault call is made.
        Disabled scopes are rejected at the SDK layer — they never reach Auth0.
        <strong> Dangerous scopes</strong> are highlighted in red.
      </InfoBanner>

      {loading ? (
        <div className="loading-state">Loading policies...</div>
      ) : (
        <div className="policy-grid">
          {policies.map((policy) => {
            const available = AVAILABLE_SCOPES[policy.connection] ?? [];
            return (
              <div className="policy-card" key={policy.id}>
                <div className="policy-card-header">
                  <div className="policy-card-left">
                    <div className="policy-card-icon">{PROVIDER_ICONS[policy.connection] ?? "🔗"}</div>
                    <div>
                      <div className="policy-card-name">{PROVIDER_NAMES[policy.connection] ?? policy.connection}</div>
                      <div className="policy-card-provider">{policy.connection}</div>
                    </div>
                  </div>
                  <span className="enabled-count">{policy.scopes.length} scopes enabled</span>
                </div>
                <div className="policy-card-body">
                  <div className="scopes-label">Available scopes</div>
                  <div className="scopes-grid">
                    {available.map((scope) => {
                      const enabled = policy.scopes.includes(scope.id);
                      return (
                        <div
                          key={scope.id}
                          className={`scope-row ${enabled ? "enabled" : ""} ${scope.dangerous ? "dangerous" : ""}`}
                          onClick={() => toggleScope(policy.connection, scope.id)}
                        >
                          <div>
                            <div style={{display:'flex', alignItems:'center'}}>
                              <span className="scope-name">{scope.label}</span>
                              {scope.dangerous && <span className="dangerous-tag">DANGEROUS</span>}
                            </div>
                            <div className="scope-desc">{scope.description}</div>
                          </div>
                          <button
                            className={`scope-toggle ${enabled ? (scope.dangerous ? "toggle-on-danger" : "toggle-on") : "toggle-off"}`}
                            onClick={(e) => { e.stopPropagation(); toggleScope(policy.connection, scope.id); }}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
