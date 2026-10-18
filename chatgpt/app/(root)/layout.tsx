import { onBoardCurrentUser } from "@/lib/user/onboard";
import { auth } from "@clerk/nextjs/server";
import { ChatShell } from "@/features/conversation/components/chat-shell";

const Layout = async ({ children }: { children: React.ReactNode }) => {
  const { userId } = await auth();

  if (userId) {
    await onBoardCurrentUser();
  }

  return <ChatShell>{children}</ChatShell>;
};

export default Layout