import { Router, IRouter, Request, Response } from 'express'
import { z } from 'zod'
import { randomUUID } from 'crypto'
import { prisma } from '../lib/prisma'
import { validate } from '../middleware/validate'
import { getAgentToken } from '../lib/auth0'

const router: IRouter = Router()

const initiateSchema = z.object({
  delegationId: z.string().min(1),
  adminUserId: z.string().min(1),
  bindingMessage: z.string().min(1).max(500),
})

// POST /stepup/initiate
// Initiates a CIBA-style async authorization request
router.post('/initiate', validate(initiateSchema), async (req: Request, res: Response) => {
  try {
    const { delegationId, adminUserId, bindingMessage } = req.body

    // Find the delegation
    const delegation = await prisma.delegation.findUnique({
      where: { id: delegationId },
      include: {
        requestingTenant: { select: { name: true, slug: true } },
        receivingTenant: { select: { name: true, slug: true } },
        agent: { select: { name: true, clientId: true } },
      },
    })

    if (!delegation) {
      res.status(404).json({ error: 'Delegation not found' })
      return
    }

    if (delegation.status !== 'PENDING') {
      res.status(400).json({
        error: `Cannot initiate step-up for delegation with status '${delegation.status}'`,
      })
      return
    }

    // Generate auth_req_id — mirrors CIBA protocol
    const authReqId = `ciba_${randomUUID().replace(/-/g, '')}`
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000) // 15 min

    // Store the CIBA request in metadata
    await prisma.delegation.update({
      where: { id: delegationId },
      data: {
        expiresAt,
        // Store authReqId in a way we can look it up
      },
    })

    // Log the CIBA initiation
    await prisma.auditLog.create({
      data: {
        tenantId: delegation.requestingTenantId,
        delegationId: delegation.id,
        action: 'stepup.initiated',
        status: 'PENDING',
        metadata: {
          authReqId,
          adminUserId,
          bindingMessage,
          requestingTenant: delegation.requestingTenant.name,
          receivingTenant: delegation.receivingTenant.name,
          agentName: delegation.agent.name,
          action: delegation.action,
          expiresAt,
          cibaProtocol: true,
          notificationChannel: 'dashboard',
          note: 'Auth0 Guardian push requires Enterprise MFA. Approval via VaultGuard dashboard.',
        },
      },
    })

    // In production this would call Auth0 /bc-authorize
    // and send a Guardian push notification to adminUserId
    // For this demo: notification is the VaultGuard dashboard
    res.status(202).json({
      auth_req_id: authReqId,
      expires_in: 900,
      interval: 5,
      delegationId: delegation.id,
      status: 'PENDING',
      bindingMessage,
      requestingTenant: delegation.requestingTenant.name,
      receivingTenant: delegation.receivingTenant.name,
      action: delegation.action,
      expiresAt,
      instructions: {
        poll: `GET /stepup/${authReqId}/status`,
        approve: `POST /delegations/${delegationId}/approve`,
        reject: `POST /delegations/${delegationId}/reject`,
      },
      note: 'Poll the status endpoint every 5 seconds. Token issued upon approval.',
    })
  } catch (error) {
    console.error('Stepup initiate error:', error)
    res.status(500).json({ error: 'Failed to initiate step-up authorization' })
  }
})

// GET /stepup/:authReqId/status
// Polls for CIBA authorization status — mirrors Auth0 /oauth/token polling
router.get('/:authReqId/status', async (req: Request, res: Response) => {
  try {
    const { authReqId } = req.params
    const { delegationId } = req.query

    if (!delegationId) {
      res.status(400).json({ error: 'delegationId query parameter is required' })
      return
    }

    const delegation = await prisma.delegation.findUnique({
      where: { id: delegationId as string },
      include: {
        requestingTenant: { select: { name: true, slug: true } },
        receivingTenant: { select: { name: true, slug: true } },
        agent: { select: { name: true } },
      },
    })

    if (!delegation) {
      res.status(404).json({ error: 'Delegation not found' })
      return
    }

    // Check expiry
    if (delegation.expiresAt && delegation.expiresAt < new Date()) {
      await prisma.delegation.update({
        where: { id: delegation.id },
        data: { status: 'EXPIRED' },
      })
      res.status(400).json({
        auth_req_id: authReqId,
        status: 'EXPIRED',
        error: 'authorization_request_expired',
        error_description: 'The authorization request has expired',
      })
      return
    }

    // Map delegation status to CIBA polling response
    switch (delegation.status) {
      case 'PENDING':
        // CIBA: authorization_pending — keep polling
        res.status(200).json({
          auth_req_id: authReqId,
          status: 'PENDING',
          error: 'authorization_pending',
          error_description: 'Awaiting approval from receiving tenant admin',
          delegationId: delegation.id,
          action: delegation.action,
          requestingTenant: delegation.requestingTenant.name,
          receivingTenant: delegation.receivingTenant.name,
          expiresAt: delegation.expiresAt,
          hint: 'Approve via VaultGuard dashboard or POST /delegations/:id/approve',
        })
        break

      case 'APPROVED':
        // CIBA: approved — token is ready
        res.status(200).json({
          auth_req_id: authReqId,
          status: 'APPROVED',
          delegationId: delegation.id,
          action: delegation.action,
          expiresAt: delegation.expiresAt,
          message: 'Authorization approved. Fetch token via GET /delegations/:id/token',
        })
        break

      case 'REJECTED':
        // CIBA: access_denied
        res.status(200).json({
          auth_req_id: authReqId,
          status: 'REJECTED',
          error: 'access_denied',
          error_description: 'The authorization request was rejected by the admin',
          delegationId: delegation.id,
        })
        break

      case 'REVOKED':
        res.status(200).json({
          auth_req_id: authReqId,
          status: 'REVOKED',
          error: 'access_denied',
          error_description: 'The delegation has been revoked',
          delegationId: delegation.id,
        })
        break

      default:
        res.status(200).json({
          auth_req_id: authReqId,
          status: delegation.status,
          delegationId: delegation.id,
        })
    }
  } catch (error) {
    console.error('Stepup status error:', error)
    res.status(500).json({ error: 'Failed to get step-up status' })
  }
})

// POST /stepup/:authReqId/complete
// Called after admin approves — issues real Auth0 token
// Mirrors Auth0 /oauth/token successful CIBA completion
router.post('/:authReqId/complete', async (req: Request, res: Response) => {
  try {
    const { delegationId } = req.body

    if (!delegationId) {
      res.status(400).json({ error: 'delegationId is required' })
      return
    }

    const delegation = await prisma.delegation.findUnique({
      where: { id: delegationId },
      include: { agent: true },
    })

    if (!delegation) {
      res.status(404).json({ error: 'Delegation not found' })
      return
    }

    if (delegation.status !== 'PENDING') {
      res.status(400).json({
        error: `Cannot complete step-up for delegation with status '${delegation.status}'`,
      })
      return
    }

    if (delegation.expiresAt && delegation.expiresAt < new Date()) {
      res.status(400).json({ error: 'Authorization request has expired' })
      return
    }

    // Get policy for TTL
    const policy = await prisma.policy.findUnique({
      where: {
        tenantId_action: {
          tenantId: delegation.receivingTenantId,
          action: delegation.action,
        },
      },
    })

    // Issue real Auth0 M2M token — same as Token Vault exchange
    let token: string
    try {
      token = await getAgentToken(
        delegation.agent.clientId,
        delegation.agent.clientSecret
      )
    } catch {
      res.status(500).json({ error: 'Failed to obtain Auth0 token' })
      return
    }

    const ttlSeconds = policy?.ttlSeconds ?? 3600
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000)

    await prisma.delegation.update({
      where: { id: delegationId },
      data: { status: 'APPROVED', token, expiresAt },
    })

    await prisma.auditLog.create({
      data: {
        tenantId: delegation.requestingTenantId,
        delegationId: delegation.id,
        action: 'stepup.completed',
        status: 'APPROVED',
        metadata: {
          authReqId: req.params.authReqId,
          completedAt: new Date(),
          expiresAt,
          ttlSeconds,
          tokenSource: 'auth0_m2m',
          cibaProtocol: true,
        },
      },
    })

    // Mirror CIBA successful token response
    res.status(200).json({
      auth_req_id: req.params.authReqId,
      status: 'APPROVED',
      delegationId: delegation.id,
      token,
      token_type: 'Bearer',
      expires_in: ttlSeconds,
      expiresAt,
      tokenSource: 'auth0_m2m',
      warning: 'Store this token securely — it will not be shown again',
    })
  } catch (error) {
    console.error('Stepup complete error:', error)
    res.status(500).json({ error: 'Failed to complete step-up authorization' })
  }
})

export default router
