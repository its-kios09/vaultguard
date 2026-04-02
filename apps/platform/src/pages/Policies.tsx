import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { getPolicies, createPolicy, deletePolicy } from '../lib/api'
import { FileText, Plus, Trash2, ShieldCheck, ShieldX, ShieldAlert } from 'lucide-react'

const effectConfig = {
  ALLOW: { color: '#4ade80', bg: 'rgba(34,197,94,.1)', icon: ShieldCheck },
  BLOCK: { color: '#f87171', bg: 'rgba(239,68,68,.1)', icon: ShieldX },
  STEP_UP: { color: '#fbbf24', bg: 'rgba(245,158,11,.1)', icon: ShieldAlert },
}

export default function Policies() {
  const [tenantId] = useLocalStorage<string>('vg_tenant_id', '')
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ action: '', effect: 'ALLOW', requireStepUp: false, ttlSeconds: 3600 })
  const [error, setError] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['policies', tenantId],
    queryFn: () => getPolicies(tenantId),
    enabled: !!tenantId,
  })

  const createMutation = useMutation({
    mutationFn: (d: any) => createPolicy(tenantId, d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['policies', tenantId] })
      setShowForm(false)
      setForm({ action: '', effect: 'ALLOW', requireStepUp: false, ttlSeconds: 3600 })
      setError('')
    },
    onError: (err: any) => setError(err.response?.data?.error || 'Failed'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deletePolicy(tenantId, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['policies', tenantId] }),
  })

  const inp = {
    width: '100%', height: '36px', padding: '0 10px',
    background: '#0d0d0d', border: '1px solid #1a1a1a',
    borderRadius: '7px', fontSize: '13px', color: '#fff',
    outline: 'none', fontFamily: 'inherit',
  } as React.CSSProperties

  return (
    <div style={{ padding: '32px 40px', fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '18px', fontWeight: 600, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
            <FileText size={16} color="#22c55e" /> Policies
          </h1>
          <p style={{ fontSize: '12px', color: '#3f3f46' }}>Define what external agents can do in your systems</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
          <Plus size={13} /> Add policy
        </button>
      </div>

      {showForm && (
        <div style={{ background: '#080808', border: '1px solid #141414', borderRadius: '12px', padding: '20px', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '13px', fontWeight: 500, color: '#fff', marginBottom: '16px' }}>New policy</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11px', color: '#3f3f46', marginBottom: '5px' }}>Action</label>
              <input type="text" value={form.action} onChange={e => setForm({ ...form, action: e.target.value })} placeholder="stock.write" style={{ ...inp, fontFamily: 'monospace' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '11px', color: '#3f3f46', marginBottom: '5px' }}>Effect</label>
              <select value={form.effect} onChange={e => setForm({ ...form, effect: e.target.value })} style={inp}>
                <option value="ALLOW">ALLOW</option>
                <option value="BLOCK">BLOCK</option>
                <option value="STEP_UP">STEP_UP</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '11px', color: '#3f3f46', marginBottom: '5px' }}>TTL (seconds)</label>
              <input type="number" value={form.ttlSeconds} onChange={e => setForm({ ...form, ttlSeconds: parseInt(e.target.value) })} style={inp} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '18px' }}>
              <input type="checkbox" id="stepup" checked={form.requireStepUp} onChange={e => setForm({ ...form, requireStepUp: e.target.checked })} style={{ width: '14px', height: '14px', accentColor: '#6366f1' }} />
              <label htmlFor="stepup" style={{ fontSize: '12px', color: '#71717a', cursor: 'pointer' }}>Require step-up</label>
            </div>
          </div>
          {error && <div style={{ marginTop: '10px', padding: '8px 12px', background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.15)', borderRadius: '7px', fontSize: '12px', color: '#f87171' }}>{error}</div>}
          <div style={{ display: 'flex', gap: '8px', marginTop: '14px' }}>
            <button onClick={() => createMutation.mutate(form)} disabled={createMutation.isPending} style={{ padding: '7px 16px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: '7px', fontSize: '12px', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', opacity: createMutation.isPending ? 0.6 : 1 }}>
              {createMutation.isPending ? 'Creating...' : 'Create policy'}
            </button>
            <button onClick={() => setShowForm(false)} style={{ padding: '7px 16px', background: '#0d0d0d', color: '#71717a', border: '1px solid #1a1a1a', borderRadius: '7px', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {isLoading ? (
          <p style={{ fontSize: '12px', color: '#3f3f46' }}>Loading...</p>
        ) : !data?.data?.length ? (
          <div style={{ background: '#080808', border: '1px solid #141414', borderRadius: '12px', padding: '32px', textAlign: 'center', color: '#2a2a2a', fontSize: '12px' }}>No policies defined yet</div>
        ) : (
          data.data.map((policy: any) => {
            const cfg = effectConfig[policy.effect as keyof typeof effectConfig]
            const Icon = cfg.icon
            return (
              <div key={policy.id} style={{ background: '#080808', border: '1px solid #141414', borderRadius: '10px', padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 10px', borderRadius: '6px', background: cfg.bg, color: cfg.color, fontSize: '10px', fontWeight: 600 }}>
                    <Icon size={10} /> {policy.effect}
                  </div>
                  <div>
                    <code style={{ fontSize: '13px', color: '#fff', fontFamily: 'monospace' }}>{policy.action}</code>
                    <div style={{ fontSize: '11px', color: '#3f3f46', marginTop: '2px' }}>TTL {policy.ttlSeconds}s{policy.requireStepUp && ' · step-up required'}</div>
                  </div>
                </div>
                <button onClick={() => deleteMutation.mutate(policy.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#2a2a2a', padding: '4px' }}>
                  <Trash2 size={13} />
                </button>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
