import { AuthenticateWithRedirectCallback } from "@clerk/nextjs";
import { Loader2 } from "lucide-react";

export default function SSOCallbackPage() {
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background gap-3">
      <Loader2 className="size-6 animate-spin text-primary" />
      <p className="text-xs text-muted-foreground font-medium">Completing authentication...</p>
      <AuthenticateWithRedirectCallback
        signInForceRedirectUrl="/"
        signUpForceRedirectUrl="/"
        signInFallbackRedirectUrl="/"
        signUpFallbackRedirectUrl="/"
        continueSignUpUrl="/register"
      />
    </div>
  );
}
