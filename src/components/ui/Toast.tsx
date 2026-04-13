
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { useToastStore } from '../../store/toast';
import { cn } from '../../lib/utils';

export function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  return (
    <div className="fixed top-4 left-0 right-0 z-50 flex flex-col items-center gap-2 pointer-events-none px-4">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
            className={cn(
              "pointer-events-auto flex items-center justify-between w-full max-w-sm p-4 rounded-2xl shadow-lg border",
              {
                'bg-white border-[#FFD3A5]': !toast.type || toast.type === 'info',
                'bg-[#FFFBDC] border-[#FFAA6E]': toast.type === 'success',
                'bg-red-50 border-red-200': toast.type === 'error',
              }
            )}
          >
            <div className="flex items-center gap-3">
              {toast.type === 'success' && <CheckCircle2 className="text-[#FF8237]" size={20} />}
              {toast.type === 'error' && <AlertCircle className="text-red-500" size={20} />}
              {(!toast.type || toast.type === 'info') && <Info className="text-[#FF5900]" size={20} />}
              
              <span className="text-[#FF5900] font-medium text-sm">
                {toast.message}
              </span>
            </div>
            <button 
              onClick={() => removeToast(toast.id)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={18} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
