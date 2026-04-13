import React from 'react';
import { cn } from '../../lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, leftIcon, id, ...props }, ref) => {
    const generatedId = React.useId();
    const inputId = id || generatedId;

    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label htmlFor={inputId} className="text-[#FF5900] font-semibold text-sm">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-4 text-[#FFAA6E]">
              {leftIcon}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            className={cn(
              'flex h-12 w-full rounded-2xl border-2 border-[#FFD3A5] bg-white px-4 py-2 text-base ring-offset-white placeholder:text-[#FFD3A5] focus-visible:outline-none focus-visible:border-[#FF8237] disabled:cursor-not-allowed disabled:opacity-50 transition-colors',
              leftIcon && 'pl-11',
              error && 'border-red-500 focus-visible:border-red-500',
              className
            )}
            {...props}
          />
        </div>
        {error && <span className="text-sm text-red-500 font-medium px-1">{error}</span>}
      </div>
    );
  }
);
Input.displayName = 'Input';
