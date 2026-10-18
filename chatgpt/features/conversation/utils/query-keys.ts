export const queryKeys = {
    
    Conversations :  {
        all : ["conversations", ]as const, 
        detail : (id : string ) => ["conversations", id]as const,
    },

    Messages :  {
        byConversation : (conversationId : string ) => 
            ["messages", conversationId]as const, 
    }
}