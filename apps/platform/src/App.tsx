import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth0 } from '@auth0/auth0-react'
import { useLocalStorage } from './hooks/useLocalStorage'
import Layout from './components/Layout'
import Landing from './pages/Landing'
import Register from './pages/Register'
import Callback from './pages/Callback'
import Dashboard from './pages/Dashboard'
import Agents from './pages/Agents'
import Policies from './pages/Policies'
import Delegations from './pages/Delegations'
import TrustGraph from './pages/TrustGraph'
import AuditLog from './pages/AuditLog'
import Loading from './pages/Loading'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, loginWithRedirect } = useAuth0()
  const [tenantId] = useLocalStorage<string | null>('vg_tenant_id', null)

  if (isLoading) return <Loading />
  if (!isAuthenticated) {
    loginWithRedirect()
    return <Loading />
  }
  if (!tenantId) return <Navigate to="/register" replace />
  return <>{children}</>
}

export default function App() {
  const { isLoading } = useAuth0()
  if (isLoading) return <Loading />

  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/callback" element={<Callback />} />
      <Route path="/register" element={<Register />} />
      <Route
        path="/dashboard"
        element={<ProtectedRoute><Layout /></ProtectedRoute>}
      >
        <Route index element={<Dashboard />} />
        <Route path="agents" element={<Agents />} />
        <Route path="policies" element={<Policies />} />
        <Route path="delegations" element={<Delegations />} />
        <Route path="graph" element={<TrustGraph />} />
        <Route path="audit" element={<AuditLog />} />
      </Route>
    </Routes>
  )
}
