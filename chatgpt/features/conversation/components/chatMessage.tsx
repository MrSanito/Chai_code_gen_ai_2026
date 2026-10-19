"use client";

import * as React from "react";
import { Bot, User } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import type { ChatMessage } from "@/features/ai/actions/chat-store";

export type ChatStatus = "ready" | "submitted" | "streaming" | "error";

export type ChatMessagesProps = {
  messages: ChatMessage[];
  status?: ChatStatus;
};

/**
 * Renders the conversation message list with markdown/plain-text responses and loading indicator.
 */
export function ChatMessages({ messages, status = "ready" }: ChatMessagesProps) {
  const scrollRef = React.useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom whenever messages list or streaming state updates
  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, status]);

  const isWaiting = status === "submitted" && messages.at(-1)?.role === "user";

  return (
    <div
      ref={scrollRef}
      className="flex-1 min-h-0 overflow-y-auto px-4 py-6 md:px-8 space-y-6"
    >
      <div className="mx-auto max-w-3xl space-y-6">
        {messages.map((message) => {
          const isUser = message.role === "user";

          return (
            <div
              key={message.id}
              className={cn(
                "flex items-start gap-3 w-full",
                isUser ? "flex-row-reverse" : "flex-row"
              )}
            >
              <Avatar
                size="sm"
                className={cn(
                  "size-8 shrink-0 border",
                  isUser
                    ? "bg-primary text-primary-foreground border-primary/20"
                    : "bg-muted text-muted-foreground border-border/60"
                )}
              >
                <AvatarFallback className="text-xs">
                  {isUser ? <User className="size-4" /> : <Bot className="size-4" />}
                </AvatarFallback>
              </Avatar>

              <div
                className={cn(
                  "min-w-0 max-w-[85%] sm:max-w-[78%] rounded-2xl px-4 py-3 text-[15px] leading-relaxed break-words",
                  isUser
                    ? "bg-primary text-primary-foreground rounded-tr-sm whitespace-pre-wrap shadow-sm"
                    : "bg-muted/60 text-foreground border border-border/40 rounded-tl-sm whitespace-pre-wrap shadow-xs"
                )}
              >
                {message.content ? (
                  message.content
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-muted-foreground text-sm">
                    <Spinner className="size-3.5 animate-spin" /> Thinking...
                  </span>
                )}
              </div>
            </div>
          );
        })}

        {isWaiting && (
          <div className="flex items-start gap-3 w-full">
            <Avatar size="sm" className="size-8 shrink-0 bg-muted text-muted-foreground border border-border/60">
              <AvatarFallback className="text-xs">
                <Bot className="size-4" />
              </AvatarFallback>
            </Avatar>
            <div className="bg-muted/60 text-muted-foreground border border-border/40 rounded-2xl rounded-tl-sm px-4 py-3 text-sm flex items-center gap-2">
              <Spinner className="size-4 animate-spin text-primary" />
              <span>ChaiGPT is thinking...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}