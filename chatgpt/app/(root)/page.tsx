import { connection } from "next/server";
import { startNewChat } from "@/features/home/action/start-new-chat";

export const instant = false;

/**
 * Root page (`/`).
 * Finds or creates a "New Chat" conversation and redirects to `/c/:id`.
 * This page never actually renders — `startNewChat()` always calls `redirect()`.
 */
export default async function Page() {
  await connection();
  await startNewChat();
}