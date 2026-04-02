import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { getDelegations, approveDelegation, rejectDelegation, revokeDelegation } from '../lib/api'
import { GitBranch, Check, X, Ban, ArrowRight } from 'lucide-react'

const statusStyle: Record<string, { bg: string; color: string }> = {
  APPROVED: { bg: 'rgba(34,197,94,.1)', color: '#4ade80' },
  PENDING: { bg: 'rgba(245,158,11,.1)', color: '#fbbf24' },
  REJECTED: { bg: 'rgba(239,68,68,.1)', color: '#f87171' },
  REVOKED: { bg: 'rgba(255,255,255,.04)', color: '#52525b' },
  EXPIRED: { bg: 'rgba(255,255,255,.03)', color: '#3f3f46' },
  BLOCKED: { bg: 'rgba(239,68,68,.1)', color: '#f87171' },
}

const borderColor: Record<string, string> = {
  PENDING: '#f59e0b',
  APPROVED: '#22c55e',
  REJECTED: '#ef4444',
  BLOCKED: '#ef4444',
}

function StatusBadge({ status }: { status: string }) {
  const st = statusStyle[status] || { bg: 'rgba(255,255,255,.04)', color: '#52525b' }
  return (
    <span style={{ fontSize: '10px', fontWeight: 500, padding: '3px 8px', borderRadius: '5px', background: st.bg, color: st.color }}>{status}</span>
  )
}

export default function Delegations() {
  const [tenantId] = useLocalStorage<string>('vg_tenant_id', '')
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['delegations', tenantId],
    queryFn: () => getDelegations(tenantId),
    enabled: !!tenantId,
    refetchInterval: 5000,
  })

  const approveMutation = useMutation({ mutationFn: approveDelegation, onSuccess: () => qc.invalidateQueries({ queryKey: ['delegations', tenantId] }) })
  const rejectMutation = useMutation({ mutationFn: rejectDelegation, onSuccess: () => qc.invalidateQueries({ queryKey: ['delegations', tenantId] }) })
  const revokeMutation = useMutation({ mutationFn: revokeDelegation, onSuccess: () => qc.invalidateQueries({ queryKey: ['delegations', tenantId] }) })

  const pending = data?.data?.filter((d: any) => d.status === 'PENDING') ?? []
  const others = data?.data?.filter((d: any) => d.status !== 'PENDING') ?? []

  return (
    <div style={{ padding: '32px 40px', fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '18px', fontWeight: 600, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
          <GitBranch size={16} color="#f59e0b" /> Delegations
        </h1>
        <p style={{ fontSize: '12px', color: '#3f3f46' }}>Manage delegation requests · auto-refreshes every 5s</p>
      </div>

      {pending.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '10px', fontWeight: 600, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>
            Awaiting approval ({pending.length})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {pending.map((d: any) => (
              <DelegationRow key={d.id} d={d} onApprove={() => approveMutation.mutate(d.id)} onReject={() => rejectMutation.mutate(d.id)} />
            ))}
          </div>
        </div>
      )}

      <div>
        {pending.length > 0 && others.length > 0 && (
          <div style={{ fontSize: '10px', fontWeight: 600, color: '#3f3f46', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>History</div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {isLoading ? (
            <p style={{ fontSize: '12px', color: '#3f3f46' }}>Loading...</p>
          ) : !data?.data?.length ? (
            <div style={{ background: '#080808', border: '1px solid #141414', borderRadius: '12px', padding: '32px', textAlign: 'center', color: '#2a2a2a', fontSize: '12px' }}>No delegations yet</div>
          ) : (
            others.map((d: any) => (
              <DelegationRow key={d.id} d={d} onRevoke={d.status === 'APPROVED' ? () => revokeMutation.mutate(d.id) : undefined} />
            ))
          )}
        </div>
      </div>
    </div>
  )
}

function DelegationRow({ d, onApprove, onReject, onRevoke }: any) {
  const leftBorder = borderColor[d.status] || '#1a1a1a'
  return (
    <div style={{ background: '#080808', border: '1px solid #141414', borderLeft: `2px solid ${leftBorder}`, borderRadius: '10px', padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px' }}>
          <StatusBadge status={d.status} />
          <code style={{ fontSize: '11px', color: '#6366f1', fontFamily: 'monospace' }}>{d.action}</code>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', marginBottom: '3px' }}>
          <span style={{ color: '#a1a1aa' }}>{d.requestingTenant?.name}</span>
          <ArrowRight size={11} color="#3f3f46" />
          <span style={{ color: '#a1a1aa' }}>{d.receivingTenant?.name}</span>
        </div>
        <div style={{ fontSize: '11px', color: '#2a2a2a' }}>
          {d.agent?.name} · {new Date(d.createdAt).toLocaleString()}
          {d.expiresAt && ` · exp ${new Date(d.expiresAt).toLocaleString()}`}
        </div>
      </div>
      <div style={{ display: 'flex', gap: '6px', marginLeft: '12px', flexShrink: 0 }}>
        {onApprove && (
          <button onClick={onApprove} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '5px 10px', background: 'rgba(34,197,94,.1)', color: '#4ade80', border: '1px solid rgba(34,197,94,.15)', borderRadius: '6px', fontSize: '11px', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
            <Check size={11} /> Approve
          </button>
        )}
        {onReject && (
          <button onClick={onReject} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '5px 10px', background: 'rgba(239,68,68,.08)', color: '#f87171', border: '1px solid rgba(239,68,68,.15)', borderRadius: '6px', fontSize: '11px', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
            <X size={11} /> Reject
          </button>
        )}
        {onRevoke && (
          <button onClick={onRevoke} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '5px 10px', background: '#0d0d0d', color: '#52525b', border: '1px solid #1a1a1a', borderRadius: '6px', fontSize: '11px', cursor: 'pointer', fontFamily: 'inherit' }}>
            <Ban size={11} /> Revoke
          </button>
        )}
      </div>
    </div>
  )
}
