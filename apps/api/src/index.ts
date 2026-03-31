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

const app: Express = express()
const PORT = process.env.PORT || 3001

app.use(helmet())
app.use(cors())
app.use(morgan('dev'))
app.use(express.json())

app.use('/health', healthRouter)
app.use('/tenants', tenantsRouter)
app.use('/tenants/:id/agents', agentsRouter)
app.use('/tenants/:id/policies', policiesRouter)
app.use('/delegations', delegationsRouter)
app.use('/delegations', verifyRouter)
app.use('/stepup', stepupRouter)
app.use('/audit', auditRouter)

app.listen(PORT, () => {
  console.log(`⚡ VaultGuard API running on http://localhost:${PORT}`)
})

export default app
