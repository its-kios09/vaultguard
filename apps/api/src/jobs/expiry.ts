import { prisma } from '../lib/prisma'

export const cleanupExpiredDelegations = async () => {
  try {
    const now = new Date()

    const expired = await prisma.delegation.findMany({
      where: {
        status: { in: ['APPROVED', 'PENDING'] },
        expiresAt: { lt: now },
      },
    })

    if (expired.length === 0) return

    await prisma.delegation.updateMany({
      where: {
        id: { in: expired.map((d) => d.id) },
      },
      data: { status: 'EXPIRED', token: null },
    })

    await prisma.auditLog.createMany({
      data: expired.map((d) => ({
        tenantId: d.requestingTenantId,
        delegationId: d.id,
        action: 'delegation.expired',
        status: 'EXPIRED',
        metadata: {
          expiredAt: now,
          action: d.action,
          autoCleanup: true,
        },
      })),
    })

    console.log(`Cleanup: ${expired.length} delegation(s) expired`)
  } catch (error) {
    console.error('Expiry cleanup error:', error)
  }
}

export const startExpiryCleanup = () => {
  cleanupExpiredDelegations()

  const interval = setInterval(cleanupExpiredDelegations, 5 * 60 * 1000)

  console.log('Expiry cleanup job started — runs every 5 minutes')

  return interval
}
