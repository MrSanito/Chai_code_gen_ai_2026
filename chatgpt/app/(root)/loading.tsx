import { ChatSkeleton } from "@/features/conversation/components/chatSkeleton";

/**
 * Root loading boundary for the application shell.
 * Automatically shown while initializing new chats on `/` or navigating within (root).
 */
export default function RootLoading() {
  return <ChatSkeleton />;
}
