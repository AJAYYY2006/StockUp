import React from 'react';
import { cn } from '../../lib/utils';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'pro' | 'basic' | 'free' | 'success' | 'warning' | 'error';
}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors',
          {
            'bg-[#F8F3E5] text-[#5F714B] border border-[#CFC3A7]': variant === 'default' || variant === 'free',
            'bg-[#5F714B] text-[#F8F3E5]': variant === 'pro',
            'bg-[#95A07A] text-[#F8F3E5]': variant === 'basic',
            'bg-green-100 text-green-800 border border-green-200': variant === 'success',
            'bg-orange-100 text-orange-800 border border-orange-200': variant === 'warning',
            'bg-red-100 text-red-800 border border-red-200': variant === 'error',
          },
          className
        )}
        {...props}
      />
    );
  }
);
Badge.displayName = 'Badge';
