"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/src/prisma/db";
import { redirect } from "next/navigation";

import { onBoardCurrentUser } from "@/lib/user/onboard";

export async function startNewChat() {
  const { userId: clerkId } = await auth();

  if (!clerkId) {
    redirect("/landing");
  }

  let user = await db.orm.public.User.where({
    clerkId,
  }).first();

  if (!user) {
    user = await onBoardCurrentUser();
  }

  if (!user) {
    redirect("/landing");
  }

  // Check if user already has an existing empty "New Chat"
  const existingConvs = await db.orm.public.Conversation.where({
    userId: user.id,
    isArchived: false,
    isPinned: false,
  })
    .orderBy((c) => c.lastMessageAt.desc())
    .all();

  for (const conv of existingConvs) {
    if (conv.title.trim().toLowerCase() === "new chat") {
      const messages = await db.orm.public.Message.where({
        conversationId: conv.id,
      }).all();
      if (messages.length === 0) {
        redirect(`/c/${conv.id}`);
      }
    }
  }

  const conversation = await db.orm.public.Conversation.create({
    userId: user.id,
    title: "New Chat",
  });

  if (!conversation) {
    throw new Error("Conversation not created");
  }

  redirect(`/c/${conversation.id}`);
}