import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import tenantsRouter from './routes/tenants'
import agentsRouter from './routes/agents'
import policiesRouter from './routes/policies'

const app = express()
const PORT = process.env.PORT || 3001

app.use(helmet())
app.use(cors())
app.use(morgan('dev'))
app.use(express.json())

// Routes
app.use('/tenants', tenantsRouter)
app.use('/tenants/:id/agents', agentsRouter)
app.use('/tenants/:id/policies', policiesRouter)

// Health
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'vaultguard-api',
    timestamp: new Date().toISOString(),
  })
})

app.listen(PORT, () => {
  console.log(`⚡ VaultGuard API running on http://localhost:${PORT}`)
})

export default app
