import { auth0 } from "@/lib/auth0";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth0.getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const logs = await prisma.auditLog.findMany({
    where: { tenantId: "demo-001" },
    orderBy: { timestamp: "desc" },
    take: 50,
  });

  return NextResponse.json(logs);
}

export async function POST(req: Request) {
  const session = await auth0.getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  const log = await prisma.auditLog.create({
    data: {
      tenantId: "demo-001",
      agentId: body.agentId ?? "ollama-local",
      action: body.action,
      connection: body.connection,
      scopesRequested: body.scopesRequested ?? [],
      scopesGranted: body.scopesGranted ?? [],
      stepUpRequired: body.stepUpRequired ?? false,
      success: body.success,
      errorCode: body.errorCode,
      metadata: body.metadata,
    },
  });

  return NextResponse.json(log, { status: 201 });
}
