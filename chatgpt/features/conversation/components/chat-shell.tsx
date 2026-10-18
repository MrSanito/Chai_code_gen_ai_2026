"use client";

import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { LogIn, UserPlus } from "lucide-react";

import { AppSidebar } from "./app-sidebar";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { ModeToggle } from "@/components/ui/mode-toggle";
import CustomUserButton from "@/components/ui/customUserButton";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * App shell with collapsible sidebar, top bar with account/theme controls,
 * and main content area for chat views.
 */
export function ChatShell({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn } = useUser();

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="min-h-svh flex flex-col overflow-hidden">
        {/* Top bar with sidebar toggle, theme toggle, and custom account menu */}
        <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center justify-between border-b bg-background/80 px-4 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
          </div>

          <div className="flex items-center gap-2">
            <ModeToggle />

            <span
              aria-hidden
              className="mx-1 h-4 w-px bg-border"
            />

            {!isLoaded ? (
              <div className="flex items-center gap-2 h-9 px-2.5 rounded-full border border-border/60 bg-card/60 animate-pulse">
                <div className="size-6 rounded-full bg-muted" />
                <div className="w-12 h-2.5 rounded-sm bg-muted hidden sm:block" />
              </div>
            ) : isSignedIn ? (
              <CustomUserButton />
            ) : (
              <div className="flex items-center gap-1.5">
                <Link
                  href="/login"
                  className={cn(
                    buttonVariants({ variant: "ghost", size: "sm" }),
                    "gap-1.5 text-xs font-semibold"
                  )}
                >
                  <LogIn className="size-3.5" />
                  <span className="hidden sm:inline">Log in</span>
                </Link>

                <Link
                  href="/register"
                  className={cn(
                    buttonVariants({ size: "sm" }),
                    "gap-1.5 text-xs font-bold"
                  )}
                >
                  <UserPlus className="size-3.5" />
                  <span>Register</span>
                </Link>
              </div>
            )}
          </div>
        </header>

        <div className="flex-1 flex flex-col min-h-0 overflow-auto">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}