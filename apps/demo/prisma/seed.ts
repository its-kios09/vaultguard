import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const tenant = await prisma.tenant.upsert({
    where: { id: "demo-001" },
    update: {},
    create: {
      id: "demo-001",
      name: "Demo Tenant",
    },
  });

  await prisma.tenantConnection.createMany({
    skipDuplicates: true,
    data: [
      { tenantId: tenant.id, provider: "google-oauth2", status: "connected", scopesGranted: ["calendar.readonly", "calendar.events.write"], connectedAt: new Date(), lastUsedAt: new Date(), usageCount: 847 },
      { tenantId: tenant.id, provider: "slack", status: "connected", scopesGranted: ["chat:write", "channels:read"], connectedAt: new Date(), lastUsedAt: new Date(), usageCount: 312 },
      { tenantId: tenant.id, provider: "github", status: "connected", scopesGranted: ["repo:read", "pull_requests"], connectedAt: new Date(), lastUsedAt: new Date(), usageCount: 125 },
      { tenantId: tenant.id, provider: "gmail", status: "disconnected", scopesGranted: [], usageCount: 0 },
    ],
  });

  await prisma.scopePolicy.createMany({
    skipDuplicates: true,
    data: [
      { tenantId: tenant.id, connection: "google-oauth2", scopes: ["calendar.readonly", "calendar.events.write"] },
      { tenantId: tenant.id, connection: "slack", scopes: ["chat:write", "channels:read"] },
      { tenantId: tenant.id, connection: "github", scopes: ["repo:read", "pull_requests"] },
      { tenantId: tenant.id, connection: "gmail", scopes: ["gmail.send"] },
    ],
  });

  await prisma.auditLog.createMany({
    data: [
      { tenantId: tenant.id, agentId: "ollama-local", action: "VAULT_TOKEN_GRANTED", connection: "google-oauth2", scopesRequested: ["calendar.events.write"], scopesGranted: ["calendar.events.write"], success: true },
      { tenantId: tenant.id, agentId: "ollama-local", action: "VAULT_TOKEN_GRANTED", connection: "slack", scopesRequested: ["chat:write"], scopesGranted: ["chat:write"], success: true },
      { tenantId: tenant.id, agentId: "ollama-local", action: "STEP_UP_INITIATED", connection: "github", scopesRequested: ["repo"], scopesGranted: [], stepUpRequired: true, success: false },
      { tenantId: tenant.id, agentId: "ollama-local", action: "VAULT_TOKEN_DENIED", connection: "gmail", scopesRequested: ["gmail.delete"], scopesGranted: [], success: false, errorCode: "POLICY_VIOLATION" },
      { tenantId: tenant.id, agentId: "ollama-local", action: "CROSS_TENANT_ATTEMPT", connection: "google-oauth2", scopesRequested: ["calendar.events.write"], scopesGranted: [], success: false, errorCode: "CROSS_TENANT_ATTEMPT" },
    ],
  });

  console.log("Seeded demo tenant with connections, policies and audit logs");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
