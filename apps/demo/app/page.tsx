import { auth0 } from "@/lib/auth0";
import Link from "next/link";

export default async function Home() {
  const session = await auth0.getSession();

  return (
    <>
      <style>{`
        @import url("https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,300&display=swap");
        @import url("https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&display=swap");

        * { box-sizing: border-box; margin: 0; padding: 0; }

        .vg-root {
          font-family: "DM Sans", sans-serif;
          background: #06060a;
          color: #e8e6f0;
          min-height: 100vh;
          overflow-x: hidden;
        }

        /* Grid background */
        .vg-root::before {
          content: '';
          position: fixed;
          inset: 0;
          background-image:
            linear-gradient(rgba(124,92,255,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(124,92,255,0.04) 1px, transparent 1px);
          background-size: 48px 48px;
          pointer-events: none;
          z-index: 0;
        }

        /* Glow */
        .hero-glow {
          position: absolute;
          width: 800px;
          height: 800px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(124,92,255,0.10) 0%, transparent 70%);
          top: -200px;
          left: 50%;
          transform: translateX(-50%);
          pointer-events: none;
        }

        /* Nav */
        .vg-nav {
          position: relative;
          z-index: 10;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 48px;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          backdrop-filter: blur(12px);
          background: rgba(6,6,10,0.7);
          position: sticky;
          top: 0;
        }

        .vg-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          text-decoration: none;
        }

        .vg-logo-text {
          font-size: 18px;
          font-weight: 700;
          color: #f0eeff;
          letter-spacing: -0.4px;
        }

        .vg-logo-text span { color: #7c5cff; }

        .vg-nav-right {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .vg-user-email {
          font-size: 13px;
          color: rgba(255,255,255,0.35);
          font-family: "DM Mono", monospace;
        }

        .btn-ghost {
          font-family: "DM Sans", sans-serif;
          font-size: 14px;
          font-weight: 500;
          color: rgba(255,255,255,0.5);
          text-decoration: none;
          padding: 8px 16px;
          border-radius: 8px;
          transition: color 0.2s, background 0.2s;
          border: none;
          background: none;
          cursor: pointer;
        }
        .btn-ghost:hover { color: #fff; background: rgba(255,255,255,0.06); }

        .btn-primary {
          font-family: "DM Sans", sans-serif;
          font-size: 14px;
          font-weight: 600;
          color: #fff;
          background: #7c5cff;
          text-decoration: none;
          padding: 9px 20px;
          border-radius: 9px;
          transition: background 0.2s, transform 0.15s;
          border: none;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }
        .btn-primary:hover { background: #6344ee; transform: translateY(-1px); }

        .btn-outline {
          font-family: "DM Sans", sans-serif;
          font-size: 15px;
          font-weight: 500;
          color: rgba(255,255,255,0.6);
          background: transparent;
          text-decoration: none;
          padding: 12px 28px;
          border-radius: 10px;
          border: 1px solid rgba(255,255,255,0.15);
          transition: all 0.2s;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }
        .btn-outline:hover { border-color: rgba(255,255,255,0.35); color: #fff; }

        .btn-primary-lg {
          font-family: "DM Sans", sans-serif;
          font-size: 15px;
          font-weight: 600;
          color: #fff;
          background: #7c5cff;
          text-decoration: none;
          padding: 13px 32px;
          border-radius: 10px;
          transition: all 0.2s;
          border: none;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }
        .btn-primary-lg:hover { background: #6344ee; transform: translateY(-2px); box-shadow: 0 8px 32px rgba(124,92,255,0.35); }

        /* Hero */
        .vg-hero {
          position: relative;
          z-index: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding: 100px 48px 80px;
        }

        .vg-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(124,92,255,0.08);
          border: 1px solid rgba(124,92,255,0.25);
          color: #a090ff;
          font-family: "DM Mono", monospace;
          font-size: 11px;
          font-weight: 400;
          letter-spacing: 0.08em;
          padding: 6px 14px;
          border-radius: 100px;
          margin-bottom: 36px;
        }

        .vg-badge-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #7c5cff;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.8); }
        }

        .vg-h1 {
          font-size: clamp(42px, 6vw, 76px);
          font-weight: 700;
          letter-spacing: -2.5px;
          line-height: 1.05;
          max-width: 900px;
          margin-bottom: 28px;
          color: #f0eeff;
        }

        .vg-h1 .accent { color: #7c5cff; }
        .vg-h1 .dim { color: rgba(240,238,255,0.45); }

        .vg-subtitle {
          font-size: 18px;
          font-weight: 400;
          color: rgba(232,230,240,0.5);
          max-width: 580px;
          line-height: 1.7;
          margin-bottom: 48px;
        }

        .vg-cta-row {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
          justify-content: center;
        }

        /* Stats bar */
        .vg-stats {
          position: relative;
          z-index: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0;
          border-top: 1px solid rgba(255,255,255,0.06);
          border-bottom: 1px solid rgba(255,255,255,0.06);
          margin: 0;
        }

        .vg-stat {
          flex: 1;
          max-width: 240px;
          padding: 32px 24px;
          text-align: center;
          border-right: 1px solid rgba(255,255,255,0.06);
        }
        .vg-stat:last-child { border-right: none; }

        .vg-stat-num {
          font-size: 32px;
          font-weight: 700;
          color: #f0eeff;
          letter-spacing: -1px;
          font-family: "DM Mono", monospace;
        }
        .vg-stat-num span { color: #7c5cff; }

        .vg-stat-label {
          font-size: 13px;
          color: rgba(255,255,255,0.35);
          margin-top: 4px;
          font-weight: 400;
        }

        /* Features */
        .vg-section {
          position: relative;
          z-index: 1;
          padding: 100px 48px;
          max-width: 1200px;
          margin: 0 auto;
        }

        .vg-section-label {
          font-family: "DM Mono", monospace;
          font-size: 11px;
          color: #7c5cff;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          margin-bottom: 16px;
        }

        .vg-section-title {
          font-size: clamp(28px, 3.5vw, 42px);
          font-weight: 700;
          letter-spacing: -1.2px;
          color: #f0eeff;
          max-width: 560px;
          line-height: 1.15;
          margin-bottom: 64px;
        }

        .vg-features-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1px;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 16px;
          overflow: hidden;
        }

        .vg-feature {
          background: #06060a;
          padding: 36px 32px;
          transition: background 0.2s;
        }
        .vg-feature:hover { background: rgba(124,92,255,0.04); }

        .vg-feature-icon {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          background: rgba(124,92,255,0.12);
          border: 1px solid rgba(124,92,255,0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 20px;
          font-size: 18px;
        }

        .vg-feature-title {
          font-size: 16px;
          font-weight: 600;
          color: #f0eeff;
          margin-bottom: 10px;
          letter-spacing: -0.3px;
        }

        .vg-feature-desc {
          font-size: 14px;
          color: rgba(232,230,240,0.45);
          line-height: 1.65;
          font-weight: 400;
        }

        /* How it works */
        .vg-steps {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 24px;
          margin-top: 64px;
        }

        .vg-step {
          position: relative;
          padding: 28px 24px;
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 14px;
        }

        .vg-step-num {
          font-family: "DM Mono", monospace;
          font-size: 11px;
          color: #7c5cff;
          letter-spacing: 0.08em;
          margin-bottom: 14px;
        }

        .vg-step-title {
          font-size: 15px;
          font-weight: 600;
          color: #f0eeff;
          margin-bottom: 8px;
          letter-spacing: -0.2px;
        }

        .vg-step-desc {
          font-size: 13px;
          color: rgba(232,230,240,0.4);
          line-height: 1.6;
        }

        /* Code block */
        .vg-code-section {
          position: relative;
          z-index: 1;
          padding: 0 48px 100px;
          max-width: 1200px;
          margin: 0 auto;
        }

        .vg-code-block {
          background: #0d0b1a;
          border: 1px solid rgba(124,92,255,0.2);
          border-radius: 16px;
          overflow: hidden;
        }

        .vg-code-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 20px;
          border-bottom: 1px solid rgba(124,92,255,0.15);
          background: rgba(124,92,255,0.05);
        }

        .vg-code-dots {
          display: flex;
          gap: 6px;
        }
        .vg-code-dots span {
          width: 10px;
          height: 10px;
          border-radius: 50%;
        }

        .vg-code-filename {
          font-family: "DM Mono", monospace;
          font-size: 12px;
          color: rgba(255,255,255,0.35);
        }

        .vg-code-body {
          padding: 28px 32px;
          font-family: "DM Mono", monospace;
          font-size: 13px;
          line-height: 1.8;
          overflow-x: auto;
        }

        .c-comment { color: #4a4060; }
        .c-keyword { color: #7c5cff; }
        .c-fn { color: #5b8fff; }
        .c-string { color: #4caf7d; }
        .c-type { color: #e8a838; }
        .c-normal { color: #c8c4e0; }

        /* CTA section */
        .vg-cta-section {
          position: relative;
          z-index: 1;
          margin: 0 48px 80px;
          padding: 80px 64px;
          background: linear-gradient(135deg, rgba(124,92,255,0.08) 0%, rgba(91,143,255,0.05) 100%);
          border: 1px solid rgba(124,92,255,0.2);
          border-radius: 24px;
          text-align: center;
          max-width: 1104px;
          margin-left: auto;
          margin-right: auto;
        }

        .vg-cta-title {
          font-size: clamp(28px, 3vw, 40px);
          font-weight: 700;
          letter-spacing: -1.2px;
          color: #f0eeff;
          margin-bottom: 16px;
        }

        .vg-cta-sub {
          font-size: 16px;
          color: rgba(232,230,240,0.45);
          margin-bottom: 40px;
          max-width: 480px;
          margin-left: auto;
          margin-right: auto;
          line-height: 1.65;
        }

        /* Footer */
        .vg-footer {
          position: relative;
          z-index: 1;
          border-top: 1px solid rgba(255,255,255,0.06);
          padding: 28px 48px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .vg-footer-left {
          font-family: "DM Mono", monospace;
          font-size: 12px;
          color: rgba(255,255,255,0.2);
        }

        .vg-footer-right {
          font-size: 12px;
          color: rgba(255,255,255,0.2);
        }

        @media (max-width: 768px) {
          .vg-nav { padding: 16px 24px; }
          .vg-hero { padding: 60px 24px 60px; }
          .vg-features-grid { grid-template-columns: 1fr; }
          .vg-steps { grid-template-columns: 1fr 1fr; }
          .vg-section { padding: 60px 24px; }
          .vg-code-section { padding: 0 24px 60px; }
          .vg-cta-section { margin: 0 24px 60px; padding: 48px 32px; }
          .vg-footer { padding: 24px; flex-direction: column; gap: 8px; text-align: center; }
          .vg-stat { padding: 24px 16px; }
        }
      `}</style>

      <div className="vg-root">
        {/* Nav */}
        <nav className="vg-nav">
          <a href="/" className="vg-logo">
            <svg width="26" height="30" viewBox="0 0 88 100" fill="none">
              <path
                d="M44 4L8 18V46C8 66 24 83 44 92C64 83 80 66 80 46V18L44 4Z"
                fill="#13101f"
                stroke="#7c5cff"
                strokeWidth="2"
              />
              <path
                d="M44 12L16 24V46C16 62 28 76 44 84C60 76 72 62 72 46V24L44 12Z"
                fill="none"
                stroke="#4a3a99"
                strokeWidth="1"
                strokeDasharray="3 3"
              />
              <circle
                cx="44"
                cy="48"
                r="18"
                fill="#0d0b1a"
                stroke="#7c5cff"
                strokeWidth="2"
              />
              <circle cx="44" cy="45" r="4.5" fill="#7c5cff" />
              <rect
                x="41.5"
                y="48"
                width="5"
                height="7"
                rx="1.5"
                fill="#7c5cff"
              />
              <circle cx="30" cy="22" r="2.5" fill="#7c5cff" />
              <circle cx="58" cy="22" r="2.5" fill="#5b8fff" />
              <line
                x1="30"
                y1="22"
                x2="44"
                y2="16"
                stroke="#7c5cff"
                strokeWidth="0.8"
                strokeDasharray="2 2"
                opacity="0.7"
              />
              <line
                x1="58"
                y1="22"
                x2="44"
                y2="16"
                stroke="#5b8fff"
                strokeWidth="0.8"
                strokeDasharray="2 2"
                opacity="0.7"
              />
            </svg>
            <span className="vg-logo-text">
              Vault<span>Guard</span>
            </span>
          </a>

          <div className="vg-nav-right">
            {session ? (
              <>
                <span className="vg-user-email">{session.user.email}</span>
                <Link
                  href="/dashboard"
                  className="btn-primary"
                  style={{ fontSize: "13px", padding: "8px 16px" }}
                >
                  Dashboard →
                </Link>
                <a href="/auth/logout" className="btn-ghost">
                  Logout
                </a>
              </>
            ) : (
              <>
                <a
                  href="https://github.com/its-kios09/vaultguard"
                  target="_blank"
                  className="btn-ghost"
                >
                  GitHub
                </a>
                <a href="/auth/login" className="btn-primary">
                  Sign in →
                </a>
              </>
            )}
          </div>
        </nav>

        {/* Hero */}
        <div className="vg-hero">
          <div className="hero-glow" />
          <div className="vg-badge">
            <div className="vg-badge-dot" />
            BUILT ON AUTH0 TOKEN VAULT · OPEN SOURCE
          </div>

          <h1 className="vg-h1">
            Your local AI,
            <br />
            <span className="accent">acting in the world</span>
            <br />
            <span className="dim">without exposing credentials.</span>
          </h1>

          <p className="vg-subtitle">
            VaultGuard is the secure gateway between locally-running AI agents
            and external APIs. Auth0 Token Vault holds the keys. Every tenant
            stays cryptographically isolated.
          </p>

          <div className="vg-cta-row">
            <a href="/auth/login" className="btn-primary-lg">
              Start building →
            </a>
            <a
              href="https://github.com/its-kios09/vaultguard"
              target="_blank"
              className="btn-outline"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.741 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
              </svg>
              View source
            </a>
          </div>
        </div>

        {/* Stats */}
        <div className="vg-stats">
          {[
            { num: "30+", label: "OAuth providers supported" },
            { num: "0", label: "credentials exposed to agents" },
            { num: "100%", label: "tenant credential isolation" },
            { num: "<1ms", label: "policy enforcement overhead" },
          ].map((s) => (
            <div className="vg-stat" key={s.label}>
              <div className="vg-stat-num">
                {s.num
                  .replace(/(\d+)/, "<span>$1</span>")
                  .includes("<span>") ? (
                  <>
                    <span style={{ color: "#7c5cff" }}>
                      {s.num.match(/\d+/)?.[0]}
                    </span>
                    {s.num.replace(/\d+/, "")}
                  </>
                ) : (
                  s.num
                )}
              </div>
              <div className="vg-stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Features */}
        <div className="vg-section">
          <div className="vg-section-label">// CORE CAPABILITIES</div>
          <div className="vg-section-title">
            Security architecture for the agentic era.
          </div>

          <div className="vg-features-grid">
            {[
              {
                icon: "⬡",
                title: "Tenant Vault Isolation",
                desc: "Tenant A's AI agent cannot request, access, or discover Tenant B's vault tokens. Structurally impossible — not just policy.",
              },
              {
                icon: "◈",
                title: "Scope Policy Engine",
                desc: "Each tenant defines an explicit allow-list of OAuth connections and scopes. Agents cannot request beyond what their tenant pre-approved.",
              },
              {
                icon: "◎",
                title: "CIBA Step-up Auth",
                desc: "High-stakes agent actions pause and request explicit human approval via Auth0's backchannel authentication before executing.",
              },
              {
                icon: "◉",
                title: "Live Threat Detection",
                desc: "Cross-tenant access attempts are blocked instantly, logged, and broadcast to the admin dashboard via Server-Sent Events in real time.",
              },
              {
                icon: "▣",
                title: "Per-Tenant Audit Log",
                desc: "Every vault exchange, scope request, and step-up event is immutably logged. Tenant admins see only their own log — never others.",
              },
              {
                icon: "⬡",
                title: "OpenClaw / Ollama Ready",
                desc: "Built for locally-running sovereign AI. Your local agent sends intent. VaultGuard holds the keys and executes — securely.",
              },
            ].map((f) => (
              <div className="vg-feature" key={f.title}>
                <div className="vg-feature-icon">{f.icon}</div>
                <div className="vg-feature-title">{f.title}</div>
                <div className="vg-feature-desc">{f.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Code block */}
        <div className="vg-code-section">
          <div className="vg-section-label" style={{ marginBottom: "16px" }}>
            // DROP-IN INTEGRATION
          </div>
          <div
            className="vg-section-title"
            style={{ marginBottom: "32px", fontSize: "28px" }}
          >
            One function call. Full tenant isolation.
          </div>
          <div className="vg-code-block">
            <div className="vg-code-header">
              <div className="vg-code-dots">
                <span style={{ background: "#ff5f57" }} />
                <span style={{ background: "#febc2e" }} />
                <span style={{ background: "#28c840" }} />
              </div>
              <span className="vg-code-filename">agent/calendar-tool.ts</span>
              <span style={{ width: "60px" }} />
            </div>
            <div className="vg-code-body">
              <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                <code>
                  <span className="c-comment">
                    {"// ❌ Before VaultGuard — dangerous, tenant-unaware"}
                  </span>
                  {"\n"}
                  <span className="c-keyword">const</span>{" "}
                  <span className="c-normal">token</span> ={" "}
                  <span className="c-keyword">await</span>{" "}
                  <span className="c-fn">getAccessTokenForConnection</span>(
                  {"\n"}
                  {"  "}
                  <span className="c-normal">connection</span>:{" "}
                  <span className="c-string">"google-oauth2"</span>,{"\n"}
                  {"  "}
                  <span className="c-type">userId</span>: req.
                  <span className="c-normal">body</span>.
                  <span className="c-normal">userId</span>{" "}
                  <span className="c-comment">
                    {"// ← any string, spoofable"}
                  </span>
                  {"\n"}
                  {")"};{"\n\n"}
                  <span className="c-comment">
                    {
                      "// ✅ After VaultGuard — tenant-isolated, policy-enforced"
                    }
                  </span>
                  {"\n"}
                  <span className="c-keyword">const</span>{" "}
                  <span className="c-normal">result</span> ={" "}
                  <span className="c-keyword">await</span>{" "}
                  <span className="c-fn">tenantScopedVault</span>({"{"}
                  {"\n"}
                  {"  "}
                  <span className="c-normal">connection</span>:{" "}
                  <span className="c-string">"google-oauth2"</span>,{"\n"}
                  {"  "}
                  <span className="c-normal">scopes</span>: [
                  <span className="c-string">"calendar.events.write"</span>],
                  {"\n"}
                  {"  "}
                  <span className="c-normal">claims</span>:{" "}
                  <span className="c-fn">getTenantClaims</span>(
                  <span className="c-normal">req</span>),{" "}
                  <span className="c-comment">
                    {"// derived from verified session"}
                  </span>
                  {"\n"}
                  {"}"}, <span className="c-normal">tokenExchangeFn</span>);
                  {"\n\n"}
                  <span className="c-keyword">if</span> (!
                  <span className="c-normal">result</span>.
                  <span className="c-normal">success</span>) {"{"}
                  {"\n"}
                  {"  "}
                  <span className="c-comment">
                    {"// blocked + logged + broadcast to threat dashboard"}
                  </span>
                  {"\n"}
                  {"  "}
                  <span className="c-keyword">return</span>{" "}
                  <span className="c-fn">handleVaultError</span>(
                  <span className="c-normal">result</span>.
                  <span className="c-normal">error</span>);{"\n"}
                  {"}"}
                </code>
              </pre>
            </div>
          </div>
        </div>

        {/* How it works */}
        <div className="vg-section" style={{ paddingTop: "0" }}>
          <div className="vg-section-label">// HOW IT WORKS</div>
          <div className="vg-section-title">
            From local AI to authorized action in 4 steps.
          </div>

          <div className="vg-steps">
            {[
              {
                n: "01",
                title: "Local AI sends intent",
                desc: "Your Ollama or OpenClaw model processes the user request and calls a VaultGuard tool endpoint.",
              },
              {
                n: "02",
                title: "Tenant context verified",
                desc: "TenantJWT middleware stamps the request. ScopePolicy engine validates the requested connection and scopes.",
              },
              {
                n: "03",
                title: "Token Vault exchange",
                desc: "VaultGuard calls Auth0 Token Vault on behalf of the verified tenant user. Your agent never sees the credentials.",
              },
              {
                n: "04",
                title: "Action executed + logged",
                desc: "The scoped access token is used to execute the action. Every detail is written to the tenant-isolated audit log.",
              },
            ].map((s) => (
              <div className="vg-step" key={s.n}>
                <div className="vg-step-num">STEP {s.n}</div>
                <div className="vg-step-title">{s.title}</div>
                <div className="vg-step-desc">{s.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="vg-cta-section">
          <div className="vg-cta-title">Ready to secure your AI agents?</div>
          <div className="vg-cta-sub">
            Start with the open-source SDK or clone the full reference
            architecture. Production-safe multi-tenant agent auth in under an
            hour.
          </div>
          <div className="vg-cta-row" style={{ justifyContent: "center" }}>
            <a href="/auth/login" className="btn-primary-lg">
              Get started free →
            </a>
            <a
              href="https://github.com/its-kios09/vaultguard"
              target="_blank"
              className="btn-outline"
            >
              View on GitHub
            </a>
          </div>
        </div>

        {/* Footer */}
        <footer className="vg-footer">
          <div className="vg-footer-left">
            VaultGuard · Built for Auth0 "Authorized to Act" Hackathon 2026
          </div>
          <div className="vg-footer-right">MIT License · its-kios09</div>
        </footer>
      </div>
    </>
  );
}
