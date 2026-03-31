import { Router, IRouter, Request, Response } from 'express'
import { z } from 'zod'
import { AuthenticationClient } from 'auth0'
import { prisma } from '../lib/prisma'
import { validate } from '../middleware/validate'

const router: IRouter = Router()

const connectSchema = z.object({
  tenantId: z.string().min(1),
  connection: z.string().min(1),
  scopes: z.array(z.string()).min(1),
})

const exchangeSchema = z.object({
  tenantId: z.string().min(1),
  connection: z.string().min(1),
  accessToken: z.string().min(1),
})

// POST /vault/connect
// Initiates connected account flow for a tenant
router.post('/connect', validate(connectSchema), async (req: Request, res: Response) => {
  try {
    const { tenantId, connection, scopes } = req.body

    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } })
    if (!tenant) {
      res.status(404).json({ error: 'Tenant not found' })
      return
    }

    // Build Auth0 connect URL
    const connectUrl = new URL(
      `https://${process.env.AUTH0_DOMAIN}/authorize`
    )
    connectUrl.searchParams.set('client_id', process.env.AUTH0_CLIENT_ID!)
    connectUrl.searchParams.set('response_type', 'code')
    connectUrl.searchParams.set('redirect_uri', `${process.env.APP_URL || 'http://localhost:3001'}/vault/callback`)
    connectUrl.searchParams.set('scope', scopes.join(' '))
    connectUrl.searchParams.set('connection', connection)
    connectUrl.searchParams.set('state', tenantId)

    await prisma.auditLog.create({
      data: {
        tenantId,
        action: 'vault.connect.initiated',
        status: 'PENDING',
        metadata: { connection, scopes },
      },
    })

    res.json({
      connectUrl: connectUrl.toString(),
      connection,
      scopes,
      tenantId,
      message: 'Redirect user to connectUrl to authorize connection',
    })
  } catch (error) {
    console.error('Vault connect error:', error)
    res.status(500).json({ error: 'Failed to initiate vault connection' })
  }
})

// POST /vault/exchange
// Exchange Auth0 access token for external provider token via Token Vault
router.post('/exchange', validate(exchangeSchema), async (req: Request, res: Response) => {
  try {
    const { tenantId, connection, accessToken } = req.body

    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } })
    if (!tenant) {
      res.status(404).json({ error: 'Tenant not found' })
      return
    }

    // Token Vault exchange — RFC 8693 OAuth 2.0 Token Exchange
    const response = await fetch(
      `https://${process.env.AUTH0_DOMAIN}/oauth/token`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'urn:auth0:params:oauth:grant-type:token-exchange:federated-connection-access-token',
          client_id: process.env.AUTH0_CLIENT_ID!,
          client_secret: process.env.AUTH0_PLATFORM_CLIENT_SECRET!,
          subject_token: accessToken,
          subject_token_type: 'urn:ietf:params:oauth:token-type:access_token',
          connection,
        }),
      }
    )

    const data = await response.json() as any

    if (!response.ok) {
      res.status(response.status).json({
        error: 'Token Vault exchange failed',
        details: data,
      })
      return
    }

    await prisma.auditLog.create({
      data: {
        tenantId,
        action: 'vault.exchange.success',
        status: 'SUCCESS',
        metadata: {
          connection,
          tokenType: data.token_type,
          expiresIn: data.expires_in,
        },
      },
    })

    res.json({
      access_token: data.access_token,
      token_type: data.token_type,
      expires_in: data.expires_in,
      connection,
      tokenSource: 'auth0_token_vault',
    })
  } catch (error) {
    console.error('Vault exchange error:', error)
    res.status(500).json({ error: 'Failed to exchange token via Token Vault' })
  }
})

// GET /vault/connections?tenantId=xxx
// List connected external providers for a tenant
router.get('/connections', async (req: Request, res: Response) => {
  try {
    const { tenantId } = req.query

    if (!tenantId) {
      res.status(400).json({ error: 'tenantId query parameter is required' })
      return
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId as string },
    })

    if (!tenant) {
      res.status(404).json({ error: 'Tenant not found' })
      return
    }

    // Get vault connection events from audit log
    const connections = await prisma.auditLog.findMany({
      where: {
        tenantId: tenantId as string,
        action: { in: ['vault.connect.initiated', 'vault.exchange.success'] },
      },
      orderBy: { createdAt: 'desc' },
    })

    res.json({ data: connections })
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch vault connections' })
  }
})

// GET /vault/callback
// OAuth callback after user connects external account
router.get('/callback', async (req: Request, res: Response) => {
  try {
    const { code, state, error } = req.query

    if (error) {
      res.status(400).json({ error: 'OAuth callback error', details: error })
      return
    }

    if (!code || !state) {
      res.status(400).json({ error: 'Missing code or state in callback' })
      return
    }

    const tenantId = state as string

    await prisma.auditLog.create({
      data: {
        tenantId,
        action: 'vault.connect.completed',
        status: 'SUCCESS',
        metadata: { callbackReceived: true },
      },
    })

    res.json({
      message: 'External account connected successfully',
      tenantId,
      status: 'connected',
      next: 'Use POST /vault/exchange to get provider access tokens',
    })
  } catch (error) {
    res.status(500).json({ error: 'Failed to process vault callback' })
  }
})

export default router
