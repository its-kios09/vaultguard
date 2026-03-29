import { Router, Request, Response } from 'express'
import { prisma } from '../lib/prisma'

const router = Router()

// GET /audit?tenantId=xxx&action=xxx&status=xxx&limit=xxx
router.get('/', async (req: Request, res: Response) => {
  try {
    const { tenantId, action, status, limit = '50', offset = '0' } = req.query

    if (!tenantId) {
      res.status(400).json({ error: 'tenantId query parameter is required' })
      return
    }

    const logs = await prisma.auditLog.findMany({
      where: {
        tenantId: tenantId as string,
        ...(action && { action: { contains: action as string } }),
        ...(status && { status: status as string }),
      },
      include: {
        delegation: {
          select: {
            id: true,
            action: true,
            status: true,
            requestingTenant: { select: { name: true, slug: true } },
            receivingTenant: { select: { name: true, slug: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: Math.min(parseInt(limit as string), 100),
      skip: parseInt(offset as string),
    })

    const total = await prisma.auditLog.count({
      where: {
        tenantId: tenantId as string,
        ...(action && { action: { contains: action as string } }),
        ...(status && { status: status as string }),
      },
    })

    res.json({
      data: logs,
      meta: {
        total,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
      },
    })
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch audit logs' })
  }
})

// GET /audit/export?tenantId=xxx
router.get('/export', async (req: Request, res: Response) => {
  try {
    const { tenantId } = req.query

    if (!tenantId) {
      res.status(400).json({ error: 'tenantId query parameter is required' })
      return
    }

    const logs = await prisma.auditLog.findMany({
      where: { tenantId: tenantId as string },
      include: {
        delegation: {
          select: {
            action: true,
            status: true,
            requestingTenant: { select: { name: true } },
            receivingTenant: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 1000,
    })

    const csvHeader = 'id,action,status,delegationAction,requestingTenant,receivingTenant,createdAt\n'
    const csvRows = logs.map((log) => [
        log.id,
        log.action,
        log.status,
        log.delegation?.action ?? '',
        log.delegation?.requestingTenant?.name ?? '',
        log.delegation?.receivingTenant?.name ?? '',
        log.createdAt.toISOString(),
      ].join(',')
    ).join('\n')

    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-Disposition', `attachment; filename="vaultguard-audit-${Date.now()}.csv"`)
    res.send(csvHeader + csvRows)
  } catch (error) {
    res.status(500).json({ error: 'Failed to export audit logs' })
  }
})

// GET /audit/:id
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const log = await prisma.auditLog.findUnique({
      where: { id: req.params.id },
      include: {
        tenant: { select: { id: true, name: true, slug: true } },
        delegation: {
          select: {
            id: true,
            action: true,
            status: true,
            expiresAt: true,
            requestingTenant: { select: { name: true, slug: true } },
            receivingTenant: { select: { name: true, slug: true } },
            agent: { select: { name: true, clientId: true } },
          },
        },
      },
    })

    if (!log) {
      res.status(404).json({ error: 'Audit log entry not found' })
      return
    }

    res.json({ data: log })
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch audit log entry' })
  }
})

export default router
