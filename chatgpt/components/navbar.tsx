'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { buttonVariants } from '@/components/ui/button';
import { ModeToggle } from '@/components/ui/mode-toggle';
import CustomUserButton from '@/components/ui/customUserButton';
import {
  BookOpen,
  HelpCircle,
  GraduationCap,
  LogIn,
  UserPlus,
  Menu,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Navbar() {
  const { isLoaded, isSignedIn } = useUser();
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <header
      className={cn(
        'sticky top-0 z-40 w-full border-b backdrop-blur-md transition-all duration-200',
        'bg-[#f4f6fb]/90 dark:bg-[#0b0f19]/90',
        scrolled
          ? 'border-[#cdd6ec] dark:border-border/80 shadow-[0_4px_20px_-8px_rgba(20,28,69,0.12)] dark:shadow-[0_4px_20px_-8px_rgba(0,0,0,0.6)]'
          : 'border-[#cdd6ec]/60 dark:border-border/40'
      )}
    >
      {/* Red margin brand hairline accent on the bottom border */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#d6402f]/45 to-transparent"
      />

      <div className="mx-auto flex h-14 max-w-[1120px] items-center justify-between px-5">
        {/* Left: Brand + Desktop nav */}
        <div className="flex items-center gap-7">
          <Link
            href="/"
            className="group flex items-center gap-2.5 font-extrabold text-[1.25rem] tracking-tight text-[#141c45] dark:text-foreground transition-opacity hover:opacity-90"
          >
            {/* The signature red margin bar */}
            <span
              className="h-5 w-[3px] rounded-full bg-[#d6402f] transition-transform duration-200 group-hover:scale-y-110"
              aria-hidden="true"
            />
            <span className="flex items-center gap-1.5">
              <span>MSU</span>
              <span className="text-[#2340c4] dark:text-blue-400">Sathi</span>
            </span>
            <span className="ml-1 rounded-full border border-[#e2a91b]/50 bg-[#e2a91b]/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#5b3d00] dark:bg-amber-400/15 dark:text-amber-300">
              Beta
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden items-center gap-1 sm:flex" aria-label="Main navigation">
            <Link
              href="/#exam"
              className={cn(
                'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold text-[#4b5679] dark:text-muted-foreground transition-colors hover:bg-[#141c45]/5 hover:text-[#141c45] dark:hover:bg-white/5 dark:hover:text-foreground'
              )}
            >
              <BookOpen className="size-3.5 opacity-70" />
              Exam practice
            </Link>

            <Link
              href="/#beta"
              className={cn(
                'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold text-[#4b5679] dark:text-muted-foreground transition-colors hover:bg-[#141c45]/5 hover:text-[#141c45] dark:hover:bg-white/5 dark:hover:text-foreground'
              )}
            >
              <HelpCircle className="size-3.5 opacity-70" />
              About the beta
            </Link>

            <Link
              href="/#campus"
              className={cn(
                'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold text-[#4b5679] dark:text-muted-foreground transition-colors hover:bg-[#141c45]/5 hover:text-[#141c45] dark:hover:bg-white/5 dark:hover:text-foreground'
              )}
            >
              <GraduationCap className="size-3.5 opacity-70" />
              About MSU
            </Link>
          </nav>
        </div>

        {/* Right: Theme toggle + Auth + Mobile toggle */}
        <div className="flex items-center gap-2">
          <ModeToggle />

          <span aria-hidden className="mx-1 h-4 w-px bg-[#cdd6ec] dark:bg-border" />

          {!isLoaded ? (
            <div className="flex items-center gap-2 h-9 px-2.5 rounded-full border border-[#cdd6ec]/60 dark:border-border/60 bg-[#fbfcff]/60 dark:bg-[#111827]/60 animate-pulse">
              <div className="size-6 rounded-full bg-[#141c45]/20 dark:bg-white/20" />
              <div className="w-12 h-2.5 rounded-sm bg-[#141c45]/15 dark:bg-white/15 hidden sm:block" />
            </div>
          ) : isSignedIn ? (
            <CustomUserButton />
          ) : (
            <div className="flex items-center gap-1.5">
              <Link
                href="/login"
                className={cn(
                  buttonVariants({ variant: 'ghost', size: 'sm' }),
                  'cursor-pointer gap-1.5 rounded-md px-3 text-xs font-semibold text-[#141c45] dark:text-foreground hover:bg-[#141c45]/5 dark:hover:bg-accent'
                )}
              >
                <LogIn className="size-3.5" />
                <span className="hidden sm:inline">Log in</span>
              </Link>

              <Link
                href="/register"
                className={cn(
                  'inline-flex items-center justify-center gap-1.5 rounded-md px-3.5 py-1.5 text-xs font-bold transition-all shadow-xs cursor-pointer',
                  'bg-[#141c45] text-[#f4f6fb] hover:bg-[#2340c4] border-2 border-[#141c45] hover:border-[#2340c4]',
                  'dark:bg-primary dark:text-primary-foreground dark:border-primary dark:hover:bg-primary/90'
                )}
              >
                <UserPlus className="size-3.5" />
                <span>Register</span>
              </Link>
            </div>
          )}

          {/* Mobile hamburger button */}
          <button
            type="button"
            onClick={() => setMobileOpen(!mobileOpen)}
            className="flex sm:hidden p-1.5 rounded-md text-[#4b5679] hover:text-[#141c45] dark:text-muted-foreground dark:hover:text-foreground hover:bg-[#141c45]/5 dark:hover:bg-accent/50 transition-colors"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {/* Mobile navigation drawer */}
      {mobileOpen && (
        <div className="border-t border-[#cdd6ec]/80 dark:border-border/60 bg-[#f4f6fb]/98 dark:bg-[#0b0f19]/98 px-5 py-3 sm:hidden shadow-lg animate-in slide-in-from-top-2 duration-150">
          <nav className="flex flex-col gap-1">
            <Link
              href="/#exam"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold text-[#141c45] dark:text-foreground hover:bg-[#141c45]/5 dark:hover:bg-accent/60 transition-colors"
            >
              <BookOpen className="size-4 text-[#2340c4] dark:text-blue-400" />
              Exam practice
            </Link>
            <Link
              href="/#beta"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold text-[#141c45] dark:text-foreground hover:bg-[#141c45]/5 dark:hover:bg-accent/60 transition-colors"
            >
              <HelpCircle className="size-4 text-[#2340c4] dark:text-blue-400" />
              About the beta
            </Link>
            <Link
              href="/#campus"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold text-[#141c45] dark:text-foreground hover:bg-[#141c45]/5 dark:hover:bg-accent/60 transition-colors"
            >
              <GraduationCap className="size-4 text-[#2340c4] dark:text-blue-400" />
              About MSU
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}