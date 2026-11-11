import * as React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'brand' | 'emergency' | 'warning' | 'success' | 'outline' | 'secondary';
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  const variants = {
    default: 'bg-slate-100 text-slate-800 border-slate-200',
    brand: 'bg-[#E3F2FD] text-[#1769AA] border-[#BBDEFB]',
    emergency: 'bg-red-50 text-[#DC3545] border-red-200',
    warning: 'bg-amber-50 text-[#B45309] border-amber-200',
    success: 'bg-emerald-50 text-[#16A34A] border-emerald-200',
    outline: 'text-[#172B4D] border-[#D9E2EC]',
    secondary: 'bg-[#102A43] text-white border-transparent',
  };

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors',
        variants[variant],
        className
      )}
      {...props}
    />
  );
}
