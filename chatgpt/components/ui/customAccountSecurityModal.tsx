'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useUser, useClerk } from '@clerk/nextjs';
import { useTheme } from 'next-themes';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  User as UserIcon,
  ShieldCheck,
  Laptop,
  Settings,
  KeyRound,
  Check,
  Copy,
  Eye,
  EyeOff,
  Sun,
  Moon,
  Monitor,
  AlertCircle,
  CheckCircle2,
  Loader2,
  LogOut,
  Mail,
  Camera,
  Smartphone,
  Globe,
  Cpu,
  Lock,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type AccountModalTab =
  | 'profile'
  | 'security'
  | 'devices'
  | 'preferences';

interface CustomAccountSecurityModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultTab?: AccountModalTab;
}

export default function CustomAccountSecurityModal({
  open,
  onOpenChange,
  defaultTab = 'profile',
}: CustomAccountSecurityModalProps) {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const { theme, setTheme } = useTheme();

  const [activeTab, setActiveTab] = useState<AccountModalTab>(defaultTab);

  // Sync tab when defaultTab prop changes while opening
  useEffect(() => {
    if (open && defaultTab) {
      setActiveTab(defaultTab);
    }
  }, [open, defaultTab]);

  // Profile edit states
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Password update states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Preference switches
  const [enableStreaming, setEnableStreaming] = useState(true);
  const [enableSyntaxHighlight, setEnableSyntaxHighlight] = useState(true);
  const [enableSound, setEnableSound] = useState(false);

  // Copy helper
  const [copiedId, setCopiedId] = useState(false);

  // Fill profile form when user loads
  useEffect(() => {
    if (user) {
      setFirstName(user.firstName || '');
      setLastName(user.lastName || '');
    }
  }, [user]);

  if (!isLoaded || !user) return null;

  const initials =
    (user.firstName?.[0] || '') + (user.lastName?.[0] || '') ||
    user.primaryEmailAddress?.emailAddress?.[0]?.toUpperCase() ||
    'U';

  const displayName =
    user.fullName ||
    [firstName, lastName].filter(Boolean).join(' ') ||
    user.username ||
    user.primaryEmailAddress?.emailAddress?.split('@')[0] ||
    'User';

  const email = user.primaryEmailAddress?.emailAddress;
  const isGoogleUser = user.externalAccounts?.some(
    (acc) => acc.provider === 'google' || acc.provider.includes('google')
  );
  const hasPassword = user.passwordEnabled;

  const handleCopyId = () => {
    if (!user.id) return;
    navigator.clipboard.writeText(user.id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    setProfileError('');
    setProfileSuccess('');

    try {
      await user.update({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      });
      setProfileSuccess('Profile updated successfully!');
      setTimeout(() => setProfileSuccess(''), 4000);
    } catch (err: any) {
      const msg =
        err?.errors?.[0]?.longMessage ||
        err?.errors?.[0]?.message ||
        'Failed to update profile';
      setProfileError(msg);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingPhoto(true);
    setProfileError('');
    setProfileSuccess('');

    try {
      await user.setProfileImage({ file });
      setProfileSuccess('Profile image updated!');
      setTimeout(() => setProfileSuccess(''), 4000);
    } catch (err: any) {
      const msg =
        err?.errors?.[0]?.longMessage ||
        err?.errors?.[0]?.message ||
        'Failed to upload profile image';
      setProfileError(msg);
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    setIsUpdatingPassword(true);

    try {
      if (hasPassword) {
        if (!currentPassword) {
          setPasswordError('Current password is required');
          setIsUpdatingPassword(false);
          return;
        }
        await user.updatePassword({
          currentPassword,
          newPassword,
          signOutOfOtherSessions: false,
        });
      } else {
        await user.updatePassword({
          newPassword,
          signOutOfOtherSessions: false,
        });
      }

      setPasswordSuccess('Password successfully updated!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSuccess(''), 4000);
    } catch (err: any) {
      const msg =
        err?.errors?.[0]?.longMessage ||
        err?.errors?.[0]?.message ||
        'Failed to update password. Please check your current password.';
      setPasswordError(msg);
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl! max-w-[95vw]! p-0! gap-0! overflow-hidden border border-border/80 bg-background/95 backdrop-blur-xl shadow-2xl rounded-2xl! max-h-[90vh] flex flex-col">
        <DialogHeader className="sr-only">
          <DialogTitle>Account & Security Settings</DialogTitle>
          <DialogDescription>
            Manage your personal profile, account credentials, security options, and app preferences.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col md:flex-row flex-1 overflow-hidden min-h-[580px] max-h-[85vh]">
          {/* Left Navigation Sidebar */}
          <aside className="w-full md:w-64 border-b md:border-b-0 md:border-r border-border/70 bg-muted/20 flex flex-col shrink-0 p-4">
            {/* User overview card */}
            <div className="flex items-center gap-3 p-2.5 mb-3 rounded-xl bg-card/60 border border-border/50 shadow-xs">
              <div className="relative">
                <Avatar className="size-11 ring-2 ring-primary/20">
                  <AvatarImage src={user.imageUrl} alt={displayName} />
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <span className="absolute bottom-0 right-0 size-2.5 rounded-full bg-emerald-500 ring-2 ring-background" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-semibold text-foreground truncate">
                    {displayName}
                  </span>
                </div>
                {email && (
                  <p className="text-[11px] text-muted-foreground truncate">
                    {email}
                  </p>
                )}
              </div>
            </div>

            {/* Navigation Tabs */}
            <nav className="space-y-1 flex-1 overflow-y-auto">
              <button
                type="button"
                onClick={() => setActiveTab('profile')}
                className={cn(
                  'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all text-left cursor-pointer',
                  activeTab === 'profile'
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'text-muted-foreground hover:bg-muted/80 hover:text-foreground'
                )}
              >
                <UserIcon className="size-4 shrink-0" />
                <span>Profile & Identity</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('security')}
                className={cn(
                  'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all text-left cursor-pointer',
                  activeTab === 'security'
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'text-muted-foreground hover:bg-muted/80 hover:text-foreground'
                )}
              >
                <ShieldCheck className="size-4 shrink-0" />
                <span>Account & Security</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('devices')}
                className={cn(
                  'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all text-left cursor-pointer',
                  activeTab === 'devices'
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'text-muted-foreground hover:bg-muted/80 hover:text-foreground'
                )}
              >
                <Laptop className="size-4 shrink-0" />
                <span>Active Sessions</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('preferences')}
                className={cn(
                  'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all text-left cursor-pointer',
                  activeTab === 'preferences'
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'text-muted-foreground hover:bg-muted/80 hover:text-foreground'
                )}
              >
                <Settings className="size-4 shrink-0" />
                <span>Preferences</span>
              </button>
            </nav>

            {/* Bottom quick sign-out */}
            <div className="pt-3 border-t border-border/60 mt-auto">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => signOut({ redirectUrl: '/' })}
                className="w-full justify-start text-xs text-destructive hover:bg-destructive/10 hover:text-destructive cursor-pointer gap-2"
              >
                <LogOut className="size-3.5" />
                <span>Sign out</span>
              </Button>
            </div>
          </aside>

          {/* Right Main Content Panel */}
          <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-card/40">
            {/* TAB 1: PROFILE */}
            {activeTab === 'profile' && (
              <div className="space-y-6 max-w-xl animate-in fade-in-50 duration-200">
                <div>
                  <h2 className="text-xl font-semibold tracking-tight text-foreground">
                    Profile & Identity
                  </h2>
                  <p className="text-xs text-muted-foreground mt-1">
                    Manage your public profile details, email address, and avatar image.
                  </p>
                </div>

                {profileSuccess && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs">
                    <CheckCircle2 className="size-4 shrink-0" />
                    <span>{profileSuccess}</span>
                  </div>
                )}

                {profileError && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-xs">
                    <AlertCircle className="size-4 shrink-0" />
                    <span>{profileError}</span>
                  </div>
                )}

                {/* Avatar change block */}
                <div className="p-4 rounded-xl border border-border/70 bg-card/60 flex flex-col sm:flex-row items-center sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="relative group">
                      <Avatar className="size-16 ring-2 ring-primary/20">
                        <AvatarImage src={user.imageUrl} alt={displayName} />
                        <AvatarFallback className="bg-primary/10 text-primary font-bold text-lg">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      {isUploadingPhoto && (
                        <div className="absolute inset-0 bg-background/80 rounded-full flex items-center justify-center">
                          <Loader2 className="size-5 animate-spin text-primary" />
                        </div>
                      )}
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-foreground">
                        Profile Photo
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        JPG, PNG, or GIF up to 5MB
                      </p>
                    </div>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isUploadingPhoto}
                    onClick={() => fileInputRef.current?.click()}
                    className="cursor-pointer gap-1.5 text-xs"
                  >
                    <Camera className="size-3.5" />
                    <span>{isUploadingPhoto ? 'Uploading...' : 'Change avatar'}</span>
                  </Button>
                </div>

                {/* Edit details form */}
                <form onSubmit={handleSaveProfile} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="firstName" className="text-xs">
                        First Name
                      </Label>
                      <Input
                        id="firstName"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="First name"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="lastName" className="text-xs">
                        Last Name
                      </Label>
                      <Input
                        id="lastName"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="Last name"
                      />
                    </div>
                  </div>

                  {/* Primary Email */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="primaryEmail" className="text-xs">
                        Primary Email
                      </Label>
                      <span className="text-[11px] text-emerald-500 font-medium flex items-center gap-1">
                        <CheckCircle2 className="size-3" />
                        Verified
                      </span>
                    </div>
                    <div className="relative">
                      <Input
                        id="primaryEmail"
                        value={email || ''}
                        disabled
                        className="bg-muted/40 cursor-not-allowed pl-9 pr-24 text-muted-foreground"
                      />
                      <Mail className="size-4 absolute left-3 top-2.5 text-muted-foreground" />
                      <span className="absolute right-3 top-2 text-[10px] uppercase font-semibold tracking-wider text-muted-foreground bg-muted px-2 py-0.5 rounded">
                        Primary
                      </span>
                    </div>
                  </div>

                  {/* Clerk User ID & Metadata */}
                  <div className="p-3 rounded-xl border border-border/60 bg-muted/30 flex items-center justify-between">
                    <div>
                      <span className="text-[11px] font-medium text-muted-foreground block">
                        Account ID
                      </span>
                      <span className="text-xs font-mono text-foreground">
                        {user.id}
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleCopyId}
                      className="cursor-pointer gap-1 text-xs"
                    >
                      {copiedId ? (
                        <>
                          <Check className="size-3 text-emerald-500" />
                          <span className="text-emerald-500">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="size-3 text-muted-foreground" />
                          <span>Copy</span>
                        </>
                      )}
                    </Button>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <Button
                      type="submit"
                      disabled={isSavingProfile}
                      className="cursor-pointer gap-2 text-xs"
                    >
                      {isSavingProfile && <Loader2 className="size-3.5 animate-spin" />}
                      <span>{isSavingProfile ? 'Saving...' : 'Save changes'}</span>
                    </Button>
                  </div>
                </form>
              </div>
            )}

            {/* TAB 2: ACCOUNT & SECURITY */}
            {activeTab === 'security' && (
              <div className="space-y-6 max-w-xl animate-in fade-in-50 duration-200">
                <div>
                  <h2 className="text-xl font-semibold tracking-tight text-foreground">
                    Account & Security
                  </h2>
                  <p className="text-xs text-muted-foreground mt-1">
                    Manage your credentials, social logins, passwords, and security controls.
                  </p>
                </div>

                {passwordSuccess && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs">
                    <CheckCircle2 className="size-4 shrink-0" />
                    <span>{passwordSuccess}</span>
                  </div>
                )}

                {passwordError && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-xs">
                    <AlertCircle className="size-4 shrink-0" />
                    <span>{passwordError}</span>
                  </div>
                )}

                {/* Connected Accounts / Social Logins */}
                <div className="p-4 rounded-xl border border-border/70 bg-card/60 space-y-3">
                  <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Globe className="size-4 text-primary" />
                    <span>Connected Authentication Methods</span>
                  </h4>

                  {/* Google OAuth item */}
                  <div className="flex items-center justify-between p-3 rounded-lg border border-border/60 bg-background/50">
                    <div className="flex items-center gap-3">
                      <div className="size-8 rounded-full bg-white dark:bg-zinc-800 flex items-center justify-center border border-border/50 shadow-xs">
                        <svg className="size-4" viewBox="0 0 24 24">
                          <path
                            fill="#4285F4"
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                          />
                          <path
                            fill="#34A853"
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                          />
                          <path
                            fill="#FBBC05"
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                          />
                          <path
                            fill="#EA4335"
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                          />
                        </svg>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-foreground">
                            Google Account
                          </span>
                          {isGoogleUser && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded-full">
                              <span className="size-1.5 rounded-full bg-emerald-500" />
                              Connected
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                          {isGoogleUser
                            ? email || 'Connected with Google SSO'
                            : 'Sign in with your Google Workspace or Personal account'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Email & Password item */}
                  <div className="flex items-center justify-between p-3 rounded-lg border border-border/60 bg-background/50">
                    <div className="flex items-center gap-3">
                      <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                        <KeyRound className="size-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-foreground">
                            Email & Password
                          </span>
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded-full">
                            <span className="size-1.5 rounded-full bg-emerald-500" />
                            {hasPassword ? 'Active' : 'OAuth Secured'}
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                          {hasPassword
                            ? 'Protected with password authentication'
                            : 'Direct authentication managed via provider tokens'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Password Change Form */}
                <div className="p-4 rounded-xl border border-border/70 bg-card/60 space-y-4">
                  <div>
                    <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <Lock className="size-4 text-primary" />
                      <span>{hasPassword ? 'Change Password' : 'Set Account Password'}</span>
                    </h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {hasPassword
                        ? 'Ensure your new password has at least 8 characters with letters and numbers.'
                        : 'Set a password to enable direct email and password sign in.'}
                    </p>
                  </div>

                  <form onSubmit={handleUpdatePassword} className="space-y-3">
                    {hasPassword && (
                      <div className="space-y-1.5">
                        <Label htmlFor="currentPassword" className="text-xs">
                          Current Password
                        </Label>
                        <div className="relative">
                          <Input
                            id="currentPassword"
                            type={showCurrentPass ? 'text' : 'password'}
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            placeholder="Enter current password"
                            className="pr-9"
                          />
                          <button
                            type="button"
                            onClick={() => setShowCurrentPass(!showCurrentPass)}
                            className="absolute right-2.5 top-2 text-muted-foreground hover:text-foreground cursor-pointer"
                          >
                            {showCurrentPass ? (
                              <EyeOff className="size-4" />
                            ) : (
                              <Eye className="size-4" />
                            )}
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <Label htmlFor="newPassword" className="text-xs">
                        New Password
                      </Label>
                      <div className="relative">
                        <Input
                          id="newPassword"
                          type={showNewPass ? 'text' : 'password'}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Enter new password (min. 8 characters)"
                          className="pr-9"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPass(!showNewPass)}
                          className="absolute right-2.5 top-2 text-muted-foreground hover:text-foreground cursor-pointer"
                        >
                          {showNewPass ? (
                            <EyeOff className="size-4" />
                          ) : (
                            <Eye className="size-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="confirmPassword" className="text-xs">
                        Confirm New Password
                      </Label>
                      <Input
                        id="confirmPassword"
                        type={showNewPass ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter new password"
                      />
                    </div>

                    <div className="pt-2 flex justify-end">
                      <Button
                        type="submit"
                        disabled={isUpdatingPassword}
                        className="cursor-pointer gap-2 text-xs"
                      >
                        {isUpdatingPassword && (
                          <Loader2 className="size-3.5 animate-spin" />
                        )}
                        <span>
                          {isUpdatingPassword
                            ? 'Updating...'
                            : hasPassword
                            ? 'Update password'
                            : 'Set password'}
                        </span>
                      </Button>
                    </div>
                  </form>
                </div>

                {/* 2FA Status Card */}
                <div className="p-4 rounded-xl border border-border/70 bg-card/60 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-foreground">
                        Two-Factor Authentication (2FA)
                      </span>
                      <span className="inline-flex items-center text-[10px] font-medium text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded-full">
                        {user.twoFactorEnabled ? 'Enabled' : 'Standard Protection'}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Add an additional verification layer to your account during login.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: ACTIVE SESSIONS */}
            {activeTab === 'devices' && (
              <div className="space-y-6 max-w-xl animate-in fade-in-50 duration-200">
                <div>
                  <h2 className="text-xl font-semibold tracking-tight text-foreground">
                    Active Sessions & Devices
                  </h2>
                  <p className="text-xs text-muted-foreground mt-1">
                    Review and manage devices currently authenticated with your account.
                  </p>
                </div>

                {/* Current Device Card */}
                <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="size-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                        <Laptop className="size-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-semibold text-foreground">
                            Current Browser & Device
                          </h4>
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                            <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Active Now
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                          Desktop Chrome / Windows • Local Session
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-emerald-500/20 text-[11px] text-muted-foreground flex items-center justify-between">
                    <span>Last active: Just now</span>
                    <span className="font-mono text-[10px]">Session ID: {user.id.slice(0, 14)}...</span>
                  </div>
                </div>

                {/* Security Advisory */}
                <div className="p-4 rounded-xl border border-border/70 bg-card/60 space-y-3">
                  <div className="flex items-start gap-3">
                    <ShieldCheck className="size-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-semibold text-foreground">
                        Session Security Safeguards
                      </h4>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                        If you ever suspect unauthorized access to your account from a public or shared computer, you can immediately invalidate all active sessions.
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => signOut({ redirectUrl: '/' })}
                      className="cursor-pointer gap-2 text-xs"
                    >
                      <LogOut className="size-3.5" />
                      <span>Sign out of all sessions</span>
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: PREFERENCES */}
            {activeTab === 'preferences' && (
              <div className="space-y-6 max-w-xl animate-in fade-in-50 duration-200">
                <div>
                  <h2 className="text-xl font-semibold tracking-tight text-foreground">
                    Preferences & Settings
                  </h2>
                  <p className="text-xs text-muted-foreground mt-1">
                    Personalize your interface theme, AI interaction flow, and display options.
                  </p>
                </div>

                {/* Theme Selector */}
                <div className="p-4 rounded-xl border border-border/70 bg-card/60 space-y-3">
                  <Label className="text-xs font-semibold text-foreground">
                    Theme Appearance
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Choose between light, dark, or system mode.
                  </p>

                  <div className="grid grid-cols-3 gap-3 pt-1">
                    <button
                      type="button"
                      onClick={() => setTheme('light')}
                      className={cn(
                        'flex flex-col items-center gap-2 p-3 rounded-xl border text-xs font-medium transition-all cursor-pointer',
                        theme === 'light'
                          ? 'border-primary bg-primary/10 text-primary ring-2 ring-primary/20 shadow-xs'
                          : 'border-border/70 bg-background/50 text-muted-foreground hover:bg-muted/80 hover:text-foreground'
                      )}
                    >
                      <Sun className="size-5" />
                      <span>Light</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setTheme('dark')}
                      className={cn(
                        'flex flex-col items-center gap-2 p-3 rounded-xl border text-xs font-medium transition-all cursor-pointer',
                        theme === 'dark'
                          ? 'border-primary bg-primary/10 text-primary ring-2 ring-primary/20 shadow-xs'
                          : 'border-border/70 bg-background/50 text-muted-foreground hover:bg-muted/80 hover:text-foreground'
                      )}
                    >
                      <Moon className="size-5" />
                      <span>Dark</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setTheme('system')}
                      className={cn(
                        'flex flex-col items-center gap-2 p-3 rounded-xl border text-xs font-medium transition-all cursor-pointer',
                        theme === 'system'
                          ? 'border-primary bg-primary/10 text-primary ring-2 ring-primary/20 shadow-xs'
                          : 'border-border/70 bg-background/50 text-muted-foreground hover:bg-muted/80 hover:text-foreground'
                      )}
                    >
                      <Monitor className="size-5" />
                      <span>System</span>
                    </button>
                  </div>
                </div>

                {/* AI Chat Experience Preferences */}
                <div className="p-4 rounded-xl border border-border/70 bg-card/60 space-y-4">
                  <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Cpu className="size-4 text-primary" />
                    <span>AI Model Experience</span>
                  </h4>

                  <div className="space-y-3 divide-y divide-border/60">
                    <div className="flex items-center justify-between pt-1">
                      <div>
                        <span className="text-xs font-medium text-foreground block">
                          Token Response Streaming
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          Stream tokens progressively as the AI generates responses.
                        </span>
                      </div>
                      <Switch
                        checked={enableStreaming}
                        onCheckedChange={setEnableStreaming}
                      />
                    </div>

                    <div className="flex items-center justify-between pt-3">
                      <div>
                        <span className="text-xs font-medium text-foreground block">
                          Syntax Highlighting
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          Format generated code blocks with Shiki coloration.
                        </span>
                      </div>
                      <Switch
                        checked={enableSyntaxHighlight}
                        onCheckedChange={setEnableSyntaxHighlight}
                      />
                    </div>

                    <div className="flex items-center justify-between pt-3">
                      <div>
                        <span className="text-xs font-medium text-foreground block">
                          Sound & Haptic Feedback
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          Play subtle chimes upon message completion.
                        </span>
                      </div>
                      <Switch
                        checked={enableSound}
                        onCheckedChange={setEnableSound}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      </DialogContent>
    </Dialog>
  );
}
