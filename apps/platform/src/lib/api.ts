import axios from 'axios'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001',
  headers: { 'Content-Type': 'application/json' },
})

// Tenants
export const registerTenant = (data: { name: string; slug: string; description?: string; auth0UserId?: string }) =>
  api.post('/tenants/register', data).then((r) => r.data)

export const getTenant = (id: string) =>
  api.get(`/tenants/${id}`).then((r) => r.data)

export const getTenantStats = (id: string) =>
  api.get(`/tenants/${id}/stats`).then((r) => r.data)

// Agents
export const getAgents = (tenantId: string) =>
  api.get(`/tenants/${tenantId}/agents`).then((r) => r.data)

export const createAgent = (tenantId: string, data: { name: string; description?: string; clientId: string; clientSecret: string }) =>
  api.post(`/tenants/${tenantId}/agents`, data).then((r) => r.data)

export const deleteAgent = (tenantId: string, agentId: string) =>
  api.delete(`/tenants/${tenantId}/agents/${agentId}`).then((r) => r.data)

// Policies
export const getPolicies = (tenantId: string) =>
  api.get(`/tenants/${tenantId}/policies`).then((r) => r.data)

export const createPolicy = (tenantId: string, data: { action: string; effect: string; requireStepUp?: boolean; ttlSeconds?: number }) =>
  api.post(`/tenants/${tenantId}/policies`, data).then((r) => r.data)

export const deletePolicy = (tenantId: string, policyId: string) =>
  api.delete(`/tenants/${tenantId}/policies/${policyId}`).then((r) => r.data)

// Delegations
export const getDelegations = (tenantId: string) =>
  api.get(`/delegations?tenantId=${tenantId}`).then((r) => r.data)

export const requestDelegation = (data: { requestingTenantId: string; receivingTenantId: string; agentId: string; action: string }) =>
  api.post('/delegations/request', data).then((r) => r.data)

export const approveDelegation = (id: string) =>
  api.post(`/delegations/${id}/approve`).then((r) => r.data)

export const rejectDelegation = (id: string) =>
  api.post(`/delegations/${id}/reject`).then((r) => r.data)

export const revokeDelegation = (id: string) =>
  api.post(`/delegations/${id}/revoke`).then((r) => r.data)

export const verifyToken = (token: string, action: string) =>
  api.post('/delegations/verify', { token, action }).then((r) => r.data)

export const getTrustGraph = (tenantId: string) =>
  api.get(`/delegations/graph?tenantId=${tenantId}`).then((r) => r.data)

// Audit
export const getAuditLogs = (tenantId: string, params?: { action?: string; status?: string; limit?: number }) =>
  api.get('/audit', { params: { tenantId, ...params } }).then((r) => r.data)

// Health
export const getMetrics = () =>
  api.get('/health/metrics').then((r) => r.data)

export const getMyTenant = (auth0UserId: string) =>
  api.get(`/tenants/me?auth0UserId=${encodeURIComponent(auth0UserId)}`).then((r) => r.data)
