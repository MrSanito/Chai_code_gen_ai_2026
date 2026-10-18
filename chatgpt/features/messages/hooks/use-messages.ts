"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createMessage,
  deleteMessage,
  listMessages,
  updateMessage,
} from "../actions/message-action";
import { queryKeys } from "@/features/conversation/utils/query-keys";
import { toast } from "@/components/ui/toast";

export function useMessages(conversationId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.Messages.byConversation(conversationId ?? "None"),
    queryFn: () => listMessages(conversationId!),
    enabled: !!conversationId,
    staleTime: Infinity,
  });
}

export function useCreateMessage(conversationId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (content: string) => {
      if (!conversationId) {
        throw new Error("Conversation ID is required");
      }
      return createMessage(conversationId, content);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.Messages.byConversation(conversationId ?? "None"),
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.Conversations.all,
      });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to send message");
    },
  });
}

export function useUpdateMessage(conversationId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, content }: { id: string; content: string }) =>
      updateMessage(id, content),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.Messages.byConversation(conversationId ?? "None"),
      });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update message");
    },
  });
}

export function useDeleteMessage(conversationId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteMessage(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.Messages.byConversation(conversationId ?? "None"),
      });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete message");
    },
  });
}