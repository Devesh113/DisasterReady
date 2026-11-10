'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ShieldAlert, LogIn, ArrowLeft, Lock, Mail, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { useAuth } from '@/hooks/useAuth';
import { AxiosError } from 'axios';
import { ApiErrorResponse } from '@/types/api';

function LoginFormContent() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const searchParams = useSearchParams();
  const isExpired = searchParams?.get('expired') === 'true';

  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      await login({
        email: email.trim().toLowerCase(),
        password,
      });
      // Redirect is handled automatically by AuthContext based on user.role
    } catch (err: unknown) {
      const axiosErr = err as AxiosError<ApiErrorResponse>;
      const message =
        axiosErr.response?.data?.error?.message ||
        'Authentication failed. Please verify your email and password.';
      setErrorMsg(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-3">
        <Link href="/" className="inline-flex items-center gap-2 text-[#102A43]">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#102A43] text-white shadow-sm">
            <ShieldAlert className="h-6 w-6 text-[#DC3545]" />
          </div>
          <span className="text-2xl font-bold tracking-tight">
            Disaster<span className="text-[#1769AA]">Ready</span>
          </span>
        </Link>
        <h2 className="text-2xl font-extrabold text-[#102A43]">
          Sign in to your account
        </h2>
        <p className="text-xs text-[#627D98]">
          Access your personal emergency kit, mock drills, incident reports, and alerts
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <Card className="border-[#D9E2EC] shadow-sm">
          {isExpired && (
            <div className="p-4 bg-amber-50 border-b border-amber-200 rounded-t-xl text-xs text-amber-900 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
              <span>Your session has expired. Please sign in again to continue.</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4 pt-6">
              {errorMsg && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800 flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-[#DC3545]" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#172B4D] block">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#829AB1]" />
                  <Input
                    type="email"
                    required
                    placeholder="citizen@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9"
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-[#172B4D]">
                    Password
                  </label>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#829AB1]" />
                  <Input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-9"
                    autoComplete="current-password"
                  />
                </div>
              </div>

              <Button
                variant="primary"
                type="submit"
                isLoading={isSubmitting}
                className="w-full justify-center gap-2 mt-2"
              >
                <LogIn className="h-4 w-4" />
                Sign In
              </Button>
            </CardContent>

            <CardFooter className="border-t border-[#D9E2EC] pt-4 justify-center text-xs text-[#627D98]">
              Don&apos;t have an account?{' '}
              <Link href="/register" className="font-semibold text-[#1769AA] hover:underline ml-1">
                Register as Citizen
              </Link>
            </CardFooter>
          </form>
        </Card>

        <div className="mt-6 text-center">
          <Link href="/" className="text-xs font-semibold text-[#627D98] hover:text-[#102A43] inline-flex items-center gap-1">
            <ArrowLeft className="h-3.5 w-3.5" /> Return to DisasterReady Public Home
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F5F7FA] flex items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#1769AA] border-t-transparent" />
        </div>
      }
    >
      <LoginFormContent />
    </Suspense>
  );
}
