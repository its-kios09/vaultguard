"use client";

import { useState } from "react";

type Connection = {
  id: string;
  name: string;
  icon: string;
  provider: string;
  description: string;
  status: "connected" | "disconnected" | "connecting";
  connectedAt?: string;
  lastUsed?: string;
  tokenExpiresAt?: string;
  scopesGranted: string[];
  usageCount: number;
};

const INITIAL_CONNECTIONS: Connection[] = [
  {
    id: "google-oauth2",
    name: "Google Calendar",
    icon: "🗓",
    provider: "google-oauth2",
    description: "Schedule meetings, read and write calendar events on behalf of users.",
    status: "connected",
    connectedAt: "2026-03-18T10:30:00Z",
    lastUsed: "2026-03-20T03:02:00Z",
    tokenExpiresAt: "2026-03-20T04:02:00Z",
    scopesGranted: ["calendar.readonly", "calendar.events.write"],
    usageCount: 847,
  },
  {
    id: "slack",
    name: "Slack",
    icon: "💬",
    provider: "slack",
    description: "Send messages and read channel information on behalf of users.",
    status: "connected",
    connectedAt: "2026-03-18T10:32:00Z",
    lastUsed: "2026-03-20T03:01:00Z",
    tokenExpiresAt: "2026-03-20T04:01:00Z",
    scopesGranted: ["chat:write", "channels:read"],
    usageCount: 312,
  },
  {
    id: "github",
    name: "GitHub",
    icon: "🐙",
    provider: "github",
    description: "Read repositories, create pull requests on behalf of users.",
    status: "connected",
    connectedAt: "2026-03-18T10:35:00Z",
    lastUsed: "2026-03-20T02:58:00Z",
    tokenExpiresAt: "2026-03-21T10:35:00Z",
    scopesGranted: ["repo:read", "pull_requests"],
    usageCount: 125,
  },
  {
    id: "gmail",
    name: "Gmail",
    icon: "✉️",
    provider: "gmail",
    description: "Send emails on behalf of users through Auth0 Token Vault.",
    status: "disconnected",
    scopesGranted: [],
    usageCount: 0,
  },
  {
    id: "spotify",
    name: "Spotify",
    icon: "🎵",
    provider: "spotify",
    description: "Create playlists and control playback on behalf of users.",
    status: "disconnected",
    scopesGranted: [],
    usageCount: 0,
  },
  {
    id: "notion",
    name: "Notion",
    icon: "📝",
    provider: "notion",
    description: "Read and write Notion pages and databases on behalf of users.",
    status: "disconnected",
    scopesGranted: [],
    usageCount: 0,
  },
];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function timeAgo(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

export default function ConnectionsPage() {
  const [connections, setConnections] = useState<Connection[]>(INITIAL_CONNECTIONS);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [disconnecting, setDisconnecting] = useState<string | null>(null);

  async function handleConnect(id: string) {
    setConnecting(id);
    setConnections((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: "connecting" } : c))
    );
    await new Promise((r) => setTimeout(r, 2000));
    setConnections((prev) =>
      prev.map((c) =>
        c.id === id
          ? {
              ...c,
              status: "connected",
              connectedAt: new Date().toISOString(),
              lastUsed: new Date().toISOString(),
              tokenExpiresAt: new Date(Date.now() + 3600000).toISOString(),
              scopesGranted: ["read"],
              usageCount: 0,
            }
          : c
      )
    );
    setConnecting(null);
  }

  async function handleDisconnect(id: string) {
    setDisconnecting(id);
    await new Promise((r) => setTimeout(r, 1000));
    setConnections((prev) =>
      prev.map((c) =>
        c.id === id
          ? {
              ...c,
              status: "disconnected",
              connectedAt: undefined,
              lastUsed: undefined,
              tokenExpiresAt: undefined,
              scopesGranted: [],
            }
          : c
      )
    );
    setDisconnecting(null);
  }

  const connected = connections.filter((c) => c.status === "connected");
  const available = connections.filter((c) => c.status !== "connected");

  return (
    <>
      <style>{`
        .conn-header { margin-bottom: 32px; }
        .conn-title { font-size: 26px; font-weight: 700; letter-spacing: -0.8px; color: #f0eeff; margin-bottom: 6px; }
        .conn-sub { font-size: 14px; color: rgba(255,255,255,0.35); line-height: 1.6; max-width: 560px; }
        .conn-section-label { font-size: 11px; font-family: "DM Mono", monospace; color: rgba(255,255,255,0.25); letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 16px; }
        .conn-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-bottom: 40px; }
        .conn-card { background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.07); border-radius: 16px; padding: 24px; transition: border-color 0.2s; }
        .conn-card:hover { border-color: rgba(124,92,255,0.2); }
        .conn-card.connected { border-color: rgba(76,175,125,0.15); }
        .conn-card-top { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 16px; }
        .conn-card-left { display: flex; align-items: center; gap: 12px; }
        .conn-icon { width: 44px; height: 44px; border-radius: 11px; display: flex; align-items: center; justify-content: center; font-size: 20px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); }
        .conn-name { font-size: 15px; font-weight: 600; color: #f0eeff; letter-spacing: -0.2px; margin-bottom: 3px; }
        .conn-provider { font-size: 11px; font-family: "DM Mono", monospace; color: rgba(255,255,255,0.25); }
        .status-pill { font-size: 10px; font-family: "DM Mono", monospace; font-weight: 600; padding: 3px 10px; border-radius: 100px; letter-spacing: 0.05em; }
        .status-connected { background: rgba(76,175,125,0.12); color: #4caf7d; border: 1px solid rgba(76,175,125,0.2); }
        .status-connecting { background: rgba(232,168,56,0.12); color: #e8a838; border: 1px solid rgba(232,168,56,0.2); animation: blink 1s infinite; }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.5} }
        .status-disconnected { background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.3); border: 1px solid rgba(255,255,255,0.08); }
        .conn-desc { font-size: 13px; color: rgba(255,255,255,0.4); line-height: 1.6; margin-bottom: 16px; }
        .conn-meta { display: flex; flex-direction: column; gap: 6px; margin-bottom: 16px; padding: 14px; background: rgba(255,255,255,0.02); border-radius: 10px; border: 1px solid rgba(255,255,255,0.05); }
        .conn-meta-row { display: flex; align-items: center; justify-content: space-between; }
        .conn-meta-label { font-size: 11px; font-family: "DM Mono", monospace; color: rgba(255,255,255,0.25); }
        .conn-meta-value { font-size: 11px; font-family: "DM Mono", monospace; color: rgba(255,255,255,0.5); }
        .conn-scopes { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 16px; }
        .conn-scope-tag { font-size: 10px; font-family: "DM Mono", monospace; padding: 2px 8px; border-radius: 4px; background: rgba(124,92,255,0.08); color: #a090ff; border: 1px solid rgba(124,92,255,0.15); }
        .conn-actions { display: flex; gap: 8px; }
        .btn-connect { font-family: "DM Sans", sans-serif; font-size: 13px; font-weight: 600; padding: 9px 20px; border-radius: 8px; border: none; cursor: pointer; background: #7c5cff; color: #fff; transition: all 0.2s; flex: 1; }
        .btn-connect:hover { background: #6344ee; }
        .btn-connect:disabled { background: rgba(124,92,255,0.3); cursor: not-allowed; }
        .btn-disconnect { font-family: "DM Sans", sans-serif; font-size: 13px; font-weight: 500; padding: 9px 20px; border-radius: 8px; border: 1px solid rgba(255,107,107,0.2); cursor: pointer; background: transparent; color: #ff9090; transition: all 0.2s; }
        .btn-disconnect:hover { background: rgba(255,107,107,0.08); border-color: rgba(255,107,107,0.4); }
        .btn-disconnect:disabled { opacity: 0.4; cursor: not-allowed; }
        .usage-bar-wrap { margin-bottom: 16px; }
        .usage-label { display: flex; justify-content: space-between; margin-bottom: 6px; }
        .usage-bar { height: 4px; background: rgba(255,255,255,0.06); border-radius: 100px; overflow: hidden; }
        .usage-fill { height: 100%; background: linear-gradient(90deg, #7c5cff, #5b8fff); border-radius: 100px; transition: width 0.5s; }
        .vault-info { background: rgba(124,92,255,0.06); border: 1px solid rgba(124,92,255,0.15); border-radius: 12px; padding: 14px 18px; margin-bottom: 32px; display: flex; gap: 10px; align-items: center; }
        .vault-info-text { font-size: 13px; color: rgba(255,255,255,0.4); line-height: 1.6; }
        .vault-info-text strong { color: #a090ff; font-weight: 500; }
        @media (max-width: 900px) { .conn-grid { grid-template-columns: 1fr; } }
      `}</style>

      <div className="conn-header">
        <div className="conn-title">Connections</div>
        <div className="conn-sub">
          Manage which external OAuth providers your AI agents can connect to via Auth0 Token Vault.
          Credentials are never exposed to agents — only scoped access tokens are exchanged.
        </div>
      </div>

      <div className="vault-info">
        <span style={{fontSize:'16px'}}>🔒</span>
        <div className="vault-info-text">
          All tokens are stored in <strong>Auth0 Token Vault</strong>. Your agents never see refresh tokens or long-lived credentials.
          Each token exchange is validated against your <strong>Scope Policy</strong> before Auth0 is contacted.
        </div>
      </div>

      {/* Connected */}
      {connected.length > 0 && (
        <>
          <div className="conn-section-label">Connected · {connected.length}</div>
          <div className="conn-grid">
            {connected.map((c) => (
              <div key={c.id} className="conn-card connected">
                <div className="conn-card-top">
                  <div className="conn-card-left">
                    <div className="conn-icon">{c.icon}</div>
                    <div>
                      <div className="conn-name">{c.name}</div>
                      <div className="conn-provider">{c.provider}</div>
                    </div>
                  </div>
                  <span className={`status-pill ${c.status === "connecting" ? "status-connecting" : "status-connected"}`}>
                    {c.status === "connecting" ? "CONNECTING..." : "CONNECTED"}
                  </span>
                </div>

                <div className="conn-desc">{c.description}</div>

                {c.connectedAt && (
                  <div className="conn-meta">
                    <div className="conn-meta-row">
                      <span className="conn-meta-label">Connected</span>
                      <span className="conn-meta-value">{formatDate(c.connectedAt)}</span>
                    </div>
                    <div className="conn-meta-row">
                      <span className="conn-meta-label">Last used</span>
                      <span className="conn-meta-value">{c.lastUsed ? timeAgo(c.lastUsed) : "—"}</span>
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
                    <div className="usage-fill" style={{width: `${Math.min((c.usageCount / 1000) * 100, 100)}%`}} />
                  </div>
                </div>

                <div className="conn-scopes">
                  {c.scopesGranted.map((s) => (
                    <span key={s} className="conn-scope-tag">{s}</span>
                  ))}
                </div>

                <div className="conn-actions">
                  <button
                    className="btn-disconnect"
                    onClick={() => handleDisconnect(c.id)}
                    disabled={disconnecting === c.id}
                  >
                    {disconnecting === c.id ? "Disconnecting..." : "Disconnect"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Available */}
      {available.length > 0 && (
        <>
          <div className="conn-section-label">Available · {available.length}</div>
          <div className="conn-grid">
            {available.map((c) => (
              <div key={c.id} className="conn-card">
                <div className="conn-card-top">
                  <div className="conn-card-left">
                    <div className="conn-icon">{c.icon}</div>
                    <div>
                      <div className="conn-name">{c.name}</div>
                      <div className="conn-provider">{c.provider}</div>
                    </div>
                  </div>
                  <span className={`status-pill ${c.status === "connecting" ? "status-connecting" : "status-disconnected"}`}>
                    {c.status === "connecting" ? "CONNECTING..." : "NOT CONNECTED"}
                  </span>
                </div>

                <div className="conn-desc">{c.description}</div>

                <div className="conn-actions">
                  <button
                    className="btn-connect"
                    onClick={() => handleConnect(c.id)}
                    disabled={connecting === c.id || c.status === "connecting"}
                  >
                    {c.status === "connecting" ? "Connecting via Auth0..." : "Connect via Token Vault"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );
}
