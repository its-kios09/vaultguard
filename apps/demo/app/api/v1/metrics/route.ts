import { auth0 } from "@/lib/auth0";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth0.getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tenantId = "demo-001";

  const [
    totalRequests,
    tokensGranted,
    threatsBlocked,
    activeConnections,
  ] = await Promise.all([
    prisma.auditLog.count({
      where: { tenantId },
    }),
    prisma.auditLog.count({
      where: { tenantId, action: "VAULT_TOKEN_GRANTED", success: true },
    }),
    prisma.auditLog.count({
      where: {
        tenantId,
        action: { in: ["CROSS_TENANT_ATTEMPT", "VAULT_TOKEN_DENIED", "POLICY_VIOLATION"] },
      },
    }),
    prisma.tenantConnection.count({
      where: { tenantId, status: "connected" },
    }),
  ]);

  const successRate =
    totalRequests > 0
      ? ((tokensGranted / totalRequests) * 100).toFixed(1)
      : "0.0";

  return NextResponse.json({
    totalRequests,
    tokensGranted,
    threatsBlocked,
    activeConnections,
    successRate: `${successRate}%`,
  });
}
