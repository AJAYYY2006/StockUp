import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../store/auth';
import { useInventoryStore } from '../store/inventory';
import { useExpenseStore } from '../store/expenses';
import { useCustomersStore } from '../store/customers';
import { PageTransition } from '../components/layout/PageTransition';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import { AlertCircle, IndianRupee, TrendingDown, TrendingUp, ArrowRight, Plus, Store, Package, Users } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { cn } from '../lib/utils';
import { supabase } from '../lib/supabase';

export default function DashboardScreen() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const { items: inventory, fetchItems } = useInventoryStore();
  const { items: expenses, fetchExpenses } = useExpenseStore();
  const { t } = useTranslation();
  
  const [showLowStockModal, setShowLowStockModal] = useState(false);
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const { fetchCustomers: fetchAllCustomers } = useCustomersStore();

  useEffect(() => {
    const loadDashboardData = async () => {
      setLoading(true);
      await Promise.all([
        fetchItems(),
        fetchExpenses(),
        fetchAllCustomers(),
      ]);
      
      const { data: salesData } = await supabase
        .from('sales')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (salesData) setSales(salesData);
      setLoading(false);
    };

    loadDashboardData();
  }, []);

  // Derive greeting
  const hour = new Date().getHours();
  const timeKey = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';
  const greetingText = t(`greeting.${timeKey}`, { defaultValue: hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening' });

  // Calculate Metrics
  const today = new Date().toISOString().split('T')[0];
  const todaySales = sales.filter(s => s.created_at.startsWith(today));
  
  const totalRevenue = sales.reduce((sum, s) => sum + (s.total_amount || 0), 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const totalProfit = totalRevenue - totalExpenses; // Simplified net cashflow

  // Total Credit of Today
  const todayCredit = todaySales.reduce((sum, s) => sum + (s.udhar_amount || 0), 0);
  // Total Revenue Today - Total Credit Today (Actual Cash Received Today)
  const todayRevenue = todaySales.reduce((sum, s) => sum + (s.total_amount || 0), 0);
  const todayCash = todayRevenue - todayCredit;

  const MAIN_METRICS = [
    { id: 'rev', labelKey: "dashboard.revenue", amount: `₹${totalRevenue.toLocaleString()}`, icon: TrendingUp, color: "text-[#5F714B]", bg: "bg-[#CFC3A7]/50" },
    { id: 'exp', labelKey: "dashboard.expense", amount: `₹${totalExpenses.toLocaleString()}`, icon: TrendingDown, color: "text-[#95A07A]", bg: "bg-[#F8F3E5]" },
    { id: 'prf', labelKey: "dashboard.profit", amount: `₹${totalProfit.toLocaleString()}`, icon: IndianRupee, color: "text-[#F8F3E5]", bg: "bg-[#95A07A]", cardBg: "bg-[#95A07A]" },
  ];

  const SECONDARY_METRICS = [
    { id: 'tcs', labelKey: "Today's Cash", amount: `₹${todayCash.toLocaleString()}`, icon: TrendingUp, color: "text-[#5F714B]", bg: "bg-white", isDynamic: true },
    { id: 'tud', labelKey: "Today's Credit", amount: `₹${todayCredit.toLocaleString()}`, icon: Users, color: "text-[#5F714B]", bg: "bg-white", isDynamic: true },
  ];

  // Combine Recent Transactions
  const recentSales = sales.slice(0, 3).map(s => ({
    id: `sale-${s.id}`,
    type: 'IN',
    title: `Sale: Bill #${s.id.slice(0, 4)}`,
    amount: `+₹${s.total_amount}`,
    time: new Date(s.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    timestamp: new Date(s.created_at).getTime()
  }));

  const recentExpenses = expenses.slice(0, 2).map(e => ({
    id: `exp-${e.id}`,
    type: 'OUT',
    title: e.vendor || e.category,
    amount: `-₹${e.amount}`,
    time: new Date(e.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    timestamp: new Date(e.date).getTime()
  }));

  const combinedRecentTXNs = [...recentSales, ...recentExpenses].sort((a, b) => b.timestamp - a.timestamp);

  // Calculate low stock items
  const lowStockItems = inventory.filter(item => item.quantity <= item.lowStockThreshold);

  return (
    <PageTransition className="flex flex-col h-full bg-[#F8F3E5] text-[#5F714B] p-4 md:p-8 lg:p-12 gap-6 pb-24 font-plus-jakarta overflow-x-hidden">
      
      {/* Header Container */}
      <div className="flex items-start justify-between w-full">
        <div className="flex flex-col">
          <motion.h1 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-2xl md:text-3xl font-black tracking-tight text-[#5F714B]"
          >
            {greetingText}, {user?.ownerName?.split(' ')[0] || user?.email?.split('@')[0] || t('common.user', 'User')}! 🌿
          </motion.h1>
          <p className="text-xs md:text-sm font-bold text-[#9BA88D] mt-1 flex items-center gap-1.5 opacity-80">
            <Store size={14} /> {user?.storeName || 'My Store'}
          </p>
        </div>
        <div className="pt-1">
          <Badge variant="pro" className="bg-gradient-to-r from-[#5F714B] to-[#95A07A] text-white px-3 py-1 text-[10px] font-black border-none shadow-premium italic tracking-widest leading-none">
            PRO
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 lg:gap-12 gap-6 w-full max-w-7xl mx-auto">
        
        {/* LEFT COLUMN: Metrics & Alerts */}
        <div className="flex flex-col gap-8 order-1">
          
          <div className="flex flex-col gap-4">
             <div className="flex items-center justify-between px-1">
               <h2 className="text-[#5F714B] font-black text-xl tracking-tighter">{t('dashboard.energyToday')}</h2>
               <span className="text-[10px] font-black text-[#9BA88D] uppercase tracking-[0.2em]">{t('dashboard.realtimeStatus')}</span>
             </div>
             
             {/* Horizontal/Stacked Metric Cards */}
             <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               transition={{ delay: 0.1 }}
               className="flex flex-col sm:flex-row lg:flex-col gap-4 scroll-smooth items-stretch"
             >
               {MAIN_METRICS.map((metric) => {
                 const Icon = metric.icon;
                 const isProfit = metric.id === 'prf';
                 return (
                    <Card 
                      key={metric.id} 
                      className={cn(
                        "flex-1 p-6 shadow-[0_4px_20px_rgba(15,42,29,0.04)] rounded-[24px] border-none flex items-center justify-between transition-all active:scale-[0.98]",
                        isProfit ? "bg-[#95A07A] text-white h-32" : "bg-white h-28"
                      )}
                    >
                      <div className="flex flex-col justify-center h-full">
                        <span className={cn(
                            "text-[10px] font-black uppercase tracking-widest leading-none mb-2",
                            isProfit ? "text-[#CFC3A7]" : "text-[#9BA88D]"
                        )}>{'isDynamic' in metric && metric.isDynamic ? metric.labelKey : t(metric.labelKey)}</span>
                        <p className={cn(
                          "text-2xl md:text-3xl font-black tracking-tighter leading-none",
                          isProfit ? "text-[#F8F3E5]" : "text-[#5F714B]"
                        )}>
                          {loading ? '...' : metric.amount}
                        </p>
                      </div>
                      <div className={cn(
                          "p-3 rounded-2xl",
                          isProfit ? "bg-white/10 text-white" : metric.bg + " " + metric.color
                      )}>
                        <Icon size={24} strokeWidth={3} />
                      </div>
                    </Card>
                 );
               })}
             </motion.div>
          </div>

          {/* Quick Actions */}
          <div className="flex gap-4">
            <Button
              onClick={() => navigate('/billing')}
              className="flex-1 bg-[#95A07A] hover:bg-[#5F714B] text-white font-black text-xs rounded-2xl h-16 border-none shadow-sm transition-all flex items-center justify-center gap-3"
            >
              <Plus size={20} /> {t('dashboard.newBill')}
            </Button>
            <Button
              onClick={() => navigate('/expenses')}
              className="flex-1 bg-white hover:bg-[#F8F3E5]/50 text-[#5F714B] font-black text-xs rounded-2xl h-16 border-2 border-[#CFC3A7]/30 shadow-none transition-all flex items-center justify-center gap-3"
            >
              <Plus size={20} /> {t('dashboard.addExpense')}
            </Button>
          </div>

          {/* Low Stock Alert Banner */}
          <motion.div
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => setShowLowStockModal(true)}
            className="group flex items-center justify-between p-5 bg-[#fceded] hover:bg-[#ffebeb] border border-[#f5c6c6]/50 rounded-[28px] cursor-pointer transition-all shadow-sm"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                <AlertCircle size={24} className="text-[#d63a3a]" />
              </div>
              <div className="flex flex-col">
                <span className="text-base font-black text-[#d63a3a] leading-tight tracking-tight">
                  {lowStockItems.length} {t('dashboard.runningLow')}
                </span>
                <span className="text-[10px] font-bold text-[#d63a3a]/60 uppercase tracking-widest">{t('dashboard.inventoryAlert')}</span>
              </div>
            </div>
            <ArrowRight size={24} className="text-[#d63a3a]/40 group-hover:translate-x-1 transition-transform" />
          </motion.div>
        </div>

        {/* RIGHT COLUMN: Recent Energy */}
        <div className="flex flex-col gap-10 order-2">
          {/* Recent Transactions List */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="flex flex-col gap-4">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-[#5F714B] font-black text-xl tracking-tighter">{t('dashboard.recentEnergy')}</h2>
              <button
                onClick={() => navigate('/reports')}
                className="text-[#95A07A] text-[10px] font-black uppercase tracking-[0.2em] flex items-center hover:opacity-70 transition-opacity"
              >
                {t('common.viewAll')} <ArrowRight size={14} className="ml-1.5" />
              </button>
            </div>
            
            <Card 
              onClick={() => navigate('/reports')}
              className="p-3 bg-white rounded-[28px] border-none shadow-[0_4px_20px_rgba(15,42,29,0.04)] flex flex-col gap-1 cursor-pointer hover:shadow-lg transition-shadow active:scale-[0.99]"
            >
              {loading ? (
                <div className="p-8 text-center text-[#9BA88D] font-bold">Loading transactions...</div>
              ) : combinedRecentTXNs.length > 0 ? (
                combinedRecentTXNs.map((txn, i) => (
                  <div 
                    key={txn.id} 
                    className={cn(
                      "flex items-center justify-between p-4 rounded-2xl transition-colors hover:bg-[#F8F3E5]/20",
                      i !== combinedRecentTXNs.length - 1 ? 'border-b border-transparent' : ''
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <div className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                          txn.type === 'IN' ? 'bg-[#CFC3A7]/20 text-[#95A07A]' : 'bg-[#fceded] text-[#d63a3a]'
                      )}>
                        {txn.type === 'IN' ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
                      </div>
                      <div className="flex flex-col">
                        <p className="text-sm font-black text-[#5F714B] leading-none mb-1.5">{txn.title}</p>
                        <p className="text-[9px] font-black text-[#9BA88D] uppercase tracking-widest">{txn.time}</p>
                      </div>
                    </div>
                    <span className={cn(
                        "text-sm font-black tracking-tighter",
                        txn.type === 'IN' ? "text-[#95A07A]" : "text-[#5F714B]"
                    )}>
                      {txn.amount}
                    </span>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-[#9BA88D] font-bold">No recent transactions</div>
              )}
            </Card>
          </motion.div>

          {/* SECONDARY METRICS: Cash & Credit Today */}
          <div className="grid grid-cols-2 gap-4">
             {SECONDARY_METRICS.map((metric) => {
               const Icon = metric.icon;
               return (
                  <Card 
                    key={metric.id} 
                    className="p-5 shadow-[0_4px_20px_rgba(15,42,29,0.04)] rounded-[24px] border-none flex items-center justify-between bg-white h-24 hover:shadow-md transition-all active:scale-[0.98]"
                  >
                    <div className="flex flex-col justify-center">
                      <span className="text-[10px] font-black uppercase tracking-widest leading-none mb-1.5 text-[#9BA88D]">{metric.labelKey}</span>
                      <p className="text-xl font-black tracking-tighter leading-none text-[#5F714B] truncate">
                        {loading ? '...' : metric.amount}
                      </p>
                    </div>
                    <div className="p-2.5 bg-[#F8F3E5] text-[#95A07A] rounded-xl">
                      <Icon size={18} strokeWidth={3} />
                    </div>
                  </Card>
               );
             })}
          </div>
        </div>
      </div>

      {/* Low Stock Detailed Modal */}
      <Modal isOpen={showLowStockModal} onClose={() => setShowLowStockModal(false)} title={t('dashboard.lowStockWarning')}>
        <div className="flex flex-col gap-4">
          {lowStockItems.length > 0 ? (
            <div className="flex flex-col gap-3">
              {lowStockItems.map(item => (
                <div key={item.id} className="flex items-center justify-between p-4 bg-[#fceded]/50 rounded-2xl border border-[#f5c6c6]/30">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                      <Package size={20} className="text-[#95A07A]" />
                    </div>
                    <div className="flex flex-col">
                      <p className="text-sm font-black text-[#5F714B] leading-none mb-1">{item.name}</p>
                      <p className="text-[10px] font-bold text-[#9BA88D] uppercase tracking-wider">{item.category}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-[#d63a3a]">{item.quantity} {item.unit || 'units'} {t('dashboard.unitsLeft')}</p>
                    <p className="text-[10px] font-bold text-[#9BA88D] uppercase tracking-widest">{t('dashboard.min')} {item.lowStockThreshold}</p>
                  </div>
                </div>
              ))}
              <Button
                onClick={() => { setShowLowStockModal(false); navigate('/inventory'); }}
                className="mt-4 bg-[#95A07A] hover:bg-[#5F714B] text-white rounded-xl"
              >
                {t('dashboard.goToInventory')}
              </Button>
            </div>
          ) : (
            <div className="py-8 text-center bg-[#F8F3E5]/30 rounded-2xl">
              <p className="text-[#95A07A] font-bold">{t('dashboard.allHealthy')}</p>
            </div>
          )}
        </div>
      </Modal>

    </PageTransition>
  );
}
