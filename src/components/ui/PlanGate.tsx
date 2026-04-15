import React from 'react';
import { Lock } from 'lucide-react';
import { Button } from './Button';
import { Card } from './Card';

interface PlanGateProps {
  children: React.ReactNode;
  allowedPlans: string[];
  currentPlan: string;
  requiredFeatureMessage?: string;
  hideGate?: boolean;
  onUpgrade?: () => void;
}

export function PlanGate({ 
  children, 
  allowedPlans, 
  currentPlan, 
  requiredFeatureMessage = 'This feature requires an upgrade',
  hideGate = false,
  onUpgrade 
}: PlanGateProps) {
  const isAllowed = allowedPlans.includes(currentPlan) || hideGate;

  if (isAllowed) {
    return <>{children}</>;
  }

  return (
    <div className="relative overflow-hidden rounded-[16px]">
      <div className="opacity-30 pointer-events-none blur-sm filter select-none transition-all">
        {children}
      </div>
      
      <div className="absolute inset-0 z-10 flex items-center justify-center p-4 bg-[#F8F3E5]/40 backdrop-blur-[2px]">
        <Card className="w-full max-w-sm flex flex-col items-center justify-center text-center gap-4 py-8 px-6 shadow-xl border-[#CFC3A7]">
          <div className="h-12 w-12 rounded-full bg-[#F8F3E5] flex items-center justify-center text-[#5F714B] mb-2">
            <Lock size={24} />
          </div>
          <p className="text-base font-semibold text-[#5F714B] mb-2">
            {requiredFeatureMessage}
          </p>
          <Button onClick={onUpgrade} className="w-full">
            Upgrade Plan
          </Button>
        </Card>
      </div>
    </div>
  );
}
