import { NextRequest } from "next/server";
import { HumanMessage, SystemMessage, AIMessage } from "@langchain/core/messages";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { revalidatePath } from "next/cache";

import { getChatModel } from "@/features/ai/utils/model";
import { requireUser } from "@/features/auth/actions/requirer-user";
import { db } from "@/src/prisma/db";

function generateTitle(content: string): string {
  const clean = content.replace(/\s+/g, " ").trim();
  return clean.length > 30 ? `${clean.slice(0, 30)}...` : clean || "New Chat";
}

export async function POST(req: NextRequest) {
  // 1. Authenticate user
  let userAuth;
  try {
    userAuth = await requireUser();
  } catch (authError) {
    return new Response(
      JSON.stringify({ error: authError instanceof Error ? authError.message : "Unauthorized" }),
      {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  const { userId } = userAuth;

  // 2. Parse request payload
  const body = await req.json().catch(() => ({}));
  const { conversationId, content, messages, model: requestedModel } = body;

  const userPrompt: string =
    typeof content === "string" && content.trim()
      ? content.trim()
      : Array.isArray(messages) && messages.length > 0 && messages[messages.length - 1]?.content
      ? String(messages[messages.length - 1].content).trim()
      : "";

  let activeConversationId: string = conversationId;

  // 3. Resolve or create conversation
  let conversation;
  if (activeConversationId) {
    conversation = await db.orm.public.Conversation.where({
      id: activeConversationId,
      userId,
    }).first();

    if (!conversation) {
      return new Response(JSON.stringify({ error: "Conversation not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }
  } else {
    // If no conversationId provided, automatically create one
    conversation = await db.orm.public.Conversation.create({
      userId,
      title: userPrompt ? generateTitle(userPrompt) : "New Chat",
    });
    activeConversationId = conversation.id;
  }

  // 4. Save user message if not already saved
  if (userPrompt) {
    const lastMsg = await db.orm.public.Message.where({
      conversationId: activeConversationId,
    })
      .orderBy((m) => m.createdAt.desc())
      .first();

    const isAlreadySaved =
      lastMsg && lastMsg.role === "USER" && lastMsg.content === userPrompt;

    if (!isAlreadySaved) {
      await db.orm.public.Message.create({
        conversationId: activeConversationId,
        role: "USER",
        status: "COMPLETE",
        content: userPrompt,
      });

      // Auto-rename conversation title if it's still "New Chat"
      if (
        conversation.title === "New Chat" ||
        conversation.title.trim().toLowerCase() === "new chat"
      ) {
        await db.orm.public.Conversation.where({
          id: activeConversationId,
        }).update({
          title: generateTitle(userPrompt),
        });
      }
    }
  }

  // 5. Load full conversation history for model context
  const dbMessages = await db.orm.public.Message.where({
    conversationId: activeConversationId,
  })
    .orderBy((m) => m.createdAt.asc())
    .all();

  const lcMessages = dbMessages.map((m) => {
    if (m.role === "SYSTEM") return new SystemMessage(m.content);
    if (m.role === "ASSISTANT") return new AIMessage(m.content);
    return new HumanMessage(m.content);
  });

  if (conversation.systemPrompt) {
    lcMessages.unshift(new SystemMessage(conversation.systemPrompt));
  }

  if (lcMessages.length === 0) {
    return new Response(
      JSON.stringify({ error: "Content or messages cannot be empty" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  // 6. Initialize LangChain model & parser stream
  try {
    const model = getChatModel(requestedModel ?? conversation.model);
    const parser = new StringOutputParser();
    const tokenStream = await model.pipe(parser).stream(lcMessages);

    const encoder = new TextEncoder();
    let fullAssistantResponse = "";

    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const token of tokenStream) {
            fullAssistantResponse += token;
            controller.enqueue(encoder.encode(token));
          }

          // 7. Save assistant's completed message & update lastMessageAt
          if (fullAssistantResponse.trim()) {
            await db.orm.public.Message.create({
              conversationId: activeConversationId,
              role: "ASSISTANT",
              status: "COMPLETE",
              content: fullAssistantResponse,
            });

            await db.orm.public.Conversation.where({
              id: activeConversationId,
            }).update({
              lastMessageAt: new Date().toISOString(),
            });

            revalidatePath(`/c/${activeConversationId}`);
            revalidatePath("/");
          }

          controller.close();
        } catch (streamErr) {
          controller.error(
            streamErr instanceof Error ? streamErr.message : String(streamErr)
          );
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        "x-conversation-id": activeConversationId,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}