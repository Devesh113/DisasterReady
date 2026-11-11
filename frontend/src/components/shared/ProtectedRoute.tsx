'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { UserRole } from '@/types/auth';
import { ShieldAlert, AlertCircle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole | UserRole[];
}

export default function ProtectedRoute({
  children,
  requiredRole,
}: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F5F7FA] p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-[#102A43] text-white flex items-center justify-center animate-pulse">
            <ShieldAlert className="h-6 w-6 text-[#1769AA]" />
          </div>
          <div className="text-sm font-semibold text-[#102A43]">
            Verifying secure session...
          </div>
          <div className="h-1.5 w-32 bg-slate-200 rounded-full overflow-hidden">
            <div className="h-full bg-[#1769AA] animate-indeterminate" />
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  // Role validation
  if (requiredRole) {
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    const isAuthorized = roles.includes(user.role);

    if (!isAuthorized) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#F5F7FA] p-4">
          <div className="max-w-md w-full bg-white rounded-2xl border border-red-200 p-8 shadow-sm text-center space-y-4">
            <div className="h-12 w-12 rounded-full bg-red-100 text-[#DC3545] flex items-center justify-center mx-auto">
              <AlertCircle className="h-6 w-6" />
            </div>
            <h2 className="text-xl font-bold text-[#102A43]">Access Restricted</h2>
            <p className="text-sm text-[#627D98] leading-relaxed">
              Your account with role <strong className="text-[#102A43]">{user.role}</strong> does not have permission to access this area.
            </p>
            <div className="pt-2 flex flex-col gap-2">
              <Button
                variant="primary"
                onClick={() => {
                  if (user.role === 'AUTHORITY') router.push('/authority/dashboard');
                  else if (user.role === 'ADMIN') router.push('/admin/dashboard');
                  else router.push('/citizen/dashboard');
                }}
              >
                Go to Your {user.role} Dashboard
              </Button>
              <Button variant="outline" onClick={() => router.push('/')}>
                Return to Public Home
              </Button>
            </div>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
}
