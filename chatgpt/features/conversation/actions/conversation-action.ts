"use server"

import { requireUser } from "@/features/auth/actions/requirer-user";
import db from "@/src/prisma/db";
import { revalidatePath } from "next/cache";

export async function listConversations() {
  const user = await requireUser();
  return await db.orm.public.Conversation.where({
    userId: user.userId,
    isArchived: false,
  }).all();
}

export type ConversationListItem = Awaited<ReturnType<typeof listConversations>>[number];

export async function createConversation (title = `New Chat`) { 
    const user = await requireUser()

     const conversation = await db.orm.public.Conversation.create({
        userId: user.userId,
        title : title.trim()  || `new chat`

         
    })

    if (!conversation){
      throw new Error("Conversation not created")
    }

 
    return conversation

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