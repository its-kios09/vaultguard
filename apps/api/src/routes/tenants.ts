import { Router, Request, Response } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { validate } from '../middleware/validate'

const router = Router()

const registerSchema = z.object({
  name: z.string().min(2).max(100),
  slug: z.string().min(2).max(50).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
  description: z.string().max(500).optional(),
})

const updateSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  description: z.string().max(500).optional(),
})

// POST /tenants/register
router.post('/register', validate(registerSchema), async (req: Request, res: Response) => {
  try {
    const { name, slug, description } = req.body

    const existing = await prisma.tenant.findUnique({ where: { slug } })
    if (existing) {
      res.status(409).json({ error: 'Tenant with this slug already exists' })
      return
    }

    const tenant = await prisma.tenant.create({
      data: { name, slug, description },
    })

    res.status(201).json({ data: tenant })
  } catch (error) {
    res.status(500).json({ error: 'Failed to register tenant' })
  }
})

// GET /tenants/:id
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const tenant = await prisma.tenant.findUnique({
      where: { id: req.params.id },
      include: {
        _count: {
          select: {
            agents: true,
            policies: true,
            delegations: true,
          },
        },
      },
    })

    if (!tenant) {
      res.status(404).json({ error: 'Tenant not found' })
      return
    }

    res.json({ data: tenant })
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch tenant' })
  }
})

// PUT /tenants/:id
router.put('/:id', validate(updateSchema), async (req: Request, res: Response) => {
  try {
    const tenant = await prisma.tenant.findUnique({ where: { id: req.params.id } })
    if (!tenant) {
      res.status(404).json({ error: 'Tenant not found' })
      return
    }

    const updated = await prisma.tenant.update({
      where: { id: req.params.id },
      data: req.body,
    })

    res.json({ data: updated })
  } catch (error) {
    res.status(500).json({ error: 'Failed to update tenant' })
  }
})

// GET /tenants/:id/stats
router.get('/:id/stats', async (req: Request, res: Response) => {
  try {
    const tenant = await prisma.tenant.findUnique({ where: { id: req.params.id } })
    if (!tenant) {
      res.status(404).json({ error: 'Tenant not found' })
      return
    }

    const [agents, policies, delegations, auditLogs] = await Promise.all([
      prisma.agent.count({ where: { tenantId: req.params.id } }),
      prisma.policy.count({ where: { tenantId: req.params.id } }),
      prisma.delegation.count({ where: { requestingTenantId: req.params.id } }),
      prisma.auditLog.count({ where: { tenantId: req.params.id } }),
    ])

    const delegationsByStatus = await prisma.delegation.groupBy({
      by: ['status'],
      where: { requestingTenantId: req.params.id },
      _count: true,
    })

    res.json({
      data: {
        agents,
        policies,
        delegations,
        auditLogs,
        delegationsByStatus,
      },
    })
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch stats' })
  }
})

export default router
