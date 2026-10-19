"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createConversation,
  deleteConversation,
  listConversations,
  updateConversation,
} from "../actions/conversation-action";
import { queryKeys } from "../utils/query-keys";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "@/components/ui/toast";

export const useConversations = () => {
  return useQuery({
    queryKey: queryKeys.Conversations.all,
    queryFn: () => listConversations(),
    staleTime: 30 * 1000,
    refetchOnWindowFocus: false,
  });
};

export const useCreateConversation = () => {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (title?: string) => createConversation(title),
    onSuccess: (conversation) => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.Conversations.all,
      });
      router.push(`/c/${conversation.id}`);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Could not create chat");
    },
  });
};

export const useUpdateConversation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      conversationId,
      data,
    }: {
      conversationId: string;
      data: {
        title?: string;
        isPinned?: boolean;
        isArchived?: boolean;
      };
    }) => updateConversation(conversationId, data),
    onSuccess: (conversation) => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.Conversations.all,
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.Conversations.detail(conversation.id),
      });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Could not update chat");
    },
  });
};

export const useDeleteConversation = () => {
  const queryClient = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();

  return useMutation({
    mutationFn: (conversationId: string) => deleteConversation(conversationId),
    onSuccess: (_data, conversationId) => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.Conversations.all,
      });

      if (pathname === `/c/${conversationId}`) {
        router.push("/");
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || "Could not delete chat");
    },
  });
};