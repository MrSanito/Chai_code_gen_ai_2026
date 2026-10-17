'use client';

import { useState } from 'react';
import { useUser, useClerk } from '@clerk/nextjs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  User as UserIcon,
  Settings,
  ShieldCheck,
  LogOut,
  ChevronDown,
  GraduationCap,
  Sparkles,
} from 'lucide-react';
import CustomAccountSecurityModal, {
  AccountModalTab,
} from '@/components/ui/customAccountSecurityModal';
import { cn } from '@/lib/utils';

interface SafeAvatarProps {
  src?: string | null;
  hasCustomImage?: boolean;
  alt: string;
  initials: string;
  className?: string;
  sizeClass?: string;
}

function SafeAvatar({
  src,
  hasCustomImage = false,
  alt,
  initials,
  className,
  sizeClass = 'size-7',
}: SafeAvatarProps) {
  const [hasError, setHasError] = useState(false);

  // If user actually has an uploaded photo and it loads without error
  const shouldUsePhoto = hasCustomImage && src && !src.includes('default') && !hasError;

  if (shouldUsePhoto) {
    return (
      <div className={cn('relative shrink-0 rounded-full overflow-hidden bg-[#e2e8f0] dark:bg-slate-800', sizeClass, className)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          referrerPolicy="no-referrer"
          crossOrigin="anonymous"
          loading="eager"
          onError={() => setHasError(true)}
          className="size-full object-cover rounded-full"
        />
      </div>
    );
  }

  // High-contrast vibrant MSU Sathi monogram gradient
  return (
    <div
      className={cn(
        'relative shrink-0 flex items-center justify-center rounded-full select-none font-bold uppercase tracking-wider text-white shadow-xs',
        'bg-gradient-to-br from-[#141c45] via-[#2340c4] to-[#1e3a8a] dark:from-[#2340c4] dark:to-[#4338ca]',
        'ring-1 ring-white/20',
        sizeClass,
        className
      )}
      aria-label={alt}
    >
      <span className="text-[11px] font-black leading-none drop-shadow-sm text-white">
        {initials}
      </span>
    </div>
  );
}

export default function CustomUserButton() {
  const { isLoaded, isSignedIn, user } = useUser();
  const { signOut } = useClerk();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState<AccountModalTab>('profile');

  const handleOpenModal = (tab: AccountModalTab) => {
    setModalTab(tab);
    setIsModalOpen(true);
  };

  // Loading skeleton matching exact height and style
  if (!isLoaded) {
    return (
      <div className="flex items-center gap-2 h-9 px-2 rounded-full border border-[#cdd6ec]/60 dark:border-border/40 bg-[#fbfcff]/60 dark:bg-[#111827]/60 animate-pulse">
        <div className="size-6 rounded-full bg-[#141c45]/15 dark:bg-white/10" />
        <div className="w-14 h-3 rounded bg-[#141c45]/10 dark:bg-white/10 hidden sm:block" />
      </div>
    );
  }

  // Not signed in
  if (!isSignedIn || !user) return null;

  const initials =
    ((user.firstName?.[0] || '') + (user.lastName?.[0] || '')).toUpperCase() ||
    user.primaryEmailAddress?.emailAddress?.[0]?.toUpperCase() ||
    'U';

  const firstName = user.firstName || user.fullName?.split(' ')[0] || '';
  const displayName =
    user.fullName ||
    user.firstName ||
    user.username ||
    user.primaryEmailAddress?.emailAddress?.split('@')[0] ||
    'Student';

  const email = user.primaryEmailAddress?.emailAddress;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          data-slot="dropdown-menu-trigger"
          className={cn(
            'group relative flex items-center gap-2 h-9 p-0.5 sm:pr-2.5 rounded-full transition-all duration-200 outline-none select-none cursor-pointer',
            // Border & Background tuned to MSU Sathi paper/sheet palette
            'border border-[#cdd6ec] hover:border-[#2340c4]/50 hover:bg-white',
            'bg-[#fbfcff]/95 dark:bg-[#111827]/95 dark:border-border/80 dark:hover:border-blue-400/50 dark:hover:bg-[#161f30]',
            // Focus ring
            'focus-visible:ring-2 focus-visible:ring-[#2340c4]/40 focus-visible:border-[#2340c4]',
            // Shadows
            'shadow-[0_1px_3px_rgba(20,28,69,0.06)] hover:shadow-[0_3px_10px_rgba(20,28,69,0.1)] dark:shadow-none'
          )}
        >
          {/* Avatar with live status dot */}
          <div className="relative shrink-0">
            <SafeAvatar
              src={user.imageUrl}
              hasCustomImage={user.hasImage}
              alt={displayName}
              initials={initials}
              sizeClass="size-7"
              className="ring-1 ring-[#cdd6ec]/80 dark:ring-border group-hover:scale-105 transition-transform duration-200"
            />
            {/* Emerald active indicator */}
            <span
              className="absolute -bottom-0.5 -right-0.5 size-2 rounded-full bg-emerald-500 ring-2 ring-[#fbfcff] dark:ring-[#111827]"
              title="Active session"
            />
          </div>

          {/* User Name (hidden on small mobile screens to keep a perfect circle) */}
          <span className="text-xs font-semibold text-[#141c45] dark:text-[#f1f5f9] tracking-tight max-w-[100px] truncate hidden sm:inline-block">
            {firstName || displayName}
          </span>

          {/* Smooth chevron indicator */}
          <ChevronDown className="size-3 text-[#4b5679] dark:text-muted-foreground group-hover:text-[#141c45] dark:group-hover:text-foreground transition-transform duration-200 group-data-[state=open]:rotate-180 hidden sm:inline-block" />
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="end"
          sideOffset={8}
          className="w-72 p-0 overflow-hidden rounded-2xl border border-[#cdd6ec] dark:border-border/80 bg-[#fbfcff]/98 dark:bg-[#0b0f19]/98 shadow-[0_12px_40px_-12px_rgba(20,28,69,0.25)] dark:shadow-[0_12px_40px_-12px_rgba(0,0,0,0.8)] backdrop-blur-xl"
        >
          {/* Decorative Header Banner */}
          <div className="h-14 bg-gradient-to-r from-[#141c45] via-[#2340c4] to-[#d6402f] relative p-3 flex items-start justify-end">
            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-white/90 bg-black/20 backdrop-blur-xs px-2 py-0.5 rounded-full border border-white/20">
              <Sparkles className="size-2.5" />
              MSU Sathi
            </span>
          </div>

          {/* User Profile Card */}
          <div className="px-4 pb-3.5 pt-0">
            <div className="flex items-end justify-between -mt-7 mb-2.5">
              <div className="relative">
                <SafeAvatar
                  src={user.imageUrl}
                  hasCustomImage={user.hasImage}
                  alt={displayName}
                  initials={initials}
                  sizeClass="size-13"
                  className="ring-4 ring-[#fbfcff] dark:ring-[#0b0f19] shadow-md"
                />
                <span className="absolute bottom-0 right-0 size-3 rounded-full bg-emerald-500 ring-2 ring-[#fbfcff] dark:ring-[#0b0f19]" />
              </div>

              <button
                type="button"
                onClick={() => handleOpenModal('profile')}
                className="text-[11px] font-bold text-[#2340c4] dark:text-blue-400 hover:text-[#141c45] dark:hover:text-blue-300 hover:underline cursor-pointer transition-colors"
              >
                Edit profile
              </button>
            </div>

            <div className="space-y-0.5">
              <div className="font-bold text-sm text-[#141c45] dark:text-[#f1f5f9] truncate">
                {displayName}
              </div>
              {email && (
                <div className="text-xs text-[#4b5679] dark:text-muted-foreground truncate font-normal">
                  {email}
                </div>
              )}
            </div>

            {/* Badges */}
            <div className="mt-2.5 flex items-center gap-1.5 flex-wrap">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#2340c4]/10 text-[#2340c4] dark:bg-blue-400/15 dark:text-blue-300 border border-[#2340c4]/20">
                <GraduationCap className="size-3" />
                MSU Student
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-[#141c45]/5 text-[#4b5679] dark:bg-white/5 dark:text-muted-foreground">
                Verified
              </span>
            </div>
          </div>

          <DropdownMenuSeparator className="my-0 bg-[#cdd6ec]/60 dark:bg-border/60" />

          {/* Menu Navigation Items */}
          <DropdownMenuGroup className="p-1.5 space-y-0.5">
            <DropdownMenuItem
              onClick={() => handleOpenModal('profile')}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-[#141c45] dark:text-[#f1f5f9] hover:bg-[#141c45]/5 dark:hover:bg-white/5 cursor-pointer transition-colors"
            >
              <UserIcon className="size-4 text-[#2340c4] dark:text-blue-400" />
              <span>Manage profile & account</span>
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={() => handleOpenModal('security')}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-[#141c45] dark:text-[#f1f5f9] hover:bg-[#141c45]/5 dark:hover:bg-white/5 cursor-pointer transition-colors"
            >
              <ShieldCheck className="size-4 text-[#2340c4] dark:text-blue-400" />
              <span>Password & security</span>
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={() => handleOpenModal('preferences')}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-[#141c45] dark:text-[#f1f5f9] hover:bg-[#141c45]/5 dark:hover:bg-white/5 cursor-pointer transition-colors"
            >
              <Settings className="size-4 text-[#4b5679] dark:text-muted-foreground" />
              <span>Settings & preferences</span>
            </DropdownMenuItem>
          </DropdownMenuGroup>

          <DropdownMenuSeparator className="my-0 bg-[#cdd6ec]/60 dark:bg-border/60" />

          {/* Sign Out Item */}
          <div className="p-1.5">
            <DropdownMenuItem
              onClick={() => signOut({ redirectUrl: '/' })}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-[#d6402f] dark:text-red-400 hover:bg-[#d6402f]/10 dark:hover:bg-red-500/15 focus:bg-[#d6402f]/10 cursor-pointer transition-colors"
            >
              <LogOut className="size-4" />
              <span>Sign out of MSU Sathi</span>
            </DropdownMenuItem>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Account & Security Modal */}
      <CustomAccountSecurityModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        defaultTab={modalTab}
      />
    </>
  );
}
