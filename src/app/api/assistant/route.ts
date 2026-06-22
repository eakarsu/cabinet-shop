import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { aiRateLimiter } from "@/lib/ai-helpers";
import {
  ASSISTANT_TOOLS,
  TOOL_KIND,
  toOpenRouterTools,
  runReadTool,
  previewWrite,
  commitWrite,
  endpointCatalog,
  DAILY_SLOTS,
} from "@/lib/assistant-tools";

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_MODEL =
  process.env.OPENROUTER_MODEL || "anthropic/claude-3-5-sonnet-20241022";
const MAX_STEPS = 6;

interface ChatMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string | null;
  tool_calls?: any[];
  tool_call_id?: string;
  name?: string;
}

const SYSTEM_PROMPT = `You are the friendly AI concierge for Heritage Cabinet & Stone, a custom
cabinetry and natural-stone countertop company (granite, quartz, marble, and
custom wood cabinets). You help homeowners explore materials, browse past
projects, answer questions, book a free design consultation, and submit a
free-estimate request.

Guidelines:
- Be concise, warm, and helpful. Ask only for details you actually need.
- Use the tools to look up real data instead of guessing. Never invent materials,
  prices, projects, or availability.
- To book a consultation you need: name, phone, date, and time. Consultation
  slots are ${DAILY_SLOTS.join(", ")}. Use check_consultation_availability first.
- To submit a quote request you need: name, email, and phone.
- Today's date is ${new Date().toISOString().split("T")[0]}. Resolve relative
  dates ("tomorrow", "next Friday") into concrete YYYY-MM-DD before calling a tool.
- IMPORTANT — never ask the user to confirm in your text reply, and never say
  "please confirm" or "shall I book it". The moment you have the required fields,
  immediately CALL the write tool (book_consultation, submit_quote, or
  perform_action). The system then shows the guest a Confirm button automatically.
- Only ask a question when a REQUIRED field is genuinely missing.
- ALWAYS read the conversation context and act automatically. The user will never
  name an API, endpoint, table, or tool — it is YOUR job to infer the right one
  from what they want and call it immediately. Never ask "which API/endpoint?",
  never ask the user to choose a data source, and never say you can't do something
  that the catalog supports — just do it.
- For anything not covered by the specific tools, use query_data (to look things
  up) or perform_action (to create/update/delete), choosing the right endpoint id
  from the catalog below. To act on a specific record (e.g. cancel a consultation,
  delete a material, edit an FAQ), first query_data to find its id, then
  perform_action with that id — all without asking the user how.
- Examples of inferring from context: "what granite do you have" → query_data
  materials.list (or search_materials); "add a quartz called Frost White" →
  perform_action material.create; "remove the Uba Tuba" → query_data to find its
  id then perform_action material.delete; "change our phone number to X" →
  perform_action settings.update; "how many slabs for a 96x36 island and two
  98x26 counters in Black Pearl granite?" or "optimize this cut / minimize waste"
  → call optimize_cut with the parts inferred from their message (and the named
  material) and report slabs needed, yield %, and cost.

Available endpoints (id → what it does):
${endpointCatalog()}`;

async function callModel(messages: ChatMessage[]) {
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.NEXTAUTH_URL || "http://localhost:3000",
      "X-Title": "Heritage Cabinet & Stone Assistant",
    },
    body: JSON.stringify({
      model: OPENROUTER_MODEL,
      messages,
      tools: toOpenRouterTools(ASSISTANT_TOOLS),
      tool_choice: "auto",
      temperature: 0.3,
      max_tokens: 1200,
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`OpenRouter ${res.status}: ${body.slice(0, 240)}`);
  }
  const json = await res.json();
  return json.choices?.[0]?.message as ChatMessage;
}

export async function POST(request: NextRequest) {
  const t0 = Date.now();
  if (!OPENROUTER_API_KEY) {
    return NextResponse.json(
      { error: "AI assistant is unavailable — OPENROUTER_API_KEY is not set." },
      { status: 503 }
    );
  }

  const rateKey = request.headers.get("x-forwarded-for") || "anon";
  if (!aiRateLimiter(rateKey).allowed) {
    return NextResponse.json(
      { error: "You've reached the assistant request limit. Try again later." },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    const history: ChatMessage[] = Array.isArray(body.messages) ? body.messages : [];
    const confirm = body.confirm as { name: string; arguments: any } | undefined;

    const messages: ChatMessage[] = [
      { role: "system", content: SYSTEM_PROMPT },
      ...history.filter((m) => m.role === "user" || m.role === "assistant"),
    ];

    // Path A: user confirmed a pending write
    if (confirm?.name) {
      let result: unknown;
      let ok = true;
      try {
        result = await commitWrite(confirm.name, confirm.arguments);
      } catch (e) {
        ok = false;
        result = { error: e instanceof Error ? e.message : "Action failed." };
      }
      const followup: ChatMessage[] = [
        ...messages,
        {
          role: "user",
          content: ok
            ? `The guest confirmed. The action "${confirm.name}" completed: ${JSON.stringify(result)}. Give a short, friendly confirmation.`
            : `The action "${confirm.name}" failed: ${JSON.stringify(result)}. Apologize briefly and suggest a fix.`,
        },
      ];
      const reply = await callModel(followup);
      await logResult(body, reply?.content, Date.now() - t0);
      return NextResponse.json({ message: reply?.content ?? "Done.", pendingAction: null });
    }

    // Path B: normal agent loop
    for (let step = 0; step < MAX_STEPS; step++) {
      const assistantMsg = await callModel(messages);
      messages.push(assistantMsg);

      const toolCalls = assistantMsg?.tool_calls ?? [];
      if (toolCalls.length === 0) {
        await logResult(body, assistantMsg?.content, Date.now() - t0);
        return NextResponse.json({ message: assistantMsg?.content ?? "", pendingAction: null });
      }

      for (const call of toolCalls) {
        const name = call.function?.name as string;
        let parsedArgs: any = {};
        try {
          parsedArgs = JSON.parse(call.function?.arguments || "{}");
        } catch {
          parsedArgs = {};
        }

        if (TOOL_KIND[name] === "write") {
          try {
            const preview = await previewWrite(name, parsedArgs);
            await logResult(body, `pending:${name}`, Date.now() - t0);
            return NextResponse.json({
              message:
                assistantMsg?.content || `Please review and confirm: ${preview.summary}`,
              pendingAction: { name, arguments: parsedArgs, summary: preview.summary },
            });
          } catch (e) {
            messages.push({
              role: "tool",
              tool_call_id: call.id,
              name,
              content: JSON.stringify({
                error: e instanceof Error ? e.message : "Invalid request.",
              }),
            });
            continue;
          }
        }

        try {
          const result = await runReadTool(name, parsedArgs);
          messages.push({
            role: "tool",
            tool_call_id: call.id,
            name,
            content: JSON.stringify(result),
          });
        } catch (e) {
          messages.push({
            role: "tool",
            tool_call_id: call.id,
            name,
            content: JSON.stringify({
              error: e instanceof Error ? e.message : "Tool failed.",
            }),
          });
        }
      }
    }

    return NextResponse.json({
      message: "Sorry, I couldn't complete that. Could you rephrase?",
      pendingAction: null,
    });
  } catch (error) {
    console.error("Assistant error:", error);
    await logResult(null, undefined, Date.now() - t0, error);
    return NextResponse.json(
      { error: "The assistant ran into a problem. Please try again." },
      { status: 500 }
    );
  }
}

async function logResult(
  input: unknown,
  output: unknown,
  durationMs: number,
  error?: unknown
) {
  try {
    await prisma.aiResult.create({
      data: {
        feature: "assistant_chat",
        model: OPENROUTER_MODEL,
        input: (input as any) ?? undefined,
        output: output != null ? ({ message: output } as any) : undefined,
        error: error ? (error instanceof Error ? error.message : String(error)) : undefined,
        durationMs,
      },
    });
  } catch (err) {
    console.error("Failed to persist assistant AiResult", err);
  }
}
