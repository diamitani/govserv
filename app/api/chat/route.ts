import { NextResponse } from "next/server";
import { readRegistry } from "@/lib/server-data";
import { answerLocally, sanitizeServiceCards } from "@/lib/govguide";
import type { ChatApiRequest, ChatApiResponse, GovService } from "@/lib/types";

/**
 * POST /api/chat — GovGuide agent endpoint.
 * Resolution order:
 *   1. AI_API_KEY → OpenAI-compatible chat completions (AI_API_BASE_URL, AI_MODEL)
 *   2. ROSTR_API_URL → Rostr platform v1 chat (best effort, catch failures)
 *   3. Local GovGuide engine (default at launch)
 *
 * Both AI paths are constrained by a system prompt that grounds the model in
 * the GovServ registry and requires citing service IDs. All serviceCards are
 * validated against the registry before returning. The registry is read fresh
 * from disk so CMS edits in dev are visible immediately.
 */

function systemPrompt(registry: GovService[]): string {
  const catalog = registry
    .map((s) => `- id: "${s.id}" | ${s.name} (${s.agency}) — ${s.category}, ${s.scope.level}. Eligibility: ${s.eligibility.slice(0, 2).join("; ")}`)
    .join("\n");
  return `You are GovGuide, the assistant for GovServ — a civic-tech portal to government services.

You help people find government programs and benefits. Rules:
- ONLY recommend services from the catalog below. Never invent programs, agencies, deadlines, or contact info.
- When you recommend services, set the response's "serviceCards" array to their IDs (from the catalog, exactly as written).
- Include a concrete "actionPlan" array of 3–5 short steps (documents to gather, who to call, where to apply, deadlines).
- Be warm, plain-spoken, and concise. Use markdown. If the user's situation doesn't match any catalog service, say so and ask a clarifying question.
- For greetings, introduce yourself briefly.

SERVICE CATALOG:
${catalog}`;
}

function takeHistory(messages: ChatApiRequest["messages"]) {
  return messages
    .filter((m) => m.role === "user" || m.role === "assistant")
    .slice(-12)
    .map((m) => ({ role: m.role as "user" | "assistant", content: String(m.content ?? "").slice(0, 4000) }));
}

async function viaOpenAICompatible(
  messages: { role: string; content: string }[],
  registry: GovService[]
): Promise<ChatApiResponse | null> {
  const key = process.env.AI_API_KEY;
  if (!key) return null;
  const base = (process.env.AI_API_BASE_URL ?? "https://api.openai.com/v1").replace(/\/$/, "");
  const model = process.env.AI_MODEL ?? "gpt-4o-mini";

  const res = await fetch(`${base}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model,
      messages: [{ role: "system", content: systemPrompt(registry) }, ...messages],
      temperature: 0.4,
      max_tokens: 1200,
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "govguide_reply",
          schema: {
            type: "object",
            properties: {
              reply: { type: "string" },
              serviceCards: { type: "array", items: { type: "string" } },
              actionPlan: { type: "array", items: { type: "string" } },
            },
            required: ["reply"],
            additionalProperties: false,
          },
        },
      },
    }),
  });
  if (!res.ok) throw new Error(`AI API error: ${res.status}`);
  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) throw new Error("Empty AI response");
  const parsed = typeof content === "string" ? JSON.parse(content) : content;
  return {
    reply: String(parsed.reply ?? ""),
    serviceCards: sanitizeServiceCards(parsed.serviceCards, registry),
    actionPlan: Array.isArray(parsed.actionPlan) ? parsed.actionPlan.map(String).slice(0, 6) : undefined,
  };
}

async function viaRostr(
  messages: { role: string; content: string }[],
  registry: GovService[]
): Promise<ChatApiResponse | null> {
  const base = process.env.ROSTR_API_URL;
  if (!base) return null;
  try {
    const res = await fetch(`${base.replace(/\/$/, "")}/v1/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [{ role: "system", content: systemPrompt(registry) }, ...messages],
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const reply = String(data.reply ?? data.message ?? data.content ?? "");
    if (!reply) return null;
    return {
      reply,
      serviceCards: sanitizeServiceCards(data.serviceCards, registry),
      actionPlan: Array.isArray(data.actionPlan) ? data.actionPlan.map(String).slice(0, 6) : undefined,
    };
  } catch {
    return null; // best effort — fall through to local engine
  }
}

export async function POST(req: Request) {
  let body: ChatApiRequest;
  try {
    body = (await req.json()) as ChatApiRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const messages = Array.isArray(body.messages) ? takeHistory(body.messages) : [];
  if (messages.length === 0) {
    return NextResponse.json({ error: "messages array is required" }, { status: 400 });
  }
  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  const registry = await readRegistry();

  // (1) OpenAI-compatible API
  try {
    const ai = await viaOpenAICompatible(messages, registry);
    if (ai) return NextResponse.json(ai);
  } catch (err) {
    console.error("GovGuide AI provider failed, falling back:", err);
  }

  // (2) Rostr platform (best effort)
  const rostr = await viaRostr(messages, registry);
  if (rostr) return NextResponse.json(rostr);

  // (3) Local GovGuide engine — default at launch
  const local = answerLocally(lastUser?.content ?? "", registry);
  return NextResponse.json(local satisfies ChatApiResponse);
}
