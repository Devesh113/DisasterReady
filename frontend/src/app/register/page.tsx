'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ShieldAlert, UserPlus, ArrowLeft, Lock, Mail, User, Phone, AlertCircle, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { useAuth } from '@/hooks/useAuth';
import { AxiosError } from 'axios';
import { ApiErrorResponse } from '@/types/api';

export default function RegisterPage() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (password.length < 8) {
      setErrorMsg('Password must be at least 8 characters long.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Security: Strictly enforces CITIZEN registration
      await register({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim().toLowerCase(),
        password,
        phone: phone.trim() || null,
        role: 'CITIZEN',
      });
      // Redirect to /citizen/dashboard is handled inside AuthContext
    } catch (err: unknown) {
      const axiosErr = err as AxiosError<ApiErrorResponse>;
      const message =
        axiosErr.response?.data?.error?.message ||
        'Registration failed. Please verify your details or try with another email.';
      setErrorMsg(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-lg text-center space-y-3">
        <Link href="/" className="inline-flex items-center gap-2 text-[#102A43]">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#102A43] text-white shadow-sm">
            <ShieldAlert className="h-6 w-6 text-[#DC3545]" />
          </div>
          <span className="text-2xl font-bold tracking-tight">
            Disaster<span className="text-[#1769AA]">Ready</span>
          </span>
        </Link>
        <h2 className="text-2xl font-extrabold text-[#102A43]">
          Citizen Registration
        </h2>
        <p className="text-xs text-[#627D98]">
          Create your free citizen account to prepare for hazards and coordinate emergency response
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg px-4 sm:px-0">
        <Card className="border-[#D9E2EC] shadow-sm">
          {/* Security badge notice */}
          <div className="p-3.5 bg-blue-50/80 border-b border-blue-100 rounded-t-xl text-xs text-[#1769AA] flex items-center gap-2 font-medium">
            <ShieldCheck className="h-4 w-4 shrink-0 text-[#16A34A]" />
            <span>Public Registration: Grants full Citizen access to personal kits, drills, and incident reporting.</span>
          </div>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4 pt-6">
              {errorMsg && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800 flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-[#DC3545]" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Name Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#172B4D] block">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="text"
                    required
                    placeholder="Jane"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#172B4D] block">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="text"
                    required
                    placeholder="Doe"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#172B4D] block">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#829AB1]" />
                  <Input
                    type="email"
                    required
                    placeholder="jane.doe@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              {/* Phone */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#172B4D] block">
                  Phone Number (Optional for emergency SMS alerts)
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#829AB1]" />
                  <Input
                    type="tel"
                    placeholder="+1 555-0199"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#172B4D] block">
                  Password (min. 8 characters) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#829AB1]" />
                  <Input
                    type="password"
                    required
                    minLength={8}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              <Button
                variant="primary"
                type="submit"
                isLoading={isSubmitting}
                className="w-full justify-center gap-2 mt-2"
              >
                <UserPlus className="h-4 w-4" />
                Register as Citizen
              </Button>
            </CardContent>

            <CardFooter className="border-t border-[#D9E2EC] pt-4 justify-center text-xs text-[#627D98]">
              Already have an account?{' '}
              <Link href="/login" className="font-semibold text-[#1769AA] hover:underline ml-1">
                Sign in here
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
