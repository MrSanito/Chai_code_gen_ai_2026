import React from "react";
import { connection } from "next/server";
import { notFound, redirect } from "next/navigation";
import { getConversation, loadChatMessages } from "@/features/ai/actions/chat-store";
import { requireUser } from "@/features/auth/actions/requirer-user";
import { ChatConversationView } from "@/features/conversation/components/ChatConversationView";

export const instant = false;

type ConversationPageProps = {
  params: Promise<{ id: string }>;
};

const Page = async ({ params }: ConversationPageProps) => {
  await connection();
  const { id } = await params;

  let user;
  try {
    user = await requireUser();
  } catch (error) {
    redirect("/login");
  }

  const conversation = await getConversation(id, user.userId);
  if (!conversation) {
    notFound();
  }

  const initialMessages = await loadChatMessages(id, user.userId);

  return (
    <ChatConversationView
      key={id}
      conversationId={id}
      initialTitle={conversation.title}
      initialMessages={initialMessages}
    />
  );
};

export default Page;