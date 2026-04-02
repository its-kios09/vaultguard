import { useQuery } from '@tanstack/react-query'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { getTenantStats, getMetrics } from '../lib/api'
import { Users, FileText, GitBranch, BookOpen, Shield, TrendingUp } from 'lucide-react'

export default function Dashboard() {
  const [tenantId] = useLocalStorage<string>('vg_tenant_id', '')
  const [tenantName] = useLocalStorage<string>('vg_tenant_name', '')

  const { data: stats } = useQuery({
    queryKey: ['stats', tenantId],
    queryFn: () => getTenantStats(tenantId),
    enabled: !!tenantId,
    refetchInterval: 10000,
  })

  const { data: metrics } = useQuery({
    queryKey: ['metrics'],
    queryFn: getMetrics,
    refetchInterval: 30000,
  })

  const statCards = [
    { label: 'Agents', value: stats?.data?.agents ?? 0, icon: Users, color: '#6366f1' },
    { label: 'Policies', value: stats?.data?.policies ?? 0, icon: FileText, color: '#22c55e' },
    { label: 'Delegations', value: stats?.data?.delegations ?? 0, icon: GitBranch, color: '#f59e0b' },
    { label: 'Audit logs', value: stats?.data?.auditLogs ?? 0, icon: BookOpen, color: '#06b6d4' },
  ]

  const delegationsByStatus = stats?.data?.delegationsByStatus ?? []

  return (
    <div style={{
      minHeight: '100%',
      padding: '32px 40px',
      fontFamily: "'DM Sans', system-ui, sans-serif",
      boxSizing: 'border-box',
    }}>
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 600, color: '#fff', marginBottom: '2px' }}>{tenantName}</h1>
        <p style={{ fontSize: '12px', color: '#3f3f46' }}>Tenant dashboard · live</p>
      </div>

      {/* Stat cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '12px',
        marginBottom: '16px',
      }}>
        {statCards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} style={{
            background: '#080808',
            border: '1px solid #141414',
            borderRadius: '12px',
            padding: '20px',
          }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '8px',
              background: `${color}15`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: '12px',
            }}>
              <Icon size={14} color={color} />
            </div>
            <div style={{ fontSize: '26px', fontWeight: 600, color: '#fff', lineHeight: 1 }}>{value}</div>
            <div style={{ fontSize: '12px', color: '#3f3f46', marginTop: '5px' }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Second row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '12px',
        marginBottom: '12px',
      }}>
        {/* Delegation status */}
        <div style={{ background: '#080808', border: '1px solid #141414', borderRadius: '12px', padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '16px' }}>
            <GitBranch size={13} color="#6366f1" />
            <span style={{ fontSize: '12px', fontWeight: 500, color: '#71717a' }}>Delegation status</span>
          </div>
          {delegationsByStatus.length === 0 ? (
            <p style={{ fontSize: '12px', color: '#2a2a2a' }}>No delegations yet</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {delegationsByStatus.map((s: any) => (
                <div key={s.status} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{
                    fontSize: '10px', fontWeight: 500, padding: '3px 8px', borderRadius: '5px',
                    background: s.status === 'APPROVED' ? 'rgba(34,197,94,.1)' :
                                s.status === 'PENDING' ? 'rgba(245,158,11,.1)' :
                                s.status === 'REJECTED' ? 'rgba(239,68,68,.1)' : 'rgba(255,255,255,.04)',
                    color: s.status === 'APPROVED' ? '#4ade80' :
                           s.status === 'PENDING' ? '#fbbf24' :
                           s.status === 'REJECTED' ? '#f87171' : '#52525b',
                  }}>{s.status}</span>
                  <span style={{ fontSize: '13px', fontWeight: 500, color: '#fff', fontFamily: 'monospace' }}>{s._count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Platform metrics */}
        <div style={{ background: '#080808', border: '1px solid #141414', borderRadius: '12px', padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '16px' }}>
            <TrendingUp size={13} color="#22c55e" />
            <span style={{ fontSize: '12px', fontWeight: 500, color: '#71717a' }}>Platform totals</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {metrics?.data?.totals && Object.entries(metrics.data.totals).map(([key, val]) => (
              <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', color: '#52525b', textTransform: 'capitalize' }}>{key}</span>
                <span style={{ fontSize: '12px', fontWeight: 500, color: '#71717a', fontFamily: 'monospace' }}>{val as number}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Auth0 Token Vault badge */}
      <div style={{
        background: 'rgba(99,102,241,.05)',
        border: '1px solid rgba(99,102,241,.12)',
        borderRadius: '12px', padding: '14px 18px',
        display: 'flex', alignItems: 'center', gap: '12px',
      }}>
        <Shield size={15} color="#6366f1" style={{ flexShrink: 0 }} />
        <div>
          <div style={{ fontSize: '12px', fontWeight: 500, color: '#fff' }}>Powered by Auth0 Token Vault</div>
          <div style={{ fontSize: '11px', color: '#3f3f46', marginTop: '2px' }}>
            All delegation tokens are real Auth0 JWTs — RS256 signed, audience-scoped, time-bound
          </div>
        </div>
      </div>
    </div>
  )
}
