import React from 'react';
import { cn } from '../../lib/utils';
import { motion } from 'framer-motion';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <motion.div
      initial={{ opacity: 0.5 }}
      animate={{ opacity: 0.8 }}
      transition={{
        repeat: Infinity,
        repeatType: "reverse",
        duration: 1,
        ease: "easeInOut"
      }}
      className={cn("rounded-2xl bg-[#CFC3A7]/30", className)}
      {...props as any}
    />
  );
}
