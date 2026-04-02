import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth0 } from '@auth0/auth0-react'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { registerTenant } from '../lib/api'

function Logo({ size = 34 }: { size?: number }) {
  const id = 'rl' + size
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

export default function Register() {
  const navigate = useNavigate()
  const { user, logout } = useAuth0()
  const [, setTenantId] = useLocalStorage<string | null>('vg_tenant_id', null)
  const [, setTenantName] = useLocalStorage<string>('vg_tenant_name', '')
  const [, setTenantSlug] = useLocalStorage<string>('vg_tenant_slug', '')
  const [form, setForm] = useState({ name: '', slug: '', description: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await registerTenant({ ...form, auth0UserId: user?.sub })
      setTenantId(res.data.id)
      setTenantName(res.data.name)
      setTenantSlug(res.data.slug)
      navigate('/dashboard')
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  const inp = {
    width: '100%', height: '38px', padding: '0 12px',
    background: '#0a0a0a', border: '1px solid #1a1a1a',
    borderRadius: '8px', fontSize: '13px', color: '#fff',
    outline: 'none', fontFamily: 'inherit',
  }

  return (
    <div style={{ background: '#030303', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '32px' }}>
          <Logo size={30} />
          <span style={{ fontSize: '15px', fontWeight: 600, color: '#fff' }}>VaultGuard</span>
        </div>

        <h1 style={{ fontSize: '22px', fontWeight: 600, color: '#fff', marginBottom: '6px', letterSpacing: '-.3px' }}>
          Create your org
        </h1>
        <p style={{ fontSize: '13px', color: '#52525b', marginBottom: '28px' }}>
          Signed in as <span style={{ color: '#a1a1aa' }}>{user?.email}</span>
        </p>

        <div style={{ background: '#080808', border: '1px solid #131313', borderRadius: '14px', padding: '24px' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#3f3f46', marginBottom: '6px' }}>Organization name</label>
              <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="MediCore HIMS" required style={inp} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#3f3f46', marginBottom: '6px' }}>Slug</label>
              <input type="text" value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })} placeholder="medicore-hims" required style={{ ...inp, fontFamily: 'monospace' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#3f3f46', marginBottom: '6px' }}>Description <span style={{ color: '#2a2a2a' }}>(optional)</span></label>
              <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Hospital Information Management System" rows={3} style={{ ...inp, height: 'auto', padding: '10px 12px', resize: 'none' }} />
            </div>

            {error && (
              <div style={{ padding: '10px 12px', background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.15)', borderRadius: '8px', fontSize: '12px', color: '#f87171' }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} style={{ height: '40px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 500, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1, fontFamily: 'inherit' }}>
              {loading ? 'Creating...' : 'Create org →'}
            </button>
          </form>
        </div>

        <button onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })} style={{ marginTop: '16px', background: 'none', border: 'none', fontSize: '12px', color: '#2a2a2a', cursor: 'pointer', width: '100%', textAlign: 'center', fontFamily: 'inherit' }}>
          Sign out
        </button>
      </div>
    </div>
  )
}
