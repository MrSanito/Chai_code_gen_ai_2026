// NOTE: yahan "use server" jaanbujhkar nahi hai.
// "use server" file ke har export ko public endpoint bana deta hai, aur ye functions
// `userId` argument lete hain. Client koi bhi userId pass karke kisi aur ki chat padh/likh
// sakta tha. Ye helpers sirf route handler / server components se call karo.

import {
  AIMessage,
  HumanMessage,
  SystemMessage,
  type BaseMessage,
} from "@langchain/core/messages";

import { db } from "@/src/prisma/db";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ChatRole = "user" | "assistant" | "system";

/** Client / UI ke liye message shape (AI SDK ke UIMessage ki jagah). */
export type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
};

/** Save karte waqt `id` optional hai. Id ho toh upsert, warna naya message. */
export type ChatMessageInput = {
  id?: string;
  role: ChatRole;
  content: string;
};

type SaveChatMessagesOptions = {
  /** true ho toh "New Chat" title pehle user message se auto-set hota hai. */
  updateTitle?: boolean;
};

type ToLangChainOptions = {
  /** Conversation.systemPrompt. Diya ho toh DB ke SYSTEM messages skip hote hain. */
  systemPrompt?: string | null;
  /** Model ko sirf itne recent messages bhejo. */
  maxMessages?: number;
};

const DEFAULT_TITLE = "New Chat";

const ROLE_TO_DB = {
  user: "USER",
  assistant: "ASSISTANT",
  system: "SYSTEM",
} as const;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function generateTitle(content: string): string {
  const clean = content.replace(/\s+/g, " ").trim();
  if (!clean) return DEFAULT_TITLE;
  // Array.from => code points pe slice, emoji beech mein nahi tutta
  const chars = Array.from(clean);
  return chars.length > 30 ? `${chars.slice(0, 30).join("")}...` : clean;
}

function fromDbRole(role: string): ChatRole {
  if (role === "ASSISTANT") return "assistant";
  if (role === "SYSTEM") return "system";
  return "user";
}

// ---------------------------------------------------------------------------
// Conversations
// ---------------------------------------------------------------------------

/** Conversation tabhi milti hai jab wo is user ki ho. */
export async function getConversation(conversationId: string, userId: string) {
  return db.orm.public.Conversation.where({
    id: conversationId,
    userId,
  }).first();
}

export async function createConversation(userId: string, title: string) {
  return db.orm.public.Conversation.create({
    userId,
    title,
    lastMessageAt: new Date().toISOString(),
  });
}

// ---------------------------------------------------------------------------
// Messages
// ---------------------------------------------------------------------------

/**
 * Conversation ke saare messages load karta hai, purane se naye order mein.
 * Conversation is user ki na ho toh throw karta hai.
 */
export async function loadChatMessages(
  conversationId: string,
  userId: string
): Promise<ChatMessage[]> {
  const conversation = await getConversation(conversationId, userId);
  if (!conversation) throw new Error("Conversation not found");

  const rows = await db.orm.public.Message.where({ conversationId })
    .orderBy((m) => m.createdAt.asc())
    .all();

  return rows.map((row) => ({
    id: String(row.id),
    role: fromDbRole(row.role),
    content: row.content,
  }));
}

/**
 * Messages ko DB mein save karta hai aur `lastMessageAt` (aur zaroorat par title) update karta hai.
 *
 * - `id` ho toh upsert (usi conversation ke andar), warna naya message banta hai.
 * - System messages skip hote hain (system prompt Conversation pe rehta hai).
 * - Empty content skip hota hai.
 * - Id-less user message agar last stored user message ke identical ho toh dobara save nahi hota
 *   (retry pe duplicate nahi banta).
 */
export async function saveChatMessages(
  conversationId: string,
  userId: string,
  messages: ChatMessageInput[],
  options: SaveChatMessagesOptions = {}
): Promise<void> {
  const { updateTitle = true } = options;

  const conversation = await getConversation(conversationId, userId);
  if (!conversation) throw new Error("Conversation not found");

  const toSave = messages.filter(
    (m) => m.role !== "system" && m.content.trim().length > 0
  );
  if (toSave.length === 0) return;

  // Sequential loop, taaki createdAt order message order ke hisaab se rahe
  for (const message of toSave) {
    const role = ROLE_TO_DB[message.role];

    if (message.id) {
      // Lookup conversationId ke saath hai: dusri conversation ka message overwrite nahi hoga
      const existing = await db.orm.public.Message.where({
        id: message.id,
        conversationId,
      }).first();

      if (existing) {
        await db.orm.public.Message.where({
          id: message.id,
          conversationId,
        }).update({
          content: message.content,
          status: "COMPLETE",
        });
      } else {
        await db.orm.public.Message.create({
          id: message.id,
          conversationId,
          role,
          status: "COMPLETE",
          content: message.content,
        });
      }
      continue;
    }

    if (message.role === "user") {
      const last = await db.orm.public.Message.where({ conversationId })
        .orderBy((m) => m.createdAt.desc())
        .first();

      if (last && last.role === "USER" && last.content === message.content) {
        continue;
      }
    }

    await db.orm.public.Message.create({
      conversationId,
      role,
      status: "COMPLETE",
      content: message.content,
    });
  }

  const firstUser = toSave.find((m) => m.role === "user");
  const isDefaultTitle =
    (conversation.title ?? "").trim().toLowerCase() === DEFAULT_TITLE.toLowerCase();

  await db.orm.public.Conversation.where({ id: conversationId }).update({
    lastMessageAt: new Date().toISOString(),
    ...(updateTitle && isDefaultTitle && firstUser
      ? { title: generateTitle(firstUser.content) }
      : {}),
  });
}

// ---------------------------------------------------------------------------
// LangChain conversion
// ---------------------------------------------------------------------------

/**
 * `ChatMessage[]` ko LangChain messages mein badalta hai.
 * System prompt sabse pehle, history cap hoti hai, aur history hamesha USER message se shuru hoti hai.
 */
export function toLangChainMessages(
  messages: ChatMessage[],
  options: ToLangChainOptions = {}
): BaseMessage[] {
  const { systemPrompt, maxMessages } = options;

  // Conversation.systemPrompt ho toh wahi use hota hai, DB ke SYSTEM messages skip
  // (warna duplicate system messages ban jaate hain)
  const systemMessages = systemPrompt
    ? [new SystemMessage(systemPrompt)]
    : messages
        .filter((m) => m.role === "system")
        .map((m) => new SystemMessage(m.content));

  let turns = messages.filter((m) => m.role !== "system");

  if (maxMessages && turns.length > maxMessages) {
    turns = turns.slice(-maxMessages);
    const firstUser = turns.findIndex((m) => m.role === "user");
    turns = firstUser === -1 ? [] : turns.slice(firstUser);
  }

  return [
    ...systemMessages,
    ...turns.map((m) =>
      m.role === "assistant" ? new AIMessage(m.content) : new HumanMessage(m.content)
    ),
  ];
}