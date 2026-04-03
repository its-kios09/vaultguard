import 'dotenv/config'
import Anthropic from '@anthropic-ai/sdk'
import { requestDelegation, pollDelegation, writeStock, submitRequisition } from './vaultguard.js'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

console.log('='.repeat(64))
console.log('  MediCore HIMS - AI Agent powered by VaultGuard + Auth0')
console.log('  Model: Claude Haiku | Auth: Auth0 Token Vault')
console.log('='.repeat(64))

const tools: Anthropic.Tool[] = [
  {
    name: 'stock_write',
    description: 'Write stock levels to NatSupply LMIS. Requires VaultGuard delegation for action: stock.write',
    input_schema: {
      type: 'object',
      properties: {
        items: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              sku: { type: 'string' },
              name: { type: 'string' },
              quantity: { type: 'number' },
              unit: { type: 'string' },
            },
            required: ['sku', 'name', 'quantity', 'unit'],
          },
        },
      },
      required: ['items'],
    },
  },
  {
    name: 'submit_requisition',
    description: 'Submit a procurement requisition to NatSupply LMIS. Requires step-up human approval.',
    input_schema: {
      type: 'object',
      properties: {
        items: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              sku: { type: 'string' },
              name: { type: 'string' },
              quantity: { type: 'number' },
              unit: { type: 'string' },
              urgency: { type: 'string', enum: ['routine', 'urgent', 'emergency'] },
            },
            required: ['sku', 'name', 'quantity', 'unit', 'urgency'],
          },
        },
        justification: { type: 'string' },
      },
      required: ['items', 'justification'],
    },
  },
  {
    name: 'check_policy',
    description: 'Check if an action is allowed by NatSupply policy before attempting it',
    input_schema: {
      type: 'object',
      properties: {
        action: { type: 'string' },
      },
      required: ['action'],
    },
  },
]

async function executeTool(name: string, input: any): Promise<string> {
  if (name === 'stock_write') {
    console.log('\n[stockWrite] Requesting delegation from VaultGuard...')
    const delegation = await requestDelegation('stock.write')
    if (delegation.status === 'BLOCKED') {
      return JSON.stringify({ error: 'Action blocked by NatSupply policy', status: 'BLOCKED' })
    }
    if (delegation.status === 'APPROVED' && delegation.token) {
      console.log('[stockWrite] ALLOW - Auth0 token issued immediately')
      console.log('[stockWrite] Token:', delegation.token.substring(0, 60) + '...')
      const result = await writeStock(delegation.token, input.items)
      console.log('[stockWrite] Stock updated:', result.stockUpdateId)
      return JSON.stringify(result)
    }
    return JSON.stringify({ error: 'Unexpected status', status: delegation.status })
  }

  if (name === 'submit_requisition') {
    console.log('\n[requisition] Requesting step-up delegation...')
    const delegation = await requestDelegation('requisition.submit')
    if (delegation.status === 'BLOCKED') {
      return JSON.stringify({ error: 'Action blocked' })
    }
    if (delegation.status === 'PENDING') {
      console.log('[requisition] STEP_UP - awaiting human approval')
      console.log('[requisition] Delegation ID:', delegation.delegationId)
      console.log('\n[requisition] To approve run in another terminal:')
      console.log('  curl -s -X POST http://localhost:3001/delegations/' + delegation.delegationId + '/approve | jq\n')
      console.log('[requisition] Polling for 30s...')
      const result = await pollDelegation(delegation.delegationId, 30000)
      if (result.status === 'APPROVED' && result.token) {
        console.log('[requisition] Approved - Auth0 token issued!')
        const submitted = await submitRequisition(result.token, input.items)
        return JSON.stringify({ ...submitted, justification: input.justification })
      }
      return JSON.stringify({ status: result.status, message: 'Not approved in time' })
    }
    return JSON.stringify({ error: 'Unexpected status' })
  }

  if (name === 'check_policy') {
    console.log('\n[checkPolicy] Checking policy for:', input.action)
    const delegation = await requestDelegation(input.action)
    return JSON.stringify({
      action: input.action,
      allowed: delegation.status !== 'BLOCKED',
      requiresStepUp: delegation.status === 'PENDING',
      status: delegation.status,
    })
  }

  return JSON.stringify({ error: 'Unknown tool' })
}

async function runAgent() {
  const messages: Anthropic.MessageParam[] = [
    {
      role: 'user',
      content: `Perform these supply chain tasks:
1. Update stock in NatSupply: Amoxicillin 500mg (1000 tablets, sku: MED-001), Paracetamol 500mg (2000 tablets, sku: MED-002)
2. Submit urgent requisition: IV Fluids Normal Saline 500ml (500 units, sku: MED-003), justification: ICU surge
3. Check if admin.access is permitted`,
    },
  ]

  let response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 4096,
    system: `You are the MediCore HIMS procurement AI agent.
Your job is to manage medical supply chain operations by interacting with NatSupply LMIS.
You use VaultGuard for secure delegated access - never hardcoded credentials.
Always use tools to perform actions. Be concise in your final response.`,
    tools,
    messages,
  })

  // Agentic loop
  while (response.stop_reason === 'tool_use') {
    const toolUseBlocks = response.content.filter(b => b.type === 'tool_use') as Anthropic.ToolUseBlock[]
    
    messages.push({ role: 'assistant', content: response.content })

    const toolResults: Anthropic.ToolResultBlockParam[] = []
    for (const toolUse of toolUseBlocks) {
      console.log(`\n[agent] Calling tool: ${toolUse.name}`)
      const result = await executeTool(toolUse.name, toolUse.input)
      toolResults.push({
        type: 'tool_result',
        tool_use_id: toolUse.id,
        content: result,
      })
    }

    messages.push({ role: 'user', content: toolResults })

    response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 4096,
      system: `You are the MediCore HIMS procurement AI agent.
Your job is to manage medical supply chain operations by interacting with NatSupply LMIS.
You use VaultGuard for secure delegated access - never hardcoded credentials.
Always use tools to perform actions. Be concise in your final response.`,
      tools,
      messages,
    })
  }

  const finalText = response.content
    .filter(b => b.type === 'text')
    .map(b => (b as Anthropic.TextBlock).text)
    .join('\n')

  console.log('\n' + '='.repeat(64))
  console.log('  Agent Response:')
  console.log('='.repeat(64))
  console.log(finalText)
  console.log('='.repeat(64) + '\n')
}

runAgent().catch(err => {
  console.error('Agent error:', err.message)
  process.exit(1)
})
