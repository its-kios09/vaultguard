import axios from 'axios'
import 'dotenv/config'

const http = axios.create({
  baseURL: process.env.VAULTGUARD_API_URL || 'http://localhost:3001',
  headers: { 'Content-Type': 'application/json' },
  validateStatus: () => true,
})

export async function requestDelegation(action: string) {
  const res = await http.post('/delegations/request', {
    requestingTenantId: process.env.MEDICORE_TENANT_ID,
    receivingTenantId: process.env.NATSUPPLY_TENANT_ID,
    agentId: process.env.MEDICORE_AGENT_ID,
    action,
  })
  if (res.status === 403) {
    return { status: 'BLOCKED', delegationId: res.data?.delegationId, reason: res.data?.reason }
  }
  return res.data
}

export async function pollDelegation(delegationId: string, maxWaitMs = 60000) {
  const start = Date.now()
  while (Date.now() - start < maxWaitMs) {
    await new Promise(r => setTimeout(r, 3000))
    const res = await http.get(`/delegations/${delegationId}`)
    const d = res.data.data
    if (d.status === 'APPROVED' && d.token) return { status: 'APPROVED', token: d.token, expiresAt: d.expiresAt }
    if (['REJECTED', 'EXPIRED', 'REVOKED'].includes(d.status)) return { status: d.status }
  }
  return { status: 'TIMEOUT' }
}

export async function verifyToken(token: string, action: string) {
  const res = await http.post('/delegations/verify', { token, action })
  return res.data
}

export async function writeStock(token: string, items: any[]) {
  const verify = await verifyToken(token, 'stock.write')
  if (!verify.valid) throw new Error('Token invalid')
  return {
    stockUpdateId: `STK-${Date.now()}`,
    status: 'UPDATED',
    items,
    updatedAt: new Date().toISOString(),
    authorizedBy: 'VaultGuard',
    tokenSource: 'auth0_m2m',
  }
}

export async function submitRequisition(token: string, items: any[]) {
  const verify = await verifyToken(token, 'requisition.submit')
  if (!verify.valid) throw new Error('Token invalid')
  return {
    requisitionId: `REQ-${Date.now()}`,
    status: 'SUBMITTED',
    items,
    submittedAt: new Date().toISOString(),
    authorizedBy: 'VaultGuard',
    tokenSource: 'auth0_m2m',
  }
}
