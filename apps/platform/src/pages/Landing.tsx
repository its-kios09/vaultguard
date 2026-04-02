import { useAuth0 } from '@auth0/auth0-react'
import { useLocalStorage } from '../hooks/useLocalStorage'

function Logo({ size = 34 }: { size?: number }) {
  const id = 'll' + size
  return (
    <svg width={size} height={size} viewBox="0 0 34 34" fill="none">
      <circle cx="17" cy="17" r="16" stroke="#1a1a1a" strokeWidth="1" />
      <circle cx="17" cy="17" r="16" stroke={`url(#${id})`} strokeWidth="1.5" strokeDasharray="55 55" strokeLinecap="round" />
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="34" y2="34" gradientUnits="userSpaceOnUse">
          <stop stopColor="#6366f1" /><stop offset="1" stopColor="#6366f1" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect x="11" y="15.5" width="12" height="9" rx="2" fill="none" stroke="white" strokeWidth="1.3" />
      <path d="M13.5 15.5V13.5a3.5 3.5 0 017 0v2" stroke="white" strokeWidth="1.3" strokeLinecap="round" fill="none" />
      <circle cx="17" cy="20" r="1.4" fill="white" />
      <path d="M17 21.4v1.6" stroke="white" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  )
}

export default function Landing() {
  const { loginWithRedirect, isAuthenticated } = useAuth0()
  const [tenantId] = useLocalStorage<string | null>('vg_tenant_id', null)

  const handleCTA = () => {
    if (isAuthenticated && tenantId) {
      window.location.href = '/dashboard'
    } else {
      loginWithRedirect()
    }
  }

  return (
    <div style={{ background: '#030303', minHeight: '100vh', fontFamily: "'DM Sans', system-ui, sans-serif", color: '#fff', overflowX: 'hidden', position: 'relative' }}>
      <div style={{ position: 'fixed', inset: 0, backgroundImage: 'linear-gradient(#ffffff04 1px,transparent 1px),linear-gradient(90deg,#ffffff04 1px,transparent 1px)', backgroundSize: '52px 52px', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', width: '600px', height: '260px', top: '120px', left: '50%', transform: 'translateX(-50%)', background: 'radial-gradient(ellipse,rgba(99,102,241,.06) 0%,transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />

      {/* Nav */}
      <nav style={{ position: 'relative', zIndex: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 36px', borderBottom: '1px solid #0d0d0d' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '11px' }}>
          <Logo size={34} />
          <span style={{ fontSize: '15px', fontWeight: 600, letterSpacing: '-.25px' }}>VaultGuard</span>
        </div>
        <span style={{ fontSize: '11px', padding: '3px 11px', border: '1px solid #1a1a1a', borderRadius: '20px', color: '#2a2a2a', fontFamily: 'monospace' }}>
          Auth0 Token Vault · Hackathon 2026
        </span>
      </nav>

      {/* Hero */}
      <div style={{ position: 'relative', zIndex: 2, maxWidth: '640px', margin: '0 auto', padding: '76px 32px 52px', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '11px', padding: '5px 14px', background: 'rgba(99,102,241,.08)', border: '1px solid rgba(99,102,241,.18)', borderRadius: '24px', color: '#818cf8', marginBottom: '30px', fontFamily: 'monospace' }}>
          <span style={{ width: '7px', height: '7px', background: '#22c55e', borderRadius: '50%', boxShadow: '0 0 8px rgba(34,197,94,.7)', display: 'inline-block' }} />
          Real Auth0 JWTs · No hardcoded secrets
        </div>

        <h1 style={{ fontSize: '50px', fontWeight: 700, letterSpacing: '-1.2px', lineHeight: 1.06, marginBottom: '18px' }}>
          Trust layer for<br />
          <span style={{ color: '#6366f1' }}>agent delegations</span>
        </h1>

        <p style={{ fontSize: '15px', color: '#52525b', lineHeight: 1.72, marginBottom: '36px', maxWidth: '420px', marginLeft: 'auto', marginRight: 'auto' }}>
          Replace static Bearer tokens with scoped, audited, revocable delegations — powered by Auth0 Token Vault.
        </p>

        <button onClick={handleCTA} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 26px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 0 0 1px rgba(99,102,241,.4),0 1px 0 rgba(255,255,255,.08) inset' }}>
          {isAuthenticated && tenantId ? 'Open dashboard' : 'Get started with Auth0'}
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 7h8M8 4l3 3-3 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>

        {/* Delegation card */}
        <div style={{ margin: '28px auto 0', maxWidth: '500px', background: '#080808', border: '1px solid #131313', borderRadius: '14px', overflow: 'hidden' }}>
          <div style={{ padding: '11px 16px', borderBottom: '1px solid #0f0f0f', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', gap: '6px' }}>
              {['#ff5f57', '#febc2e', '#28c840'].map(c => <span key={c} style={{ width: '10px', height: '10px', borderRadius: '50%', background: c, display: 'inline-block' }} />)}
            </div>
            <span style={{ fontSize: '11px', fontFamily: 'monospace', color: '#2a2a2a' }}>delegation · auth0_m2m · RS256</span>
          </div>
          <div style={{ padding: '4px 16px 8px' }}>
            {[
              { k: 'from', v: 'MediCore HIMS', vc: '#a1a1aa' },
              { k: 'to', v: 'NatSupply LMIS', vc: '#a1a1aa' },
              { k: 'action', v: 'stock.write', chip: { bg: 'rgba(99,102,241,.1)', color: '#818cf8', border: 'rgba(99,102,241,.2)' } },
              { k: 'status', v: 'APPROVED', chip: { bg: 'rgba(34,197,94,.08)', color: '#4ade80', border: 'rgba(34,197,94,.15)' } },
              { k: 'expires', v: 'in 24h · revocable', vc: '#3f3f46' },
              { k: 'issued by', v: 'Auth0 Token Vault', vc: '#3f3f46' },
            ].map(({ k, v, vc, chip }, i) => (
              <div key={k} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: i < 5 ? '1px solid #0d0d0d' : 'none' }}>
                <span style={{ fontSize: '11px', fontFamily: 'monospace', color: '#2a2a2a' }}>{k}</span>
                {chip ? (
                  <span style={{ padding: '3px 8px', borderRadius: '5px', fontSize: '10px', fontFamily: 'monospace', fontWeight: 500, background: chip.bg, color: chip.color, border: `1px solid ${chip.border}` }}>{v}</span>
                ) : (
                  <span style={{ fontSize: '11px', fontFamily: 'monospace', color: vc }}>{v}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Feature strip */}
      <div style={{ position: 'relative', zIndex: 2, display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', borderTop: '1px solid #0d0d0d' }}>
        {[
          { color: '#6366f1', bg: 'rgba(99,102,241,.1)', title: 'Token Vault', desc: 'Auth0 issues real RS256 JWTs via OAuth 2.0 Token Exchange. Agents never see raw credentials.', icon: <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><rect x="2.5" y="7" width="10" height="7" rx="1.5" stroke="#6366f1" strokeWidth="1.3"/><path d="M5 7V5.5a2.5 2.5 0 015 0V7" stroke="#6366f1" strokeWidth="1.3" strokeLinecap="round" fill="none"/></svg> },
          { color: '#22c55e', bg: 'rgba(34,197,94,.08)', title: 'Policy engine', desc: 'ALLOW · BLOCK · STEP_UP per action, per tenant. Deny-by-default with full override control.', icon: <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M2 4.5h11M2 7.5h7M2 10.5h9" stroke="#22c55e" strokeWidth="1.3" strokeLinecap="round"/></svg> },
          { color: '#f59e0b', bg: 'rgba(245,158,11,.08)', title: 'Audit trail', desc: 'Every delegation logged with full chain of custody per tenant. One-click revocation anytime.', icon: <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><circle cx="7.5" cy="7.5" r="5.5" stroke="#f59e0b" strokeWidth="1.3"/><path d="M7.5 5v3l2 1.5" stroke="#f59e0b" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg> },
        ].map(({ bg, title, desc, icon }, i) => (
          <div key={title} style={{ padding: '28px 30px', borderRight: i < 2 ? '1px solid #0d0d0d' : 'none' }}>
            <div style={{ width: '30px', height: '30px', background: bg, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px' }}>{icon}</div>
            <div style={{ fontSize: '13px', fontWeight: 500, color: '#d4d4d8', marginBottom: '6px' }}>{title}</div>
            <div style={{ fontSize: '12px', color: '#3f3f46', lineHeight: 1.6 }}>{desc}</div>
          </div>
        ))}
      </div>

      {/* Footer bar */}
      <div style={{ position: 'relative', zIndex: 2, padding: '12px 36px', borderTop: '1px solid #0d0d0d', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontFamily: 'monospace', color: '#22c55e', background: 'rgba(34,197,94,.05)', border: '1px solid rgba(34,197,94,.1)', borderRadius: '6px', padding: '4px 10px', flexShrink: 0 }}>
          <span style={{ width: '6px', height: '6px', background: '#22c55e', borderRadius: '50%', display: 'inline-block' }} />
          API online
        </span>
        <span style={{ fontSize: '11px', fontFamily: 'monospace', color: '#1f1f1f', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          dev-e4jfj18ze4bq2ych.us.auth0.com · audience: https://api.vaultguard.dev · tenants: 2 · delegations: 9
        </span>
      </div>
    </div>
  )
}
