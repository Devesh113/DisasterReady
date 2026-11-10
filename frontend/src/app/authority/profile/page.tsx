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
  Building,
  Radio,
  FileCheck2,
  Users,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { authService } from '@/services/auth.service';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { formatDate } from '@/lib/utils';

export default function AuthorityProfilePage() {
  const { user } = useAuth();

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Form feedback state
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
        'Officer security credentials updated successfully. Existing refresh tokens have been revoked.'
      );
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setErrorMessage(
        error.response?.data?.message ||
          'Failed to update officer password. Please verify current credentials and try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const getInitials = () => {
    if (!user) return 'EO';
    return `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase() || 'EO';
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* 1. Header */}
      <div className="pb-6 border-b border-slate-200">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-xs font-semibold text-[#1769AA] mb-2">
          <Shield className="h-4 w-4" />
          EOC Command Staff Credentials
        </div>
        <h1 className="text-3xl font-extrabold text-[#102A43] tracking-tight">
          Officer Profile & Operational Security
        </h1>
        <p className="text-slate-600 text-sm mt-1">
          Review your Emergency Operations Center (EOC) identity, cryptographic credentials, and role privileges.
        </p>
      </div>

      {/* 2. Officer Identity Card */}
      <div className="bg-gradient-to-br from-[#102A43] via-[#163859] to-[#0A192F] rounded-2xl p-6 md:p-8 text-white shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 bg-[#1769AA]/20 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 relative z-10">
          <div className="h-20 w-20 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-2xl font-black text-white shrink-0 shadow-inner">
            {getInitials()}
          </div>

          <div className="flex-1 text-center sm:text-left space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
              <h2 className="text-2xl font-bold">
                {user?.firstName} {user?.lastName}
              </h2>
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-400/30 text-xs uppercase font-mono">
                  {user?.role || 'AUTHORITY'} CLEARANCE
                </Badge>
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-500/20 text-blue-200 border border-blue-400/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  EOC Station Active
                </span>
              </div>
            </div>

            <p className="text-slate-300 text-sm">
              Civil Defense & Emergency Management Authority • Command Dispatch
            </p>

            <div className="pt-3 flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-slate-300">
              <div className="flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5 text-blue-300" />
                <span className="font-mono">{user?.email}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5 text-blue-300" />
                <span>{user?.phone || 'Emergency Direct Line Not Configured'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-blue-300" />
                <span>Station Officer Since {user?.createdAt ? formatDate(user.createdAt) : '2026'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 3. Change Password Form (2 Columns) */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-slate-200 shadow-xs">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2 text-[#102A43]">
                <Key className="h-5 w-5 text-[#1769AA]" />
                <CardTitle className="text-lg">Update Officer Password</CardTitle>
              </div>
              <CardDescription>
                Ensure your command credential uses a robust password with uppercase letters, numbers, and symbols.
              </CardDescription>
            </CardHeader>

            <CardContent>
              {successMessage && (
                <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">Security Update Complete</p>
                    <p className="text-xs text-emerald-700 mt-0.5">{successMessage}</p>
                  </div>
                </div>
              )}

              {errorMessage && (
                <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">Verification Failed</p>
                    <p className="text-xs text-rose-700 mt-0.5">{errorMessage}</p>
                  </div>
                </div>
              )}

              <form onSubmit={handleChangePassword} className="space-y-4">
                {/* Current Password */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Current Master Password *
                  </label>
                  <div className="relative">
                    <Input
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter your current password"
                      required
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
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
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    New Master Password *
                  </label>
                  <div className="relative">
                    <Input
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimum 8 characters with letters and numbers"
                      required
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                    >
                      {showNewPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Password must be at least 8 characters long.
                  </p>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Confirm New Master Password *
                  </label>
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat the new password exactly"
                    required
                  />
                </div>

                {/* Submit button */}
                <div className="pt-3">
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full sm:w-auto bg-[#1769AA] hover:bg-[#125386] text-white flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        Encrypting & Updating...
                      </>
                    ) : (
                      <>
                        <Lock className="h-4 w-4" />
                        Apply New Credential
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* 4. RBAC Privileges & Cryptographic Security Info (1 Column) */}
        <div className="space-y-6">
          <Card className="border-slate-200 shadow-xs">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2 text-[#102A43]">
                <ShieldCheck className="h-5 w-5 text-emerald-600" />
                <CardTitle className="text-base">Role-Based Privileges</CardTitle>
              </div>
              <CardDescription className="text-xs">
                Emergency Authority scope authorized by system policies.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3.5 text-xs">
              <div className="flex items-start gap-2.5">
                <FileCheck2 className="h-4 w-4 text-[#1769AA] shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-slate-800">Incident Triage Desk</p>
                  <p className="text-slate-500 text-[11px]">
                    Verify submitted citizen reports, update lifecycle status, and dismiss duplicates.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <Radio className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-slate-800">Alert Broadcasting Studio</p>
                  <p className="text-slate-500 text-[11px]">
                    Issue critical advisories, define spatial hazard coordinates, and resolve active warnings.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <Building className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-slate-800">Resource Infrastructure</p>
                  <p className="text-slate-500 text-[11px]">
                    Deploy shelters, hospital facilities, and toggle operational service availability.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <Users className="h-4 w-4 text-purple-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-slate-800">Mock Drill Coordination</p>
                  <p className="text-slate-500 text-[11px]">
                    Schedule community preparation exercises and inspect attendee rosters.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-xs bg-slate-50/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                Cryptographic Architecture
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs text-slate-600">
              <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Hash Algorithm</span>
                <span className="font-mono font-semibold text-slate-800">Argon2id</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Session Guard</span>
                <span className="font-semibold text-slate-800">HttpOnly Cookie</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Token Rotation</span>
                <span className="font-semibold text-emerald-700">Automatic</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-500">Node ID</span>
                <span className="font-mono text-[11px] text-slate-700">EOC-HQ-01</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
