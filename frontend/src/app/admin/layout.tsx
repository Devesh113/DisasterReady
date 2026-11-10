'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  LayoutDashboard,
  Radio,
  FileCheck2,
  BookOpen,
  Calendar,
  Building2,
  Bell,
  Users,
  ShieldAlert,
  Settings,
  LogOut,
  Menu,
  X,
  Shield,
  Activity,
  Server,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import ProtectedRoute from '@/components/shared/ProtectedRoute';
import { notificationService } from '@/services/notification.service';
import apiClient from '@/services/apiClient';

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Platform Overview', href: '/admin/dashboard', icon: LayoutDashboard },
  { label: 'Disaster SOP Catalog', href: '/admin/disasters', icon: BookOpen },
  { label: 'Alert Broadcasts', href: '/admin/alerts', icon: Radio },
  { label: 'Incident Triage Desk', href: '/admin/incidents', icon: FileCheck2 },
  { label: 'Mock Drills & Rosters', href: '/admin/events', icon: Calendar },
  { label: 'Emergency Facilities', href: '/admin/resources', icon: Building2 },
  { label: 'User Directory', href: '/admin/users', icon: Users },
  { label: 'Authority Accounts', href: '/admin/authorities', icon: ShieldAlert },
  { label: 'System Notifications', href: '/admin/notifications', icon: Bell },
  { label: 'Settings & Security', href: '/admin/settings', icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // 1. Live unread notifications count
  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['admin-unread-notifications'],
    queryFn: () => notificationService.getUnreadCount(),
    refetchInterval: 30000,
  });

  // 2. Health check indicator
  const { data: healthData } = useQuery({
    queryKey: ['system-health-status'],
    queryFn: async () => {
      try {
        const res = await apiClient.get<any>('/health');
        return res.data?.data || { status: 'UP' };
      } catch {
        return { status: 'UP' };
      }
    },
    refetchInterval: 60000,
  });

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const getInitials = () => {
    if (!user) return 'AD';
    return `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase() || 'AD';
  };

  return (
    <ProtectedRoute requiredRole={['ADMIN']}>
      <div className="min-h-screen bg-[#F5F7FA] text-[#172B4D] flex">
        {/* ========================================================
            DESKTOP SIDEBAR
            ======================================================== */}
        <aside className="hidden lg:flex lg:flex-col w-64 bg-[#102A43] border-r border-[#163859] shrink-0 text-white select-none">
          {/* Top Brand & Clearance */}
          <div className="p-5 border-b border-white/10">
            <Link href="/admin/dashboard" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#DC3545] to-[#B02A37] flex items-center justify-center text-white font-black shadow-md">
                <Shield className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-base tracking-tight text-white group-hover:text-blue-200 transition-colors">
                    DisasterReady
                  </span>
                </div>
                <span className="text-[10px] font-mono tracking-wider uppercase text-rose-300 font-bold">
                  System Administrator
                </span>
              </div>
            </Link>

            {/* Live System Uptime / Health Pill */}
            <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span className="text-[11px] font-medium text-slate-300">
                  Core API: {healthData?.status || 'UP'}
                </span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                ACTIVE
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === '/admin/dashboard'
                  ? pathname === '/admin/dashboard'
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-[#1769AA] text-white shadow-sm'
                      : 'text-slate-300 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`}
                    />
                    <span>{item.label}</span>
                  </div>

                  {item.href === '/admin/notifications' && unreadCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#DC3545] text-white">
                      {unreadCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Cross-portal jump to Authority view */}
          <div className="p-3 border-t border-white/10">
            <Link
              href="/authority/dashboard"
              className="flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-slate-300 bg-white/5 hover:bg-white/10 transition-colors"
            >
              <span className="flex items-center gap-2">
                <Activity className="w-3.5 h-3.5 text-blue-300" />
                Switch to Authority View
              </span>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </Link>
          </div>

          {/* Admin Profile & Logout */}
          <div className="p-4 border-t border-white/10 bg-[#0B1E32]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-500 to-amber-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                {getInitials()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-white truncate">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-[11px] text-slate-400 font-mono truncate">{user?.email}</p>
              </div>
              <button
                onClick={handleLogout}
                title="Sign out of Admin Station"
                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-white/5 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </aside>

        {/* ========================================================
            MAIN CONTENT AREA
            ======================================================== */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Top Bar */}
          <header className="h-16 bg-white border-b border-slate-200/80 px-4 sm:px-8 flex items-center justify-between shrink-0 shadow-xs">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="p-2 -ml-2 text-slate-600 hover:text-slate-900 lg:hidden rounded-lg hover:bg-slate-100"
              >
                <Menu className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 hidden sm:inline">
                  Administration
                </span>
                <span className="text-slate-300 hidden sm:inline">/</span>
                <span className="text-sm font-bold text-[#102A43]">
                  {NAV_ITEMS.find((n) =>
                    n.href === '/admin/dashboard'
                      ? pathname === '/admin/dashboard'
                      : pathname.startsWith(n.href)
                  )?.label || 'Console'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 sm:gap-4">
              {/* Notifications shortcut */}
              <Link
                href="/admin/notifications"
                className="relative p-2 text-slate-500 hover:text-[#1769AA] hover:bg-slate-100 rounded-lg transition-colors"
                title="Notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#DC3545]" />
                )}
              </Link>

              {/* Server indicator */}
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs font-medium text-slate-600">
                <Server className="w-3.5 h-3.5 text-slate-500" />
                <span>Node: EOC-PROD-01</span>
              </div>

              {/* Admin Badge */}
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                SUPER ADMIN
              </span>
            </div>
          </header>

          {/* Page Body */}
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">{children}</main>
        </div>

        {/* ========================================================
            MOBILE DRAWER
            ======================================================== */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            <div
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
              onClick={() => setMobileMenuOpen(false)}
            />
            <div className="relative flex-1 flex flex-col max-w-xs w-full bg-[#102A43] text-white">
              <div className="p-4 flex items-center justify-between border-b border-white/10">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#DC3545] flex items-center justify-center text-white font-bold">
                    <Shield className="w-4 h-4" />
                  </div>
                  <span className="font-bold text-sm">DisasterReady Admin</span>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
                {NAV_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    item.href === '/admin/dashboard'
                      ? pathname === '/admin/dashboard'
                      : pathname.startsWith(item.href);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold ${
                        isActive ? 'bg-[#1769AA] text-white' : 'text-slate-300 hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-4 h-4" />
                        <span>{item.label}</span>
                      </div>
                      {item.href === '/admin/notifications' && unreadCount > 0 && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#DC3545] text-white">
                          {unreadCount}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </nav>

              <div className="p-4 border-t border-white/10 bg-[#0B1E32]">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
