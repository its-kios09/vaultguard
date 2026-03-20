import { auth0 } from "@/lib/auth0";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth0.getSession();
  if (!session) redirect("/auth/login");

  return (
    <div className="dash-root">
      <nav className="dash-nav">
        <div className="dash-nav-left">
          <Link href="/" className="dash-logo">
            <svg width="22" height="26" viewBox="0 0 88 100" fill="none">
              <path d="M44 4L8 18V46C8 66 24 83 44 92C64 83 80 66 80 46V18L44 4Z" fill="#13101f" stroke="#7c5cff" strokeWidth="2"/>
              <path d="M44 12L16 24V46C16 62 28 76 44 84C60 76 72 62 72 46V24L44 12Z" fill="none" stroke="#4a3a99" strokeWidth="0.75" strokeDasharray="3 3"/>
              <circle cx="44" cy="48" r="18" fill="#0d0b1a" stroke="#7c5cff" strokeWidth="2"/>
              <circle cx="44" cy="45" r="4" fill="#7c5cff"/>
              <rect x="42" y="48" width="4" height="6" rx="1" fill="#7c5cff"/>
              <circle cx="30" cy="22" r="2" fill="#7c5cff"/>
              <circle cx="58" cy="22" r="2" fill="#5b8fff"/>
            </svg>
            <span className="dash-logo-text">Vault<span>Guard</span></span>
          </Link>

          <div className="dash-nav-links">
            <Link href="/dashboard" className="dash-nav-link">Overview</Link>
            <Link href="/dashboard/connections" className="dash-nav-link">Connections</Link>
            <Link href="/dashboard/policy" className="dash-nav-link">Scope Policy</Link>
            <Link href="/dashboard/audit" className="dash-nav-link">Audit Log</Link>
            <Link href="/dashboard/threats" className="dash-nav-link">Threats</Link>
          </div>
        </div>

        <div className="dash-nav-right">
          <div className="dash-tenant-badge">
            <div className="dash-tenant-dot" />
            TENANT · DEMO-001
          </div>
          <div className="dash-user-pill">
            <div className="dash-user-avatar">
              {session.user.email?.[0]?.toUpperCase() ?? "U"}
            </div>
            <span className="dash-user-email">{session.user.email}</span>
          </div>
          <a href="/auth/logout" className="dash-logout">Logout</a>
        </div>
      </nav>

      <div className="dash-content">
        {children}
      </div>

      <style>{`
        @import url("https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&display=swap");
        @import url("https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&display=swap");

        .dash-root {
          font-family: "DM Sans", sans-serif;
          background: #06060a;
          color: #e8e6f0;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }

        .dash-nav {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 32px;
          height: 60px;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          background: rgba(6,6,10,0.95);
          backdrop-filter: blur(12px);
          position: sticky;
          top: 0;
          z-index: 50;
          flex-shrink: 0;
        }

        .dash-nav-left {
          display: flex;
          align-items: center;
          gap: 24px;
        }

        .dash-logo {
          display: flex;
          align-items: center;
          gap: 8px;
          text-decoration: none;
          flex-shrink: 0;
        }

        .dash-logo-text {
          font-size: 16px;
          font-weight: 700;
          color: #f0eeff;
          letter-spacing: -0.3px;
          font-family: "DM Sans", sans-serif;
        }
        .dash-logo-text span { color: #7c5cff; }

        .dash-nav-links {
          display: flex;
          align-items: center;
          gap: 2px;
        }

        .dash-nav-link {
          font-size: 13px;
          font-weight: 500;
          color: rgba(255,255,255,0.4);
          text-decoration: none;
          padding: 6px 12px;
          border-radius: 7px;
          transition: all 0.15s;
          font-family: "DM Sans", sans-serif;
          white-space: nowrap;
        }
        .dash-nav-link:hover {
          color: #fff;
          background: rgba(255,255,255,0.06);
        }

        .dash-nav-right {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-shrink: 0;
        }

        .dash-tenant-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          background: rgba(124,92,255,0.08);
          border: 1px solid rgba(124,92,255,0.2);
          border-radius: 100px;
          padding: 4px 10px;
          font-family: "DM Mono", monospace;
          font-size: 10px;
          color: #a090ff;
          letter-spacing: 0.05em;
          white-space: nowrap;
        }

        .dash-tenant-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: #7c5cff;
          animation: dash-pulse 2s infinite;
          flex-shrink: 0;
        }

        @keyframes dash-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }

        .dash-user-pill {
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 100px;
          padding: 4px 12px 4px 4px;
        }

        .dash-user-avatar {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: linear-gradient(135deg, #7c5cff, #5b8fff);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          font-weight: 700;
          color: white;
          font-family: "DM Sans", sans-serif;
          flex-shrink: 0;
        }

        .dash-user-email {
          font-family: "DM Mono", monospace;
          font-size: 11px;
          color: rgba(255,255,255,0.4);
          max-width: 180px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .dash-logout {
          font-size: 13px;
          color: rgba(255,255,255,0.3);
          text-decoration: none;
          padding: 6px 10px;
          border-radius: 7px;
          transition: all 0.15s;
          font-family: "DM Sans", sans-serif;
          white-space: nowrap;
        }
        .dash-logout:hover {
          color: #ff6b6b;
          background: rgba(255,107,107,0.08);
        }

        .dash-content {
          flex: 1;
          padding: 36px 40px;
          max-width: 1400px;
          margin: 0 auto;
          width: 100%;
        }

        @media (max-width: 1024px) {
          .dash-nav { padding: 0 20px; }
          .dash-content { padding: 24px 20px; }
          .dash-tenant-badge { display: none; }
        }

        @media (max-width: 768px) {
          .dash-nav-links { display: none; }
          .dash-user-email { display: none; }
        }
      `}</style>
    </div>
  );
}
