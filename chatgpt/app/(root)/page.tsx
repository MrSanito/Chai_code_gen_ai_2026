import React from "react";
import { connection } from "next/server";
import { startNewChat } from "@/features/home/action/start-new-chat";
import { notFound } from "next/navigation";
import { getConversation } from "@/features/conversation/actions/conversation-action";

export const instant = false;

type conversationPageProps = { 
    params : Promise<{id : string}>;
}

export default async function Page( { params} : conversationPageProps) {

  const { id} = await params;
  await connection();
  await startNewChat();

  try {
    // getConversation(id)
    
  } catch (error) {
    notFound()
    
  }

  // const initialMessages = await loadChatMessages(id)

  return (
    <div>page</div>
  );
}