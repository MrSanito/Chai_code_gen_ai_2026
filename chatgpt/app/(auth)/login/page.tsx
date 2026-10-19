'use client'

import { useSignIn, useAuth } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Eye, EyeOff, Loader2, AlertCircle, ShieldCheck, RefreshCw } from 'lucide-react'
import { useState, useEffect } from 'react'

function GoogleIcon() {
  return (
    <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
        fill="#EA4335"
      />
    </svg>
  )
}

export default function LoginPage() {
  const { signIn, errors, fetchStatus } = useSignIn()
  const { isSignedIn } = useAuth()
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [verifyError, setVerifyError] = useState('')
  const [customError, setCustomError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleGoogleSignIn = async () => {
    if (!signIn) return
    setCustomError('')
    setLoading(true)

    try {
      const { error } = await signIn.sso({
        strategy: 'oauth_google',
        redirectUrl: '/sso-callback',
        redirectCallbackUrl: '/',
      })
      if (error) {
        setCustomError(error.message || 'Google sign-in failed')
        setLoading(false)
      }
    } catch (err: any) {
      console.error('[Clerk Google Sign-In Error]:', err)
      setCustomError(err.message || 'Google authentication failed')
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!signIn) return
    setCustomError('')
    setVerifyError('')
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const emailAddress = (formData.get('email') as string)?.trim()
    const password = formData.get('password') as string

    try {
      const { error } = await signIn.password({ emailAddress, password })
      if (error) {
        setCustomError(error.message || 'Invalid credentials')
        setLoading(false)
        return
      }

      if (signIn.status === 'complete') {
        await signIn.finalize({
          navigate: ({ decorateUrl }) => {
            const url = decorateUrl('/')
            if (url.startsWith('http')) {
              window.location.href = url
            } else {
              router.push(url)
            }
          },
        })
        return
      }

      if (signIn.status === 'needs_client_trust' || signIn.status === 'needs_second_factor') {
        const emailCodeFactor = signIn.supportedSecondFactors?.find((f) => f.strategy === 'email_code')
        if (emailCodeFactor) {
          await signIn.mfa.sendEmailCode()
        }
        setLoading(false)
        return
      }

      setLoading(false)
    } catch (err: any) {
      console.error('[Clerk Sign-In Error]:', err)
      setCustomError(err.message || 'Failed to sign in')
      setLoading(false)
    }
  }

  const handleVerify = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!signIn) return
    setVerifyError('')
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const code = (formData.get('code') as string)?.trim()

    try {
      const { error } = await signIn.mfa.verifyEmailCode({ code })
      if (error) {
        setVerifyError(error.message || 'Invalid verification code')
        setLoading(false)
        return
      }

      if (signIn.status === 'complete') {
        await signIn.finalize({
          navigate: ({ decorateUrl }) => {
            const url = decorateUrl('/')
            if (url.startsWith('http')) {
              window.location.href = url
            } else {
              router.push(url)
            }
          },
        })
        return
      }

      setVerifyError('Sign-in attempt not complete. Please try again.')
      setLoading(false)
    } catch (err: any) {
      console.error('Error verifying MFA code:', err)
      setVerifyError(err.message || 'Invalid verification code')
      setLoading(false)
    }
  }

  const handleResendCode = async () => {
    if (!signIn) return
    try {
      await signIn.mfa.sendEmailCode()
    } catch (err: any) {
      console.error('Resend error:', err)
    }
  }

  useEffect(() => {
    if (isSignedIn) {
      router.push('/')
    }
  }, [isSignedIn, router])

  if (isSignedIn) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-border border-t-primary" />
          <span className="text-xs">Redirecting...</span>
        </div>
      </div>
    )
  }

  if (signIn?.status === 'complete') return null

  // ── PHASE 2: MFA Verification ──
  if (signIn?.status === 'needs_client_trust' || signIn?.status === 'needs_second_factor') {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-background px-4">
        <div className="w-full max-w-sm">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 border border-primary/20">
              <ShieldCheck className="h-5 w-5 text-primary" />
            </div>
            <h1 className="text-xl font-semibold text-foreground">Verify your identity</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">Enter the code sent to your email</p>
          </div>

          <form onSubmit={handleVerify} className="space-y-4">
            {verifyError && (
              <div className="flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-red-400">
                <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                <span>{verifyError}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground" htmlFor="code">Verification Code</label>
              <Input
                id="code" name="code" type="text" placeholder="000000" autoComplete="one-time-code"
                className="h-10 border-border bg-card text-foreground text-center tracking-[0.4em] font-mono text-base placeholder:tracking-normal placeholder:text-muted rounded-lg focus-visible:ring-1 focus-visible:ring-ring focus-visible:border-primary/50"
              />
            </div>

            <Button className="w-full h-10 bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-sm rounded-lg gap-2 disabled:opacity-40" type="submit" disabled={fetchStatus === 'fetching' || loading}>
              {fetchStatus === 'fetching' || loading ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />Verifying...</> : 'Verify'}
            </Button>

            <div className="flex items-center justify-between pt-1">
              <button type="button" onClick={handleResendCode} className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5 cursor-pointer">
                <RefreshCw className="h-3 w-3" />Resend code
              </button>
              <button type="button" onClick={() => signIn?.reset()} className="text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                Start over
              </button>
            </div>
          </form>
        </div>
      </div>
    )
  }

  // ── PHASE 1: Login Form ──
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">

        {/* Brand */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 border border-primary/20">
            <span className="text-primary font-bold text-sm tracking-tight">AI</span>
          </div>
          <h1 className="text-xl font-semibold text-foreground">Welcome Back</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">Enter your credentials to continue</p>
        </div>

        {/* Social Login Button */}
        <Button
          type="button"
          variant="outline"
          onClick={handleGoogleSignIn}
          disabled={loading || fetchStatus === 'fetching'}
          className="w-full h-10 border-border bg-card hover:bg-muted text-foreground font-medium text-sm rounded-lg gap-2.5 transition-colors cursor-pointer"
        >
          <GoogleIcon />
          <span>Continue with Google</span>
        </Button>

        {/* Divider */}
        <div className="relative my-5 flex items-center justify-center">
          <div className="w-full border-t border-border" />
          <span className="absolute bg-background px-2.5 text-[11px] uppercase tracking-wider text-muted-foreground">
            or continue with email
          </span>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {customError && (
            <div className="flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-red-400">
              <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              <p>{customError}</p>
            </div>
          )}

          {/* Email */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground" htmlFor="email">Email</label>
            <Input
              id="email" type="email" name="email" placeholder="name@company.com" required
              className="h-10 border-border bg-card text-foreground rounded-lg text-sm placeholder:text-muted focus-visible:ring-1 focus-visible:ring-ring focus-visible:border-primary/50 transition-colors"
            />
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-muted-foreground" htmlFor="password">Password</label>
              <Link href="/forgot-password" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Forgot password?</Link>
            </div>
            <div className="relative">
              <Input
                id="password" type={showPassword ? 'text' : 'password'} name="password" placeholder="••••••••" required
                className="h-10 pr-10 border-border bg-card text-foreground rounded-lg text-sm placeholder:text-muted focus-visible:ring-1 focus-visible:ring-ring focus-visible:border-primary/50 transition-colors"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <Button className="w-full h-10 bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-sm rounded-lg gap-2 disabled:opacity-40 mt-2" type="submit" disabled={fetchStatus === 'fetching' || loading}>
            {fetchStatus === 'fetching' || loading ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />Logging in...</> : 'Login'}
          </Button>
        </form>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Don't have an account?{' '}
          <Link href="/register" className="text-primary hover:text-primary/80 transition-colors font-medium">Register</Link>
        </p>

        <div className="mt-8 border-t border-border" />
        <p className="mt-4 text-center text-[10px] text-muted-foreground/40">Protected by AI Auth</p>
      </div>
    </div>
  )
}
