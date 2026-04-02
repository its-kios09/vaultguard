import { useQuery } from '@tanstack/react-query'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { getTrustGraph } from '../lib/api'
import ReactFlow, { Background, Controls, MiniMap } from 'reactflow'
import type { Node, Edge } from 'reactflow'
import 'reactflow/dist/style.css'
import { Activity } from 'lucide-react'

export default function TrustGraph() {
  const [tenantId] = useLocalStorage<string>('vg_tenant_id', '')

  const { data, isLoading } = useQuery({
    queryKey: ['graph', tenantId],
    queryFn: () => getTrustGraph(tenantId),
    enabled: !!tenantId,
    refetchInterval: 10000,
  })

  const nodes: Node[] = (data?.data?.nodes ?? []).map((n: any, i: number) => ({
    id: n.id,
    data: { label: n.label },
    position: { x: 180 + i * 280, y: 180 },
    style: {
      background: '#080808', border: '1px solid #1a1a1a',
      borderRadius: '10px', color: '#fff',
      padding: '10px 18px', fontSize: '12px', fontWeight: 500,
    },
  }))

  const edges: Edge[] = (data?.data?.edges ?? []).map((e: any) => ({
    id: e.id, source: e.source, target: e.target,
    label: e.action, animated: e.status === 'PENDING',
    style: { stroke: e.status === 'APPROVED' ? '#4ade80' : e.status === 'PENDING' ? '#fbbf24' : '#2a2a2a' },
    labelStyle: { fill: '#52525b', fontSize: 10 },
  }))

  return (
    <div style={{ padding: '32px 40px', fontFamily: "'DM Sans', system-ui, sans-serif", height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ fontSize: '18px', fontWeight: 600, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
          <Activity size={16} color="#06b6d4" /> Trust graph
        </h1>
        <p style={{ fontSize: '12px', color: '#3f3f46' }}>Live visualization of delegation chains</p>
      </div>

      <div style={{ flex: 1, background: '#080808', border: '1px solid #141414', borderRadius: '12px', overflow: 'hidden', minHeight: '500px' }}>
        {isLoading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#3f3f46', fontSize: '12px' }}>Loading...</div>
        ) : nodes.length === 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#2a2a2a', fontSize: '12px' }}>No active delegations to visualize</div>
        ) : (
          <ReactFlow nodes={nodes} edges={edges} fitView>
            <Background color="#141414" gap={24} />
            <Controls />
            <MiniMap nodeColor="#6366f1" maskColor="rgba(0,0,0,.6)" />
          </ReactFlow>
        )}
      </div>
    </div>
  )
}
