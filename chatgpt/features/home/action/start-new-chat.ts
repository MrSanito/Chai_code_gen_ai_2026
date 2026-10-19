"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/src/prisma/db";
import { redirect } from "next/navigation";

import { onBoardCurrentUser } from "@/lib/user/onboard";

export async function startNewChat() {
  const { userId: clerkId } = await auth();

  if (!clerkId) {
    console.error("[startNewChat] No clerkId from auth() — redirecting to /landing");
    redirect("/landing");
  }

  let user = await db.orm.public.User.where({
    clerkId,
  }).first();

  if (!user) {
    console.error("[startNewChat] User not in DB, attempting onboard for clerkId:", clerkId);
    try {
      user = await onBoardCurrentUser();
    } catch (err) {
      console.error("[startNewChat] onBoardCurrentUser threw:", err);
    }
  }

  // Fallback: if onBoardCurrentUser returned null (currentUser() was null),
  // fetch via Clerk Backend API using the clerkId we already have
  if (!user) {
    console.error("[startNewChat] onBoardCurrentUser returned null, trying clerkClient fallback for:", clerkId);
    try {
      const { clerkClient } = await import("@clerk/nextjs/server");
      const client = await clerkClient();
      const clerkUser = await client.users.getUser(clerkId);
      if (clerkUser) {
        const { syncUserFromClerk } = await import("@/lib/user/sync-user");
        user = await syncUserFromClerk(clerkUser);
      }
    } catch (err) {
      console.error("[startNewChat] clerkClient fallback failed:", err);
    }
  }

  if (!user) {
    console.error("[startNewChat] All onboard attempts failed for clerkId:", clerkId, "— redirecting to /landing");
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