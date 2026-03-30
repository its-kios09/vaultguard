import { Router, IRouter, Request, Response } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { validate } from '../middleware/validate'

const router: IRouter = Router({ mergeParams: true })

const createSchema = z.object({
  action: z
    .string()
    .min(2)
    .max(100)
    .regex(/^[a-z0-9._-]+$/, 'Action must be lowercase alphanumeric with dots, hyphens or underscores'),
  effect: z.enum(['ALLOW', 'BLOCK', 'STEP_UP']),
  requireStepUp: z.boolean().default(false),
  ttlSeconds: z.number().int().min(60).max(86400).default(3600),
})

const updateSchema = createSchema.partial()

// POST /tenants/:id/policies
router.post('/', validate(createSchema), async (req: Request, res: Response) => {
  try {
    const tenant = await prisma.tenant.findUnique({ where: { id: req.params.id } })
    if (!tenant) {
      res.status(404).json({ error: 'Tenant not found' })
      return
    }

    const existing = await prisma.policy.findUnique({
      where: { tenantId_action: { tenantId: req.params.id, action: req.body.action } },
    })
    if (existing) {
      res.status(409).json({ error: `Policy for action '${req.body.action}' already exists` })
      return
    }

    const policy = await prisma.policy.create({
      data: {
        tenantId: req.params.id,
        action: req.body.action,
        effect: req.body.effect,
        requireStepUp: req.body.requireStepUp,
        ttlSeconds: req.body.ttlSeconds,
      },
    })

    await prisma.auditLog.create({
      data: {
        tenantId: req.params.id,
        action: 'policy.created',
        status: 'SUCCESS',
        metadata: {
          policyId: policy.id,
          policyAction: policy.action,
          effect: policy.effect,
        },
      },
    })

    res.status(201).json({ data: policy })
  } catch (error) {
    res.status(500).json({ error: 'Failed to create policy' })
  }
})

// GET /tenants/:id/policies
router.get('/', async (req: Request, res: Response) => {
  try {
    const tenant = await prisma.tenant.findUnique({ where: { id: req.params.id } })
    if (!tenant) {
      res.status(404).json({ error: 'Tenant not found' })
      return
    }

    const policies = await prisma.policy.findMany({
      where: { tenantId: req.params.id },
      orderBy: { createdAt: 'desc' },
    })

    res.json({ data: policies })
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch policies' })
  }
})

// GET /tenants/:id/policies/:policyId
router.get('/:policyId', async (req: Request, res: Response) => {
  try {
    const policy = await prisma.policy.findFirst({
      where: { id: req.params.policyId, tenantId: req.params.id },
    })

    if (!policy) {
      res.status(404).json({ error: 'Policy not found' })
      return
    }

    res.json({ data: policy })
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch policy' })
  }
})

// PUT /tenants/:id/policies/:policyId
router.put('/:policyId', validate(updateSchema), async (req: Request, res: Response) => {
  try {
    const policy = await prisma.policy.findFirst({
      where: { id: req.params.policyId, tenantId: req.params.id },
    })

    if (!policy) {
      res.status(404).json({ error: 'Policy not found' })
      return
    }

    const updated = await prisma.policy.update({
      where: { id: req.params.policyId },
      data: req.body,
    })

    await prisma.auditLog.create({
      data: {
        tenantId: req.params.id,
        action: 'policy.updated',
        status: 'SUCCESS',
        metadata: {
          policyId: updated.id,
          policyAction: updated.action,
          changes: req.body,
        },
      },
    })

    res.json({ data: updated })
  } catch (error) {
    res.status(500).json({ error: 'Failed to update policy' })
  }
})

// DELETE /tenants/:id/policies/:policyId
router.delete('/:policyId', async (req: Request, res: Response) => {
  try {
    const policy = await prisma.policy.findFirst({
      where: { id: req.params.policyId, tenantId: req.params.id },
    })

    if (!policy) {
      res.status(404).json({ error: 'Policy not found' })
      return
    }

    await prisma.policy.delete({ where: { id: req.params.policyId } })

    await prisma.auditLog.create({
      data: {
        tenantId: req.params.id,
        action: 'policy.deleted',
        status: 'SUCCESS',
        metadata: {
          policyId: policy.id,
          policyAction: policy.action,
        },
      },
    })

    res.json({ message: 'Policy deleted successfully' })
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete policy' })
  }
})

export default router
