import { auth0 } from "@/lib/auth0";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

const OLLAMA_URL = process.env.OLLAMA_URL ?? "http://localhost:11434";
const TENANT_ID = "demo-001";

const TOOLS = [
  {
    type: "function",
    function: {
      name: "check_calendar",
      description: "Check Google Calendar events for the user",
      parameters: {
        type: "object",
        properties: {
          date: { type: "string", description: "Date to check in YYYY-MM-DD format" },
        },
        required: ["date"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_calendar_event",
      description: "Create a Google Calendar event on behalf of the user",
      parameters: {
        type: "object",
        properties: {
          title:    { type: "string", description: "Event title" },
          date:     { type: "string", description: "Event date in YYYY-MM-DD format" },
          time:     { type: "string", description: "Event time in HH:MM format" },
          duration: { type: "number", description: "Duration in minutes" },
        },
        required: ["title", "date", "time"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "send_slack_message",
      description: "Send a Slack message on behalf of the user",
      parameters: {
        type: "object",
        properties: {
          channel: { type: "string", description: "Slack channel name" },
          message: { type: "string", description: "Message to send" },
        },
        required: ["channel", "message"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_github_issue",
      description: "Create a GitHub issue on behalf of the user",
      parameters: {
        type: "object",
        properties: {
          repo:  { type: "string", description: "Repository name in owner/repo format" },
          title: { type: "string", description: "Issue title" },
          body:  { type: "string", description: "Issue body" },
        },
        required: ["repo", "title"],
      },
    },
  },
];

const TOOL_VAULT_MAP: Record<string, { connection: string; scopes: string[] }> = {
  check_calendar:        { connection: "google-oauth2", scopes: ["calendar.readonly"] },
  create_calendar_event: { connection: "google-oauth2", scopes: ["calendar.events.write"] },
  send_slack_message:    { connection: "slack",         scopes: ["chat:write"] },
  create_github_issue:   { connection: "github",        scopes: ["repo:read"] },
};

async function validateVaultAccess(toolName: string, tenantId: string) {
  const mapping = TOOL_VAULT_MAP[toolName];
  if (!mapping) return { allowed: false, reason: "Unknown tool" };

  const policy = await prisma.scopePolicy.findUnique({
    where: { tenantId_connection: { tenantId, connection: mapping.connection } },
  });

  if (!policy) {
    return { allowed: false, reason: `No policy for connection: ${mapping.connection}` };
  }

  const deniedScopes = mapping.scopes.filter((s) => !policy.scopes.includes(s));
  if (deniedScopes.length > 0) {
    return {
      allowed: false,
      reason: `POLICY_VIOLATION: scopes not allowed: ${deniedScopes.join(", ")}`,
    };
  }

  return { allowed: true, connection: mapping.connection, scopes: mapping.scopes };
}

async function logAudit(params: {
  tenantId: string;
  action: string;
  connection: string;
  scopesRequested: string[];
  scopesGranted: string[];
  success: boolean;
  errorCode?: string;
}) {
  await prisma.auditLog.create({
    data: {
      tenantId:        params.tenantId,
      agentId:         "ollama-llama3.2",
      action:          params.action,
      connection:      params.connection,
      scopesRequested: params.scopesRequested,
      scopesGranted:   params.scopesGranted,
      stepUpRequired:  false,
      success:         params.success,
      errorCode:       params.errorCode,
    },
  });
}

async function executeTool(toolName: string, args: Record<string, unknown>, tenantId: string) {
  const validation = await validateVaultAccess(toolName, tenantId);
  const mapping = TOOL_VAULT_MAP[toolName];

  if (!validation.allowed) {
    await logAudit({
      tenantId,
      action:          "VAULT_TOKEN_DENIED",
      connection:      mapping?.connection ?? "unknown",
      scopesRequested: mapping?.scopes ?? [],
      scopesGranted:   [],
      success:         false,
      errorCode:       "POLICY_VIOLATION",
    });
    return { error: validation.reason };
  }

  await logAudit({
    tenantId,
    action:          "VAULT_TOKEN_GRANTED",
    connection:      validation.connection!,
    scopesRequested: validation.scopes!,
    scopesGranted:   validation.scopes!,
    success:         true,
  });

  switch (toolName) {
    case "check_calendar":
      return {
        events: [
          { time: "09:00", title: "Team standup", duration: 30 },
          { time: "14:00", title: "Product review", duration: 60 },
        ],
        date:   args.date,
        source: "google-calendar via Auth0 Token Vault",
      };
    case "create_calendar_event":
      return {
        success: true,
        event:   { title: args.title, date: args.date, time: args.time, duration: args.duration ?? 60 },
        message: `Event "${args.title}" created via Auth0 Token Vault`,
      };
    case "send_slack_message":
      return {
        success: true,
        channel: args.channel,
        message: args.message,
        ts:      Date.now().toString(),
        source:  "slack via Auth0 Token Vault",
      };
    case "create_github_issue":
      return {
        success: true,
        issue:   { number: Math.floor(Math.random() * 1000), title: args.title, repo: args.repo },
        url:     `https://github.com/${args.repo}/issues/1`,
        source:  "github via Auth0 Token Vault",
      };
    default:
      return { error: "Unknown tool" };
  }
}

export async function POST(req: Request) {
  const session = await auth0.getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { message } = await req.json();
  if (!message) {
    return NextResponse.json({ error: "Message required" }, { status: 400 });
  }

  const messages: any[] = [
    {
      role: "system",
      content: `You are a helpful AI assistant with access to the user's external services through VaultGuard's secure gateway.
All API calls go through Auth0 Token Vault — you never handle credentials directly.
Available tools: Google Calendar (check/create events), Slack (send messages), GitHub (create issues).
Be concise and confirm what actions you took.`,
    },
    { role: "user", content: message },
  ];

  const ollamaRes = await fetch(`${OLLAMA_URL}/api/chat`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ model: "llama3.2:3b", messages, tools: TOOLS, stream: false }),
  });

  if (!ollamaRes.ok) {
    return NextResponse.json({ error: "Ollama request failed" }, { status: 500 });
  }

  const ollamaData = await ollamaRes.json();
  const assistantMessage = ollamaData.message;
  const toolCalls = assistantMessage?.tool_calls ?? [];
  const toolResults: { tool: string; result: unknown; allowed: boolean }[] = [];

  for (const toolCall of toolCalls) {
    const toolName = toolCall.function?.name;
    const toolArgs = toolCall.function?.arguments ?? {};
    const result = await executeTool(toolName, toolArgs, TENANT_ID);
    toolResults.push({ tool: toolName, result, allowed: !("error" in result) });
    messages.push({ role: "assistant", content: assistantMessage.content ?? "", tool_calls: toolCalls });
    messages.push({ role: "tool", content: JSON.stringify(result) });
  }

  let finalResponse = assistantMessage.content;

  if (toolCalls.length > 0) {
    const finalRes = await fetch(`${OLLAMA_URL}/api/chat`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ model: "llama3.2:3b", messages, stream: false }),
    });
    if (finalRes.ok) {
      const finalData = await finalRes.json();
      finalResponse = finalData.message?.content ?? finalResponse;
    }
  }

  return NextResponse.json({
    response:  finalResponse,
    toolCalls: toolResults,
    model:     "llama3.2:3b",
    gateway:   "VaultGuard · Auth0 Token Vault",
  });
}
