import { NextRequest, NextResponse } from "next/server";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { revalidatePath } from "next/cache";

import { getChatModel } from "@/features/ai/utils/model";
import { requireUser } from "@/features/auth/actions/requirer-user";
import {
  createConversation,
  generateTitle,
  getConversation,
  loadChatMessages,
  saveChatMessages,
  toLangChainMessages,
} from "@/features/ai/actions/chat-store";

// Long streams need a higher limit on Vercel (adjust to your plan)
export const maxDuration = 60;

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

// TODO: apne actual model IDs yahan daalo. Client sirf inhi mein se choose kar sakta hai.
const ALLOWED_MODELS: string[] = [
  "gemini-2.5-flash",
  "gemini-1.5-flash",
  "gemini-1.5-pro",
];

const MAX_PROMPT_CHARS = 8_000;
const MAX_HISTORY_MESSAGES = 40; // model ko itne recent messages hi bhejte hain

// Best-effort in-memory limiter (per server instance).
// Serverless pe production ke liye Redis/Upstash use karo.
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 20;
const rateHits = new Map<string, { count: number; resetAt: number }>();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function extractUserPrompt(body: Record<string, unknown>): string {
  const { content, messages } = body;

  if (typeof content === "string" && content.trim()) {
    return content.trim();
  }

  if (Array.isArray(messages) && messages.length > 0) {
    const last = messages[messages.length - 1] as
      | { role?: unknown; content?: unknown }
      | undefined;
    // Sirf user ka last message lo, assistant ka nahi
    if (
      last &&
      (last.role === undefined || last.role === "user") &&
      typeof last.content === "string"
    ) {
      return last.content.trim();
    }
  }

  return "";
}

function checkRateLimit(key: string): { limited: boolean; retryAfterSec: number } {
  const now = Date.now();

  // Map ko badhne se rokne ke liye expired entries hata do
  if (rateHits.size > 5_000) {
    for (const [k, v] of rateHits) {
      if (v.resetAt <= now) rateHits.delete(k);
    }
  }

  const entry = rateHits.get(key);
  if (!entry || entry.resetAt <= now) {
    rateHits.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return { limited: false, retryAfterSec: 0 };
  }

  entry.count += 1;
  return {
    limited: entry.count > RATE_LIMIT_MAX,
    retryAfterSec: Math.ceil((entry.resetAt - now) / 1000),
  };
}

async function persistAssistantMessage(
  conversationId: string,
  userId: string,
  content: string
) {
  try {
    await saveChatMessages(
      conversationId,
      userId,
      [{ role: "assistant", content }],
      { updateTitle: false }
    );
  } catch (err) {
    console.error("[chat] failed to save assistant message", err);
    return;
  }

  try {
    revalidatePath(`/c/${conversationId}`);
    revalidatePath("/");
  } catch (err) {
    console.error("[chat] revalidate failed", err);
  }
}

// ---------------------------------------------------------------------------
// Route
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate (requireUser already handles auth, so no separate auth.protect())
    let userAuth: Awaited<ReturnType<typeof requireUser>>;
    try {
      userAuth = await requireUser();
    } catch (authError) {
      return NextResponse.json(
        { error: authError instanceof Error ? authError.message : "Unauthorized" },
        { status: 401 }
      );
    }
    const { userId } = userAuth;

    // 2. Rate limit
    const rate = checkRateLimit(String(userId));
    if (rate.limited) {
      return NextResponse.json(
        { error: "Too many requests. Please slow down." },
        { status: 429, headers: { "Retry-After": String(rate.retryAfterSec) } }
      );
    }

    // 3. Parse + validate payload (sab kuch DB touch karne se pehle)
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;

    const userPrompt = extractUserPrompt(body);
    if (userPrompt.length > MAX_PROMPT_CHARS) {
      return NextResponse.json(
        { error: `Message too long (max ${MAX_PROMPT_CHARS} characters)` },
        { status: 413 }
      );
    }

    let requestedConversationId: string | null = null;
    const rawConversationId = body.conversationId;
    if (rawConversationId !== undefined && rawConversationId !== null && rawConversationId !== "") {
      if (typeof rawConversationId !== "string" || rawConversationId.length > 128) {
        return NextResponse.json({ error: "Invalid conversationId" }, { status: 400 });
      }
      requestedConversationId = rawConversationId;
    }

    // Naya chat hai aur prompt empty => orphan conversation banane se pehle hi reject
    if (!requestedConversationId && !userPrompt) {
      return NextResponse.json(
        { error: "Content or messages cannot be empty" },
        { status: 400 }
      );
    }

    let modelName: string | undefined;
    const rawModel = body.model;
    if (rawModel !== undefined && rawModel !== null) {
      if (typeof rawModel !== "string" || !ALLOWED_MODELS.includes(rawModel)) {
        return NextResponse.json({ error: "Model not allowed" }, { status: 400 });
      }
      modelName = rawModel;
    }

    // 4. Resolve or create conversation
    let conversation;
    if (requestedConversationId) {
      conversation = await getConversation(requestedConversationId, userId);
      if (!conversation) {
        return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
      }
    } else {
      conversation = await createConversation(userId, generateTitle(userPrompt));
    }
    const conversationId = String(conversation.id);

    // 5. Save user message (store duplicate retry ko khud skip kar deta hai)
    if (userPrompt) {
      await saveChatMessages(
        conversationId,
        userId,
        [{ role: "user", content: userPrompt }],
        { updateTitle: true }
      );
    }

    // 6. Load history for model context
    const history = await loadChatMessages(conversationId, userId);

    const lastTurn = [...history].reverse().find((m) => m.role !== "system");
    if (!lastTurn || lastTurn.role !== "user") {
      // Agar tumhare paas "regenerate" flow hai toh ye guard hata dena
      return NextResponse.json(
        { error: "No user message to respond to" },
        { status: 400 }
      );
    }

    const lcMessages = toLangChainMessages(history, {
      systemPrompt: conversation.systemPrompt,
      maxMessages: MAX_HISTORY_MESSAGES,
    });

    // 7. Stream from model
    const abortController = new AbortController();
    req.signal.addEventListener("abort", () => abortController.abort(), { once: true });

    const model = getChatModel(modelName ?? conversation.model);
    const parser = new StringOutputParser();
    const tokenStream = await model
      .pipe(parser)
      .stream(lcMessages, { signal: abortController.signal });

    const encoder = new TextEncoder();
    let fullAssistantResponse = "";

    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        let controllerOpen = true;
        let streamError: unknown = null;

        try {
          for await (const token of tokenStream) {
            fullAssistantResponse += token;
            if (!controllerOpen) continue;

            try {
              controller.enqueue(encoder.encode(token));
            } catch {
              // Client chala gaya: LLM call band karo, paisa mat jalao
              controllerOpen = false;
              abortController.abort();
            }
          }
        } catch (err) {
          // Abort (user ne Stop dabaya / tab band kiya) error nahi hai
          if (!abortController.signal.aborted) streamError = err;
        }

        // Jo bhi response mila (poora ya partial) save karo, taaki history alternate rahe
        if (fullAssistantResponse.trim()) {
          await persistAssistantMessage(conversationId, userId, fullAssistantResponse);
        }

        try {
          if (streamError) {
            console.error("[chat] stream error", streamError);
            controller.error(
              streamError instanceof Error ? streamError : new Error(String(streamError))
            );
          } else {
            controller.close();
          }
        } catch {
          // controller already closed/cancelled
        }
      },
      cancel() {
        abortController.abort();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        "x-conversation-id": conversationId,
      },
    });
  } catch (err) {
    console.error("[chat] unhandled error", err);
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}