import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth0 } from '@auth0/auth0-react'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { getMyTenant } from '../lib/api'

export default function Callback() {
  const { isLoading, isAuthenticated, user, error } = useAuth0()
  const navigate = useNavigate()
  const [, setTenantId] = useLocalStorage<string | null>('vg_tenant_id', null)
  const [, setTenantName] = useLocalStorage<string>('vg_tenant_name', '')
  const [, setTenantSlug] = useLocalStorage<string>('vg_tenant_slug', '')
  const ran = useRef(false)

  useEffect(() => {
    console.log('[Callback] state:', { isLoading, isAuthenticated, user, error })
  }, [isLoading, isAuthenticated, user, error])

  useEffect(() => {
    if (isLoading) return
    if (error) {
      console.error('[Callback] Auth0 error:', error)
      navigate('/')
      return
    }
    if (!isAuthenticated || !user?.sub) {
      console.warn('[Callback] Not authenticated, redirecting to /')
      navigate('/')
      return
    }
    if (ran.current) return
    ran.current = true

    console.log('[Callback] Authenticated as:', user.sub, user.email)
    console.log('[Callback] Fetching tenant for:', user.sub)

    getMyTenant(user.sub)
      .then((res) => {
        console.log('[Callback] Tenant found:', res.data)
        setTenantId(res.data.id)
        setTenantName(res.data.name)
        setTenantSlug(res.data.slug)
        navigate('/dashboard')
      })
      .catch((err) => {
        console.log('[Callback] No tenant, status:', err?.response?.status, '→ /register')
        navigate('/register')
      })
  }, [isLoading, isAuthenticated, user, error])

  return (
    <div style={{ background: '#030303', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
        <div style={{ width: '32px', height: '32px', border: '2px solid #6366f1', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <span style={{ fontSize: '13px', color: '#52525b', fontFamily: 'monospace' }}>Authenticating...</span>
        <div style={{ fontSize: '11px', color: '#1f1f1f', fontFamily: 'monospace', textAlign: 'center', maxWidth: '400px' }}>
          <div>isLoading: {String(isLoading)}</div>
          <div>isAuthenticated: {String(isAuthenticated)}</div>
          <div>user: {user?.email || 'none'}</div>
          <div>error: {error?.message || 'none'}</div>
          <div>url: {window.location.href}</div>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
