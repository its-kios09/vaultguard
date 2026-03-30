import { Router, IRouter, Request, Response } from 'express'
import { createRemoteJWKSet, jwtVerify } from 'jose'
import { prisma } from '../lib/prisma'

const router: IRouter = Router()

const JWKS = createRemoteJWKSet(
  new URL(`https://${process.env.AUTH0_DOMAIN}/.well-known/jwks.json`)
)

// POST /delegations/verify
router.post('/verify', async (req: Request, res: Response) => {
  try {
    const { token, action } = req.body

    if (!token) {
      res.status(400).json({ error: 'Token is required' })
      return
    }

    // 1. Verify JWT signature against Auth0 JWKS
    let payload: any
    try {
      const result = await jwtVerify(token, JWKS, {
        issuer: `https://${process.env.AUTH0_DOMAIN}/`,
        audience: process.env.AUTH0_AUDIENCE,
      })
      payload = result.payload
    } catch (jwtError: any) {
      res.status(401).json({
        valid: false,
        error: 'Invalid or expired token',
        reason: jwtError.message,
      })
      return
    }

    // 2. Find delegation record for this token
    const delegation = await prisma.delegation.findFirst({
      where: { token },
      include: {
        requestingTenant: { select: { id: true, name: true, slug: true } },
        receivingTenant: { select: { id: true, name: true, slug: true } },
        agent: { select: { id: true, name: true, clientId: true } },
      },
    })

    if (!delegation) {
      res.status(401).json({ valid: false, error: 'Token not found in delegation registry' })
      return
    }

    // 3. Check delegation status
    if (delegation.status === 'REVOKED') {
      res.status(401).json({ valid: false, error: 'Delegation has been revoked', delegationId: delegation.id })
      return
    }

    if (delegation.status === 'EXPIRED') {
      res.status(401).json({ valid: false, error: 'Delegation has expired', delegationId: delegation.id })
      return
    }

    if (delegation.status !== 'APPROVED') {
      res.status(401).json({ valid: false, error: `Delegation status is '${delegation.status}'`, delegationId: delegation.id })
      return
    }

    // 4. Check expiry
    if (delegation.expiresAt && delegation.expiresAt < new Date()) {
      await prisma.delegation.update({ where: { id: delegation.id }, data: { status: 'EXPIRED' } })
      res.status(401).json({ valid: false, error: 'Delegation has expired', delegationId: delegation.id })
      return
    }

    // 5. Check action scope if provided
    if (action && delegation.action !== action) {
      res.status(403).json({
        valid: false,
        error: 'Token not authorized for this action',
        tokenAction: delegation.action,
        requestedAction: action,
      })
      return
    }

    // 6. Log verification
    await prisma.auditLog.create({
      data: {
        tenantId: delegation.requestingTenantId,
        delegationId: delegation.id,
        action: 'delegation.verified',
        status: 'SUCCESS',
        metadata: {
          verifiedAt: new Date(),
          requestedAction: action ?? delegation.action,
          sub: payload.sub,
        },
      },
    })

    res.json({
      valid: true,
      delegationId: delegation.id,
      action: delegation.action,
      expiresAt: delegation.expiresAt,
      requestingTenant: delegation.requestingTenant,
      receivingTenant: delegation.receivingTenant,
      agent: delegation.agent,
      jwtPayload: {
        sub: payload.sub,
        iss: payload.iss,
        aud: payload.aud,
        iat: payload.iat,
        exp: payload.exp,
      },
    })
  } catch (error) {
    res.status(500).json({ error: 'Failed to verify token' })
  }
})

export default router
