import 'dotenv/config'
import { generateText, tool } from 'ai'
import { openai } from '@ai-sdk/openai'
import { z } from 'zod'
import { requestDelegation, pollDelegation, writeStock, submitRequisition } from './vaultguard.js'

console.log('='.repeat(64))
console.log('  MediCore HIMS - AI Agent powered by VaultGuard + Auth0')
console.log('  Requesting delegated access to NatSupply LMIS')
console.log('='.repeat(64))

const stockWriteTool = tool({
  description: 'Write stock levels to NatSupply LMIS. Requires VaultGuard delegation for action: stock.write',
  parameters: z.object({
    items: z.array(z.object({
      sku: z.string(),
      name: z.string(),
      quantity: z.number(),
      unit: z.string(),
    })),
  }),
  execute: async ({ items }) => {
    console.log('\n[stockWrite] Requesting delegation from VaultGuard...')
    const delegation = await requestDelegation('stock.write')
    if (delegation.status === 'BLOCKED') {
      return { error: 'Action blocked by NatSupply policy', status: 'BLOCKED' }
    }
    if (delegation.status === 'APPROVED' && delegation.token) {
      console.log('[stockWrite] ALLOW - Auth0 token issued immediately')
      console.log('[stockWrite] Token preview:', delegation.token.substring(0, 60) + '...')
      const result = await writeStock(delegation.token, items)
      console.log('[stockWrite] Stock updated:', result.stockUpdateId)
      return result
    }
    return { error: 'Unexpected status', status: delegation.status }
  },
})

const requisitionTool = tool({
  description: 'Submit a procurement requisition to NatSupply LMIS. Requires step-up human approval.',
  parameters: z.object({
    items: z.array(z.object({
      sku: z.string(),
      name: z.string(),
      quantity: z.number(),
      unit: z.string(),
      urgency: z.enum(['routine', 'urgent', 'emergency']),
    })),
    justification: z.string(),
  }),
  execute: async ({ items, justification }) => {
    console.log('\n[requisition] Requesting step-up delegation...')
    const delegation = await requestDelegation('requisition.submit')
    if (delegation.status === 'BLOCKED') {
      return { error: 'Action blocked by NatSupply policy' }
    }
    if (delegation.status === 'PENDING') {
      console.log('[requisition] STEP_UP - awaiting human approval')
      console.log('[requisition] Delegation ID:', delegation.delegationId)
      console.log('[requisition] To approve run:')
      console.log('  curl -s -X POST http://localhost:3001/delegations/' + delegation.delegationId + '/approve | jq')
      console.log('[requisition] Polling for 30s...')
      const result = await pollDelegation(delegation.delegationId, 30000)
      if (result.status === 'APPROVED' && result.token) {
        console.log('[requisition] Approved - Auth0 token issued!')
        const submitted = await submitRequisition(result.token, items)
        return { ...submitted, justification }
      }
      return { status: result.status, message: 'Not approved in time' }
    }
    return { error: 'Unexpected status' }
  },
})

const checkPolicyTool = tool({
  description: 'Check if an action is allowed by NatSupply policy',
  parameters: z.object({
    action: z.string(),
  }),
  execute: async ({ action }) => {
    console.log('\n[checkPolicy] Checking policy for:', action)
    const delegation = await requestDelegation(action)
    return {
      action,
      allowed: delegation.status !== 'BLOCKED',
      requiresStepUp: delegation.status === 'PENDING',
      status: delegation.status,
    }
  },
})

async function runAgent() {
  const { text, steps } = await generateText({
    model: openai('gpt-4o-mini'),
    tools: {
      stockWrite: stockWriteTool,
      submitRequisition: requisitionTool,
      checkPolicy: checkPolicyTool,
    },
    maxSteps: 10,
    system: `You are the MediCore HIMS procurement AI agent.
Your job is to manage medical supply chain operations by interacting with NatSupply LMIS.
You use VaultGuard for secure delegated access - never hardcoded credentials.
Be concise in your responses.`,
    prompt: `Perform these tasks:
1. Update stock in NatSupply: Amoxicillin 500mg (1000 tablets), Paracetamol 500mg (2000 tablets)
2. Submit urgent requisition: IV Fluids Normal Saline 500ml (500 units), justification: ICU surge
3. Check if admin.access is permitted`,
  })

  console.log('\n' + '='.repeat(64))
  console.log('  Agent Response:')
  console.log('='.repeat(64))
  console.log(text)
  console.log('\n  Steps taken:', steps.length)
  console.log('='.repeat(64) + '\n')
}

runAgent().catch(err => {
  console.error('Agent error:', err.message)
  process.exit(1)
})
