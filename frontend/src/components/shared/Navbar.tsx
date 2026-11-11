'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ShieldAlert,
  AlertTriangle,
  Menu,
  X,
  BookOpen,
  Calendar,
  MapPin,
  Info,
  LogIn,
  LayoutDashboard,
  LogOut,
  User as UserIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuth();

  // If on citizen dashboard, hide public navbar to let citizen layout take over
  const isCitizenDashboard = pathname.startsWith('/citizen');
  const isAuthorityDashboard = pathname.startsWith('/authority');
  const isAdminDashboard = pathname.startsWith('/admin');

  if (isCitizenDashboard || isAuthorityDashboard || isAdminDashboard) {
    return null;
  }

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/awareness', label: 'Disaster Hub', icon: BookOpen },
    { href: '/alerts', label: 'Live Alerts', icon: AlertTriangle, highlight: true },
    { href: '/events', label: 'Drills & Workshops', icon: Calendar },
    { href: '/resources', label: 'Emergency Map', icon: MapPin },
    { href: '/about', label: 'About', icon: Info },
  ];

  const isActive = (path: string) => {
    if (path === '/') return pathname === '/';
    return pathname.startsWith(path);
  };

  const getDashboardLink = () => {
    if (user?.role === 'AUTHORITY') return '/authority/dashboard';
    if (user?.role === 'ADMIN') return '/admin/dashboard';
    return '/citizen/dashboard';
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#D9E2EC] bg-white/95 backdrop-blur shadow-xs">
      {/* Top micro alert strip */}
      <div className="bg-[#102A43] text-white text-xs py-1.5 px-4 text-center font-medium flex items-center justify-center gap-2">
        <span className="inline-block h-2 w-2 rounded-full bg-[#DC3545] animate-ping" />
        <span>Official National Emergency Platform — In an immediate life-threatening crisis, call emergency dispatch directly.</span>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-2.5 text-[#102A43] hover:opacity-90 transition-opacity">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#102A43] text-white shadow-sm">
              <ShieldAlert className="h-6 w-6 text-[#DC3545]" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-[#102A43] block leading-none">
                Disaster<span className="text-[#1769AA]">Ready</span>
              </span>
              <span className="text-[10px] text-[#627D98] tracking-widest uppercase font-semibold block">
                Preparedness & Response
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
            {navLinks.map((link) => {
              const active = isActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5',
                    active
                      ? 'bg-[#E3F2FD] text-[#1769AA] font-semibold'
                      : 'text-[#172B4D] hover:bg-[#F5F7FA] hover:text-[#102A43]'
                  )}
                >
                  {link.highlight && (
                    <span className="h-2 w-2 rounded-full bg-[#DC3545]" />
                  )}
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Action CTAs */}
          <div className="hidden md:flex items-center space-x-3">
            {isAuthenticated && user ? (
              <div className="flex items-center gap-3">
                <Link href={getDashboardLink()}>
                  <Button variant="primary" size="sm" className="gap-2">
                    <LayoutDashboard className="h-4 w-4" />
                    <span>{user.firstName}&apos;s Dashboard</span>
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => logout()}
                  className="gap-1.5 text-[#627D98] hover:text-[#DC3545]"
                  title="Sign Out"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" size="sm" className="gap-1.5 text-[#172B4D]">
                    <LogIn className="h-4 w-4" />
                    Sign In
                  </Button>
                </Link>
                <Link href="/register">
                  <Button variant="primary" size="sm">
                    Get Started
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile hamburger menu toggle */}
          <div className="flex md:hidden">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-[#102A43] hover:bg-[#F5F7FA]"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[#D9E2EC] bg-white px-4 pt-2 pb-6 space-y-1 shadow-lg">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const active = isActive(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-base font-medium transition-colors',
                  active
                    ? 'bg-[#E3F2FD] text-[#1769AA] font-semibold'
                    : 'text-[#172B4D] hover:bg-[#F5F7FA]'
                )}
              >
                {Icon && <Icon className="h-5 w-5 text-[#627D98]" />}
                <span>{link.label}</span>
                {link.highlight && (
                  <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-red-100 text-[#DC3545] font-semibold">
                    Live
                  </span>
                )}
              </Link>
            );
          })}
          <div className="pt-4 border-t border-[#D9E2EC] flex flex-col gap-2">
            {isAuthenticated && user ? (
              <>
                <Link href={getDashboardLink()} onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="primary" className="w-full justify-center gap-2">
                    <LayoutDashboard className="h-4 w-4" />
                    Go to Dashboard
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    logout();
                  }}
                  className="w-full justify-center gap-2 text-[#DC3545] border-red-200"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="outline" className="w-full justify-center">
                    Sign In
                  </Button>
                </Link>
                <Link href="/register" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="primary" className="w-full justify-center">
                    Get Started
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
