"use client";

import { useEffect } from "react";
import { AuthenticateWithRedirectCallback, useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

/**
 * Custom SSO callback page.
 * Processes Clerk OAuth/SSO redirects from Google and finalizes the session.
 */
export default function SSOCallbackPage() {
  const { isSignedIn, isLoaded } = useAuth();
  const router = useRouter();

  // If already signed in, immediately forward to home
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.replace("/");
    }
  }, [isLoaded, isSignedIn, router]);

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
