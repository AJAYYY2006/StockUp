import { useState } from 'react';
import { Search, Bell, User, AlertTriangle, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { cn } from '../../lib/utils';
import { useLayoutStore } from '../../store/layout';
import { useAuthStore } from '../../store/auth';
import { useInventoryStore } from '../../store/inventory';
import { useCustomersStore } from '../../store/customers';

interface HeaderProps {
  title: string;
  className?: string;
}

export function Header({ title, className }: HeaderProps) {
  const navigate = useNavigate();
  const { headerActions } = useLayoutStore();
  const [showNotifications, setShowNotifications] = useState(false);
  const { t } = useTranslation();
  
  const user = useAuthStore((state) => state.user);
  const inventory = useInventoryStore((state) => state.items);
  const customers = useCustomersStore((state) => state.items);

  // Dynamic alerts
  const lowStockItems = inventory.filter(item => item.quantity <= item.lowStockThreshold);
  const overdueCustomers = customers.filter(c => {
    if (c.balance <= 0) return false;
    const lastDate = new Date(c.lastTransactionDate);
    const today = new Date();
    const diffDays = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 3600 * 24));
    return diffDays > 5; // Long term unpaid (5+ days)
  });

  const totalNotifications = lowStockItems.length + overdueCustomers.length;

  return (
    <header className={cn(
      "hidden md:flex items-center justify-between px-8 py-5 bg-transparent w-full z-30",
      className
    )}>
      {/* Title */}
      <div className="flex-1 min-w-0">
        <h1 className="text-2xl font-black text-[#FF5900] tracking-tight truncate">{title}</h1>
      </div>

      {/* Actions & Global Icons */}
      <div className="flex items-center gap-6 shrink-0 ml-4">
        {/* Contextual Actions Slot */}
        {headerActions && (
          <div className="flex items-center gap-3 pr-6 border-r border-[#FFD3A5]/50 animate-in fade-in slide-in-from-right-4 duration-300">
            {headerActions}
          </div>
        )}

        {/* Global Search */}
        <div className="relative group min-w-[240px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#FFAA6E] group-focus-within:text-[#FF5900] transition-colors" size={18} />
          <input 
            type="text" 
            placeholder={t('common.searchPlaceholder', 'Search...')} 
            className="w-full bg-white border border-[#FFD3A5]/30 rounded-2xl py-2.5 pl-11 pr-4 text-sm font-medium focus:outline-none focus:border-[#FF8237] focus:ring-2 focus:ring-[#FF8237]/5 transition-all shadow-sm group-hover:shadow-md"
          />
        </div>

        {/* Notifications */}
        <div className="relative">
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2.5 rounded-2xl bg-white border border-[#FFD3A5]/30 text-[#FFAA6E] hover:bg-[#FF8237] hover:text-white transition-all shadow-sm hover:shadow-md relative"
          >
            <Bell size={20} />
            {totalNotifications > 0 && (
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
            )}
          </button>

          <AnimatePresence>
            {showNotifications && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute right-0 mt-3 w-80 bg-white rounded-3xl shadow-[0_20px_50px_rgba(15,42,29,0.15)] border border-[#FFD3A5]/30 p-4 z-50 max-h-[500px] overflow-y-auto"
              >
                <div className="flex flex-col gap-3">
                  <h3 className="text-[10px] font-black text-[#FFD3A5] uppercase tracking-[0.2em] px-2 mb-1">{t('common.recentAlerts', 'Recent Alerts')}</h3>
                  
                  {totalNotifications === 0 && (
                    <div className="py-8 text-center">
                      <p className="text-xs font-bold text-[#FFAA6E]">{t('common.noAlerts', 'All clear! No alerts today.')}</p>
                    </div>
                  )}

                  {/* Low Stock dynamic list */}
                  {lowStockItems.map(item => (
                    <div key={item.id} className="p-3 bg-red-50 rounded-2xl flex items-start gap-3 border border-red-100">
                      <div className="w-8 h-8 bg-red-500 rounded-xl flex items-center justify-center text-white shrink-0">
                        <AlertTriangle size={16} />
                      </div>
                      <div>
                        <h4 className="text-[11px] font-black text-red-600 uppercase tracking-widest">{t('inventory.lowStock', 'Low Stock')}</h4>
                        <p className="text-xs font-bold text-red-900 mt-0.5">{item.name} ({item.quantity} {item.unit} {t('dashboard.unitsLeft', 'left')})</p>
                      </div>
                    </div>
                  ))}

                  {/* Udhar dynamic list */}
                  {overdueCustomers.map(c => (
                    <div key={c.id} className="p-3 bg-blue-50 rounded-2xl flex items-start gap-3 border border-blue-100">
                      <div className="w-8 h-8 bg-blue-500 rounded-xl flex items-center justify-center text-white shrink-0">
                        <MessageSquare size={16} />
                      </div>
                      <div>
                        <h4 className="text-[11px] font-black text-blue-600 uppercase tracking-widest">{t('customers.udharReminder', 'Udhar Reminder')}</h4>
                        <p className="text-xs font-bold text-blue-900 mt-0.5">{c.name}: ₹{c.balance.toLocaleString()} unpaid</p>
                      </div>
                    </div>
                  ))}

                  <button 
                    onClick={() => setShowNotifications(false)}
                    className="w-full py-2.5 mt-2 bg-[#FFFBDC] text-[#FF8237] font-black text-[10px] uppercase rounded-xl hover:bg-[#FF8237] hover:text-white transition-all shadow-sm"
                  >
                    {t('common.dismissAll', 'Dismiss All')}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* User Profile */}
        <div 
          onClick={() => navigate('/settings')}
          className="flex items-center gap-3 pl-4 border-l border-[#FFD3A5]/50 cursor-pointer group"
        >
          <div className="text-right">
            <p className="text-xs font-black text-[#FF5900] group-hover:text-[#FF8237] truncate max-w-[120px]">
              {user?.ownerName || t('common.owner', 'Owner')}
            </p>
            <p className="text-[10px] font-bold text-[#FFAA6E] uppercase tracking-wider">{t('common.owner', 'Owner')}</p>
          </div>
          <button className="w-10 h-10 rounded-2xl bg-[#FF8237] flex items-center justify-center text-[#FFFBDC] shadow-lg border border-[#FF5900]/10 group-active:scale-95 transition-all">
            <User size={20} />
          </button>
        </div>
      </div>
    </header>
  );
}
