"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/src/prisma/db";

import { redirect } from "next/navigation";

export async function requireUser() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/login");
  }

  const user = await db.orm.public.User.where({
    clerkId: userId,
  }).first();

  if (!user) {
    throw new Error("User not found in the DB");
  }

  return {
    user,
    userId: user.id,
    clerkId: userId,
  };
}
