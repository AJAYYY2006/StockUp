import React from 'react';
import { cn } from '../../lib/utils';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

export interface ButtonProps extends React.ComponentProps<typeof motion.button> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  isLoading?: boolean;
  isSuccess?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'default', isLoading, isSuccess, children, ...props }, ref) => {
    return (
      <motion.button
        ref={ref}
        whileTap={{ scale: 0.97 }}
        className={cn(
          'inline-flex items-center justify-center rounded-2xl text-base font-semibold transition-all duration-300 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 min-h-[48px]',
          {
            'bg-[#5F714B] text-[#F8F3E5] hover:bg-[#5F714B]/90': variant === 'primary' && !isSuccess,
            'bg-[#F8F3E5] text-[#5F714B] hover:bg-[#F8F3E5]/90': variant === 'secondary' && !isSuccess,
            'border-2 border-[#CFC3A7] bg-white text-[#5F714B] hover:bg-gray-50': variant === 'outline' && !isSuccess,
            'hover:bg-[#F8F3E5] text-[#5F714B]': variant === 'ghost' && !isSuccess,
            
            // Success Overrides globally across all variants
            'bg-[#95A07A] text-[#F8F3E5] border-transparent shadow-lg': isSuccess,

            'h-12 px-6 py-2': size === 'default',
            'h-10 px-4 text-sm': size === 'sm',
            'h-14 px-8 text-lg': size === 'lg',
            'h-12 w-12': size === 'icon',
          },
          className
        )}
        disabled={isLoading || isSuccess || props.disabled}
        {...props}
      >
        {isLoading ? (
          <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : isSuccess ? (
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex items-center justify-center">
            <Check size={20} strokeWidth={3} className="mr-2" /> Saved
          </motion.div>
        ) : (
          children as React.ReactNode
        )}
      </motion.button>
    );
  }
);
Button.displayName = 'Button';
