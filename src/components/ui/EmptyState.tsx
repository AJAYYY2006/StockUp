import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import { Button } from './Button';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon: Icon, title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center p-8 text-center h-full w-full max-w-sm mx-auto"
    >
      <div className="w-20 h-20 bg-[#FF8237]/10 rounded-full flex items-center justify-center mb-6 border border-[#FFD3A5]/30 shadow-inner">
        <Icon size={32} className="text-[#FF8237]" />
      </div>
      
      <h3 className="text-[#FF5900] text-lg font-black tracking-tight mb-2">
        {title}
      </h3>
      
      <p className="text-[#FFAA6E] text-sm font-medium leading-relaxed mb-8">
        {description}
      </p>

      {actionLabel && onAction && (
        <Button onClick={onAction} className="w-full sm:w-auto shadow-md">
          {actionLabel}
        </Button>
      )}
    </motion.div>
  );
}
