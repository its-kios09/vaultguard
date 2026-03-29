import { Router, Request, Response } from 'express'
import { z } from 'zod'
import { randomBytes } from 'crypto'
import { prisma } from '../lib/prisma'
import { validate } from '../middleware/validate'

const router = Router({ mergeParams: true })

const createSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(500).optional(),
})

const generateCredentials = () => ({
  clientId: `agent_${randomBytes(12).toString('hex')}`,
  clientSecret: randomBytes(32).toString('hex'),
})

// POST /tenants/:id/agents
router.post('/', validate(createSchema), async (req: Request, res: Response) => {
  try {
    const tenant = await prisma.tenant.findUnique({ where: { id: req.params.id } })
    if (!tenant) {
      res.status(404).json({ error: 'Tenant not found' })
      return
    }

    const { clientId, clientSecret } = generateCredentials()

    const agent = await prisma.agent.create({
      data: {
        name: req.body.name,
        description: req.body.description,
        tenantId: req.params.id,
        clientId,
        clientSecret,
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

    // Return secret only on creation — never again
    res.status(201).json({
      data: {
        ...agent,
        clientSecret,
      },
      warning: 'Store the clientSecret securely — it will not be shown again',
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
        // Never return clientSecret in list
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

    const newSecret = randomBytes(32).toString('hex')

    await prisma.agent.update({
      where: { id: req.params.agentId },
      data: { clientSecret: newSecret },
    })

    await prisma.auditLog.create({
      data: {
        tenantId: req.params.id,
        action: 'agent.secret_rotated',
        status: 'SUCCESS',
        metadata: { agentId: agent.id, agentName: agent.name },
      },
    })

    res.json({
      data: { clientSecret: newSecret },
      warning: 'Store the new clientSecret securely — it will not be shown again',
    })
  } catch (error) {
    res.status(500).json({ error: 'Failed to rotate secret' })
  }
})

export default router
