import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Store, Bell, User, AlertTriangle, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../../store/auth';
import { useInventoryStore } from '../../store/inventory';
import { useCustomersStore } from '../../store/customers';
import { useTranslation } from 'react-i18next';
import paisaLogo from '../../assets/paisa_logo.png';

export function MobileHeader() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const user = useAuthStore((state) => state.user);
  const inventory = useInventoryStore((state) => state.items);
  const customers = useCustomersStore((state) => state.items);
  const [showNotifications, setShowNotifications] = useState(false);

  const lowStockItems = inventory.filter(item => item.quantity <= item.lowStockThreshold);
  const overdueCustomers = customers.filter(c => {
    if (c.balance <= 0) return false;
    const diffDays = Math.floor((Date.now() - new Date(c.lastTransactionDate).getTime()) / (1000 * 3600 * 24));
    return diffDays > 5;
  });
  const totalNotifications = lowStockItems.length + overdueCustomers.length;

  return (
    <header className="md:hidden flex items-center justify-between px-4 py-3 bg-[#FF5900] sticky top-0 z-30 shadow-md">
      {/* Branding */}
      <div className="flex items-center gap-2">
        <div className="w-10 h-10 rounded-2xl flex items-center justify-center overflow-hidden shrink-0">
          <img src={paisaLogo} alt="Paisa Logo" className="w-full h-full object-cover" />
        </div>
        <span className="text-[#FFD3A5] text-[9px] font-bold uppercase tracking-widest truncate max-w-[100px]">
          {user?.storeName || 'My Store'}
        </span>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2">
        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="w-9 h-9 rounded-xl bg-[#FF8237]/60 flex items-center justify-center text-[#FFFBDC] relative"
          >
            <Bell size={18} />
            {totalNotifications > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-yellow-300 rounded-full border border-[#FF5900]" />
            )}
          </button>

          <AnimatePresence>
            {showNotifications && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setShowNotifications(false)}
                  className="fixed inset-0 z-40"
                />
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.95 }}
                  className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-[#FFD3A5]/30 p-3 z-50 max-h-[60vh] overflow-y-auto"
                >
                  <h3 className="text-[10px] font-black text-[#FFAA6E] uppercase tracking-widest px-1 mb-2">
                    {t('common.recentAlerts', 'Recent Alerts')}
                  </h3>

                  {totalNotifications === 0 && (
                    <p className="text-xs font-bold text-[#FFAA6E] text-center py-4">
                      {t('common.noAlerts', 'All clear!')}
                    </p>
                  )}

                  {lowStockItems.map(item => (
                    <div key={item.id} className="p-2.5 bg-red-50 rounded-xl flex items-start gap-2 mb-2 border border-red-100">
                      <AlertTriangle size={14} className="text-red-500 mt-0.5 shrink-0" />
                      <p className="text-xs font-bold text-red-800">
                        {item.name} — {item.quantity} left
                      </p>
                    </div>
                  ))}

                  {overdueCustomers.map(c => (
                    <div key={c.id} className="p-2.5 bg-blue-50 rounded-xl flex items-start gap-2 mb-2 border border-blue-100">
                      <MessageSquare size={14} className="text-blue-500 mt-0.5 shrink-0" />
                      <p className="text-xs font-bold text-blue-800">
                        {c.name} — ₹{c.balance.toLocaleString()} unpaid
                      </p>
                    </div>
                  ))}

                  <button
                    onClick={() => setShowNotifications(false)}
                    className="w-full py-2 mt-1 bg-[#FFFBDC] text-[#FF8237] font-black text-[10px] uppercase rounded-xl"
                  >
                    {t('common.dismissAll', 'Dismiss All')}
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* Profile Avatar */}
        <button
          onClick={() => navigate('/settings')}
          className="w-9 h-9 rounded-xl bg-[#FFFBDC] flex items-center justify-center text-[#FF5900] shadow-sm"
        >
          <User size={18} />
        </button>
      </div>
    </header>
  );
}
