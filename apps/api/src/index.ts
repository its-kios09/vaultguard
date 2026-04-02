import 'dotenv/config'
import express, { Express } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import tenantsRouter from './routes/tenants'
import agentsRouter from './routes/agents'
import policiesRouter from './routes/policies'
import delegationsRouter from './routes/delegations'
import auditRouter from './routes/audit'
import healthRouter from './routes/health'
import verifyRouter from './routes/verify'
import stepupRouter from './routes/stepup'
import vaultRouter from './routes/vault'
import { globalLimiter, delegationLimiter, vaultLimiter } from './middleware/rateLimit'
import { startExpiryCleanup } from './jobs/expiry'

const app: Express = express()
const PORT = process.env.PORT || 3001

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
  crossOriginEmbedderPolicy: false,
}))
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}))
app.use(morgan('dev'))
app.use(express.json({ limit: '10mb' }))
app.use(globalLimiter)

// Request ID middleware
app.use((req, res, next) => {
  req.headers['x-request-id'] = req.headers['x-request-id'] ||
    `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  res.setHeader('x-request-id', req.headers['x-request-id'])
  next()
})

// Routes
app.use('/health', healthRouter)
app.use('/tenants', tenantsRouter)
app.use('/tenants/:id/agents', agentsRouter)
app.use('/tenants/:id/policies', policiesRouter)
app.use('/delegations', delegationLimiter, delegationsRouter)
app.use('/delegations', verifyRouter)
app.use('/stepup', stepupRouter)
app.use('/vault', vaultLimiter, vaultRouter)
app.use('/audit', auditRouter)

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    path: req.path,
    method: req.method,
  })
})

// Start expiry cleanup job
startExpiryCleanup()

app.listen(PORT, () => {
  console.log(`⚡ VaultGuard API running on http://localhost:${PORT}`)
})

export default app
