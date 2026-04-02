import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth0 } from '@auth0/auth0-react'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { Users, FileText, GitBranch, BarChart3, BookOpen, LogOut, Activity } from 'lucide-react'

const navItems = [
  { to: '/dashboard', icon: BarChart3, label: 'Overview', end: true },
  { to: '/dashboard/agents', icon: Users, label: 'Agents' },
  { to: '/dashboard/policies', icon: FileText, label: 'Policies' },
  { to: '/dashboard/delegations', icon: GitBranch, label: 'Delegations' },
  { to: '/dashboard/graph', icon: Activity, label: 'Trust graph' },
  { to: '/dashboard/audit', icon: BookOpen, label: 'Audit log' },
]

function Logo({ size = 28 }: { size?: number }) {
  const id = 'layout' + size
  return (
    <svg width={size} height={size} viewBox="0 0 34 34" fill="none">
      <circle cx="17" cy="17" r="16" stroke="#1a1a1a" strokeWidth="1" />
      <circle cx="17" cy="17" r="16" stroke={`url(#${id})`} strokeWidth="1.5" strokeDasharray="55 55" strokeLinecap="round" />
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="34" y2="34" gradientUnits="userSpaceOnUse">
          <stop stopColor="#6366f1" />
          <stop offset="1" stopColor="#6366f1" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect x="11" y="15.5" width="12" height="9" rx="2" fill="none" stroke="white" strokeWidth="1.3" />
      <path d="M13.5 15.5V13.5a3.5 3.5 0 017 0v2" stroke="white" strokeWidth="1.3" strokeLinecap="round" fill="none" />
      <circle cx="17" cy="20" r="1.4" fill="white" />
      <path d="M17 21.4v1.6" stroke="white" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  )
}

export default function Layout() {
  const [tenantName] = useLocalStorage<string>('vg_tenant_name', '')
  const [, setTenantId] = useLocalStorage<string | null>('vg_tenant_id', null)
  const [, setTenantName] = useLocalStorage<string>('vg_tenant_name', '')
  const { logout } = useAuth0()

  const handleLogout = () => {
    setTenantId(null)
    setTenantName('')
    logout({ logoutParams: { returnTo: window.location.origin } })
  }

  return (
    <div style={{
      display: 'flex', height: '100vh',
      background: '#030303',
      fontFamily: "'DM Sans', system-ui, sans-serif",
    }}>
      {/* Sidebar */}
      <aside style={{
        width: '200px', flexShrink: 0,
        background: '#080808',
        borderRight: '1px solid #0f0f0f',
        display: 'flex', flexDirection: 'column',
      }}>
        {/* Logo */}
        <div style={{ padding: '14px 16px', borderBottom: '1px solid #0f0f0f', display: 'flex', alignItems: 'center', gap: '9px' }}>
          <Logo size={26} />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#fff' }}>VaultGuard</div>
            <div style={{ fontSize: '11px', color: '#2a2a2a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {tenantName || 'No org'}
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '6px' }}>
          {navItems.map(({ to, icon: Icon, label, end }) => (
            <NavLink key={to} to={to} end={end} style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '6px 10px', borderRadius: '7px',
              fontSize: '12px', fontWeight: isActive ? 500 : 400,
              color: isActive ? '#fff' : '#3f3f46',
              background: isActive ? '#111' : 'transparent',
              border: isActive ? '1px solid #1a1a1a' : '1px solid transparent',
              textDecoration: 'none', marginBottom: '1px',
              transition: 'all 0.1s',
            })}>
              <Icon size={13} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div style={{ padding: '6px', borderTop: '1px solid #0f0f0f' }}>
          <button
            onClick={handleLogout}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '6px 10px', borderRadius: '7px',
              fontSize: '12px', color: '#2a2a2a',
              background: 'transparent', border: 'none',
              cursor: 'pointer', width: '100%',
              fontFamily: 'inherit',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.background = '#111' }}
            onMouseLeave={e => { e.currentTarget.style.color = '#2a2a2a'; e.currentTarget.style.background = 'transparent' }}
          >
            <LogOut size={13} />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, overflow: 'auto', background: '#030303' }}>
        <Outlet />
      </main>
    </div>
  )
}
