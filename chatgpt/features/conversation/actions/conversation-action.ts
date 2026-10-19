"use server"

import { requireUser } from "@/features/auth/actions/requirer-user";
import db from "@/src/prisma/db";
import { revalidatePath } from "next/cache";

export async function listConversations() {
  const user = await requireUser();
  const all = await db.orm.public.Conversation.where({
    userId: user.userId,
    isArchived: false,
  })
    .orderBy((c) => c.lastMessageAt.desc())
    .all();

  // Deduplicate empty "New Chat" conversations so the user never sees 5-10 duplicate empty chats
  const result: typeof all = [];
  let hasKeptEmptyNewChat = false;

  for (const conv of all) {
    const isDefaultTitle = conv.title.trim().toLowerCase() === "new chat";
    if (isDefaultTitle && !conv.isPinned) {
      const messages = await db.orm.public.Message.where({
        conversationId: conv.id,
      }).all();

      if (messages.length === 0) {
        if (!hasKeptEmptyNewChat) {
          // Keep at most ONE most recent empty New Chat
          hasKeptEmptyNewChat = true;
          result.push(conv);
        } else {
          // Automatically clean up duplicate abandoned empty New Chats
          void db.orm.public.Conversation.where({
            id: conv.id,
            userId: user.userId,
          })
            .delete()
            .catch(() => {});
        }
        continue;
      }
    }
    result.push(conv);
  }

  return result;
}

export type ConversationListItem = Awaited<ReturnType<typeof listConversations>>[number];


export async function getConversation(conversationId: string) {
    const user = await requireUser();
    return assertOwnsConversation(conversationId, user.userId)
}

export async function createConversation (title = `New Chat`) { 
    const user = await requireUser();

    // If creating a default "New Chat", reuse an existing empty unpinned one instead of creating duplicates
    if (title.trim().toLowerCase() === "new chat") {
      const existing = await db.orm.public.Conversation.where({
        userId: user.userId,
        isArchived: false,
        isPinned: false,
      })
        .orderBy((c) => c.lastMessageAt.desc())
        .all();

      for (const conv of existing) {
        if (conv.title.trim().toLowerCase() === "new chat") {
          const messages = await db.orm.public.Message.where({
            conversationId: conv.id,
          }).all();
          if (messages.length === 0) {
            return conv;
          }
        }
      }
    }

    const conversation = await db.orm.public.Conversation.create({
        userId: user.userId,
        title: title.trim() || `New Chat`
    });

    if (!conversation){
      throw new Error("Conversation not created");
    }

    return conversation;
}

export async function updateConversation(
  conversationId: string,
  data: {
    title?: string;
    isPinned?: boolean;
    isArchived?: boolean;
  }
) {
  const user = await requireUser();

  await assertOwnsConversation(conversationId, user.userId);

  const updatePayload: {
    title?: string;
    isPinned?: boolean;
    isArchived?: boolean;
  } = {};

  if (data.title !== undefined) {
    updatePayload.title = data.title.trim() || "New Chat";
  }
  if (data.isPinned !== undefined) {
    updatePayload.isPinned = data.isPinned;
  }
  if (data.isArchived !== undefined) {
    updatePayload.isArchived = data.isArchived;
  }

  const conversation = await db.orm.public.Conversation.where({
    id: conversationId,
    userId: user.userId,
  }).update(updatePayload);

  if (!conversation) {
    throw new Error("Failed to update conversation");
  }

  revalidatePath("/");
  revalidatePath(`/c/${conversationId}`);

  return conversation;
}

async function assertOwnsConversation(conversationId: string, userId: string) {
  const conversation = await db.orm.public.Conversation.where({
    id: conversationId,
    userId,
  }).first();

  if (!conversation) {
    throw new Error("conversation not found");
  }
  return conversation;
}

export async function deleteConversation (conversationId : string ) { 
    const user = await requireUser() 
    await assertOwnsConversation(conversationId, user.userId)

    await db.orm.public.Conversation.where({
        userId: user.userId,
        id: conversationId,
    }).delete()

} 