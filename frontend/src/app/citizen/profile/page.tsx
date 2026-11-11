'use client';

import React, { useState } from 'react';
import {
  User as UserIcon,
  Shield,
  Key,
  Mail,
  Phone,
  Calendar,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Info,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { authService } from '@/services/auth.service';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { formatDate } from '@/lib/utils';

export default function CitizenProfilePage() {
  const { user } = useAuth();

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Form submission feedback
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage(null);
    setErrorMessage(null);

    if (!currentPassword) {
      setErrorMessage('Current password is required.');
      return;
    }

    if (newPassword.length < 8) {
      setErrorMessage('New password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('New password and confirmation do not match.');
      return;
    }

    setIsLoading(true);
    try {
      await authService.changePassword({
        currentPassword,
        newPassword,
      });

      setSuccessMessage(
        'Password updated successfully! For enhanced security, prior active refresh tokens have been revoked.'
      );
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setErrorMessage(
        error.response?.data?.message ||
          'Failed to update password. Please verify your current password and try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const getInitials = () => {
    if (!user) return 'DR';
    return `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase() || 'DR';
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* ========================================================
          1. HEADER
          ======================================================== */}
      <div className="pb-6 border-b border-slate-200">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-xs font-semibold text-[#1769AA] mb-2">
          <UserIcon className="h-4 w-4" />
          Account & Security
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#102A43] tracking-tight">
          Citizen Profile & Credentials
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Review your verified identity, emergency contact details, and account security controls.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* ========================================================
            2. USER DETAILS CARD (LEFT COLUMN)
            ======================================================== */}
        <div className="md:col-span-1 space-y-6">
          <Card className="border border-slate-200 bg-white shadow-sm overflow-hidden text-center p-6">
            <div className="flex flex-col items-center">
              {/* Avatar circle */}
              <div className="h-20 w-20 rounded-full bg-gradient-to-br from-[#102A43] to-[#1769AA] text-white flex items-center justify-center text-2xl font-black shadow-md mb-4">
                {getInitials()}
              </div>

              <h2 className="text-lg font-black text-[#102A43]">
                {user?.firstName} {user?.lastName}
              </h2>

              <p className="text-xs text-slate-500 mb-3">{user?.email}</p>

              <Badge className="bg-[#1769AA] text-white text-xs font-bold uppercase tracking-wider px-3 py-1">
                {user?.role || 'CITIZEN'}
              </Badge>
            </div>

            <div className="mt-6 pt-6 border-t border-slate-100 text-left space-y-3 text-xs">
              <div className="flex items-center gap-2.5 text-slate-600">
                <Mail className="h-4 w-4 text-slate-400 flex-shrink-0" />
                <span className="truncate">{user?.email}</span>
              </div>

              <div className="flex items-center gap-2.5 text-slate-600">
                <Phone className="h-4 w-4 text-slate-400 flex-shrink-0" />
                <span>{user?.phone || 'No phone provided'}</span>
              </div>

              <div className="flex items-center gap-2.5 text-slate-600">
                <Calendar className="h-4 w-4 text-slate-400 flex-shrink-0" />
                <span>Member since {user?.createdAt ? formatDate(user.createdAt) : '2025'}</span>
              </div>
            </div>
          </Card>

          {/* Security Summary Badge */}
          <Card className="border border-slate-200 bg-slate-50 p-4 text-xs space-y-2">
            <div className="flex items-center gap-2 font-bold text-[#102A43]">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              Security Architecture
            </div>
            <p className="text-slate-600 leading-relaxed text-[11px]">
              Your session is authenticated via Argon2id hashed credentials and protected by HttpOnly rotating refresh tokens.
            </p>
          </Card>
        </div>

        {/* ========================================================
            3. CHANGE PASSWORD & CONTROLS (RIGHT 2 COLUMNS)
            ======================================================== */}
        <div className="md:col-span-2 space-y-6">
          {/* Change Password Card */}
          <Card className="border border-slate-200 bg-white shadow-sm">
            <CardHeader className="p-6 pb-4 border-b border-slate-100">
              <CardTitle className="text-lg font-bold text-[#102A43] flex items-center gap-2">
                <Lock className="h-5 w-5 text-[#1769AA]" />
                Change Password
              </CardTitle>
              <CardDescription className="text-xs">
                Ensure your account uses a secure password of at least 8 characters.
              </CardDescription>
            </CardHeader>

            <CardContent className="p-6">
              {successMessage && (
                <div className="mb-4 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 flex-shrink-0 mt-0.5 text-emerald-600" />
                  <span>{successMessage}</span>
                </div>
              )}

              {errorMessage && (
                <div className="mb-4 p-3.5 rounded-xl bg-red-50 border border-red-200 text-[#DC3545] text-xs flex items-start gap-2.5">
                  <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5 text-[#DC3545]" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <form onSubmit={handleChangePassword} className="space-y-4 text-xs">
                {/* Current Password */}
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700 block">
                    Current Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Input
                      type={showCurrentPassword ? 'text' : 'password'}
                      required
                      placeholder="Enter your current password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="pr-10 text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                      aria-label={showCurrentPassword ? 'Hide password' : 'Show password'}
                    >
                      {showCurrentPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700 block">
                    New Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Input
                      type={showNewPassword ? 'text' : 'password'}
                      required
                      minLength={8}
                      placeholder="Minimum 8 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="pr-10 text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                      aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                    >
                      {showNewPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Confirm New Password */}
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700 block">
                    Confirm New Password <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="password"
                    required
                    minLength={8}
                    placeholder="Re-type new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="text-xs"
                  />
                </div>

                <div className="pt-2">
                  <Button
                    type="submit"
                    size="sm"
                    isLoading={isLoading}
                    className="bg-[#102A43] hover:bg-[#172B4D] text-white font-bold gap-2"
                  >
                    <Key className="h-4 w-4" />
                    Update Password
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Account Policy Information */}
          <Card className="border border-slate-200 bg-white p-5">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-blue-50 text-[#1769AA] mt-0.5">
                <Info className="h-4 w-4" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-[#102A43]">
                  Profile Identity Verification Notice
                </h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  To ensure emergency communications reach legitimate municipal citizens during civil defense operations, legal name and core email updates require administrator verification. For address updates or phone changes, contact your regional authority administrator.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
