import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { getAgents, createAgent, deleteAgent } from '../lib/api'
import { Users, Plus, Trash2, Copy, Check } from 'lucide-react'

export default function Agents() {
  const [tenantId] = useLocalStorage<string>('vg_tenant_id', '')
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', description: '', clientId: '', clientSecret: '' })
  const [error, setError] = useState('')
  const [copied, setCopied] = useState<string | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['agents', tenantId],
    queryFn: () => getAgents(tenantId),
    enabled: !!tenantId,
  })

  const createMutation = useMutation({
    mutationFn: (d: any) => createAgent(tenantId, d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['agents', tenantId] })
      setShowForm(false)
      setForm({ name: '', description: '', clientId: '', clientSecret: '' })
      setError('')
    },
    onError: (err: any) => setError(err.response?.data?.error || 'Failed'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteAgent(tenantId, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['agents', tenantId] }),
  })

  const copy = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

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
            <Users size={16} color="#6366f1" /> Agents
          </h1>
          <p style={{ fontSize: '12px', color: '#3f3f46' }}>Register Auth0 M2M applications as agents</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
          <Plus size={13} /> Register agent
        </button>
      </div>

      {showForm && (
        <div style={{ background: '#080808', border: '1px solid #141414', borderRadius: '12px', padding: '20px', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '13px', fontWeight: 500, color: '#fff', marginBottom: '16px' }}>New agent</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {[
              { key: 'name', label: 'Name', placeholder: 'Stock Agent', type: 'text' },
              { key: 'description', label: 'Description', placeholder: 'Pushes daily stock data', type: 'text' },
              { key: 'clientId', label: 'Auth0 Client ID', placeholder: 'Auth0 M2M Client ID', type: 'text' },
              { key: 'clientSecret', label: 'Auth0 Client Secret', placeholder: '••••••••', type: 'password' },
            ].map(({ key, label, placeholder, type }) => (
              <div key={key}>
                <label style={{ display: 'block', fontSize: '11px', color: '#3f3f46', marginBottom: '5px' }}>{label}</label>
                <input type={type} value={form[key as keyof typeof form]} onChange={e => setForm({ ...form, [key]: e.target.value })} placeholder={placeholder} style={key === 'clientId' ? { ...inp, fontFamily: 'monospace' } : inp} />
              </div>
            ))}
          </div>
          {error && <div style={{ marginTop: '10px', padding: '8px 12px', background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.15)', borderRadius: '7px', fontSize: '12px', color: '#f87171' }}>{error}</div>}
          <div style={{ display: 'flex', gap: '8px', marginTop: '14px' }}>
            <button onClick={() => createMutation.mutate(form)} disabled={createMutation.isPending} style={{ padding: '7px 16px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: '7px', fontSize: '12px', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', opacity: createMutation.isPending ? 0.6 : 1 }}>
              {createMutation.isPending ? 'Registering...' : 'Register'}
            </button>
            <button onClick={() => setShowForm(false)} style={{ padding: '7px 16px', background: '#0d0d0d', color: '#71717a', border: '1px solid #1a1a1a', borderRadius: '7px', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {isLoading ? (
          <p style={{ fontSize: '12px', color: '#3f3f46' }}>Loading...</p>
        ) : !data?.data?.length ? (
          <div style={{ background: '#080808', border: '1px solid #141414', borderRadius: '12px', padding: '32px', textAlign: 'center', color: '#2a2a2a', fontSize: '12px' }}>No agents registered yet</div>
        ) : (
          data.data.map((agent: any) => (
            <div key={agent.id} style={{ background: '#080808', border: '1px solid #141414', borderRadius: '10px', padding: '16px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 500, color: '#fff' }}>{agent.name}</div>
                {agent.description && <div style={{ fontSize: '11px', color: '#3f3f46', marginTop: '2px' }}>{agent.description}</div>}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px' }}>
                  <code style={{ fontSize: '10px', color: '#6366f1', background: 'rgba(99,102,241,.08)', padding: '2px 8px', borderRadius: '4px', fontFamily: 'monospace' }}>{agent.clientId}</code>
                  <button onClick={() => copy(agent.clientId, agent.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#2a2a2a', padding: '2px' }}>
                    {copied === agent.id ? <Check size={11} color="#4ade80" /> : <Copy size={11} />}
                  </button>
                </div>
              </div>
              <button onClick={() => deleteMutation.mutate(agent.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#2a2a2a', padding: '6px', borderRadius: '6px' }}>
                <Trash2 size={14} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
