"use server"

import { revalidatePath } from "next/cache"

import { requireUser } from "@/features/auth/actions/requirer-user"
import type { DefaultModelRow } from "@prisma/orm-postgres/orm-client"
import type { Contract } from "@/src/prisma/contract.d"

import { db } from "@/src/prisma/db"

export type MessageRole = DefaultModelRow<Contract, "Message">["role"]

export type MessageItem = {
  id: string;
  conversationId: string;
  role: MessageRole;
  status: "PENDING" | "COMPLETE" | "ERROR";
  content: string;
  createdAt: Date;
  updatedAt: Date | string;
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

export async function listMessages(conversationId: string) {
  const { userId } = await requireUser();

  await assertOwnsConversation(conversationId, userId);

  const messages = await db.orm.public.Message.where({
    conversationId,
  })
    .orderBy((m) => m.createdAt.asc())
    .all();

  return messages.map((m) => ({
    id: m.id,
    conversationId: m.conversationId,
    role: m.role,
    status: m.status,
    content: m.content,
    createdAt: m.createdAt,
    updatedAt: m.updatedAt,
  }));
}


function generateTitle(content: string): string {
  const clean = content.replace(/\s+/g, " ").trim();
  return clean.length > 30 ? `${clean.slice(0, 30)}...` : clean || "New Chat";
}

export async function createMessage(conversationId: string, content: string) {
  const { userId } = await requireUser();

  const conversation = await assertOwnsConversation(conversationId, userId);
  const trimmed = content.trim();
  if (!trimmed) throw new Error("content must not be empty");

  const message = await db.orm.public.Message.create({
    conversationId: conversation.id,
    role: "USER",
    status: "COMPLETE",
    content: trimmed,
  });

  const shouldRename = conversation.title === `New Chat` || conversation.title.trim().toLowerCase() === `new chat`;
  if (shouldRename) {
    await db.orm.public.Conversation.where({
      id: conversation.id,
    }).update({
      title: generateTitle(trimmed),
    });
  }

  return message;
}


export async function updateMessage(messageId: string, content: string) {
  const { userId } = await requireUser();
  const trimmed = content.trim();

  if (!trimmed) {
    throw new Error("Message cannot be empty");
  }

  const existing = await db.orm.public.Message.where({ id: messageId })
    .include("conversation")
    .first();

  if (!existing || existing.conversation.userId !== userId) {
    throw new Error("Message not found");
  }

  const message = await db.orm.public.Message.where({ id: messageId }).update({
    content: trimmed,
  });

  if (!message) {
    throw new Error("Failed to update message");
  }

  revalidatePath(`/c/${existing.conversationId}`);
  return message;
}

/** Delete a single message. */
export async function deleteMessage(messageId: string) {
  const { userId } = await requireUser();

  const existing = await db.orm.public.Message.where({ id: messageId })
    .include("conversation")
    .first();

  if (!existing || existing.conversation.userId !== userId) {
    throw new Error("Message not found");
  }

  await db.orm.public.Message.where({ id: messageId }).delete();

  revalidatePath(`/c/${existing.conversationId}`);
  return { id: messageId, conversationId: existing.conversationId };
}