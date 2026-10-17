import { AuthenticateWithRedirectCallback } from "@clerk/nextjs";

export default function SSOCallbackPage() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background">
      <AuthenticateWithRedirectCallback />
    </div>
  );
}
