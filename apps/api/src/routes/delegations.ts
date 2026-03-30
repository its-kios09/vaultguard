import { Router, IRouter, Request, Response } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { validate } from '../middleware/validate'
import { getAgentToken } from '../lib/auth0'

const router: IRouter = Router()

const requestSchema = z.object({
  requestingTenantId: z.string().min(1),
  receivingTenantId: z.string().min(1),
  agentId: z.string().min(1),
  action: z.string().min(1),
})

// POST /delegations/request — core policy engine
router.post('/request', validate(requestSchema), async (req: Request, res: Response) => {
  try {
    const { requestingTenantId, receivingTenantId, agentId, action } = req.body

    const requestingTenant = await prisma.tenant.findUnique({ where: { id: requestingTenantId } })
    if (!requestingTenant) {
      res.status(404).json({ error: 'Requesting tenant not found' })
      return
    }

    const receivingTenant = await prisma.tenant.findUnique({ where: { id: receivingTenantId } })
    if (!receivingTenant) {
      res.status(404).json({ error: 'Receiving tenant not found' })
      return
    }

    const agent = await prisma.agent.findFirst({
      where: { id: agentId, tenantId: requestingTenantId },
    })
    if (!agent) {
      res.status(404).json({ error: 'Agent not found or does not belong to requesting tenant' })
      return
    }

    const policy = await prisma.policy.findUnique({
      where: { tenantId_action: { tenantId: receivingTenantId, action } },
    })

    // No policy = deny by default
    if (!policy) {
      await prisma.auditLog.create({
        data: {
          tenantId: requestingTenantId,
          action: 'delegation.denied',
          status: 'DENIED',
          metadata: { agentId, receivingTenantId, requestedAction: action, reason: 'No policy found — deny by default' },
        },
      })
      res.status(403).json({ error: 'Delegation denied', reason: 'No policy defined for this action' })
      return
    }

    // BLOCK
    if (policy.effect === 'BLOCK') {
      const delegation = await prisma.delegation.create({
        data: { requestingTenantId, receivingTenantId, agentId, action, status: 'REJECTED' },
      })
      await prisma.auditLog.create({
        data: {
          tenantId: requestingTenantId,
          delegationId: delegation.id,
          action: 'delegation.blocked',
          status: 'BLOCKED',
          metadata: { agentId, receivingTenantId, requestedAction: action, reason: 'Blocked by policy' },
        },
      })
      res.status(403).json({
        error: 'Delegation blocked',
        reason: 'This action is explicitly blocked by the receiving tenant policy',
        delegationId: delegation.id,
      })
      return
    }

    // STEP_UP — requires human approval via CIBA
    if (policy.effect === 'STEP_UP' || policy.requireStepUp) {
      const delegation = await prisma.delegation.create({
        data: {
          requestingTenantId,
          receivingTenantId,
          agentId,
          action,
          status: 'PENDING',
          expiresAt: new Date(Date.now() + 15 * 60 * 1000),
        },
      })
      await prisma.auditLog.create({
        data: {
          tenantId: requestingTenantId,
          delegationId: delegation.id,
          action: 'delegation.step_up_required',
          status: 'PENDING',
          metadata: { agentId, receivingTenantId, requestedAction: action, reason: 'Step-up authorization required' },
        },
      })
      res.status(202).json({
        message: 'Step-up authorization required',
        delegationId: delegation.id,
        status: 'PENDING',
        action: 'Awaiting approval from receiving tenant admin',
        expiresAt: delegation.expiresAt,
      })
      return
    }

    // ALLOW — get real Auth0 M2M token via Token Vault
    let token: string
    let tokenSource: string

    try {
      token = await getAgentToken(agent.clientId, agent.clientSecret)
      tokenSource = 'auth0_m2m'
    } catch (authError) {
      res.status(500).json({ error: 'Failed to obtain Auth0 token for agent' })
      return
    }

    const expiresAt = new Date(Date.now() + policy.ttlSeconds * 1000)

    const delegation = await prisma.delegation.create({
      data: {
        requestingTenantId,
        receivingTenantId,
        agentId,
        action,
        status: 'APPROVED',
        token,
        expiresAt,
      },
    })

    await prisma.auditLog.create({
      data: {
        tenantId: requestingTenantId,
        delegationId: delegation.id,
        action: 'delegation.approved',
        status: 'APPROVED',
        metadata: { agentId, receivingTenantId, requestedAction: action, expiresAt, ttlSeconds: policy.ttlSeconds, tokenSource },
      },
    })

    res.status(201).json({
      message: 'Delegation approved',
      delegationId: delegation.id,
      status: 'APPROVED',
      token,
      expiresAt,
      tokenSource,
      warning: 'Store this token securely — it will not be shown again',
    })
  } catch (error) {
    console.error('Delegation request error:', error)
    res.status(500).json({ error: 'Failed to process delegation request' })
  }
})

// GET /delegations?tenantId=xxx
router.get('/', async (req: Request, res: Response) => {
  try {
    const { tenantId, status } = req.query
    const delegations = await prisma.delegation.findMany({
      where: {
        ...(tenantId && {
          OR: [
            { requestingTenantId: tenantId as string },
            { receivingTenantId: tenantId as string },
          ],
        }),
        ...(status && { status: status as any }),
      },
      include: {
        requestingTenant: { select: { id: true, name: true, slug: true } },
        receivingTenant: { select: { id: true, name: true, slug: true } },
        agent: { select: { id: true, name: true, clientId: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
    res.json({ data: delegations })
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch delegations' })
  }
})

// GET /delegations/graph
router.get('/graph', async (req: Request, res: Response) => {
  try {
    const { tenantId } = req.query
    const delegations = await prisma.delegation.findMany({
      where: {
        ...(tenantId && {
          OR: [
            { requestingTenantId: tenantId as string },
            { receivingTenantId: tenantId as string },
          ],
        }),
        status: { in: ['APPROVED', 'PENDING'] },
      },
      include: {
        requestingTenant: { select: { id: true, name: true, slug: true } },
        receivingTenant: { select: { id: true, name: true, slug: true } },
        agent: { select: { id: true, name: true } },
      },
    })

    const nodeMap = new Map()
    const edges: any[] = []

    delegations.forEach((d) => {
      if (!nodeMap.has(d.requestingTenantId)) {
        nodeMap.set(d.requestingTenantId, { id: d.requestingTenantId, type: 'tenant', label: d.requestingTenant.name, slug: d.requestingTenant.slug })
      }
      if (!nodeMap.has(d.receivingTenantId)) {
        nodeMap.set(d.receivingTenantId, { id: d.receivingTenantId, type: 'tenant', label: d.receivingTenant.name, slug: d.receivingTenant.slug })
      }
      edges.push({ id: d.id, source: d.requestingTenantId, target: d.receivingTenantId, label: d.action, status: d.status, agent: d.agent.name, expiresAt: d.expiresAt })
    })

    res.json({ data: { nodes: Array.from(nodeMap.values()), edges } })
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch trust graph' })
  }
})

// GET /delegations/:id
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const delegation = await prisma.delegation.findUnique({
      where: { id: req.params.id },
      include: {
        requestingTenant: { select: { id: true, name: true, slug: true } },
        receivingTenant: { select: { id: true, name: true, slug: true } },
        agent: { select: { id: true, name: true, clientId: true } },
        auditLogs: { orderBy: { createdAt: 'desc' } },
      },
    })
    if (!delegation) {
      res.status(404).json({ error: 'Delegation not found' })
      return
    }
    res.json({ data: delegation })
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch delegation' })
  }
})

// POST /delegations/:id/approve
router.post('/:id/approve', async (req: Request, res: Response) => {
  try {
    const delegation = await prisma.delegation.findUnique({
      where: { id: req.params.id },
      include: { agent: true },
    })
    if (!delegation) {
      res.status(404).json({ error: 'Delegation not found' })
      return
    }
    if (delegation.status !== 'PENDING') {
      res.status(400).json({ error: `Cannot approve delegation with status '${delegation.status}'` })
      return
    }
    if (delegation.expiresAt && delegation.expiresAt < new Date()) {
      await prisma.delegation.update({ where: { id: req.params.id }, data: { status: 'EXPIRED' } })
      res.status(400).json({ error: 'Delegation request has expired' })
      return
    }

    const policy = await prisma.policy.findUnique({
      where: { tenantId_action: { tenantId: delegation.receivingTenantId, action: delegation.action } },
    })

    // Get real Auth0 token on approval
    let token: string
    try {
      token = await getAgentToken(delegation.agent.clientId, delegation.agent.clientSecret)
    } catch {
      res.status(500).json({ error: 'Failed to obtain Auth0 token' })
      return
    }

    const ttlSeconds = policy?.ttlSeconds ?? 3600
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000)

    const updated = await prisma.delegation.update({
      where: { id: req.params.id },
      data: { status: 'APPROVED', token, expiresAt },
    })

    await prisma.auditLog.create({
      data: {
        tenantId: delegation.requestingTenantId,
        delegationId: delegation.id,
        action: 'delegation.approved',
        status: 'APPROVED',
        metadata: { approvedAt: new Date(), expiresAt, ttlSeconds, tokenSource: 'auth0_m2m' },
      },
    })

    res.json({
      message: 'Delegation approved',
      delegationId: updated.id,
      status: 'APPROVED',
      token,
      expiresAt,
      warning: 'Store this token securely — it will not be shown again',
    })
  } catch (error) {
    res.status(500).json({ error: 'Failed to approve delegation' })
  }
})

// POST /delegations/:id/reject
router.post('/:id/reject', async (req: Request, res: Response) => {
  try {
    const delegation = await prisma.delegation.findUnique({ where: { id: req.params.id } })
    if (!delegation) {
      res.status(404).json({ error: 'Delegation not found' })
      return
    }
    if (delegation.status !== 'PENDING') {
      res.status(400).json({ error: `Cannot reject delegation with status '${delegation.status}'` })
      return
    }
    await prisma.delegation.update({ where: { id: req.params.id }, data: { status: 'REJECTED' } })
    await prisma.auditLog.create({
      data: {
        tenantId: delegation.requestingTenantId,
        delegationId: delegation.id,
        action: 'delegation.rejected',
        status: 'REJECTED',
        metadata: { rejectedAt: new Date(), reason: req.body.reason ?? 'Rejected by admin' },
      },
    })
    res.json({ message: 'Delegation rejected', delegationId: delegation.id, status: 'REJECTED' })
  } catch (error) {
    res.status(500).json({ error: 'Failed to reject delegation' })
  }
})

// POST /delegations/:id/revoke
router.post('/:id/revoke', async (req: Request, res: Response) => {
  try {
    const delegation = await prisma.delegation.findUnique({ where: { id: req.params.id } })
    if (!delegation) {
      res.status(404).json({ error: 'Delegation not found' })
      return
    }
    if (delegation.status !== 'APPROVED') {
      res.status(400).json({ error: `Cannot revoke delegation with status '${delegation.status}'` })
      return
    }
    await prisma.delegation.update({ where: { id: req.params.id }, data: { status: 'REVOKED', token: null } })
    await prisma.auditLog.create({
      data: {
        tenantId: delegation.requestingTenantId,
        delegationId: delegation.id,
        action: 'delegation.revoked',
        status: 'REVOKED',
        metadata: { revokedAt: new Date(), reason: req.body.reason ?? 'Revoked by admin' },
      },
    })
    res.json({ message: 'Delegation revoked', delegationId: delegation.id, status: 'REVOKED' })
  } catch (error) {
    res.status(500).json({ error: 'Failed to revoke delegation' })
  }
})

export default router
