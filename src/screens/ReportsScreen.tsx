import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '../store/auth';
import { useTranslation } from 'react-i18next';
import { PlanGate } from '../components/ui/PlanGate';
import { PageTransition } from '../components/layout/PageTransition';
import { Card } from '../components/ui/Card';
import { useLayoutStore } from '../store/layout';
import { useToastStore } from '../store/toast';
import { useInventoryStore } from '../store/inventory';
import { useCustomersStore } from '../store/customers';
import { useExpenseStore } from '../store/expenses';
import { supabase } from '../lib/supabase';
import { cn } from '../lib/utils';
import { 
  IndianRupee, 
  TrendingUp, 
  TrendingDown, 
  Percent, 
  Users,
  ChevronDown,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  FileDown,
  AlertTriangle,
  Zap
} from 'lucide-react';

// --- HELPER FOR REAL-TIME CALCULATIONS ---
function getStats(sales: any[], expenses: any[], previousSales: any[], previousExpenses: any[]) {
  const currentRevenue = sales.reduce((sum, s) => sum + (s.total_amount || 0), 0);
  const currentExpense = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const currentProfit = currentRevenue - currentExpense;

  const prevRevenue = previousSales.reduce((sum, s) => sum + (s.total_amount || 0), 0);
  const prevExpense = previousExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const prevProfit = prevRevenue - prevExpense;

  const calculateChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  };

  return {
    revenue: currentRevenue,
    revenueChange: calculateChange(currentRevenue, prevRevenue),
    expense: currentExpense,
    expenseChange: calculateChange(currentExpense, prevExpense),
    profit: currentProfit,
    profitChange: calculateChange(currentProfit, prevProfit),
    profitMargin: currentRevenue > 0 ? Math.round((currentProfit / currentRevenue) * 100) : 0,
    topProducts: [] as { name: string; value: number }[] // Derived later
  };
}

type TimeRange = 'Today' | 'This Week';

export default function ReportsScreen() {
  const user = useAuthStore((state) => state.user);
  const addToast = useToastStore((state) => state.addToast);
  const setHeaderActions = useLayoutStore((state) => state.setHeaderActions);
  const { t } = useTranslation();
  
  const [timeRange, setTimeRange] = useState<TimeRange>('This Week');
  const { items: inventory, fetchItems } = useInventoryStore();
  const { items: customers, fetchCustomers } = useCustomersStore();
  const { items: expenses, fetchExpenses } = useExpenseStore();
  const [sales, setSales] = useState<any[]>([]);

  useEffect(() => {
    const loadData = async () => {
      await Promise.all([
        fetchItems(),
        fetchCustomers(),
        fetchExpenses()
      ]);

      const { data: salesData } = await supabase
        .from('sales')
        .select('*, sale_items(*)');

      if (salesData) setSales(salesData);
    };
    loadData().catch(console.error);
  }, []);

  // Filter data based on timeRange
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay())).getTime();
  const rangeLimit = timeRange === 'Today' ? today : startOfWeek;

  const currentSales = sales.filter(s => new Date(s.created_at).getTime() >= rangeLimit);
  const currentExpenses = expenses.filter(e => new Date(e.date).getTime() >= rangeLimit);
  
  // For comparison
  const prevRangeLimit = timeRange === 'Today' 
    ? today - (24 * 60 * 60 * 1000) 
    : startOfWeek - (7 * 24 * 60 * 60 * 1000);
  
  const prevSales = sales.filter(s => {
    const t = new Date(s.created_at).getTime();
    return t >= prevRangeLimit && t < rangeLimit;
  });
  const prevExpenses = expenses.filter(e => {
    const t = new Date(e.date).getTime();
    return t >= prevRangeLimit && t < rangeLimit;
  });

  const stats = getStats(currentSales, currentExpenses, prevSales, prevExpenses);
  
  // Calculate Top Products dynamically
  const productPerformance: Record<string, number> = {};
  currentSales.forEach(s => {
    (s.sale_items || []).forEach((si: any) => {
      const productName = inventory.find(i => i.id === si.inventory_id)?.name || 'Unknown';
      productPerformance[productName] = (productPerformance[productName] || 0) + (si.quantity * si.unit_price);
    });
  });

  stats.topProducts = Object.entries(productPerformance)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, value]) => ({ name, value }));

  // Dynamic Udhar Data
  const dynamicUdharTotalCredit = customers.reduce((sum, c) => sum + (c.balance > 0 ? c.balance : 0), 0);
  const dynamicUdharCount = customers.filter(c => c.balance > 0).length;
  const dynamicUdharOutstanding = dynamicUdharTotalCredit; 

  const data = {
    ...stats,
    udharTotalCredit: dynamicUdharTotalCredit,
    udharCollected: 0, // Not explicitly tracked in simple store yet
    udharOutstanding: dynamicUdharOutstanding,
    udharCount: dynamicUdharCount,
  };

  // Logic for Slow Moving Items (Stock > 3x threshold and not a top seller)
  const slowMovingItems = inventory.filter(item => 
    item.quantity > item.lowStockThreshold * 3 && 
    !data.topProducts.some(tp => tp.name === item.name)
  ).slice(0, 5);

  // Logic for Demand Forecast (Items below or near threshold)
  const forecastItems = inventory.filter(item => 
    item.quantity <= item.lowStockThreshold * 1.5
  ).sort((a, b) => a.quantity - b.quantity).slice(0, 5);

  const handleExport = (format: string) => {
    addToast({ 
      message: t('reports.exportingAs', `Exporting Reports as ${format}...`), 
      type: 'success' 
    });
  };

  // Sync Header Actions for Desktop
  useEffect(() => {
    const desktopActions = (
      <div className="flex items-center gap-3">
        {/* Date Picker (Desktop Version) */}
        <div className="relative group mr-2">
          <Calendar size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#FF8237] z-10" />
          <select 
            value={timeRange} 
            onChange={(e) => setTimeRange(e.target.value as TimeRange)}
            className="appearance-none bg-white/50 hover:bg-white border border-[#FFD3A5]/40 text-[#FF8237] font-bold text-xs py-2 pl-10 pr-9 rounded-xl outline-none focus:ring-2 focus:ring-[#FF8237]/10 focus:border-[#FF8237]/40 cursor-pointer transition-all"
          >
            <option value="Today">{t('time.Today', 'Today')}</option>
            <option value="This Week">{t('time.ThisWeek', 'This Week')}</option>
          </select>
          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#FF8237] pointer-events-none" />
        </div>

        {/* Export Buttons */}
        <div className="flex items-center gap-2">
          <button 
            onClick={() => handleExport('CSV')}
            className="flex items-center gap-2 px-3 py-2 bg-white border border-[#FFD3A5]/40 text-[#FF8237] hover:bg-[#FF8237] hover:text-white rounded-xl text-xs font-black transition-all shadow-sm group"
          >
            <FileDown size={14} className="group-hover:scale-110 transition-transform" />
            CSV
          </button>
          <button 
            onClick={() => handleExport('JSON')}
            className="flex items-center gap-2 px-3 py-2 bg-white border border-[#FFD3A5]/40 text-[#FF8237] hover:bg-[#FF8237] hover:text-white rounded-xl text-xs font-black transition-all shadow-sm group"
          >
            <FileDown size={14} className="group-hover:scale-110 transition-transform" />
            JSON
          </button>
        </div>
      </div>
    );

    setHeaderActions(desktopActions);
    
    // Clear on unmount
    return () => setHeaderActions(null);
  }, [timeRange, setHeaderActions]);

  return (
    <PageTransition className="flex flex-col h-full min-h-screen pb-24 p-4 md:p-8 bg-[#FFFBDC] text-[#FF5900] transition-all">
      
      {/* Mobile Header & Date Range Picker (Hidden on Desktop) */}
      <div className="flex flex-col md:hidden z-10 pt-2 mb-8 gap-4">
        <div className="flex flex-col">
          <h2 className="text-3xl font-black tracking-tight text-[#FF5900]">{t('reports.title', 'Insights')}</h2>
          <p className="text-sm font-bold text-[#FFAA6E]">{t('reports.analyticsDesc', "Deep dive into your store's performance")}</p>
        </div>
        
        <div className="relative group">
          <Calendar size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#FF8237] z-10" />
          <select 
            value={timeRange} 
            onChange={(e) => setTimeRange(e.target.value as TimeRange)}
            className="appearance-none bg-white border-2 border-[#FFD3A5]/40 text-[#FF8237] font-black py-3 pl-12 pr-12 rounded-[20px] outline-none focus:ring-4 focus:ring-[#FF8237]/5 focus:border-[#FF8237] shadow-sm cursor-pointer transition-all"
          >
            <option value="Today">{t('time.Today', 'Today')}</option>
            <option value="This Week">{t('time.ThisWeek', 'This Week')}</option>
          </select>
          <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#FF8237] pointer-events-none" />
        </div>
      </div>

      <PlanGate 
        allowedPlans={['pro']} 
        currentPlan={user?.plan || 'free'}
        requiredFeatureMessage={t('reports.advancedReportsBanner', "Unlock Advanced Reports by upgrading to Pro.")}
      >
        <div className="flex flex-col gap-6 md:gap-8">

        {/* 4 Metric Cards Grid - Fixed 4 column on lg */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 text-[#FF5900]">
          
          {/* Total Revenue */}
          <Card className="p-5 border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white rounded-[24px] flex flex-col justify-between h-32 md:h-36 group hover:shadow-xl transition-all">
            <div className="flex items-center justify-between w-full">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-[#FFFBDC] text-[#FF8237] rounded-2xl flex items-center justify-center">
                <TrendingUp size={24} />
              </div>
              <span className={cn(
                "text-[10px] md:text-xs font-black px-2 py-1 rounded-lg flex items-center gap-0.5",
                data.revenueChange >= 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
              )}>
                {data.revenueChange >= 0 ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                {Math.abs(data.revenueChange)}%
              </span>
            </div>
            <div>
              <span className="text-[10px] font-black text-[#FFAA6E] uppercase tracking-[0.2em] mb-1 block">{t('reports.totalRevenue', "Total Revenue")}</span>
              <div className="text-2xl md:text-3xl font-black text-[#FF5900]">
                ₹{data.revenue.toLocaleString()}
              </div>
            </div>
          </Card>

          {/* Total Expense */}
          <Card className="p-5 border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white rounded-[24px] flex flex-col justify-between h-32 md:h-36 hover:shadow-xl transition-all font-inter">
            <div className="flex items-center justify-between w-full">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-[#FFD3A5]/20 text-[#FF5900] rounded-2xl flex items-center justify-center">
                <TrendingDown size={24} />
              </div>
              <span className={cn(
                "text-[10px] md:text-xs font-black px-2 py-1 rounded-lg flex items-center gap-0.5",
                data.expenseChange <= 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
              )}>
                {data.expenseChange <= 0 ? <ArrowDownRight size={10} /> : <ArrowUpRight size={10} />}
                {Math.abs(data.expenseChange)}%
              </span>
            </div>
            <div>
              <span className="text-[10px] font-black text-[#FFAA6E] uppercase tracking-[0.2em] mb-1 block">{t('reports.totalExpense', "Total Expense")}</span>
              <div className="text-2xl md:text-3xl font-black text-[#FF5900]">
                ₹{data.expense.toLocaleString()}
              </div>
            </div>
          </Card>

          {/* Net Profit */}
          <Card className="p-5 border-none shadow-2xl bg-[#FF5900] text-[#FFFBDC] rounded-[24px] flex flex-col justify-between h-32 md:h-36 relative overflow-hidden group hover:scale-[1.02] transition-all">
            <div className="absolute top-[-20px] right-[-20px] w-24 h-24 bg-[#FF8237] rounded-full blur-3xl opacity-30 group-hover:opacity-60 transition-opacity" />
            <div className="flex items-center justify-between w-full relative z-10">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-[#FF8237] text-[#FFFBDC] rounded-2xl flex items-center justify-center border border-[#FFD3A5]/10">
                <IndianRupee size={24} />
              </div>
              <span className="text-[10px] md:text-xs font-black bg-[#FF8237] text-[#FFD3A5] px-2 py-1 rounded-lg flex items-center gap-0.5">
                <ArrowUpRight size={10} /> {data.profitChange}%
              </span>
            </div>
            <div className="relative z-10">
              <span className="text-[10px] font-black text-[#FFD3A5] uppercase tracking-[0.2em] mb-1 block">{t('reports.netProfit', "Net Profit")}</span>
              <div className="text-2xl md:text-3xl font-black">
                ₹{data.profit.toLocaleString()}
              </div>
            </div>
          </Card>

          {/* Profit Margin */}
          <Card className="p-5 border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white rounded-[24px] flex flex-col justify-between h-32 md:h-36 hover:shadow-xl transition-all text-[#FF5900]">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-[#FFFBDC] text-[#FFAA6E] rounded-2xl flex items-center justify-center">
              <Percent size={24} />
            </div>
            <div>
              <span className="text-[10px] font-black text-[#FFAA6E] uppercase tracking-[0.2em] mb-1 block">{t('reports.profitMargin', "Profit Margin")}</span>
              <div className="text-2xl md:text-3xl font-black">
                {data.profitMargin}%
              </div>
            </div>
          </Card>

        </div>

        {/* Main Analytics Grid - Multi-column on desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 overflow-hidden">
          
          {/* Udhar / Khata Detailed Summary Card */}
          <motion.div 
            key={`udhar-detailed-${timeRange}`}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="w-full flex flex-col gap-6"
          >
             <Card className="p-8 md:p-10 border-none bg-gradient-to-br from-[#FFFBDC] to-white rounded-[32px] shadow-[0_10px_40px_rgba(15,42,29,0.05)] h-full overflow-hidden relative">
                <div className="absolute right-[-40px] bottom-[-40px] opacity-[0.03] rotate-12">
                   <Users size={320} className="text-[#FF8237]" />
                </div>
                
                <div className="flex items-center gap-5 mb-10 md:mb-12">
                   <div className="w-16 h-16 bg-[#FF8237] text-white rounded-[24px] flex items-center justify-center shadow-xl shadow-[#FF8237]/20 border border-[#FF5900]/10">
                      <Users size={32} />
                   </div>
                   <div className="flex flex-col">
                      <h3 className="text-2xl font-black text-[#FF5900]">{t('reports.udharKhata', "Udhar / Khata")}</h3>
                      <p className="text-xs font-bold text-[#FFAA6E] uppercase tracking-[0.2em]">{data.udharCount} {t('reports.activeAccounts', "active accounts")}</p>
                   </div>
                </div>

                <div className="flex flex-col gap-8 relative z-10">
                   <div className="grid grid-cols-2 gap-8">
                      <div className="flex flex-col gap-1.5">
                         <span className="text-[10px] font-black text-[#FFAA6E] uppercase tracking-[0.3em]">{t('reports.totalCredit', "Total Credit")}</span>
                         <span className="text-2xl font-black text-[#FF5900]">₹{data.udharTotalCredit.toLocaleString()}</span>
                      </div>
                      <div className="flex flex-col gap-1.5 text-right">
                         <span className="text-[10px] font-black text-[#FFAA6E] uppercase tracking-[0.3em]">{t('reports.totalCollected', "Total Collected")}</span>
                         <span className="text-2xl font-black text-[#FF8237]">₹{data.udharCollected.toLocaleString()}</span>
                      </div>
                   </div>
                   
                   <div className="h-px bg-[#FFD3A5]/30 w-full" />
                   
                   <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                         <span className="text-[10px] font-black text-[#FF8237] uppercase tracking-[0.3em]">{t('reports.outstandingBalance', "Outstanding Balance")}</span>
                         <div className="flex items-center gap-1.5 px-3 py-1 bg-white rounded-full border border-red-100 shadow-sm">
                            <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                            <span className="text-[10px] font-black text-red-600 uppercase tracking-widest">{t('reports.actionRequired', "Action Required")}</span>
                         </div>
                      </div>
                      <span className="text-5xl font-black text-[#FF5900] tracking-tight">₹{data.udharOutstanding.toLocaleString()}</span>
                   </div>
                </div>
             </Card>
          </motion.div>

          {/* Slow Moving Items Section */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="w-full bg-white rounded-[32px] border border-[#FFD3A5]/30 p-6 md:p-10 shadow-[0_10px_40px_rgb(15,42,29,0.03)] flex flex-col gap-6"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-xl md:text-2xl font-black text-[#FF5900]">{t('reports.slowMoving', "Slow Moving Items")}</h3>
              <AlertTriangle className="text-orange-400" size={24} />
            </div>
            <div className="flex flex-col gap-3">
              {slowMovingItems.length > 0 ? slowMovingItems.map(item => (
                <div key={item.id} className="flex items-center justify-between p-4 bg-[#FFFBDC]/30 rounded-2xl border border-[#FFD3A5]/10">
                  <div className="flex flex-col">
                    <span className="font-bold text-[#FF5900]">{item.name}</span>
                    <span className="text-[10px] font-bold text-[#FFAA6E] uppercase">{item.category}</span>
                  </div>
                  <div className="text-right">
                    <span className="block text-sm font-black text-[#FF8237]">{item.quantity} {item.unit || 'units'}</span>
                    <span className="text-[9px] font-bold text-orange-400 uppercase">High Stock</span>
                  </div>
                </div>
              )) : (
                <div className="p-8 text-center text-[#FFAA6E] font-bold italic">
                  No slow moving items detected. Your inventory is healthy!
                </div>
              )}
            </div>
          </motion.div>

          {/* Demand Forecast Section */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full bg-white rounded-[32px] border border-[#FFD3A5]/30 p-6 md:p-10 shadow-[0_10px_40px_rgb(15,42,29,0.03)] flex flex-col gap-6"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-xl md:text-2xl font-black text-[#FF5900]">{t('reports.demandForecast', "Demand Forecast")}</h3>
              <Zap className="text-yellow-500" size={24} fill="currentColor" />
            </div>
            <div className="bg-gradient-to-r from-[#FF5900] to-[#FF8237] p-5 rounded-2xl text-white mb-2 shadow-lg">
              <p className="text-sm font-black mb-1">AI Recommendation:</p>
              <p className="text-xs font-bold opacity-90 leading-relaxed">
                Based on current sales trends, you should prioritize restocking the following items to avoid stockouts in the next 7 days.
              </p>
            </div>
            <div className="flex flex-col gap-3">
              {forecastItems.map(item => (
                <div key={item.id} className="flex items-center justify-between p-4 bg-white border border-[#FFD3A5]/30 rounded-2xl shadow-sm">
                  <div className="flex flex-col">
                    <span className="font-bold text-[#FF5900]">{item.name}</span>
                    <span className="text-[10px] font-bold text-[#FFAA6E]">Restock suggestion: {Math.max(item.lowStockThreshold * 2 - item.quantity, 5)} units</span>
                  </div>
                  <div className="px-3 py-1 bg-red-50 text-red-600 rounded-full border border-red-100 font-black text-[10px] uppercase">
                    Low Stock
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Top 5 Products Horizontal Bar Chart */}
          <motion.div 
            key={`products-${timeRange}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full lg:col-span-1 bg-white rounded-[32px] border border-[#FFD3A5]/30 p-6 md:p-10 shadow-[0_10px_40px_rgb(15,42,29,0.03)] flex flex-col gap-8 md:gap-10"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-xl md:text-2xl font-black text-[#FF5900]">{t('reports.topProducts', "Top Products")}</h3>
              <div className="flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-[#FF8237]" />
                 <span className="text-[10px] font-black text-[#FFAA6E] uppercase tracking-widest">{t('reports.byWeeklyRevenue', "by weekly revenue")}</span>
              </div>
            </div>
            
            <div className="flex flex-col gap-4">
              {data.topProducts.map((p, i) => (
                <div key={p.name} className="flex items-center justify-between p-3 bg-[#FFFBDC]/30 rounded-xl border border-[#FFD3A5]/10">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-lg bg-[#FF8237] text-white flex items-center justify-center text-[10px] font-black">#{i+1}</span>
                    <span className="font-bold text-[#FF5900]">{p.name}</span>
                  </div>
                  <span className="font-black text-[#FF8237]">₹{p.value.toLocaleString()}</span>
                </div>
              ))}
              <p className="mt-4 text-xs font-bold text-[#FFAA6E] italic text-center">
                ✨ {t('reports.topProductsDesc', "These are the items your customers love the most! Keep them in stock!")}
              </p>
            </div>
          </motion.div>



        </div>

        </div>
      </PlanGate>

    </PageTransition>
  );
}
