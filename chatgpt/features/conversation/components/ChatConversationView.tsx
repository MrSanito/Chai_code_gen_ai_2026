"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "@/components/ui/toast";
import { queryKeys } from "../utils/query-keys";
import { ChatEmpty } from "./chatEmpty";
import { ChatMessages, type ChatStatus } from "./chatMessage";
import { ChatComposer } from "./chatComposer";
import type { ChatMessage } from "@/features/ai/actions/chat-store";

export type ConversationViewProps = {
  conversationId: string;
  initialMessages: ChatMessage[];
  initialTitle?: string | null;
};

/**
 * Main chat view — message list (or empty state) and composer with real-time streaming.
 * Header is managed by ChatShell to provide a unified single navbar.
 */
export const ChatConversationView = ({
  conversationId,
  initialMessages = [],
}: ConversationViewProps) => {
  const queryClient = useQueryClient();

  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [status, setStatus] = useState<ChatStatus>("ready");
  const abortControllerRef = useRef<AbortController | null>(null);

  // Sync state whenever initialMessages changes (e.g., navigating between chats)
  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

  // Clean up abort controller on unmount
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  const handleSend = useCallback(
    async (content: string) => {
      const trimmed = content.trim();
      if (!trimmed || status !== "ready") return;

      const userMessageId = `user-${Date.now()}`;
      const assistantMessageId = `assistant-${Date.now()}`;

      const userMessage: ChatMessage = {
        id: userMessageId,
        role: "user",
        content: trimmed,
      };

      const placeholderAssistant: ChatMessage = {
        id: assistantMessageId,
        role: "assistant",
        content: "",
      };

      // Optimistically append user message and empty assistant placeholder
      setMessages((prev) => [...prev, userMessage, placeholderAssistant]);
      setStatus("submitted");

      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            conversationId,
            content: trimmed,
          }),
          signal: controller.signal,
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || `HTTP error ${response.status}`);
        }

        if (!response.body) {
          throw new Error("No response body received from server");
        }

        setStatus("streaming");

        const reader = response.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let accumulatedText = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          accumulatedText += chunk;

          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMessageId
                ? { ...msg, content: accumulatedText }
                : msg
            )
          );
        }

        setStatus("ready");

        // Refresh conversation list to pick up auto-generated titles and lastMessageAt
        void queryClient.invalidateQueries({
          queryKey: queryKeys.Conversations.all,
        });
        void queryClient.invalidateQueries({
          queryKey: queryKeys.Messages.byConversation(conversationId),
        });
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === "AbortError") {
          // Request was aborted by user/unmount
          setStatus("ready");
          return;
        }

        console.error("[ChatConversationView] Send error:", err);
        const errorMessage =
          err instanceof Error ? err.message : "Failed to generate reply";
        toast.error(errorMessage);
        setStatus("error");

        // If assistant never produced any output, remove the empty placeholder
        setMessages((prev) =>
          prev.filter(
            (msg) =>
              msg.id !== assistantMessageId || msg.content.trim().length > 0
          )
        );
      } finally {
        abortControllerRef.current = null;
      }
    },
    [conversationId, status, queryClient]
  );

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      {messages.length === 0 ? (
        <ChatEmpty />
      ) : (
        <ChatMessages messages={messages} status={status} />
      )}

      <ChatComposer
        onSend={handleSend}
        isSending={status !== "ready"}
        autoFocus
      />
    </div>
  );
};

export { ChatConversationView as ConversationView };
export default ChatConversationView;