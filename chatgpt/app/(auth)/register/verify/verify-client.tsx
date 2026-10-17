"use client";

import { Suspense } from "react";
import { useSignUp } from "@clerk/nextjs";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, MailCheck, ShieldAlert, Clock, Laptop, AlertCircle } from "lucide-react";

function VerifySignUpEmailLinkInner() {
  const { signUp } = useSignUp();

  // Not loaded yet — show loading spinner
  if (!signUp) {
    return (
      <div className="relative flex min-h-screen w-full items-center justify-center bg-background px-4 font-sans overflow-hidden">
        <Card className="relative w-full max-w-md border-border bg-card shadow-lg text-card-foreground text-center">
          <CardHeader className="pt-8 pb-6">
            <div className="flex justify-center mb-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
            <CardTitle className="text-xl font-bold">Loading</CardTitle>
            <CardDescription className="text-muted-foreground">
              Connecting to authentication server...
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Safely access verification
  const verification = (signUp?.verifications as any)?.emailLinkVerification;
  const status = verification?.status;
  const errorMessage = verification?.error?.message || verification?.error?.longMessage || null;

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center bg-background px-4 font-sans overflow-hidden">
      <Card className="relative w-full max-w-md border-border bg-card shadow-lg text-card-foreground text-center">
        {/* --- NO ACTIVE VERIFICATION --- */}
        {!status && (
          <>
            <CardHeader className="pt-8 pb-6">
              <div className="flex justify-center mb-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-500">
                  <AlertCircle className="h-7 w-7" />
                </div>
              </div>
              <CardTitle className="text-xl font-bold">No Verification Found</CardTitle>
              <CardDescription className="text-muted-foreground">
                There is no active email verification. Please start a new registration attempt.
              </CardDescription>
            </CardHeader>
            <CardFooter className="px-6 pb-8">
              <Link href="/register" className="w-full">
                <Button className="w-full h-10 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-lg text-sm">
                  Go to Register
                </Button>
              </Link>
            </CardFooter>
          </>
        )}

        {/* --- UNVERIFIED (Waiting) --- */}
        {status === "unverified" && (
          <CardHeader className="pt-8 pb-6">
            <div className="flex justify-center mb-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
            <CardTitle className="text-xl font-bold">Verifying Link</CardTitle>
            <CardDescription className="text-muted-foreground">
              Please wait while we secure your session...
            </CardDescription>
          </CardHeader>
        )}

        {/* --- FAILED --- */}
        {status === "failed" && (
          <>
            <CardHeader className="pt-8 pb-6">
              <div className="flex justify-center mb-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 border border-destructive/20 text-destructive">
                  <ShieldAlert className="h-7 w-7" />
                </div>
              </div>
              <CardTitle className="text-xl font-bold">Verification Failed</CardTitle>
              <CardDescription className="text-muted-foreground">
                {errorMessage || "The email link verification has failed."}
              </CardDescription>
            </CardHeader>
            {errorMessage && (
              <CardContent className="px-6 pb-4">
                <div className="flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive text-left">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{errorMessage}</span>
                </div>
              </CardContent>
            )}
            <CardFooter className="px-6 pb-8">
              <Link href="/register" className="w-full">
                <Button className="w-full h-10 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-lg text-sm">
                  Return to Register
                </Button>
              </Link>
            </CardFooter>
          </>
        )}

        {/* --- EXPIRED --- */}
        {status === "expired" && (
          <>
            <CardHeader className="pt-8 pb-6">
              <div className="flex justify-center mb-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-500">
                  <Clock className="h-7 w-7" />
                </div>
              </div>
              <CardTitle className="text-xl font-bold">Link Expired</CardTitle>
              <CardDescription className="text-muted-foreground">
                This verification link is no longer valid. Please request a new one.
              </CardDescription>
            </CardHeader>
            <CardFooter className="px-6 pb-8">
              <Link href="/register" className="w-full">
                <Button className="w-full h-10 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-lg text-sm">
                  Request New Link
                </Button>
              </Link>
            </CardFooter>
          </>
        )}

        {/* --- CLIENT MISMATCH --- */}
        {status === "client_mismatch" && (
          <>
            <CardHeader className="pt-8 pb-6">
              <div className="flex justify-center mb-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-500">
                  <Laptop className="h-7 w-7" />
                </div>
              </div>
              <CardTitle className="text-xl font-bold">Browser Mismatch</CardTitle>
              <CardDescription className="text-muted-foreground text-sm leading-relaxed px-4">
                You must complete the registration on the same device and browser where you requested the link.
              </CardDescription>
            </CardHeader>
            <CardFooter className="px-6 pb-8">
              <Link href="/register" className="w-full">
                <Button className="w-full h-10 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-lg text-sm">
                  Return to Register
                </Button>
              </Link>
            </CardFooter>
          </>
        )}

        {/* --- VERIFIED (Success) --- */}
        {status === "verified" && (
          <CardHeader className="pt-8 pb-6">
            <div className="flex justify-center mb-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-500/10 border border-green-500/20 text-green-500">
                <MailCheck className="h-7 w-7" />
              </div>
            </div>
            <CardTitle className="text-xl font-bold">Verified Successfully</CardTitle>
            <CardDescription className="text-muted-foreground">
              You can now close this tab and return to your original registration tab.
            </CardDescription>
          </CardHeader>
        )}
      </Card>
    </div>
  );
}

export default function VerifySignUpEmailLink() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen w-full items-center justify-center bg-background px-4">
          <Card className="w-full max-w-md border-border bg-card shadow-lg text-card-foreground text-center">
            <CardHeader className="pt-8 pb-6">
              <div className="flex justify-center mb-4">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
              </div>
              <CardTitle className="text-xl font-bold">Loading</CardTitle>
              <CardDescription className="text-muted-foreground">
                Connecting to authentication server...
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      }
    >
      <VerifySignUpEmailLinkInner />
    </Suspense>
  );
}
