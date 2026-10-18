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

  const conversation = await db.orm.public.Conversation.create({
    userId: user.id,
    title: "New Chat",
  });

  if (!conversation) {
    throw new Error("Conversation not created");
  }

  redirect(`/c/${conversation.id}`);
}