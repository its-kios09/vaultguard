import { auth0 } from "@/lib/auth0";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth0.getSession();
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const tenantId = "demo-001";
  let lastId: string | null = null;

  const stream = new ReadableStream({
    async start(controller) {
      const encode = (data: object) => {
        const payload = `data: ${JSON.stringify(data)}\n\n`;
        controller.enqueue(new TextEncoder().encode(payload));
      };

      // Send initial batch
      const initial = await prisma.auditLog.findMany({
        where: { tenantId },
        orderBy: { timestamp: "desc" },
        take: 20,
      });

      if (initial.length > 0) {
        lastId = initial[0].id;
        encode({ type: "initial", logs: initial });
      }

      // Poll for new entries every 3 seconds
      const interval = setInterval(async () => {
        try {
          const newLogs = await prisma.auditLog.findMany({
            where: {
              tenantId,
              ...(lastId ? { id: { gt: lastId } } : {}),
              timestamp: { gt: new Date(Date.now() - 10000) },
            },
            orderBy: { timestamp: "desc" },
            take: 10,
          });

          if (newLogs.length > 0) {
            lastId = newLogs[0].id;
            for (const log of newLogs) {
              encode({ type: "new", log });
            }
          }

          encode({ type: "heartbeat", ts: Date.now() });
        } catch {
          clearInterval(interval);
          controller.close();
        }
      }, 3000);

      // Clean up on disconnect
      const cleanup = () => {
        clearInterval(interval);
        try { controller.close(); } catch {}
      };

      // Auto close after 5 minutes to prevent hanging connections
      setTimeout(cleanup, 5 * 60 * 1000);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}
