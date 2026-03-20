"use client";

import { useState, useRef, useEffect } from "react";
import { PageHeader } from "@/components/ui";

type ToolCall = {
  tool: string;
  result: unknown;
  allowed: boolean;
};

type Message = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  toolCalls?: ToolCall[];
  timestamp: Date;
};

const SUGGESTED_PROMPTS = [
  "Check my calendar for tomorrow",
  "Schedule a team meeting tomorrow at 10am for 1 hour",
  "Send a Slack message to #general saying the deployment is complete",
  "Create a GitHub issue in my-org/my-repo titled 'Fix login bug'",
  "Check my calendar and send a summary to #standup on Slack",
];

const TOOL_ICONS: Record<string, string> = {
  check_calendar:        "🗓",
  create_calendar_event: "🗓",
  send_slack_message:    "💬",
  create_github_issue:   "🐙",
};

const TOOL_LABELS: Record<string, string> = {
  check_calendar:        "Google Calendar · calendar.readonly",
  create_calendar_event: "Google Calendar · calendar.events.write",
  send_slack_message:    "Slack · chat:write",
  create_github_issue:   "GitHub · repo:read",
};

export default function AgentPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "system-1",
      role: "system",
      content: "VaultGuard Agent ready. Running llama3.2:3b locally via Ollama. All tool calls go through Auth0 Token Vault — credentials never exposed to the agent.",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage(text?: string) {
    const content = text ?? input.trim();
    if (!content || loading) return;

    setInput("");
    setLoading(true);

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);

    try {
      const res = await fetch("/api/v1/agent", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ message: content }),
      });

      const data = await res.json();

      const assistantMsg: Message = {
        id:        crypto.randomUUID(),
        role:      "assistant",
        content:   data.response ?? data.error ?? "No response",
        toolCalls: data.toolCalls,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id:        crypto.randomUUID(),
          role:      "assistant",
          content:   "Error connecting to agent. Is Ollama running?",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <>
      <style>{`
        .agent-layout { display: grid; grid-template-columns: 1fr 320px; gap: 20px; height: calc(100vh - 180px); }
        .agent-chat { display: flex; flex-direction: column; background: var(--bg-surface); border: 1px solid var(--border-base); border-radius: var(--radius-xl); overflow: hidden; }
        .agent-messages { flex: 1; overflow-y: auto; padding: 20px; display: flex; flex-direction: column; gap: 16px; }
        .agent-messages::-webkit-scrollbar { width: 4px; }
        .agent-messages::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }
        .msg-system { background: var(--bg-purple); border: 1px solid var(--border-purple); border-radius: var(--radius-md); padding: 12px 16px; }
        .msg-system-text { font-size: 12px; font-family: var(--font-mono); color: var(--accent-purple-light); line-height: 1.6; }
        .msg-user { display: flex; justify-content: flex-end; }
        .msg-user-bubble { background: var(--accent-purple); color: #fff; border-radius: 14px 14px 4px 14px; padding: 12px 16px; max-width: 80%; font-size: 14px; line-height: 1.6; }
        .msg-assistant { display: flex; gap: 10px; align-items: flex-start; }
        .msg-avatar { width: 28px; height: 28px; border-radius: 50%; background: linear-gradient(135deg, #13101f, #2a2040); border: 1px solid var(--border-purple); display: flex; align-items: center; justify-content: center; font-size: 12px; flex-shrink: 0; margin-top: 2px; }
        .msg-assistant-content { flex: 1; }
        .msg-assistant-bubble { background: rgba(255,255,255,0.04); border: 1px solid var(--border-base); border-radius: 4px 14px 14px 14px; padding: 12px 16px; font-size: 14px; color: var(--text-primary); line-height: 1.7; }
        .msg-tool-calls { display: flex; flex-direction: column; gap: 6px; margin-top: 8px; }
        .tool-call { display: flex; align-items: center; gap: 8px; padding: 8px 12px; border-radius: var(--radius-md); border: 1px solid; font-size: 11px; font-family: var(--font-mono); }
        .tool-call-allowed { background: var(--bg-green); border-color: var(--border-green); color: var(--accent-green); }
        .tool-call-denied { background: var(--bg-red); border-color: var(--border-red); color: var(--accent-red); }
        .tool-call-icon { font-size: 14px; }
        .tool-call-label { flex: 1; }
        .tool-call-status { font-weight: 600; letter-spacing: 0.05em; }
        .msg-time { font-size: 10px; color: var(--text-hint); font-family: var(--font-mono); margin-top: 4px; text-align: right; }
        .agent-input-area { padding: 16px; border-top: 1px solid rgba(255,255,255,0.05); }
        .agent-input-row { display: flex; gap: 10px; align-items: flex-end; }
        .agent-textarea { flex: 1; background: rgba(255,255,255,0.04); border: 1px solid var(--border-base); border-radius: var(--radius-md); padding: 12px 16px; font-family: var(--font-sans); font-size: 14px; color: var(--text-primary); resize: none; outline: none; transition: border-color 0.2s; min-height: 44px; max-height: 120px; line-height: 1.5; }
        .agent-textarea:focus { border-color: var(--border-purple); }
        .agent-textarea::placeholder { color: var(--text-muted); }
        .agent-send-btn { width: 44px; height: 44px; border-radius: var(--radius-md); background: var(--accent-purple); border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s; flex-shrink: 0; }
        .agent-send-btn:hover { background: #6344ee; }
        .agent-send-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .thinking { display: flex; gap: 4px; padding: 4px 0; }
        .thinking span { width: 6px; height: 6px; border-radius: 50%; background: var(--accent-purple-light); animation: thinking 1.2s infinite; }
        .thinking span:nth-child(2) { animation-delay: 0.2s; }
        .thinking span:nth-child(3) { animation-delay: 0.4s; }
        @keyframes thinking { 0%,80%,100%{opacity:0.2;transform:scale(0.8)} 40%{opacity:1;transform:scale(1)} }
        .agent-sidebar { display: flex; flex-direction: column; gap: 16px; }
        .sidebar-card { background: var(--bg-surface); border: 1px solid var(--border-base); border-radius: var(--radius-xl); overflow: hidden; }
        .sidebar-card-header { padding: 14px 16px; border-bottom: 1px solid rgba(255,255,255,0.05); font-size: 12px; font-weight: 600; color: var(--text-primary); letter-spacing: -0.1px; }
        .sidebar-card-body { padding: 14px 16px; }
        .prompt-btn { width: 100%; text-align: left; background: rgba(255,255,255,0.02); border: 1px solid var(--border-base); border-radius: var(--radius-md); padding: 10px 12px; font-family: var(--font-sans); font-size: 12px; color: var(--text-secondary); cursor: pointer; transition: all 0.15s; margin-bottom: 8px; line-height: 1.4; }
        .prompt-btn:last-child { margin-bottom: 0; }
        .prompt-btn:hover { border-color: var(--border-purple); color: var(--accent-purple-light); background: var(--bg-purple); }
        .vault-status-row { display: flex; align-items: center; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.04); font-size: 12px; }
        .vault-status-row:last-child { border-bottom: none; }
        .vault-status-label { color: var(--text-muted); font-family: var(--font-mono); }
        .vault-status-value { color: var(--accent-green); font-family: var(--font-mono); font-size: 10px; font-weight: 600; }
        .model-badge { display: flex; align-items: center; gap: 6px; padding: 8px 0; }
        .model-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--accent-green); animation: dot-pulse 2s infinite; }
        .model-name { font-family: var(--font-mono); font-size: 12px; color: var(--text-secondary); }
        @media (max-width: 900px) { .agent-layout { grid-template-columns: 1fr; height: auto; } .agent-chat { height: 60vh; } .agent-sidebar { display: none; } }
      `}</style>

      <PageHeader
        title="Agent Simulator"
        subtitle="Real Ollama agent · llama3.2:3b · all tool calls through Auth0 Token Vault"
      />

      <div className="agent-layout">
        {/* Chat */}
        <div className="agent-chat">
          <div className="agent-messages">
            {messages.map((msg) => (
              <div key={msg.id}>
                {msg.role === "system" && (
                  <div className="msg-system">
                    <div className="msg-system-text">⬡ {msg.content}</div>
                  </div>
                )}

                {msg.role === "user" && (
                  <div className="msg-user">
                    <div className="msg-user-bubble">{msg.content}</div>
                  </div>
                )}

                {msg.role === "assistant" && (
                  <div className="msg-assistant">
                    <div className="msg-avatar">⬡</div>
                    <div className="msg-assistant-content">
                      {msg.toolCalls && msg.toolCalls.length > 0 && (
                        <div className="msg-tool-calls">
                          {msg.toolCalls.map((tc, i) => (
                            <div
                              key={i}
                              className={`tool-call ${tc.allowed ? "tool-call-allowed" : "tool-call-denied"}`}
                            >
                              <span className="tool-call-icon">{TOOL_ICONS[tc.tool] ?? "🔧"}</span>
                              <span className="tool-call-label">
                                {TOOL_LABELS[tc.tool] ?? tc.tool} · VaultGuard
                              </span>
                              <span className="tool-call-status">
                                {tc.allowed ? "✓ GRANTED" : "✗ DENIED"}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="msg-assistant-bubble">{msg.content}</div>
                      <div className="msg-time">
                        {msg.timestamp.toLocaleTimeString("en-US", { hour12: false })} · llama3.2:3b · VaultGuard gateway
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="msg-assistant">
                <div className="msg-avatar">⬡</div>
                <div className="msg-assistant-content">
                  <div className="msg-assistant-bubble">
                    <div className="thinking">
                      <span /><span /><span />
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          <div className="agent-input-area">
            <div className="agent-input-row">
              <textarea
                ref={inputRef}
                className="agent-textarea"
                placeholder="Ask the agent to check your calendar, send a Slack message, create a GitHub issue..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
                disabled={loading}
              />
              <button
                className="agent-send-btn"
                onClick={() => sendMessage()}
                disabled={loading || !input.trim()}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13"/>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="agent-sidebar">
          <div className="sidebar-card">
            <div className="sidebar-card-header">Model status</div>
            <div className="sidebar-card-body">
              <div className="model-badge">
                <div className="model-dot" />
                <span className="model-name">llama3.2:3b · local</span>
              </div>
              <div className="vault-status-row">
                <span className="vault-status-label">gateway</span>
                <span className="vault-status-value">ACTIVE</span>
              </div>
              <div className="vault-status-row">
                <span className="vault-status-label">token vault</span>
                <span className="vault-status-value">AUTH0</span>
              </div>
              <div className="vault-status-row">
                <span className="vault-status-label">tenant</span>
                <span className="vault-status-value">DEMO-001</span>
              </div>
              <div className="vault-status-row">
                <span className="vault-status-label">isolation</span>
                <span className="vault-status-value">ENFORCED</span>
              </div>
            </div>
          </div>

          <div className="sidebar-card">
            <div className="sidebar-card-header">Suggested prompts</div>
            <div className="sidebar-card-body">
              {SUGGESTED_PROMPTS.map((p) => (
                <button
                  key={p}
                  className="prompt-btn"
                  onClick={() => sendMessage(p)}
                  disabled={loading}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div className="sidebar-card">
            <div className="sidebar-card-header">Connected tools</div>
            <div className="sidebar-card-body">
              {[
                { icon: "🗓", name: "Google Calendar", scope: "calendar.readonly + events.write" },
                { icon: "💬", name: "Slack",           scope: "chat:write" },
                { icon: "🐙", name: "GitHub",          scope: "repo:read" },
              ].map((t) => (
                <div className="vault-status-row" key={t.name}>
                  <span className="vault-status-label">{t.icon} {t.name}</span>
                  <span className="vault-status-value">VAULT</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
