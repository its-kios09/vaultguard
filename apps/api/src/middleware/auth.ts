import { Request, Response, NextFunction } from 'express'
import { createRemoteJWKSet, jwtVerify } from 'jose'

const JWKS = createRemoteJWKSet(
  new URL(`https://${process.env.AUTH0_DOMAIN}/.well-known/jwks.json`)
)

export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader?.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Missing or invalid authorization header' })
      return
    }

    const token = authHeader.substring(7)
    const { payload } = await jwtVerify(token, JWKS, {
      issuer: `https://${process.env.AUTH0_DOMAIN}/`,
      audience: process.env.AUTH0_AUDIENCE,
    })

    req.auth = { sub: payload.sub!, payload }
    next()
  } catch (error) {
    res.status(401).json({ error: 'Invalid or expired token' })
  }
}

declare global {
  namespace Express {
    interface Request {
      auth?: { sub: string; payload: any }
    }
  }
}
