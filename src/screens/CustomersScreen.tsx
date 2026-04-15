import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../store/auth';
import { useTranslation } from 'react-i18next';
import { PageTransition } from '../components/layout/PageTransition';
import { EmptyState } from '../components/ui/EmptyState';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { PlanGate } from '../components/ui/PlanGate';
import { Search, Users, ChevronRight, Phone, Plus, History, ArrowRightLeft } from 'lucide-react';
import { useCustomersStore, type Customer } from '../store/customers';
import { Button } from '../components/ui/Button';
import { BottomSheet } from '../components/ui/BottomSheet';
import { Modal } from '../components/ui/Modal';
import { useToastStore } from '../store/toast';
import { cn } from '../lib/utils';

interface CustomerFormProps {
  formData: any;
  setFormData: (data: any) => void;
  handleSave: (e: React.FormEvent) => void;
  isSaving: boolean;
  t: any;
}

const CustomerForm = ({ 
  formData, 
  setFormData, 
  handleSave, 
  isSaving, 
  t 
}: CustomerFormProps) => (
  <form onSubmit={handleSave} className="flex flex-col gap-4">
    <Input 
      label={t('customers.customerName', 'Customer Name *')}
      placeholder={t('customers.customerNamePlaceholder', 'e.g. Ramesh Kumar')}
      value={formData.name}
      onChange={(e) => setFormData({...formData, name: e.target.value})}
      required
    />
    <Input 
      label={t('customers.phoneRequired', 'Phone Number *')}
      placeholder={t('customers.phonePlaceholder', 'e.g. 9876543210')}
      value={formData.phone}
      onChange={(e) => setFormData({...formData, phone: e.target.value})}
      required
    />
    <Input 
      label={t('customers.outstandingBalance', 'Outstanding Balance (₹)')}
      type="number"
      placeholder="0.00"
      value={formData.balance}
      onChange={(e) => setFormData({...formData, balance: e.target.value})}
    />
    <Button type="submit" isSuccess={isSaving} className="w-full h-12 mt-4 text-lg">
      {t('customers.addNew', 'Add Customer')}
    </Button>
  </form>
);

export default function CustomersScreen() {
  const user = useAuthStore((state) => state.user);
  const addToast = useToastStore((state) => state.addToast);
  const { items, addCustomer, fetchCustomers, loading } = useCustomersStore();
  const { t } = useTranslation();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({ name: '', phone: '', balance: '' });
  
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentDescription, setPaymentDescription] = useState('Payment Received');

  useEffect(() => {
    fetchCustomers();
  }, []);

  // Update selected customer if items change (to keep history/balance in sync)
  useEffect(() => {
    if (selectedCustomer) {
      const updated = items.find(c => c.id === selectedCustomer.id);
      if (updated) setSelectedCustomer(updated);
    }
  }, [items]);

  const totalCredit = items.reduce((sum, item) => sum + item.balance, 0);

  const filteredCustomers = items.filter(
    c => c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.phone.includes(searchQuery)
  );

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) return;

    setIsSaving(true);
    try {
      await addCustomer({
        name: formData.name,
        phone: formData.phone,
        balance: parseFloat(formData.balance) || 0,
        lastTransactionDate: new Date().toISOString()
      });

      addToast({ message: t('customers.customerAdded', 'Customer added to Credit Book'), type: 'success' });
      setIsFormOpen(false);
      setFormData({ name: '', phone: '', balance: '' });
    } catch (error) {
      addToast({ message: t('common.error'), type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCollectPayment = async () => {
    if (!selectedCustomer || !paymentAmount) return;
    const amountNum = parseFloat(paymentAmount);
    if (isNaN(amountNum) || amountNum <= 0) return;

    setIsSaving(true);
    try {
      const newBalance = selectedCustomer.balance - amountNum;
      await useCustomersStore.getState().updateBalance(
        selectedCustomer.id,
        newBalance,
        amountNum,
        'credit',
        paymentDescription
      );
      addToast({ message: t('customers.paymentSuccess', 'Payment collected successfully!'), type: 'success' });
      setIsPaymentModalOpen(false);
      setPaymentAmount('');
      setPaymentDescription('Payment Received');
    } catch (error) {
      addToast({ message: t('common.error'), type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  // Shared customer detail panel content (used in both desktop panel and mobile modals)
  const CustomerDetail = () => {
    if (!selectedCustomer) return (
      <div className="flex-1 flex flex-col items-center justify-center py-20 text-center">
        <div className="w-20 h-20 bg-[#F8F3E5] rounded-3xl flex items-center justify-center mb-4">
          <Users size={32} className="text-[#CFC3A7]" />
        </div>
        <p className="text-sm font-black text-[#9BA88D]">Select a customer</p>
        <p className="text-xs font-bold text-[#CFC3A7] mt-1">to view details & history</p>
      </div>
    );

    return (
      <div className="flex flex-col gap-4 h-full overflow-y-auto no-scrollbar">
        {/* Customer Card */}
        <div className="flex items-center gap-4 p-4 bg-[#5F714B] rounded-2xl text-[#F8F3E5]">
          <div className="w-14 h-14 bg-[#95A07A] rounded-2xl flex items-center justify-center font-black text-2xl shrink-0">
            {selectedCustomer.name.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-black text-lg leading-tight truncate">{selectedCustomer.name}</h3>
            <p className="text-[11px] font-bold text-[#CFC3A7] flex items-center gap-1 mt-0.5"><Phone size={10} /> {selectedCustomer.phone}</p>
          </div>
          <div className="text-right shrink-0">
            <span className={cn("font-black text-xl block", selectedCustomer.balance > 0 ? "text-yellow-200" : "text-green-300")}>
              ₹{selectedCustomer.balance.toLocaleString('en-IN')}
            </span>
            <span className="text-[10px] font-bold text-[#CFC3A7] uppercase tracking-wider">
              {selectedCustomer.balance > 0 ? 'Unpaid' : 'Settled'}
            </span>
          </div>
        </div>

        {/* Payment Section */}
        <div className="p-4 bg-white rounded-2xl border border-[#CFC3A7]/30 flex flex-col gap-3">
          <h4 className="text-[10px] font-black text-[#9BA88D] uppercase tracking-widest">{t('customers.collectPayment', 'Collect Payment')}</h4>
          <div className="flex items-center justify-between p-3 bg-red-50 rounded-xl border border-red-100">
            <span className="text-xs font-bold text-red-400">Remaining After Payment</span>
            <span className="text-base font-black text-red-600">
              ₹{Math.max((selectedCustomer.balance) - (parseFloat(paymentAmount) || 0), 0).toLocaleString('en-IN')}
            </span>
          </div>
          <Input
            type="number"
            placeholder="Amount (₹)"
            value={paymentAmount}
            onChange={(e) => setPaymentAmount(e.target.value)}
            className="bg-[#F8F3E5] border-[#CFC3A7]/40"
          />
          <Input
            placeholder="Note (e.g. Cash payment)"
            value={paymentDescription}
            onChange={(e) => setPaymentDescription(e.target.value)}
            className="bg-[#F8F3E5] border-[#CFC3A7]/40"
          />
          <Button
            className="w-full h-12 font-black bg-[#5F714B] hover:bg-[#95A07A] text-white"
            onClick={handleCollectPayment}
            disabled={isSaving || !paymentAmount}
          >
            {isSaving ? 'Processing...' : t('customers.confirmPayment', 'Confirm Payment')}
          </Button>
        </div>

        {/* Transaction History */}
        <div className="flex flex-col gap-3">
          <h4 className="text-[10px] font-black text-[#9BA88D] uppercase tracking-widest px-1">{t('customers.transactions', 'Transactions')}</h4>
          <div className="flex flex-col gap-2">
            {selectedCustomer.transactions && selectedCustomer.transactions.length > 0 ? (
              selectedCustomer.transactions.map((trx) => (
                <div key={trx.id} className="p-3 bg-white border border-[#CFC3A7]/20 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center border shrink-0",
                      trx.type === 'debit' ? "bg-red-50 border-red-100 text-red-500" : "bg-green-50 border-green-100 text-green-500"
                    )}>
                      {trx.type === 'debit' ? <ArrowRightLeft size={15} /> : <History size={15} />}
                    </div>
                    <div>
                      <p className="text-xs font-black text-[#5F714B]">{trx.description}</p>
                      <p className="text-[9px] font-bold text-[#9BA88D]">{new Date(trx.date).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <span className={cn("text-sm font-black shrink-0", trx.type === 'debit' ? "text-red-500" : "text-green-500")}>
                    {trx.type === 'debit' ? '-' : '+'} ₹{trx.amount}
                  </span>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-[#9BA88D]">
                <History size={28} className="mx-auto mb-2 opacity-30" />
                <p className="text-xs font-bold">{t('customers.noHistory', 'No transaction history')}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <PageTransition className="flex flex-col md:flex-row gap-4 md:gap-6 p-2 md:p-6 h-full min-h-screen bg-[#F8F3E5] text-[#5F714B] overflow-hidden">

      {/* ── LEFT: List Panel (now right) ── */}
      <div className="flex flex-col flex-1 min-w-0 bg-white rounded-[32px] overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-[#CFC3A7]/30">

      {/* Header Area */}
      <div className="bg-gradient-to-r from-[#5F714B] to-[#95A07A] p-4 md:p-6 shadow-md z-20 border-b border-[#CFC3A7]/20 shrink-0 sticky top-0 md:relative text-[#F8F3E5]">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Users size={22} /> {t('customers.udharBook', 'Credit Book')}
          </h2>
          <Button
            onClick={() => setIsFormOpen(true)}
            className="hidden md:flex items-center gap-2 bg-[#95A07A] hover:bg-[#9BA88D] border-none text-xs h-9 px-4"
          >
            <Plus size={16} /> {t('customers.addNew', 'Add Customer')}
          </Button>
        </div>

        <div className="bg-[#95A07A] p-3 rounded-2xl border border-[#CFC3A7]/20 shadow-inner mb-3 flex justify-between items-center">
          <div>
            <p className="text-[10px] uppercase font-black text-[#CFC3A7] tracking-widest">{t('customers.totalReceivable', 'Total Receivable')}</p>
            <h3 className="text-2xl font-black text-[#F8F3E5]">₹{totalCredit.toLocaleString('en-IN')}</h3>
          </div>
          <div className="bg-[#5F714B] px-3 py-1.5 rounded-xl">
            <p className="text-[10px] font-bold text-[#CFC3A7] text-center">{items.filter(i => i.balance > 0).length} {t('customers.customersCount', 'Customers')}</p>
          </div>
        </div>

        <Input
          placeholder={t('customers.searchCustomers', 'Search by name or phone...')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          leftIcon={<Search size={20} className="text-[#95A07A]" />}
          className="w-full bg-[#F8F3E5] text-[#5F714B] border-transparent focus-visible:border-[#CFC3A7] rounded-xl"
        />
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar">
        <PlanGate
          allowedPlans={['pro', 'basic']}
          currentPlan={user?.plan || 'free'}
          requiredFeatureMessage={t('customers.unlockUdhar', 'Unlock the Credit Book by upgrading to Basic or Pro.')}
        >
          <div className="p-4 flex flex-col gap-3 pb-24 md:pb-4">
            {loading ? (
              <div className="py-20 flex justify-center">
                <div className="w-10 h-10 border-4 border-[#95A07A] border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : (
              <AnimatePresence>
                {filteredCustomers.map((customer) => (
                  <motion.div
                    key={customer.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    onClick={() => {
                      setSelectedCustomer(customer);
                      setPaymentAmount('');
                      // on mobile: open payment modal; on desktop: selection handles the detail panel
                      if (window.innerWidth < 768) setIsPaymentModalOpen(true);
                    }}
                  >
                    <Card className={cn(
                      "flex flex-col shadow-sm hover:shadow-md border cursor-pointer group transition-all bg-white overflow-hidden",
                      selectedCustomer?.id === customer.id ? "border-[#95A07A] ring-2 ring-[#95A07A]/20" : "border-[#CFC3A7]/30"
                    )}>
                      <div className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 bg-[#F8F3E5] text-[#95A07A] rounded-2xl flex items-center justify-center border border-[#CFC3A7] shrink-0 font-black text-lg">
                            {customer.name.charAt(0)}
                          </div>
                          <div>
                            <h4 className="font-black text-[#5F714B] leading-tight">{customer.name}</h4>
                            <p className="text-[11px] font-bold text-[#9BA88D] flex items-center gap-1 mt-0.5">
                              <Phone size={10} /> {customer.phone}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-right">
                            <span className={cn("font-black text-base block", customer.balance > 0 ? "text-red-500" : "text-green-500")}>
                              {customer.balance > 0 ? `₹${customer.balance.toLocaleString('en-IN')}` : t('customers.settled', 'Settled')}
                            </span>
                            {customer.balance > 0 && <span className="text-[9px] uppercase font-black text-red-400 tracking-wider">Unpaid</span>}
                          </div>
                          <ChevronRight size={18} className="text-[#CFC3A7] group-hover:text-[#95A07A] transition-colors" />
                        </div>
                      </div>
                      <div
                        className="px-4 py-2 bg-[#F8F3E5]/30 border-t border-[#F8F3E5] flex justify-between items-center hover:bg-[#F8F3E5]/60 transition-colors"
                        onClick={(e) => { e.stopPropagation(); setSelectedCustomer(customer); setPaymentAmount(''); setIsHistoryModalOpen(true); }}
                      >
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">
                          {t('customers.lastTrx', 'Last Trx:')} {customer.lastTransactionDate ? new Date(customer.lastTransactionDate).toLocaleDateString() : 'N/A'}
                        </p>
                        <button className="text-[10px] font-black text-[#95A07A] flex items-center gap-1">
                          <History size={11} /> {t('customers.viewHistory', 'History →')}
                        </button>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}

            {!loading && filteredCustomers.length === 0 && (
              <EmptyState
                icon={Users}
                title={t('customers.noCustomers', 'No customers found')}
                description={t('customers.noCustomersDesc', 'No customers match your search.')}
              />
            )}
          </div>
        </PlanGate>
      </div>

      {/* FAB - mobile only */}
      <div className="fixed md:hidden bottom-[88px] right-4 z-30">
        <PlanGate allowedPlans={['pro', 'basic']} currentPlan={user?.plan || 'free'} hideGate={!items.length} requiredFeatureMessage={t('customers.unlimitedNeedsBasic', 'Unlimited Customers needs Basic')}>
          <Button onClick={() => setIsFormOpen(true)} className="w-14 h-14 rounded-full shadow-xl bg-[#5F714B] hover:bg-[#95A07A] active:scale-95 transition-transform flex items-center justify-center p-0">
            <Plus size={28} className="text-[#F8F3E5]" />
          </Button>
        </PlanGate>
      </div>

      </div>{/* end left column */}

      {/* ── RIGHT: Detail Panel (desktop only, now left) ── */}
      <div className="hidden md:flex flex-col w-[380px] shrink-0 bg-white rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-[#CFC3A7]/40 p-5 overflow-y-auto no-scrollbar">
        <CustomerDetail />
      </div>

      {/* Add Customer Modal/BottomSheet */}
      <div className="hidden md:block">
        <Modal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} title={t('customers.addNew', 'Add Customer')}>
          <CustomerForm formData={formData} setFormData={setFormData} handleSave={handleSave} isSaving={isSaving} t={t} />
        </Modal>
      </div>
      <div className="md:hidden">
        <BottomSheet isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} title={t('customers.addNew', 'Add Customer')}>
          <CustomerForm formData={formData} setFormData={setFormData} handleSave={handleSave} isSaving={isSaving} t={t} />
        </BottomSheet>
      </div>

      {/* Mobile: Payment Modal */}
      <Modal isOpen={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)} title={t('customers.collectPayment', 'Collect Payment')}>
        <CustomerDetail />
      </Modal>

      {/* Mobile: History Modal */}
      <Modal isOpen={isHistoryModalOpen} onClose={() => setIsHistoryModalOpen(false)} title={selectedCustomer?.name || ''}>
        <CustomerDetail />
      </Modal>

    </PageTransition>
  );
}
