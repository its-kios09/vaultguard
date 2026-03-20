"use client";

import { useState, useEffect } from "react";
import { PageHeader, InfoBanner, SectionLabel } from "@/components/ui";

type Connection = {
  id: string;
  tenantId: string;
  provider: string;
  status: string;
  scopesGranted: string[];
  connectedAt: string | null;
  lastUsedAt: string | null;
  tokenExpiresAt: string | null;
  usageCount: number;
};

const PROVIDER_META: Record<string, { name: string; icon: string; description: string }> = {
  "google-oauth2": { name: "Google Calendar", icon: "🗓", description: "Schedule meetings, read and write calendar events on behalf of users." },
  slack:           { name: "Slack",           icon: "💬", description: "Send messages and read channel information on behalf of users." },
  github:          { name: "GitHub",          icon: "🐙", description: "Read repositories, create pull requests on behalf of users." },
  gmail:           { name: "Gmail",           icon: "✉️", description: "Send emails on behalf of users through Auth0 Token Vault." },
  spotify:         { name: "Spotify",         icon: "🎵", description: "Create playlists and control playback on behalf of users." },
  notion:          { name: "Notion",          icon: "📝", description: "Read and write Notion pages and databases on behalf of users." },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

function timeAgo(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

export default function ConnectionsPage() {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/v1/connections")
      .then((r) => r.json())
      .then((data) => { setConnections(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  async function handleConnect(provider: string) {
    setActing(provider);
    setConnections((prev) =>
      prev.map((c) => c.provider === provider ? { ...c, status: "connecting" } : c)
    );
    await new Promise((r) => setTimeout(r, 1500));
    const res = await fetch("/api/v1/connections", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ provider, status: "connected" }),
    });
    const updated = await res.json();
    setConnections((prev) =>
      prev.map((c) => c.provider === provider ? updated : c)
    );
    setActing(null);
  }

  async function handleDisconnect(provider: string) {
    setActing(provider);
    await new Promise((r) => setTimeout(r, 800));
    const res = await fetch("/api/v1/connections", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ provider, status: "disconnected" }),
    });
    const updated = await res.json();
    setConnections((prev) =>
      prev.map((c) => c.provider === provider ? updated : c)
    );
    setActing(null);
  }

  const connected = connections.filter((c) => c.status === "connected" || c.status === "connecting");
  const available = connections.filter((c) => c.status === "disconnected");

  return (
    <>
      <style>{`
        .conn-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-bottom: 40px; }
        .conn-card { background: var(--bg-surface); border: 1px solid var(--border-base); border-radius: var(--radius-xl); padding: 24px; transition: border-color 0.2s; }
        .conn-card:hover { border-color: rgba(255,255,255,0.12); }
        .conn-card.connected { border-color: var(--border-green); }
        .conn-card-top { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 16px; }
        .conn-card-left { display: flex; align-items: center; gap: 12px; }
        .conn-icon { width: 44px; height: 44px; border-radius: 11px; display: flex; align-items: center; justify-content: center; font-size: 20px; background: rgba(255,255,255,0.04); border: 1px solid var(--border-base); }
        .conn-name { font-size: 15px; font-weight: 600; color: var(--text-primary); letter-spacing: -0.2px; margin-bottom: 3px; }
        .conn-provider { font-size: 11px; font-family: var(--font-mono); color: var(--text-muted); }
        .status-pill { font-size: 10px; font-family: var(--font-mono); font-weight: 600; padding: 3px 10px; border-radius: var(--radius-pill); letter-spacing: 0.05em; border: 1px solid; }
        .pill-connected { background: var(--bg-green); color: var(--accent-green); border-color: var(--border-green); }
        .pill-connecting { background: var(--bg-amber); color: var(--accent-amber); border-color: var(--border-amber); animation: blink 1s infinite; }
        .pill-disconnected { background: rgba(255,255,255,0.04); color: var(--text-muted); border-color: var(--border-base); }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.5} }
        .conn-desc { font-size: 13px; color: var(--text-secondary); line-height: 1.6; margin-bottom: 16px; }
        .conn-meta { display: flex; flex-direction: column; gap: 6px; margin-bottom: 16px; padding: 14px; background: rgba(255,255,255,0.02); border-radius: var(--radius-md); border: 1px solid var(--border-base); }
        .conn-meta-row { display: flex; align-items: center; justify-content: space-between; }
        .conn-meta-label { font-size: 11px; font-family: var(--font-mono); color: var(--text-muted); }
        .conn-meta-value { font-size: 11px; font-family: var(--font-mono); color: var(--text-secondary); }
        .conn-scopes { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 16px; }
        .conn-scope-tag { font-size: 10px; font-family: var(--font-mono); padding: 2px 8px; border-radius: 4px; background: var(--bg-purple); color: var(--accent-purple-light); border: 1px solid var(--border-purple); }
        .conn-actions { display: flex; gap: 8px; }
        .btn-connect { font-family: var(--font-sans); font-size: 13px; font-weight: 600; padding: 9px 20px; border-radius: var(--radius-md); border: none; cursor: pointer; background: var(--accent-purple); color: #fff; transition: all 0.2s; flex: 1; }
        .btn-connect:hover { background: #6344ee; }
        .btn-connect:disabled { opacity: 0.4; cursor: not-allowed; }
        .btn-disconnect { font-family: var(--font-sans); font-size: 13px; font-weight: 500; padding: 9px 20px; border-radius: var(--radius-md); border: 1px solid var(--border-red); cursor: pointer; background: transparent; color: #ff9090; transition: all 0.2s; }
        .btn-disconnect:hover { background: var(--bg-red); border-color: rgba(255,107,107,0.4); }
        .btn-disconnect:disabled { opacity: 0.4; cursor: not-allowed; }
        .usage-bar-wrap { margin-bottom: 16px; }
        .usage-label { display: flex; justify-content: space-between; margin-bottom: 6px; }
        .usage-bar { height: 4px; background: rgba(255,255,255,0.06); border-radius: 100px; overflow: hidden; }
        .usage-fill { height: 100%; background: linear-gradient(90deg, #7c5cff, #5b8fff); border-radius: 100px; transition: width 0.8s ease; }
        .loading-state { padding: 60px; text-align: center; color: var(--text-muted); font-family: var(--font-mono); font-size: 13px; }
        @media (max-width: 900px) { .conn-grid { grid-template-columns: 1fr; } }
      `}</style>

      <PageHeader
        title="Connections"
        subtitle="Manage which external OAuth providers your AI agents can connect to via Auth0 Token Vault."
      />

      <InfoBanner>
        All tokens are stored in <strong>Auth0 Token Vault</strong>. Your agents never see refresh tokens or long-lived credentials.
        Each token exchange is validated against your <strong>Scope Policy</strong> before Auth0 is contacted.
      </InfoBanner>

      {loading ? (
        <div className="loading-state">Loading connections...</div>
      ) : (
        <>
          {connected.length > 0 && (
            <>
              <SectionLabel>Connected · {connected.length}</SectionLabel>
              <div className="conn-grid">
                {connected.map((c) => {
                  const meta = PROVIDER_META[c.provider];
                  return (
                    <div key={c.id} className="conn-card connected">
                      <div className="conn-card-top">
                        <div className="conn-card-left">
                          <div className="conn-icon">{meta?.icon ?? "🔗"}</div>
                          <div>
                            <div className="conn-name">{meta?.name ?? c.provider}</div>
                            <div className="conn-provider">{c.provider}</div>
                          </div>
                        </div>
                        <span className={`status-pill ${c.status === "connecting" ? "pill-connecting" : "pill-connected"}`}>
                          {c.status === "connecting" ? "CONNECTING..." : "CONNECTED"}
                        </span>
                      </div>

                      <div className="conn-desc">{meta?.description}</div>

                      {c.connectedAt && (
                        <div className="conn-meta">
                          <div className="conn-meta-row">
                            <span className="conn-meta-label">Connected</span>
                            <span className="conn-meta-value">{formatDate(c.connectedAt)}</span>
                          </div>
                          <div className="conn-meta-row">
                            <span className="conn-meta-label">Last used</span>
                            <span className="conn-meta-value">{c.lastUsedAt ? timeAgo(c.lastUsedAt) : "—"}</span>
                          </div>
                          <div className="conn-meta-row">
                            <span className="conn-meta-label">Token expires</span>
                            <span className="conn-meta-value">{c.tokenExpiresAt ? formatDate(c.tokenExpiresAt) : "—"}</span>
                          </div>
                        </div>
                      )}

                      <div className="usage-bar-wrap">
                        <div className="usage-label">
                          <span className="conn-meta-label">Usage</span>
                          <span className="conn-meta-value">{c.usageCount} requests</span>
                        </div>
                        <div className="usage-bar">
                          <div className="usage-fill" style={{ width: `${Math.min((c.usageCount / 1000) * 100, 100)}%` }} />
                        </div>
                      </div>

                      {c.scopesGranted.length > 0 && (
                        <div className="conn-scopes">
                          {c.scopesGranted.map((s) => (
                            <span key={s} className="conn-scope-tag">{s}</span>
                          ))}
                        </div>
                      )}

                      <div className="conn-actions">
                        <button
                          className="btn-disconnect"
                          onClick={() => handleDisconnect(c.provider)}
                          disabled={acting === c.provider}
                        >
                          {acting === c.provider ? "Disconnecting..." : "Disconnect"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {available.length > 0 && (
            <>
              <SectionLabel>Available · {available.length}</SectionLabel>
              <div className="conn-grid">
                {available.map((c) => {
                  const meta = PROVIDER_META[c.provider];
                  return (
                    <div key={c.id} className="conn-card">
                      <div className="conn-card-top">
                        <div className="conn-card-left">
                          <div className="conn-icon">{meta?.icon ?? "🔗"}</div>
                          <div>
                            <div className="conn-name">{meta?.name ?? c.provider}</div>
                            <div className="conn-provider">{c.provider}</div>
                          </div>
                        </div>
                        <span className="status-pill pill-disconnected">NOT CONNECTED</span>
                      </div>

                      <div className="conn-desc">{meta?.description}</div>

                      <div className="conn-actions">
                        <button
                          className="btn-connect"
                          onClick={() => handleConnect(c.provider)}
                          disabled={acting === c.provider}
                        >
                          {acting === c.provider ? "Connecting via Auth0..." : "Connect via Token Vault"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </>
      )}
    </>
  );
}
