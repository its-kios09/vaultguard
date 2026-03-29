import { Router, Request, Response } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { validate } from '../middleware/validate'
import { getAgentToken } from '../lib/auth0'

const router = Router({ mergeParams: true })

const createSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(500).optional(),
  clientId: z.string().min(1),
  clientSecret: z.string().min(1),
})

const updateSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  description: z.string().max(500).optional(),
})

// POST /tenants/:id/agents
router.post('/', validate(createSchema), async (req: Request, res: Response) => {
  try {
    const tenant = await prisma.tenant.findUnique({ where: { id: req.params.id } })
    if (!tenant) {
      res.status(404).json({ error: 'Tenant not found' })
      return
    }

    const existing = await prisma.agent.findUnique({ where: { clientId: req.body.clientId } })
    if (existing) {
      res.status(409).json({ error: 'Agent with this clientId already exists' })
      return
    }

    // Verify the credentials work against Auth0 before saving
    try {
      await getAgentToken(req.body.clientId, req.body.clientSecret)
    } catch {
      res.status(400).json({ error: 'Invalid Auth0 credentials — could not obtain token' })
      return
    }

    const agent = await prisma.agent.create({
      data: {
        name: req.body.name,
        description: req.body.description,
        tenantId: req.params.id,
        clientId: req.body.clientId,
        clientSecret: req.body.clientSecret,
      },
    })

    await prisma.auditLog.create({
      data: {
        tenantId: req.params.id,
        action: 'agent.created',
        status: 'SUCCESS',
        metadata: { agentId: agent.id, agentName: agent.name },
      },
    })

    res.status(201).json({
      data: {
        id: agent.id,
        name: agent.name,
        description: agent.description,
        clientId: agent.clientId,
        tenantId: agent.tenantId,
        createdAt: agent.createdAt,
      },
      message: 'Agent registered successfully with Auth0 credentials verified',
    })
  } catch (error) {
    res.status(500).json({ error: 'Failed to create agent' })
  }
})

// GET /tenants/:id/agents
router.get('/', async (req: Request, res: Response) => {
  try {
    const tenant = await prisma.tenant.findUnique({ where: { id: req.params.id } })
    if (!tenant) {
      res.status(404).json({ error: 'Tenant not found' })
      return
    }

    const agents = await prisma.agent.findMany({
      where: { tenantId: req.params.id },
      select: {
        id: true,
        name: true,
        description: true,
        clientId: true,
        tenantId: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    res.json({ data: agents })
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch agents' })
  }
})

// DELETE /tenants/:id/agents/:agentId
router.delete('/:agentId', async (req: Request, res: Response) => {
  try {
    const agent = await prisma.agent.findFirst({
      where: { id: req.params.agentId, tenantId: req.params.id },
    })

    if (!agent) {
      res.status(404).json({ error: 'Agent not found' })
      return
    }

    await prisma.agent.delete({ where: { id: req.params.agentId } })

    await prisma.auditLog.create({
      data: {
        tenantId: req.params.id,
        action: 'agent.deleted',
        status: 'SUCCESS',
        metadata: { agentId: agent.id, agentName: agent.name },
      },
    })

    res.json({ message: 'Agent deleted successfully' })
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete agent' })
  }
})

// POST /tenants/:id/agents/:agentId/rotate-secret
router.post('/:agentId/rotate-secret', async (req: Request, res: Response) => {
  try {
    const agent = await prisma.agent.findFirst({
      where: { id: req.params.agentId, tenantId: req.params.id },
    })

    if (!agent) {
      res.status(404).json({ error: 'Agent not found' })
      return
    }

    const { clientSecret } = z.object({ clientSecret: z.string().min(1) }).parse(req.body)

    // Verify new secret works
    try {
      await getAgentToken(agent.clientId, clientSecret)
    } catch {
      res.status(400).json({ error: 'Invalid new secret — could not obtain Auth0 token' })
      return
    }

    await prisma.agent.update({
      where: { id: req.params.agentId },
      data: { clientSecret },
    })

    await prisma.auditLog.create({
      data: {
        tenantId: req.params.id,
        action: 'agent.secret_rotated',
        status: 'SUCCESS',
        metadata: { agentId: agent.id, agentName: agent.name },
      },
    })

    res.json({ message: 'Agent secret updated and verified successfully' })
  } catch (error) {
    res.status(500).json({ error: 'Failed to rotate secret' })
  }
})

export default router
