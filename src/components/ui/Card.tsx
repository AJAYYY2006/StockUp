import React from 'react';
import { cn } from '../../lib/utils';
import { motion } from 'framer-motion';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  animated?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, animated, children, ...props }, ref) => {
    const Component = animated ? motion.div : 'div';
    const animationProps = animated ? {
      initial: { opacity: 0, y: 10 },
      animate: { opacity: 1, y: 0 },
    } : {};

    return (
      <Component
        ref={ref}
        className={cn(
          'bg-white border-2 border-[#CFC3A7] rounded-[16px] p-4 shadow-sm overflow-hidden',
          className
        )}
        {...animationProps}
        {...props as any}
      >
        {children as React.ReactNode}
      </Component>
    );
  }
);
Card.displayName = 'Card';
