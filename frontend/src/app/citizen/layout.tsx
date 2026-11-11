'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  ShieldAlert,
  LayoutDashboard,
  BookOpen,
  AlertTriangle,
  Calendar,
  MapPin,
  FileText,
  PhoneCall,
  CheckSquare,
  Bell,
  Gamepad2,
  User,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Shield,
  Radio,
  ExternalLink,
} from 'lucide-react';
import ProtectedRoute from '@/components/shared/ProtectedRoute';
import { useAuth } from '@/hooks/useAuth';
import { notificationService } from '@/services/notification.service';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';

export default function CitizenLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  // Poll or query unread notifications count for the top bar indicator
  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['notifications-unread-count'],
    queryFn: () => notificationService.getUnreadCount(),
    refetchInterval: 30000, // Check every 30 seconds
    enabled: Boolean(user),
  });

  const sidebarLinks = [
    { href: '/citizen/dashboard', label: 'Overview', icon: LayoutDashboard },
    { href: '/citizen/alerts', label: 'Live Alerts', icon: Radio, highlight: true },
    { href: '/citizen/awareness', label: 'Disaster Hub', icon: BookOpen },
    { href: '/citizen/map', label: 'Emergency Map', icon: MapPin },
    { href: '/citizen/reports', label: 'Incident Reports', icon: FileText },
    { href: '/citizen/assistance', label: 'Emergency Help', icon: PhoneCall },
    { href: '/citizen/events', label: 'Drills & Events', icon: Calendar },
    { href: '/citizen/preparedness', label: 'Preparedness Kit', icon: CheckSquare },
    { href: '/citizen/notifications', label: 'Notifications', icon: Bell, badgeCount: unreadCount },
    { href: '/citizen/simulations', label: '3D Simulations', icon: Gamepad2 },
    { href: '/citizen/profile', label: 'Profile & Settings', icon: User },
  ];

  const isActive = (href: string) => {
    if (href === '/citizen/dashboard') return pathname === '/citizen/dashboard';
    return pathname.startsWith(href);
  };

  const userInitials =
    user?.firstName && user?.lastName
      ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
      : user?.firstName
      ? user.firstName[0].toUpperCase()
      : 'C';

  return (
    <ProtectedRoute requiredRole={['CITIZEN', 'ADMIN']}>
      <div className="min-h-screen bg-[#F5F7FA] flex flex-col md:flex-row">
        {/* ========================================================
            SIDEBAR (DESKTOP)
            ======================================================== */}
        <aside className="hidden md:flex md:w-64 flex-col bg-[#102A43] text-white shrink-0 sticky top-0 h-screen border-r border-[#243B53]">
          {/* Brand Header */}
          <div className="h-16 flex items-center px-6 border-b border-[#243B53] gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#1769AA] text-white shadow-sm">
              <ShieldAlert className="h-5 w-5 text-[#DC3545]" />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-white block leading-none">
                Disaster<span className="text-[#64B5F6]">Ready</span>
              </span>
              <span className="text-[10px] text-blue-200 tracking-wider uppercase font-semibold block mt-0.5">
                Citizen Portal
              </span>
            </div>
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
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors relative',
                    active
                      ? 'bg-[#1769AA] text-white font-semibold shadow-sm'
                      : 'text-slate-300 hover:bg-[#243B53] hover:text-white'
                  )}
                >
                  <Icon className={cn('h-4 w-4 shrink-0', active ? 'text-white' : 'text-slate-400')} />
                  <span className="truncate">{item.label}</span>

                  {item.badgeCount !== undefined && item.badgeCount > 0 ? (
                    <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#DC3545] text-white">
                      {item.badgeCount}
                    </span>
                  ) : null}

                  {item.highlight && !active && (
                    <span className="ml-auto h-2 w-2 rounded-full bg-[#DC3545] animate-ping" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Citizen Status Footer in Sidebar */}
          <div className="p-4 border-t border-[#243B53] bg-[#0B1F33]">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-[#1769AA] text-white flex items-center justify-center font-bold text-xs shrink-0">
                {userInitials}
              </div>
              <div className="overflow-hidden flex-1">
                <span className="text-xs font-semibold text-white block truncate">
                  {user?.firstName} {user?.lastName}
                </span>
                <span className="text-[10px] text-emerald-400 font-medium block">
                  ● Verified Citizen
                </span>
              </div>
              <button
                onClick={() => logout()}
                className="text-slate-400 hover:text-red-400 p-1.5 rounded transition-colors"
                title="Sign Out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </aside>

        {/* ========================================================
            MAIN BODY (TOPBAR + CONTENT)
            ======================================================== */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top Bar */}
          <header className="h-16 bg-white border-b border-[#D9E2EC] px-4 sm:px-6 lg:px-8 flex items-center justify-between sticky top-0 z-40 shadow-xs">
            {/* Mobile Header Brand & Drawer Toggle */}
            <div className="flex items-center gap-3 md:hidden">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-lg text-[#102A43] hover:bg-[#F5F7FA]"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
              <span className="font-bold text-base text-[#102A43]">
                Disaster<span className="text-[#1769AA]">Ready</span>
              </span>
            </div>

            {/* Desktop Left Status */}
            <div className="hidden md:flex items-center gap-3 text-xs text-[#627D98]">
              <span className="flex items-center gap-1.5 font-medium text-[#102A43]">
                <Shield className="h-4 w-4 text-[#16A34A]" />
                Authenticated Session
              </span>
              <span className="text-slate-300">|</span>
              <span>Emergency Dispatch: <strong>112 / 911</strong></span>
            </div>

            {/* Topbar Right Controls */}
            <div className="flex items-center gap-3 ml-auto">
              {/* Emergency Report Quick Action */}
              <Link href="/citizen/reports">
                <Button variant="emergency" size="sm" className="gap-1.5 text-xs py-1.5 shadow-xs">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Report Incident</span>
                  <span className="sm:hidden">Report</span>
                </Button>
              </Link>

              {/* Notification Indicator Bell */}
              <Link
                href="/citizen/notifications"
                className="p-2 rounded-lg text-[#627D98] hover:text-[#102A43] hover:bg-[#F5F7FA] relative transition-colors"
                title="Notifications"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#DC3545] text-white text-[10px] font-bold shadow-xs">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Link>

              {/* Profile Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-[#F5F7FA] transition-colors cursor-pointer"
                >
                  <div className="h-8 w-8 rounded-full bg-[#102A43] text-white flex items-center justify-center font-bold text-xs">
                    {userInitials}
                  </div>
                  <div className="hidden lg:block text-left">
                    <span className="text-xs font-semibold text-[#102A43] block leading-tight">
                      {user?.firstName}
                    </span>
                    <span className="text-[10px] text-[#627D98] block">Citizen</span>
                  </div>
                  <ChevronDown className="h-3.5 w-3.5 text-[#627D98]" />
                </button>

                {/* Dropdown Menu */}
                {userDropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setUserDropdownOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-56 rounded-xl border border-[#D9E2EC] bg-white p-2 shadow-lg z-50 text-xs space-y-1">
                      <div className="p-2 border-b border-[#D9E2EC] mb-1">
                        <span className="font-bold text-[#102A43] block truncate">
                          {user?.firstName} {user?.lastName}
                        </span>
                        <span className="text-[11px] text-[#627D98] block truncate">
                          {user?.email}
                        </span>
                      </div>

                      <Link
                        href="/citizen/profile"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-[#172B4D] hover:bg-[#F5F7FA] transition-colors"
                      >
                        <User className="h-4 w-4 text-[#1769AA]" />
                        <span>Account Profile</span>
                      </Link>

                      <Link
                        href="/citizen/assistance"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-[#172B4D] hover:bg-[#F5F7FA] transition-colors"
                      >
                        <PhoneCall className="h-4 w-4 text-emerald-600" />
                        <span>Emergency Contacts</span>
                      </Link>

                      <Link
                        href="/"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-[#172B4D] hover:bg-[#F5F7FA] transition-colors"
                      >
                        <ExternalLink className="h-4 w-4 text-slate-500" />
                        <span>Public Website</span>
                      </Link>

                      <div className="pt-1 border-t border-[#D9E2EC]">
                        <button
                          type="button"
                          onClick={() => {
                            setUserDropdownOpen(false);
                            logout();
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors font-medium cursor-pointer"
                        >
                          <LogOut className="h-4 w-4" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </header>

          {/* Mobile Drawer Navigation */}
          {mobileMenuOpen && (
            <div className="md:hidden border-b border-[#D9E2EC] bg-[#102A43] text-white px-4 py-4 space-y-1 shadow-md">
              {sidebarLinks.map((item) => {
                const active = isActive(item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                      active
                        ? 'bg-[#1769AA] text-white font-semibold'
                        : 'text-slate-300 hover:bg-[#243B53]'
                    )}
                  >
                    <Icon className="h-4 w-4 text-slate-400" />
                    <span>{item.label}</span>
                    {item.badgeCount !== undefined && item.badgeCount > 0 ? (
                      <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#DC3545] text-white">
                        {item.badgeCount}
                      </span>
                    ) : null}
                  </Link>
                );
              })}
              <div className="pt-3 border-t border-[#243B53]">
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-red-400 hover:bg-[#243B53] text-sm"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}

          {/* Dashboard Page Content */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
