import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useExpenseStore, type ExpenseCategory } from '../store/expenses';
import { useAuthStore } from '../store/auth';
import { PageTransition } from '../components/layout/PageTransition';
import { EmptyState } from '../components/ui/EmptyState';
import { PlanGate } from '../components/ui/PlanGate';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { BottomSheet } from '../components/ui/BottomSheet';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { useToastStore } from '../store/toast';
import { 
  Plus, 
  Package, 
  Home, 
  Zap, 
  Users, 
  MoreHorizontal,
  IndianRupee,
  Receipt,
  Camera,
  Keyboard
} from 'lucide-react';
import { cn } from '../lib/utils';

const CATEGORY_ICONS: Record<ExpenseCategory, React.ElementType> = {
  Stock: Package,
  Rent: Home,
  Electricity: Zap,
  Salary: Users,
  Other: MoreHorizontal,
};

interface ExpenseFormProps {
  amount: string;
  setAmount: (v: string) => void;
  vendor: string;
  setVendor: (v: string) => void;
  category: ExpenseCategory;
  setCategory: (v: ExpenseCategory) => void;
  handleSave: (e: React.FormEvent) => void;
  isSaving: boolean;
}

function ExpenseForm({
  amount,
  setAmount,
  vendor,
  setVendor,
  category,
  setCategory,
  handleSave,
  isSaving
}: ExpenseFormProps) {
  const { t } = useTranslation();
  return (
    <form onSubmit={handleSave} className="flex flex-col gap-6">
      <div className="flex flex-col gap-2 items-center justify-center bg-[#F8F3E5] rounded-3xl p-6 border-2 border-[#CFC3A7] border-dashed">
        <span className="text-[#95A07A] font-bold text-sm">{t('expenses.enterAmount', 'Enter Amount')}</span>
        <div className="flex items-center justify-center w-full text-[#5F714B]">
          <IndianRupee size={32} className="mt-1" />
          <input 
            type="number" 
            min="0"
            step="0.01"
            placeholder="0"
            required
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="bg-transparent text-5xl font-black w-full max-w-[200px] outline-none text-center placeholder-[#9BA88D]/50"
          />
        </div>
      </div>

      <Input
        label={t('expenses.vendorDesc', 'Vendor / Description *')}
        placeholder={t('expenses.vendorPlaceholder', 'e.g. Shop Rent, Supplier Name')}
        value={vendor}
        onChange={(e) => setVendor(e.target.value)}
        required
        leftIcon={<Receipt size={20} />}
      />

      <div className="flex flex-col gap-2">
        <label className="text-sm font-bold text-[#95A07A]">{t('expenses.category', 'Category *')}</label>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
          {(Object.keys(CATEGORY_ICONS) as ExpenseCategory[]).map((cat) => {
            const Icon = CATEGORY_ICONS[cat];
            const isActive = category === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={cn(
                  "flex flex-col items-center justify-center gap-1.5 p-2 rounded-2xl transition-all border-2",
                  isActive 
                    ? "bg-[#95A07A] border-[#95A07A] text-[#F8F3E5]" 
                    : "bg-white border-[#CFC3A7]/40 text-[#9BA88D] hover:bg-[#F8F3E5]"
                )}
              >
                <Icon size={20} />
                <span className="text-[10px] font-bold">{t(`expenses.categories.${cat.toLowerCase()}`, cat)}</span>
              </button>
            );
          })}
        </div>
      </div>

      <Button type="submit" isSuccess={isSaving} className="w-full h-14 mt-2 text-lg shadow-xl shadow-[#5F714B]/10">
        {t('expenses.saveExpense', 'Save Expense')}
      </Button>
    </form>
  );
}

export default function ExpenseScreen() {
  const { t } = useTranslation();
  const user = useAuthStore((state) => state.user);
  const { items, addExpense, fetchExpenses, loading } = useExpenseStore();
  const addToast = useToastStore((state) => state.addToast);
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [amount, setAmount] = useState('');
  const [vendor, setVendor] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('Stock');

  useEffect(() => {
    fetchExpenses();
  }, []);

  // Advanced Date Grouping Logic
  const groupedExpenses = items.reduce((acc, item) => {
    const dateObj = new Date(item.date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const oneWeekAgo = new Date(today);
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    let group = '';
    
    if (dateObj.toDateString() === today.toDateString()) {
      group = 'Today';
    } else if (dateObj.toDateString() === yesterday.toDateString()) {
      group = 'Yesterday';
    } else if (dateObj > oneWeekAgo) {
      group = 'ThisWeek';
    } else {
      group = 'Earlier';
    }

    if (!acc[group]) {
      acc[group] = [];
    }
    acc[group].push(item);
    return acc;
  }, {} as Record<string, typeof items>);

  const groupOrder = ['Today', 'Yesterday', 'ThisWeek', 'Earlier'];
  const sortedGroups = Object.keys(groupedExpenses).sort((a, b) => {
    return groupOrder.indexOf(a) - groupOrder.indexOf(b);
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !vendor) return;

    setIsSaving(true);
    try {
      await addExpense({
        amount: parseFloat(amount),
        vendor,
        category,
        date: new Date().toISOString()
      });

      addToast({ message: t('expenses.savedSuccess', 'Expense saved successfully'), type: 'success' });
      setIsFormOpen(false);
      setAmount('');
      setVendor('');
      setCategory('Stock');
    } catch (error) {
       addToast({ message: t('common.error'), type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const currentMonthTotal = items
    .filter(item => {
      const date = new Date(item.date);
      const now = new Date();
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    })
    .reduce((sum, item) => sum + item.amount, 0);

  return (
    <PageTransition className="flex flex-col h-full min-h-screen pb-24 bg-[#F8F3E5]">
      {/* Mobile-Only Sticky Header */}
      <div className="bg-[#5F714B] rounded-b-[40px] px-6 pt-8 pb-10 shadow-2xl z-20 shrink-0 sticky top-0 text-[#F8F3E5] md:hidden">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Receipt size={22} className="text-[#CFC3A7]" /> {t('expenses.tracker', 'Expense Tracker')}
          </h2>
          <div className="w-10 h-10 rounded-full bg-[#95A07A] flex items-center justify-center border border-[#9BA88D]/30">
            <IndianRupee size={18} className="text-[#CFC3A7]" />
          </div>
        </div>
        
        <div className="flex flex-col gap-4">
          <div>
            <span className="text-[#CFC3A7] text-xs font-bold uppercase tracking-[0.1em] mb-1">{t('expenses.monthlyTotal', 'Monthly Total Expense')}</span>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-black">₹{currentMonthTotal.toLocaleString()}</span>
              <span className="text-[#9BA88D] text-sm font-bold">{t('expenses.thisMonth', 'this month')}</span>
            </div>
          </div>

          <div className="flex gap-2">
            <button 
              onClick={() => document.getElementById('bill-camera')?.click()}
              className="flex-1 bg-[#95A07A] py-3 rounded-xl flex items-center justify-center gap-2 text-xs font-black border border-[#9BA88D]/30 active:scale-95 transition-all"
            >
              <Camera size={16} /> {t('expenses.scanBill', 'Scan Bill')}
            </button>
            <button
              onClick={() => document.getElementById('bill-upload')?.click()}
              className="flex-1 bg-[#F8F3E5] text-[#5F714B] py-3 rounded-xl flex items-center justify-center gap-2 text-xs font-black active:scale-95 transition-all"
            >
              <Keyboard size={16} /> {t('expenses.uploadBill', 'Upload Bill')}
            </button>
          </div>
        </div>
      </div>

      {/* Desktop Summary */}
      <div className="hidden md:flex flex-col gap-8 mb-4">
        <div className="bg-[#5F714B] rounded-[32px] p-8 text-[#F8F3E5] shadow-2xl flex items-center justify-between overflow-hidden relative">
          <div className="relative z-10">
            <p className="text-[#CFC3A7] text-sm font-bold uppercase tracking-widest mb-2">{t('expenses.monthlyTotal', 'Monthly Total Expense')}</p>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-black">₹{currentMonthTotal.toLocaleString()}</span>
              <span className="text-[#9BA88D] font-bold">{t('expenses.thisMonth', 'this month')}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4 relative z-10">
            <button 
              onClick={() => setIsFormOpen(true)}
              className="bg-[#F8F3E5] text-[#5F714B] px-6 py-3 rounded-2xl font-black flex items-center gap-2 hover:bg-white transition-all shadow-lg active:scale-95"
            >
              <Plus size={20} /> {t('expenses.createNew', 'Create New Expense')}
            </button>
          </div>
          <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-[#95A07A] rounded-full blur-3xl opacity-50" />
        </div>

        <div className="flex items-center gap-4">
          <input 
            type="file" 
            id="bill-camera" 
            className="hidden" 
            accept="image/*" 
            capture="environment"
            onChange={() => addToast({ message: t('expenses.scannedSuccess', 'Bill scanned successfully!'), type: 'success' })}
          />
          <input 
            type="file" 
            id="bill-upload" 
            className="hidden" 
            accept="image/*,application/pdf"
            onChange={() => addToast({ message: t('expenses.uploadedSuccess', 'Bill uploaded successfully!'), type: 'success' })}
          />
          
          <button 
            onClick={() => document.getElementById('bill-camera')?.click()}
            className="flex-1 bg-white border border-[#CFC3A7]/30 p-5 rounded-[24px] flex items-center gap-4 hover:border-[#95A07A] transition-all group shadow-sm hover:shadow-md"
          >
            <div className="w-12 h-12 bg-[#F8F3E5] rounded-2xl flex items-center justify-center text-[#95A07A] group-hover:bg-[#95A07A] group-hover:text-white transition-all shadow-inner">
              <Camera size={24} />
            </div>
            <div className="text-left">
              <p className="font-black text-[#5F714B]">{t('expenses.scanBill', 'Scan Bill')}</p>
              <p className="text-xs font-bold text-[#9BA88D]">{t('expenses.openCamera', 'Open Camera')}</p>
            </div>
          </button>
          <button 
            onClick={() => document.getElementById('bill-upload')?.click()}
            className="flex-1 bg-white border border-[#CFC3A7]/30 p-5 rounded-[24px] flex items-center gap-4 hover:border-[#95A07A] transition-all group shadow-sm hover:shadow-md"
          >
            <div className="w-12 h-12 bg-[#F8F3E5] rounded-2xl flex items-center justify-center text-[#95A07A] group-hover:bg-[#95A07A] group-hover:text-white transition-all shadow-inner">
              <Keyboard size={24} />
            </div>
            <div className="text-left">
              <p className="font-black text-[#5F714B]">{t('expenses.uploadBill', 'Upload Bill')}</p>
              <p className="text-xs font-bold text-[#9BA88D]">{t('expenses.importFile', 'Import PDF or Image')}</p>
            </div>
          </button>
        </div>
      </div>

      <PlanGate 
        allowedPlans={['basic', 'pro']} 
        currentPlan={user?.plan || 'free'}
        requiredFeatureMessage={t('expenses.premiumBanner', 'Unlock Expense Tracking by upgrading to Basic or Pro.')}
      >
      <div className="flex-1 p-4 flex flex-col gap-8 mt-2">
        {loading ? (
          <div className="py-20 flex justify-center">
             <div className="w-10 h-10 border-4 border-[#95A07A] border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          sortedGroups.map(groupKey => (
            <div key={groupKey} className="flex flex-col gap-4">
              <h3 className="text-xs font-black text-[#9BA88D] uppercase tracking-widest px-2">
                {t(`time.${groupKey}`, groupKey)}
              </h3>
              
              <div className="flex flex-col gap-3">
                <AnimatePresence mode="popLayout">
                  {groupedExpenses[groupKey].map(item => {
                    const Icon = CATEGORY_ICONS[item.category];
                    return (
                      <motion.div
                        key={item.id}
                        layout
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                      >
                        <Card className="p-4 flex items-center justify-between shadow-[0_4px_12px_rgba(15,42,29,0.05)] border-none bg-white rounded-2xl active:scale-[0.98] transition-transform">
                          <div className="flex items-center gap-4 flex-1">
                            <div className="w-12 h-12 bg-[#F8F3E5] rounded-2xl flex items-center justify-center border border-[#CFC3A7]/30 text-[#95A07A] shrink-0">
                              <Icon size={24} />
                            </div>
                            <div className="min-w-0">
                              <h4 className="font-bold text-[#5F714B] truncate">{item.vendor}</h4>
                              <p className="text-xs font-bold text-[#9BA88D]">{t(`expenses.categories.${item.category.toLowerCase()}`, item.category)} • {new Date(item.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            {item.imageUrl && (
                              <div className="w-10 h-10 rounded-lg overflow-hidden border border-[#CFC3A7]/50 shadow-sm shrink-0">
                                <img src={item.imageUrl} alt="Receipt" className="w-full h-full object-cover grayscale-[0.3] hover:grayscale-0 transition-all" />
                              </div>
                            )}
                            <div className="text-right whitespace-nowrap">
                              <span className="font-black text-lg text-[#5F714B]">₹{item.amount.toLocaleString()}</span>
                            </div>
                          </div>
                        </Card>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </div>
          ))
        )}
        
        {!loading && items.length === 0 && (
          <EmptyState
            icon={Receipt}
            title={t('expenses.noExpenses', 'No expenses yet')}
            description={t('expenses.startTracking', "Start tracking your store's money out by adding an expense.")}
            actionLabel={t('expenses.addExpense', 'Add Expense')}
            onAction={() => setIsFormOpen(true)}
          />
        )}
      </div>

      {/* Premium FAB */}
      <div className="fixed bottom-24 right-6 z-30 md:hidden">
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsFormOpen(true)}
          className="w-16 h-16 rounded-full shadow-[0_8px_25px_rgba(15,42,29,0.4)] bg-[#5F714B] flex items-center justify-center border-2 border-[#95A07A]"
        >
          <Plus size={32} className="text-[#F8F3E5]" />
        </motion.button>
      </div>

      {/* Responsive Forms */}
      <div className="md:hidden">
        <BottomSheet isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} title={t('expenses.addExpense', 'Add Expense')}>
          <ExpenseForm amount={amount} setAmount={setAmount} vendor={vendor} setVendor={setVendor} category={category} setCategory={setCategory} handleSave={handleSave} isSaving={isSaving} />
        </BottomSheet>
      </div>

      <div className="hidden md:block">
        <Modal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} title={t('expenses.createNew', 'Create New Expense')}>
          <ExpenseForm amount={amount} setAmount={setAmount} vendor={vendor} setVendor={setVendor} category={category} setCategory={setCategory} handleSave={handleSave} isSaving={isSaving} />
        </Modal>
      </div>
      </PlanGate>

    </PageTransition>
  );
}
