'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  ShieldAlert,
  LayoutDashboard,
  Radio,
  FileText,
  Calendar,
  Users,
  Building2,
  BookOpen,
  Bell,
  ShieldCheck,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Shield,
  Activity,
  Flame,
} from 'lucide-react';
import ProtectedRoute from '@/components/shared/ProtectedRoute';
import { useAuth } from '@/hooks/useAuth';
import { notificationService } from '@/services/notification.service';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';

export default function AuthorityLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  // Poll or query unread notifications count for the top bar indicator
  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['notifications-unread-count'],
    queryFn: () => notificationService.getUnreadCount(),
    refetchInterval: 30000,
    enabled: Boolean(user),
  });

  const sidebarLinks = [
    { href: '/authority/dashboard', label: 'EOC Overview', icon: LayoutDashboard },
    { href: '/authority/alerts', label: 'Alert Broadcasting', icon: Radio, highlight: true },
    { href: '/authority/incidents', label: 'Incident Desk', icon: ShieldAlert },
    { href: '/authority/events', label: 'Drills & Exercises', icon: Calendar },
    { href: '/authority/registrations', label: 'Event Rosters', icon: Users },
    { href: '/authority/resources', label: 'Emergency Resources', icon: Building2 },
    { href: '/authority/disasters', label: 'Disaster Protocols', icon: BookOpen },
    { href: '/authority/notifications', label: 'Command Alerts', icon: Bell, badgeCount: unreadCount },
    { href: '/authority/profile', label: 'Officer Profile', icon: ShieldCheck },
  ];

  const isActive = (href: string) => {
    if (href === '/authority/dashboard') return pathname === '/authority/dashboard';
    return pathname.startsWith(href);
  };

  const userInitials =
    user?.firstName && user?.lastName
      ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
      : user?.firstName
      ? user.firstName[0].toUpperCase()
      : 'AO';

  return (
    <ProtectedRoute requiredRole={['AUTHORITY', 'ADMIN']}>
      <div className="min-h-screen bg-[#F5F7FA] flex flex-col md:flex-row">
        {/* ========================================================
            SIDEBAR (DESKTOP)
            ======================================================== */}
        <aside className="hidden md:flex md:w-64 flex-col bg-[#102A43] text-white shrink-0 sticky top-0 h-screen border-r border-[#243B53]">
          {/* Brand Header */}
          <div className="h-16 flex items-center px-6 border-b border-[#243B53] gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#DC3545] text-white shadow-sm">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-white block leading-none">
                Disaster<span className="text-[#64B5F6]">Ready</span>
              </span>
              <span className="text-[9px] text-amber-400 tracking-wider uppercase font-bold block mt-0.5">
                Authority Command Center
              </span>
            </div>
          </div>

          {/* Operational Status Pill */}
          <div className="px-4 py-2 bg-black/20 border-b border-[#243B53]/60 flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-1.5 text-slate-300">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>EOC Node: Active</span>
            </div>
            <span className="text-[10px] font-mono text-slate-400">DEFCON 4</span>
          </div>

          {/* Navigation Items */}
          <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1 scrollbar-none">
            {sidebarLinks.map((item) => {
              const active = isActive(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors relative',
                    active
                      ? 'bg-[#1769AA] text-white shadow-sm'
                      : 'text-slate-300 hover:bg-[#243B53] hover:text-white',
                    item.highlight && !active && 'text-amber-300 hover:text-amber-200'
                  )}
                >
                  <Icon className={cn('h-4 w-4 shrink-0', active ? 'text-white' : 'text-slate-400')} />
                  <span className="truncate flex-1">{item.label}</span>
                  {Boolean(item.badgeCount && item.badgeCount > 0) && (
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black bg-[#DC3545] text-white">
                      {item.badgeCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Footer User Info */}
          <div className="p-4 border-t border-[#243B53] bg-[#0b1d30]">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-[#1769AA] flex items-center justify-center text-xs font-bold text-white shrink-0 border border-white/20">
                {userInitials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-white truncate">
                  {user?.firstName} {user?.lastName}
                </p>
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-amber-300 font-bold uppercase tracking-wider">
                    {user?.role}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={logout}
                title="Sign out of command center"
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </aside>

        {/* ========================================================
            MAIN VIEWPORT CONTAINER
            ======================================================== */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top Bar */}
          <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
                aria-label="Toggle mobile menu"
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#102A43] hidden sm:inline-block">
                  Emergency Operations Command
                </span>
                <span className="hidden sm:inline-block text-slate-300">•</span>
                <span className="text-xs text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 font-semibold flex items-center gap-1">
                  <Activity className="h-3 w-3 text-emerald-600 animate-pulse" />
                  Live Operational Network
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Notification Bell */}
              <Link
                href="/authority/notifications"
                className="relative p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
                title="Command notifications"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 h-4 w-4 rounded-full bg-[#DC3545] text-white text-[10px] font-bold flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Link>

              {/* User Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 transition-colors"
                >
                  <div className="h-8 w-8 rounded-full bg-[#102A43] text-white text-xs font-bold flex items-center justify-center">
                    {userInitials}
                  </div>
                  <div className="text-left hidden lg:block">
                    <span className="text-xs font-bold text-[#102A43] block leading-tight">
                      {user?.firstName}
                    </span>
                    <span className="text-[10px] text-amber-700 font-semibold block uppercase">
                      {user?.role}
                    </span>
                  </div>
                  <ChevronDown className="h-4 w-4 text-slate-400" />
                </button>

                {userDropdownOpen && (
                  <div
                    className="absolute right-0 mt-2 w-52 rounded-xl bg-white shadow-xl border border-slate-100 py-1.5 z-50 text-xs"
                    onClick={() => setUserDropdownOpen(false)}
                  >
                    <div className="px-4 py-2 border-b border-slate-100">
                      <p className="font-bold text-[#102A43] truncate">
                        {user?.firstName} {user?.lastName}
                      </p>
                      <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
                    </div>

                    <Link
                      href="/authority/profile"
                      className="flex items-center gap-2 px-4 py-2 text-slate-700 hover:bg-slate-50 font-medium"
                    >
                      <ShieldCheck className="h-4 w-4 text-[#1769AA]" />
                      Officer Credentials & Settings
                    </Link>

                    <Link
                      href="/"
                      className="flex items-center gap-2 px-4 py-2 text-slate-700 hover:bg-slate-50 font-medium"
                    >
                      <Shield className="h-4 w-4 text-slate-400" />
                      Public Platform View
                    </Link>

                    <div className="border-t border-slate-100 my-1" />

                    <button
                      type="button"
                      onClick={logout}
                      className="w-full flex items-center gap-2 px-4 py-2 text-[#DC3545] hover:bg-red-50 font-medium text-left"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </header>

          {/* Mobile Drawer Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden bg-[#102A43] text-white border-b border-[#243B53] px-4 py-3 space-y-1">
              {sidebarLinks.map((item) => {
                const active = isActive(item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold',
                      active ? 'bg-[#1769AA] text-white' : 'text-slate-300 hover:bg-[#243B53]'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                    {Boolean(item.badgeCount && item.badgeCount > 0) && (
                      <span className="ml-auto px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-[#DC3545] text-white">
                        {item.badgeCount}
                      </span>
                    )}
                  </Link>
                );
              })}
              <div className="pt-2 border-t border-[#243B53] flex items-center justify-between">
                <span className="text-xs text-slate-400">{user?.email}</span>
                <Button size="sm" variant="ghost" onClick={logout} className="text-red-400 hover:text-red-300 text-xs">
                  Sign Out
                </Button>
              </div>
            </div>
          )}

          {/* Page Content Body */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
