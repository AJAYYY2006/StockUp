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
            'bg-[#FFFBDC] text-[#FF5900] border border-[#FFD3A5]': variant === 'default' || variant === 'free',
            'bg-[#FF5900] text-[#FFFBDC]': variant === 'pro',
            'bg-[#FF8237] text-[#FFFBDC]': variant === 'basic',
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
