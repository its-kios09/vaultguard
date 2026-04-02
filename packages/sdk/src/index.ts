import axios, { AxiosInstance } from 'axios'

export interface VaultGuardConfig {
  apiUrl: string
  tenantId: string
  agentId: string
  clientId: string
  clientSecret: string
}

export interface DelegationRequest {
  receivingTenantId: string
  action: string
  waitForApproval?: boolean
  pollIntervalMs?: number
  timeoutMs?: number
}

export interface DelegationResult {
  delegationId: string
  status: 'APPROVED' | 'PENDING' | 'BLOCKED' | 'REJECTED'
  token?: string
  expiresAt?: string
  action: string
  message?: string
}

export interface VerifyResult {
  valid: boolean
  delegationId?: string
  action?: string
  requestingTenant?: string
  receivingTenant?: string
  expiresAt?: string
  error?: string
}

export interface StepUpResult {
  authReqId: string
  delegationId: string
  status: string
  expiresIn: number
  interval: number
  bindingMessage: string
  instructions: {
    poll: string
    approve: string
    reject: string
  }
}

export class VaultGuardClient {
  private http: AxiosInstance
  private config: VaultGuardConfig

  constructor(config: VaultGuardConfig) {
    this.config = config
    this.http = axios.create({
      baseURL: config.apiUrl,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  /**
   * Request a delegation token to perform an action in another tenant.
   * Handles ALLOW (instant token), STEP_UP (polls for approval), BLOCK (throws).
   */
  async requestDelegation(req: DelegationRequest): Promise<DelegationResult> {
    const { receivingTenantId, action, waitForApproval = true, pollIntervalMs = 3000, timeoutMs = 300000 } = req

    const res = await this.http.post('/delegations/request', {
      requestingTenantId: this.config.tenantId,
      receivingTenantId,
      agentId: this.config.agentId,
      action,
    })

    const data = res.data

    // BLOCKED
    if (data.status === 'BLOCKED' || data.blocked) {
      return {
        delegationId: data.delegationId,
        status: 'BLOCKED',
        action,
        message: 'Action is blocked by receiving tenant policy',
      }
    }

    // APPROVED immediately
    if (data.status === 'APPROVED' && data.token) {
      return {
        delegationId: data.delegationId,
        status: 'APPROVED',
        token: data.token,
        expiresAt: data.expiresAt,
        action,
      }
    }

    // STEP_UP — requires human approval
    if (data.status === 'PENDING' && waitForApproval) {
      return await this.waitForApproval(data.delegationId, action, pollIntervalMs, timeoutMs)
    }

    return {
      delegationId: data.delegationId,
      status: data.status,
      action,
      message: data.action,
    }
  }

  /**
   * Initiate a CIBA-style step-up authorization request.
   * Returns auth_req_id for polling.
   */
  async initiateStepUp(delegationId: string, bindingMessage: string): Promise<StepUpResult> {
    const res = await this.http.post('/stepup/initiate', {
      delegationId,
      adminUserId: this.config.tenantId,
      bindingMessage,
    })
    return res.data
  }

  /**
   * Poll for step-up approval status — mirrors CIBA /token polling.
   */
  async pollStepUp(authReqId: string, delegationId: string): Promise<{ status: string; token?: string }> {
    const res = await this.http.get(`/stepup/${authReqId}/status`, {
      params: { delegationId },
    })
    return res.data
  }

  /**
   * Verify a delegation token is valid and not revoked.
   */
  async verifyToken(token: string, action: string): Promise<VerifyResult> {
    try {
      const res = await this.http.post('/delegations/verify', { token, action })
      return { valid: true, ...res.data }
    } catch (err: any) {
      return {
        valid: false,
        error: err.response?.data?.error || 'Token verification failed',
      }
    }
  }

  /**
   * Revoke a delegation.
   */
  async revokeDelegation(delegationId: string): Promise<void> {
    await this.http.post(`/delegations/${delegationId}/revoke`)
  }

  /**
   * Higher-order function — wraps an agent action with delegation auth.
   * Usage:
   *   const result = await client.withDelegation(
   *     { receivingTenantId: 'xxx', action: 'stock.write' },
   *     async (token) => { ... do the action with token ... }
   *   )
   */
  async withDelegation<T>(
    req: DelegationRequest,
    fn: (token: string, delegation: DelegationResult) => Promise<T>
  ): Promise<T> {
    const delegation = await this.requestDelegation(req)

    if (delegation.status === 'BLOCKED') {
      throw new Error(`Action '${req.action}' is blocked by receiving tenant policy`)
    }

    if (delegation.status === 'REJECTED') {
      throw new Error(`Delegation for action '${req.action}' was rejected`)
    }

    if (delegation.status !== 'APPROVED' || !delegation.token) {
      throw new Error(`Delegation for action '${req.action}' was not approved (status: ${delegation.status})`)
    }

    return await fn(delegation.token, delegation)
  }

  private async waitForApproval(
    delegationId: string,
    action: string,
    pollIntervalMs: number,
    timeoutMs: number
  ): Promise<DelegationResult> {
    const startTime = Date.now()

    while (Date.now() - startTime < timeoutMs) {
      await sleep(pollIntervalMs)

      try {
        const res = await this.http.get(`/delegations/${delegationId}`)
        const delegation = res.data.data

        if (delegation.status === 'APPROVED' && delegation.token) {
          return {
            delegationId,
            status: 'APPROVED',
            token: delegation.token,
            expiresAt: delegation.expiresAt,
            action,
          }
        }

        if (delegation.status === 'REJECTED') {
          return { delegationId, status: 'REJECTED', action, message: 'Delegation was rejected' }
        }

        if (delegation.status === 'EXPIRED') {
          return { delegationId, status: 'REJECTED', action, message: 'Delegation request expired' }
        }
      } catch {
        // continue polling
      }
    }

    return {
      delegationId,
      status: 'PENDING',
      action,
      message: `Delegation timed out after ${timeoutMs / 1000}s — still pending approval`,
    }
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export function createVaultGuardClient(config: VaultGuardConfig): VaultGuardClient {
  return new VaultGuardClient(config)
}

export default VaultGuardClient
