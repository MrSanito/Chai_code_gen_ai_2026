import { ChatSkeleton } from "@/features/conversation/components/chatSkeleton";

/**
 * Loading boundary for individual conversation pages (/c/[id]).
 * Next.js displays this immediately when navigating to or between chats,
 * preventing split-second flashes or freezes of previous chat content.
 */
export default function Loading() {
  return <ChatSkeleton />;
}
