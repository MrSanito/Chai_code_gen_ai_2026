import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Bot, User } from "lucide-react";

/**
 * High-fidelity loading skeleton that matches ChatConversationView layout perfectly.
 * Displayed instantly via loading.tsx whenever navigating between chats or creating a new chat.
 */
export function ChatSkeleton() {
  return (
    <div className="flex h-full min-h-0 flex-1 flex-col animate-in fade-in duration-150">
      {/* Scrollable messages skeleton list */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-6 md:px-8 space-y-6">
        <div className="mx-auto max-w-3xl space-y-6">
          {/* User message skeleton (aligned right) */}
          <div className="flex items-start gap-3 w-full flex-row-reverse">
            <div className="size-8 rounded-full bg-primary/20 border border-primary/20 flex items-center justify-center shrink-0">
              <User className="size-4 text-primary/60" />
            </div>
            <div className="flex flex-col items-end gap-1.5 max-w-[85%] sm:max-w-[70%]">
              <div className="rounded-2xl rounded-tr-sm px-4 py-3 bg-primary/10 border border-primary/20 w-44 sm:w-60 space-y-2">
                <Skeleton className="h-3.5 w-full bg-primary/20" />
                <Skeleton className="h-3.5 w-3/4 bg-primary/20" />
              </div>
            </div>
          </div>

          {/* Assistant message skeleton (aligned left) */}
          <div className="flex items-start gap-3 w-full flex-row">
            <div className="size-8 rounded-full bg-muted border border-border/60 flex items-center justify-center shrink-0">
              <Bot className="size-4 text-muted-foreground/60" />
            </div>
            <div className="min-w-0 max-w-[85%] sm:max-w-[78%] rounded-2xl rounded-tl-sm px-4 py-3 bg-muted/50 border border-border/40 flex-1 space-y-2.5">
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-4/6" />
              <div className="pt-1 space-y-2">
                <Skeleton className="h-4 w-11/12" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            </div>
          </div>

          {/* Another short user message skeleton */}
          <div className="flex items-start gap-3 w-full flex-row-reverse">
            <div className="size-8 rounded-full bg-primary/20 border border-primary/20 flex items-center justify-center shrink-0">
              <User className="size-4 text-primary/60" />
            </div>
            <div className="flex flex-col items-end gap-1.5 max-w-[85%] sm:max-w-[70%]">
              <div className="rounded-2xl rounded-tr-sm px-4 py-3 bg-primary/10 border border-primary/20 w-32 sm:w-44 space-y-1.5">
                <Skeleton className="h-3.5 w-full bg-primary/20" />
              </div>
            </div>
          </div>

          {/* Thinking / Streaming placeholder skeleton */}
          <div className="flex items-start gap-3 w-full flex-row">
            <div className="size-8 rounded-full bg-muted border border-border/60 flex items-center justify-center shrink-0">
              <Bot className="size-4 text-muted-foreground/60" />
            </div>
            <div className="bg-muted/50 border border-border/40 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-2">
              <Skeleton className="size-3.5 rounded-full" />
              <Skeleton className="h-3.5 w-24" />
            </div>
          </div>
        </div>
      </div>

      {/* Composer skeleton at the bottom */}
      <div className="mx-auto w-full max-w-3xl px-4 pb-4 md:px-6">
        <div className="h-auto min-h-14 rounded-3xl border border-border/80 bg-background shadow-xs dark:bg-input/40 px-4 py-3.5 flex items-center justify-between">
          <Skeleton className="h-4 w-36 sm:w-48" />
          <Skeleton className="size-9 rounded-full shrink-0" />
        </div>
        <p className="mt-2 text-center text-xs text-muted-foreground select-none">
          ChaiGPT can make mistakes. Check important info.
        </p>
      </div>
    </div>
  );
}

export default ChatSkeleton;
