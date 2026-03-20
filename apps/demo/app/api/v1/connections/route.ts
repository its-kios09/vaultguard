import { auth0 } from "@/lib/auth0";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth0.getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const connections = await prisma.tenantConnection.findMany({
    where: { tenantId: "demo-001" },
    orderBy: { provider: "asc" },
  });

  return NextResponse.json(connections);
}

export async function PATCH(req: Request) {
  const session = await auth0.getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { provider, status } = body;

  const connection = await prisma.tenantConnection.update({
    where: {
      tenantId_provider: {
        tenantId: "demo-001",
        provider,
      },
    },
    data: {
      status,
      connectedAt: status === "connected" ? new Date() : null,
      lastUsedAt: status === "connected" ? new Date() : null,
      tokenExpiresAt: status === "connected"
        ? new Date(Date.now() + 3600 * 1000)
        : null,
      scopesGranted: status === "connected" ? ["read"] : [],
    },
  });

  return NextResponse.json(connection);
}
