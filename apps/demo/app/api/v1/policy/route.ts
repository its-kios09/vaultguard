import { auth0 } from "@/lib/auth0";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth0.getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const policies = await prisma.scopePolicy.findMany({
    where: { tenantId: "demo-001" },
    orderBy: { connection: "asc" },
  });

  return NextResponse.json(policies);
}

export async function PUT(req: Request) {
  const session = await auth0.getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { connection, scopes } = body;

  const policy = await prisma.scopePolicy.upsert({
    where: {
      tenantId_connection: {
        tenantId: "demo-001",
        connection,
      },
    },
    update: { scopes },
    create: {
      tenantId: "demo-001",
      connection,
      scopes,
    },
  });

  return NextResponse.json(policy);
}
