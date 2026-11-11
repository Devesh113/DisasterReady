'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'emergency' | 'secondary' | 'outline' | 'ghost' | 'success';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading = false, children, disabled, ...props }, ref) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none cursor-pointer';

    const variants = {
      primary: 'bg-[#1769AA] text-white hover:bg-[#125386] focus-visible:ring-[#1769AA] shadow-sm',
      emergency: 'bg-[#DC3545] text-white hover:bg-[#b02a37] focus-visible:ring-[#DC3545] shadow-sm',
      secondary: 'bg-[#102A43] text-white hover:bg-[#243B53] focus-visible:ring-[#102A43] shadow-sm',
      outline: 'border border-[#D9E2EC] bg-white text-[#172B4D] hover:bg-[#F5F7FA] focus-visible:ring-[#1769AA]',
      ghost: 'bg-transparent text-[#172B4D] hover:bg-[#F5F7FA] focus-visible:ring-[#1769AA]',
      success: 'bg-[#16A34A] text-white hover:bg-[#15803d] focus-visible:ring-[#16A34A] shadow-sm',
    };

    const sizes = {
      sm: 'text-xs px-3 py-1.5 gap-1.5',
      md: 'text-sm px-4 py-2 gap-2',
      lg: 'text-base px-6 py-3 gap-2.5',
      icon: 'h-9 w-9 p-0',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading && <Loader2 className="h-4 w-4 animate-spin text-current" />}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
