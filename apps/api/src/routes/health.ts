import { Router, IRouter, Request, Response } from 'express'
import { prisma } from '../lib/prisma'

const router: IRouter = Router()

// GET /health
router.get('/', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'vaultguard-api',
    timestamp: new Date().toISOString(),
  })
})

// GET /health/db
router.get('/db', async (_req: Request, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`
    res.json({
      status: 'ok',
      database: 'connected',
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    res.status(503).json({
      status: 'error',
      database: 'disconnected',
      timestamp: new Date().toISOString(),
    })
  }
})

// GET /health/metrics
router.get('/metrics', async (_req: Request, res: Response) => {
  try {
    const [tenants, agents, policies, delegations, auditLogs] = await Promise.all([
      prisma.tenant.count(),
      prisma.agent.count(),
      prisma.policy.count(),
      prisma.delegation.count(),
      prisma.auditLog.count(),
    ])

    const delegationsByStatus = await prisma.delegation.groupBy({
      by: ['status'],
      _count: true,
    })

    const policyEffects = await prisma.policy.groupBy({
      by: ['effect'],
      _count: true,
    })

    res.json({
      data: {
        totals: { tenants, agents, policies, delegations, auditLogs },
        delegationsByStatus,
        policyEffects,
        uptime: Math.floor(process.uptime()),
        memory: process.memoryUsage(),
        timestamp: new Date().toISOString(),
      },
    })
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch metrics' })
  }
})

export default router
