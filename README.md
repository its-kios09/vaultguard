# VaultGuard

> The trust layer for agent-to-agent authorization across organizational boundaries.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Auth0](https://img.shields.io/badge/Powered%20by-Auth0%20Token%20Vault-EB5424?logo=auth0)](https://auth0.com/ai)
[![pnpm](https://img.shields.io/badge/managed%20with-pnpm-F69220?logo=pnpm)](https://pnpm.io)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

---

## The Problem

Every day, thousands of AI agents cross organizational boundaries — a hospital system pushing stock data to a national supply chain, a logistics agent querying a partner's inventory, a procurement agent submitting orders to an external ERP.

Today, these systems either:

- **Hardcode static Bearer tokens** — leaked once, compromised forever, no audit trail
- **Share service account credentials** — one key grants access to everything for everyone
- **Re-authenticate from scratch** — broken UX, no delegation continuity
- **Trust agents blindly** — no scope enforcement, no revocation, no chain of custody

There is no standard infrastructure for *"I permit your agent to act in my systems, with these specific scopes, for this duration, requiring human consent above this risk level."*

**VaultGuard is that infrastructure.**

---

## What VaultGuard Does

VaultGuard is a **multi-tenant trust broker** where organizations register their AI agents, define delegation policies, and issue scoped, time-bound, fully audited authorization tokens — powered by [Auth0 Token Vault](https://auth0.com/ai/docs/intro/token-vault).

```
Org A's HIMS Agent                    Org B's LMIS Platform
       │                                       │
       │  1. Request delegation                │
       │  (action: push stock data)            │
       ▼                                       │
  ┌─────────────────────────────┐              │
  │        VaultGuard           │              │
  │                             │              │
  │  ✓ Validate policy          │              │
  │  ✓ Check scope boundaries   │              │
  │  ✓ Auth0 Token Vault        │              │
  │  ✓ Issue scoped token       │              │
  │  ✓ Log to audit trail       │              │
  └─────────────────────────────┘              │
       │                                       │
       │  2. Scoped token issued               │
       ▼                                       ▼
  Agent calls Org B's API ──────────────────► ✅ Authorized
  Agent tries unauthorized endpoint ────────► ❌ Blocked + logged
  Agent triggers high-risk action ──────────► ⚡ Step-up consent required
```

---

## Key Features

- **Multi-tenant isolation** — every org's credentials, policies, and audit logs are completely isolated; Auth0 Token Vault enforces this cryptographically
- **Policy engine** — orgs define exactly what external agents can do: allowed actions, blocked actions, step-up triggers
- **Scoped delegation tokens** — agents never see raw credentials; they receive time-bound, scope-limited tokens via OAuth 2.0 Token Exchange (RFC 8693)
- **Step-up authorization** — high-stakes operations pause and require a human approver before proceeding
- **Real-time revocation** — org admins kill any active delegation instantly from the dashboard
- **Full audit trail** — every delegation request, approval, rejection, and token exchange logged with chain of custody per tenant
- **Trust graph visualization** — see live delegation chains across your organization
- **`vaultguard-sdk`** — drop-in npm package; wrap any agent tool with delegation in three lines of code

---

## Architecture

```
vaultguard/
├── apps/
│   ├── platform/
│   └── api/
├── packages/
│   └── sdk/
└── examples/
    ├── medicore-agent/
    └── natsupply-agent/
```

### Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Tailwind CSS, React Flow |
| Backend | Express, Prisma, PostgreSQL |
| Auth | Auth0 Token Vault, Auth0 M2M, `@auth0/ai-vercel` |
| SDK | TypeScript, publishable to npm |
| Infrastructure | Docker (local), DigitalOcean (production) |
| Monorepo | pnpm workspaces |

---

## The Demo Scenario

VaultGuard ships with a realistic healthcare supply chain demo:

**MediCore HIMS** (Org A) — a hospital information management system that needs to push daily stock data and submit drug requisitions to a national supply platform.

**NatSupply LMIS** (Org B) — a national logistics management information system that exposes APIs for stock updates, requisitions, and delivery confirmations.

**Without VaultGuard:** MediCore hardcodes a static Bearer token. One leak = unauthorized access to national drug supply data.

**With VaultGuard:**

```typescript
import { VaultGuard } from 'vaultguard-sdk'

const guard = new VaultGuard({
  agentId: process.env.VAULTGUARD_AGENT_ID,
  secret: process.env.VAULTGUARD_SECRET,
  brokerUrl: process.env.VAULTGUARD_BROKER_URL,
})

// Request a scoped delegation to push stock data
const stockTool = guard.withDelegation({
  targetOrg: 'natsupply-lmis',
  action: 'stock.write',
  ttl: '24h',
})(pushDailyStockTool)

// High-stakes: submit a requisition — triggers step-up consent
const requisitionTool = guard.withDelegation({
  targetOrg: 'natsupply-lmis',
  action: 'requisition.submit',
  requireStepUp: true,
})(submitRequisitionTool)
```

**Live demo outcomes:**
- ✅ Stock data pushed — scoped token issued, audited
- ⚡ Requisition submitted — NatSupply admin approves via consent popup
- ❌ Admin endpoint access attempted — blocked by policy, logged
- 🔍 Full delegation chain visible in VaultGuard dashboard

---

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 9+
- Docker + Docker Compose
- Auth0 account (free tier works)

### Installation

```bash
# Clone the repository
git clone https://github.com/its-kios09/vaultguard.git
cd vaultguard

# Install dependencies
pnpm install

# Start PostgreSQL
docker compose up -d

# Copy environment files
cp apps/api/.env.example apps/api/.env
cp apps/platform/.env.example apps/platform/.env

# Run database migrations
pnpm --filter api db:migrate

# Start all services
pnpm dev
```

### Auth0 Setup

1. Create an Auth0 account at [auth0.com](https://auth0.com)
2. Create a Regular Web Application
3. Enable Token Vault under **Security → Token Vault**
4. Enable `enableConnectAccountEndpoint: true`
5. Add your credentials to `apps/api/.env`

Full setup guide: [docs/auth0-setup.md](docs/auth0-setup.md)

---

## SDK Usage

```bash
npm install vaultguard-sdk
```

```typescript
import { VaultGuard } from 'vaultguard-sdk'

const guard = new VaultGuard({
  agentId: 'your-agent-id',
  secret: 'your-agent-secret',
  brokerUrl: 'https://your-vaultguard-instance.com',
})

// Wrap any tool with delegation enforcement
const delegatedTool = guard.withDelegation({
  targetOrg: 'target-org-id',
  action: 'action.scope',
  ttl: '1h',
})(yourExistingTool)
```

See [packages/sdk/README.md](packages/sdk/README.md) for full API reference.

---

## Why Auth0 Token Vault

VaultGuard is built on [Auth0 Token Vault](https://auth0.com/ai/docs/intro/token-vault), which implements OAuth 2.0 Token Exchange (RFC 8693). This means:

- **No credentials on your infrastructure** — agents never hold raw provider tokens
- **Automatic token refresh** — Auth0 manages the full token lifecycle
- **Cryptographic user/tenant isolation** — vault access requires a valid Auth0 credential; agents cannot request arbitrary credentials
- **30+ pre-integrated providers** — Google, Microsoft, Slack, GitHub, Salesforce, and more

VaultGuard extends Token Vault's human→agent pattern into **agent→agent cross-organizational delegation** — the missing infrastructure layer for the multi-agent era.

---

## Roadmap

- [x] Multi-tenant org registration
- [x] Agent registration + M2M identity
- [x] Policy engine (allow / block / step-up)
- [x] Token Vault delegation flow
- [x] Step-up consent UI
- [x] Audit trail + chain of custody
- [x] Real-time revocation
- [x] Trust graph dashboard
- [x] `vaultguard-sdk` npm package
- [ ] Webhook notifications on delegation events
- [ ] Policy templates for common healthcare + supply chain patterns
- [ ] Auth0 FGA integration for fine-grained authorization
- [ ] MCP server support

---

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

---

## License

[MIT](LICENSE)

---

## Acknowledgements

Built for the [Authorized to Act: Auth0 for AI Agents Hackathon](https://auth0devchallenge.devpost.com/) — powered by [Auth0 Token Vault](https://auth0.com/ai).

---

<p align="center">
  <sub>VaultGuard — because hardcoded tokens are a vulnerability, not a strategy.</sub>
</p>
