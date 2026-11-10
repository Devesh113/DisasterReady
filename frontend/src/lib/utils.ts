import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return 'N/A';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return 'Invalid date';
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatDateTime(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return 'N/A';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return 'Invalid date';
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export function timeAgo(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return '';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '';
  const now = new Date();
  const diffInSec = Math.floor((now.getTime() - d.getTime()) / 1000);

  if (diffInSec < 60) return 'just now';
  const diffInMin = Math.floor(diffInSec / 60);
  if (diffInMin < 60) return `${diffInMin}m ago`;
  const diffInHours = Math.floor(diffInMin / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) return `${diffInDays}d ago`;
  return formatDate(d);
}

export type AlertSeverity = 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';

export function getSeverityBadgeStyles(severity: AlertSeverity | string) {
  switch (severity?.toUpperCase()) {
    case 'CRITICAL':
      return {
        bg: 'bg-red-100 text-red-800 border-red-300',
        badge: 'bg-[#DC3545] text-white',
        border: 'border-l-4 border-l-[#DC3545]',
        dot: 'bg-[#DC3545]',
        label: 'Critical',
      };
    case 'HIGH':
      return {
        bg: 'bg-orange-100 text-orange-800 border-orange-300',
        badge: 'bg-[#EA580C] text-white',
        border: 'border-l-4 border-l-[#EA580C]',
        dot: 'bg-[#EA580C]',
        label: 'High',
      };
    case 'MODERATE':
      return {
        bg: 'bg-amber-100 text-amber-900 border-amber-300',
        badge: 'bg-[#F59E0B] text-white',
        border: 'border-l-4 border-l-[#F59E0B]',
        dot: 'bg-[#F59E0B]',
        label: 'Moderate',
      };
    case 'LOW':
    default:
      return {
        bg: 'bg-emerald-100 text-emerald-800 border-emerald-300',
        badge: 'bg-[#16A34A] text-white',
        border: 'border-l-4 border-l-[#16A34A]',
        dot: 'bg-[#16A34A]',
        label: 'Low',
      };
  }
}

export function getStatusBadgeStyles(status: string) {
  switch (status?.toUpperCase()) {
    case 'ACTIVE':
    case 'UPCOMING':
    case 'REGISTERED':
      return 'bg-emerald-100 text-emerald-800 border border-emerald-300';
    case 'ONGOING':
    case 'UNDER_REVIEW':
      return 'bg-blue-100 text-blue-800 border border-blue-300';
    case 'COMPLETED':
    case 'RESOLVED':
    case 'VERIFIED':
      return 'bg-slate-100 text-slate-800 border border-slate-300';
    case 'EXPIRED':
    case 'CANCELLED':
    case 'REJECTED':
      return 'bg-rose-100 text-rose-800 border border-rose-300';
    default:
      return 'bg-gray-100 text-gray-800 border border-gray-300';
  }
}
