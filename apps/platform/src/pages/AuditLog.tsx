import { useQuery } from '@tanstack/react-query'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { getAuditLogs } from '../lib/api'
import { BookOpen, Download, ArrowRight } from 'lucide-react'

const actionColors: Record<string, string> = {
  'delegation.approved': '#4ade80',
  'delegation.blocked': '#f87171',
  'delegation.rejected': '#f87171',
  'delegation.revoked': '#52525b',
  'delegation.step_up_required': '#fbbf24',
  'delegation.verified': '#6366f1',
  'delegation.expired': '#2a2a2a',
  'delegation.denied': '#f87171',
  'agent.created': '#6366f1',
  'agent.deleted': '#f87171',
  'policy.created': '#4ade80',
  'policy.deleted': '#f87171',
  'stepup.initiated': '#fbbf24',
  'stepup.completed': '#4ade80',
  'vault.connect.initiated': '#06b6d4',
  'vault.connect.completed': '#4ade80',
  'vault.exchange.success': '#4ade80',
}

const statusStyle: Record<string, { bg: string; color: string }> = {
  SUCCESS: { bg: 'rgba(34,197,94,.1)', color: '#4ade80' },
  APPROVED: { bg: 'rgba(34,197,94,.1)', color: '#4ade80' },
  PENDING: { bg: 'rgba(245,158,11,.1)', color: '#fbbf24' },
  BLOCKED: { bg: 'rgba(239,68,68,.1)', color: '#f87171' },
  REJECTED: { bg: 'rgba(239,68,68,.1)', color: '#f87171' },
}

export default function AuditLog() {
  const [tenantId] = useLocalStorage<string>('vg_tenant_id', '')

  const { data, isLoading } = useQuery({
    queryKey: ['audit', tenantId],
    queryFn: () => getAuditLogs(tenantId, { limit: 50 }),
    enabled: !!tenantId,
    refetchInterval: 10000,
  })

  return (
    <div style={{ padding: '32px 40px', fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '18px', fontWeight: 600, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
            <BookOpen size={16} color="#f59e0b" /> Audit log
          </h1>
          <p style={{ fontSize: '12px', color: '#3f3f46' }}>Full chain of custody · last 50 events</p>
        </div>
        <button onClick={() => window.open(`${import.meta.env.VITE_API_URL}/audit/export?tenantId=${tenantId}`, '_blank')} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px', background: '#080808', color: '#71717a', border: '1px solid #141414', borderRadius: '8px', fontSize: '12px', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
          <Download size={13} /> Export CSV
        </button>
      </div>

      <div style={{ background: '#080808', border: '1px solid #141414', borderRadius: '12px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #111' }}>
              {['Action', 'Status', 'Delegation', 'Time'].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '10px 16px', fontSize: '10px', fontWeight: 600, color: '#2a2a2a', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={4} style={{ padding: '24px 16px', fontSize: '12px', color: '#3f3f46' }}>Loading...</td></tr>
            ) : !data?.data?.length ? (
              <tr><td colSpan={4} style={{ padding: '24px 16px', fontSize: '12px', color: '#2a2a2a' }}>No audit logs yet</td></tr>
            ) : (
              data.data.map((log: any, i: number) => {
                const st = statusStyle[log.status] || { bg: 'rgba(255,255,255,.04)', color: '#52525b' }
                return (
                  <tr key={log.id} style={{ borderBottom: i < data.data.length - 1 ? '1px solid #0d0d0d' : 'none' }}>
                    <td style={{ padding: '10px 16px' }}>
                      <code style={{ fontSize: '11px', fontFamily: 'monospace', color: actionColors[log.action] || '#52525b' }}>{log.action}</code>
                    </td>
                    <td style={{ padding: '10px 16px' }}>
                      <span style={{ fontSize: '10px', fontWeight: 500, padding: '2px 7px', borderRadius: '4px', background: st.bg, color: st.color }}>{log.status}</span>
                    </td>
                    <td style={{ padding: '10px 16px' }}>
                      {log.delegation ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px' }}>
                          <span style={{ color: '#71717a' }}>{log.delegation.requestingTenant?.name}</span>
                          <ArrowRight size={9} color="#2a2a2a" />
                          <span style={{ color: '#71717a' }}>{log.delegation.receivingTenant?.name}</span>
                          <code style={{ marginLeft: '4px', fontSize: '10px', color: '#6366f1', fontFamily: 'monospace' }}>{log.delegation.action}</code>
                        </div>
                      ) : <span style={{ color: '#2a2a2a', fontSize: '11px' }}>—</span>}
                    </td>
                    <td style={{ padding: '10px 16px', fontSize: '11px', color: '#2a2a2a', whiteSpace: 'nowrap' }}>{new Date(log.createdAt).toLocaleString()}</td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
