import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../store/auth';
import { useTranslation } from 'react-i18next';
import { PageTransition } from '../components/layout/PageTransition';
import { EmptyState } from '../components/ui/EmptyState';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { PlanGate } from '../components/ui/PlanGate';
import { Search, Users, ChevronRight, Phone, Plus, History, ArrowRightLeft, Calendar, FileText, TrendingDown } from 'lucide-react';
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

  const totalUdhar = items.reduce((sum, item) => sum + item.balance, 0);

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

      addToast({ message: t('customers.customerAdded', 'Customer added to Udhar Book'), type: 'success' });
      setIsFormOpen(false);
      setFormData({ name: '', phone: '', balance: '' });
    } catch (error) {
      addToast({ message: t('common.error'), type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleViewHistory = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsHistoryModalOpen(true);
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

  return (
    <PageTransition className="flex flex-col h-full min-h-screen bg-[#FFFBDC] text-[#FF5900]">
      
      {/* Header Area */}
      <div className="bg-[#FF5900] rounded-b-3xl p-4 md:p-6 shadow-xl z-20 shrink-0 sticky top-0 md:relative text-[#FFFBDC]">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Users size={22} /> {t('customers.udharBook', 'Udhar Book')}
          </h2>
          <Button 
            onClick={() => setIsFormOpen(true)}
            className="hidden md:flex items-center gap-2 bg-[#FF8237] hover:bg-[#FFAA6E] border-none text-xs h-9 px-4"
          >
            <Plus size={16} /> {t('customers.addNew', 'Add Customer')}
          </Button>
        </div>
        
        <div className="bg-[#FF8237] p-4 rounded-2xl border border-[#FFD3A5]/20 shadow-inner mb-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-[10px] uppercase font-black text-[#FFD3A5] tracking-widest">{t('customers.totalReceivable', 'Total Receivable')}</p>
              <h3 className="text-2xl font-black text-[#FFFBDC]">₹{totalUdhar.toLocaleString('en-IN')}</h3>
            </div>
            <div className="bg-[#FF5900] px-3 py-1.5 rounded-xl border border-[#FF8237]">
              <p className="text-[10px] font-bold text-[#FFD3A5] text-center">{items.filter(i => i.balance > 0).length} {t('customers.customersCount', 'Customers')}</p>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#FFD3A5]/10">
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-[10px] font-black text-[#FFD3A5] uppercase tracking-wider">
                {user?.plan === 'pro' ? 'Pro' : user?.plan === 'basic' ? 'Basic' : 'Free'} {t('customers.customerLimit', 'Customer Limit')}
              </span>
              <span className="text-[10px] font-bold text-[#FFFBDC]">{items.length} / {user?.plan === 'pro' ? '∞' : user?.plan === 'basic' ? 100 : 10}</span>
            </div>
            <div className="h-1.5 w-full bg-[#FF5900] rounded-full overflow-hidden">
              <div 
                className="h-full bg-[#FFD3A5] rounded-full transition-all duration-500" 
                style={{ width: `${Math.min((items.length / (user?.plan === 'pro' ? (items.length || 1) : user?.plan === 'basic' ? 100 : 10)) * 100, 100)}%` }}
              />
            </div>
          </div>
        </div>

        <Input 
          placeholder={t('customers.searchCustomers', 'Search by name or phone...')} 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          leftIcon={<Search size={20} className="text-[#FF8237]" />}
          className="w-full bg-[#FFFBDC] text-[#FF5900] border-transparent focus-visible:border-[#FFD3A5] rounded-xl"
        />
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar">
        <PlanGate 
          allowedPlans={['pro', 'basic']} 
          currentPlan={user?.plan || 'free'} 
          requiredFeatureMessage={t('customers.unlockUdhar', 'Unlock the Udhar Book by upgrading to Basic or Pro.')}
        >
          <div className="p-4 md:p-6 flex flex-col gap-3 pb-24">
            {loading ? (
              <div className="py-20 flex justify-center">
                 <div className="w-10 h-10 border-4 border-[#FF8237] border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : (
              <AnimatePresence>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
                  {filteredCustomers.map((customer) => (
                    <motion.div
                      key={customer.id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      onClick={() => {
                        setSelectedCustomer(customer);
                        setIsPaymentModalOpen(true);
                      }}
                    >
                      <Card className="flex flex-col shadow-sm hover:shadow-md border-[#FFD3A5]/30 cursor-pointer group transition-all h-full bg-white overflow-hidden">
                        <div className="p-4 flex items-center justify-between flex-1">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-[#FFFBDC] text-[#FF8237] rounded-2xl flex items-center justify-center border border-[#FFD3A5] shrink-0 font-black text-xl">
                              {customer.name.charAt(0)}
                            </div>
                            <div className="flex flex-col">
                              <h4 className="font-black text-[#FF5900] leading-tight text-base">{customer.name}</h4>
                              <p className="text-[11px] font-bold text-[#FFAA6E] flex items-center gap-1 mt-0.5">
                                <Phone size={10} /> {customer.phone}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="text-right flex flex-col items-end">
                              <span className={cn(
                                "font-black tracking-tight text-lg",
                                customer.balance > 0 ? "text-[#ef4444]" : "text-[#10b981]"
                              )}>
                                {customer.balance > 0 ? `₹${customer.balance.toLocaleString('en-IN')}` : t('customers.settled', 'Settled')}
                              </span>
                              {customer.balance > 0 && (
                                <span className="text-[10px] uppercase font-black text-[#ef4444] tracking-wider opacity-70">{t('customers.unpaid', 'Unpaid')}</span>
                              )}
                            </div>
                            <ChevronRight size={18} className="text-[#FFD3A5] group-hover:text-[#FF8237] transition-colors" />
                          </div>
                        </div>

                        <div 
                          className="px-4 py-2.5 bg-[#FFFBDC]/30 border-t border-[#FFFBDC] flex justify-between items-center hover:bg-[#FFFBDC]/50 transition-colors"
                          onClick={(e) => { e.stopPropagation(); handleViewHistory(customer); }}
                        >
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                            {t('customers.lastTrx', 'Last Trx:')} {customer.lastTransactionDate ? new Date(customer.lastTransactionDate).toLocaleDateString() : 'N/A'}
                          </p>
                          <button className="text-[10px] font-black text-[#FF8237] flex items-center gap-1 hover:underline">
                            <History size={12} /> {t('customers.viewHistory', 'View History →')}
                          </button>
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </AnimatePresence>
            )}

            {!loading && filteredCustomers.length === 0 && (
              <EmptyState 
                icon={Users}
                title={t('customers.noCustomers', 'No customers found')}
                description={t('customers.noCustomersDesc', 'No customers match your search criteria.')}
              />
            )}
          </div>
        </PlanGate>
      </div>

      {/* FAB */}
      <div className="fixed md:hidden bottom-[88px] right-4 z-30">
        <PlanGate allowedPlans={['pro', 'basic']} currentPlan={user?.plan || 'free'} hideGate={!items.length} requiredFeatureMessage={t('customers.unlimitedNeedsBasic', 'Unlimited Customers needs Basic')}>
          <Button 
            onClick={() => setIsFormOpen(true)}
            className="w-14 h-14 rounded-full shadow-[0_10px_25px_rgba(15,42,29,0.3)] bg-[#FF5900] hover:bg-[#FF8237] active:scale-95 transition-transform flex items-center justify-center p-0"
          >
            <Plus size={28} className="text-[#FFFBDC]" />
          </Button>
        </PlanGate>
      </div>

      {/* Add Customer Modal/BottomSheet */}
      <div className="hidden md:block">
        <Modal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} title={t('customers.addNew', 'Add Customer')}>
          <CustomerForm 
            formData={formData}
            setFormData={setFormData}
            handleSave={handleSave}
            isSaving={isSaving}
            t={t}
          />
        </Modal>
      </div>
      <div className="md:hidden">
        <BottomSheet isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} title={t('customers.addNew', 'Add Customer')}>
          <CustomerForm 
            formData={formData}
            setFormData={setFormData}
            handleSave={handleSave}
            isSaving={isSaving}
            t={t}
          />
        </BottomSheet>
      </div>

      {/* Payment Collection Modal */}
      <Modal 
        isOpen={isPaymentModalOpen} 
        onClose={() => setIsPaymentModalOpen(false)} 
        title={t('customers.collectPayment', 'Collect Payment')}
      >
        <div className="flex flex-col gap-6 p-2">
          <div className="flex items-center justify-between p-4 bg-[#FFFBDC]/50 rounded-2xl border border-[#FFD3A5]/30">
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-[#FFAA6E] uppercase tracking-widest leading-none mb-1">{selectedCustomer?.name}</span>
              <span className="text-xl font-black text-[#FF5900]">₹{selectedCustomer?.balance.toLocaleString('en-IN')}</span>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-black text-[#FFAA6E] uppercase tracking-widest leading-none block mb-1">{t('customers.balance', 'Balance')}</span>
              <span className="text-xl font-black text-[#FF5900]">₹{selectedCustomer?.balance.toLocaleString('en-IN')}</span>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-red-50 rounded-2xl border border-red-100 shadow-inner">
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-red-400 uppercase tracking-widest leading-none mb-1">
                {t('customers.unpaidAmount', 'Unpaid Amount')}
              </span>
              <span className="text-2xl font-black text-red-600">
                ₹{((selectedCustomer?.balance || 0) - (parseFloat(paymentAmount) || 0)).toLocaleString('en-IN')}
              </span>
            </div>
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-red-500 shadow-sm">
                <TrendingDown size={20} />
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <Input 
              label={t('customers.entryAmount', 'Amount Given by User (₹)')}
              type="number"
              placeholder="0.00"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              className="text-lg font-black"
              autoFocus
            />
            <Input 
              label={t('customers.note', 'Note / Description')}
              placeholder={t('customers.notePlaceholder', 'e.g. Cash payment')}
              value={paymentDescription}
              onChange={(e) => setPaymentDescription(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-3 pt-2">
            <Button 
              className="w-full h-14 text-base font-black bg-[#FF5900] hover:bg-[#FF8237] shadow-xl shadow-orange-500/10"
              onClick={handleCollectPayment}
              disabled={isSaving || !paymentAmount}
            >
              {isSaving ? t('common.saving', 'Processing...') : t('customers.confirmPayment', 'Confirm Payment')}
            </Button>
            <Button 
              variant="outline" 
              className="w-full h-12 border-[#FFD3A5] text-[#FFAA6E] font-bold"
              onClick={() => setIsPaymentModalOpen(false)}
            >
              {t('common.cancel', 'Cancel')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Transaction History Modal */}
      <Modal 
        isOpen={isHistoryModalOpen} 
        onClose={() => setIsHistoryModalOpen(false)} 
        title={`${selectedCustomer?.name}`}
      >
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between p-4 bg-[#FF5900] rounded-2xl text-[#FFFBDC]">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest opacity-70">{t('customers.balance', 'Balance')}</p>
              <h4 className="text-2xl font-black">₹{selectedCustomer?.balance.toLocaleString('en-IN')}</h4>
            </div>
            <div className="bg-[#FF8237] p-3 rounded-xl">
              <Users size={20} />
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <h5 className="text-xs font-black text-[#FFAA6E] uppercase tracking-widest px-1">{t('customers.transactions', 'Transactions')}</h5>
            <div className="flex flex-col gap-2 max-h-[350px] overflow-y-auto no-scrollbar pr-1">
              {selectedCustomer?.transactions && selectedCustomer.transactions.length > 0 ? (
                selectedCustomer.transactions.map((trx) => (
                  <div key={trx.id} className="p-4 bg-white border border-[#FFD3A5]/20 rounded-2xl flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center border",
                        trx.type === 'debit' ? "bg-red-50 border-red-100 text-red-600" : "bg-green-50 border-green-100 text-green-600"
                      )}>
                        {trx.type === 'debit' ? <ArrowRightLeft size={18} /> : <History size={18} />}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-[#FF5900]">{trx.description}</span>
                        <span className="text-[10px] font-bold text-[#FFAA6E] flex items-center gap-1">
                          <Calendar size={10} /> {new Date(trx.date).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={cn(
                        "font-black text-sm block",
                        trx.type === 'debit' ? "text-red-600" : "text-green-600"
                      )}>
                        {trx.type === 'debit' ? '-' : '+'} ₹{trx.amount}
                      </span>
                      <span className="text-[9px] font-bold text-gray-400 flex items-center justify-end gap-1">
                        {trx.type === 'credit' ? t('customers.amountGiven', 'Amount Given by User') : t('customers.taxIncl', 'Tax Incl.')}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-10 text-center flex flex-col items-center gap-2 text-gray-400">
                  <History size={30} className="opacity-20" />
                  <p className="text-sm font-bold">{t('customers.noHistory', 'No transaction history found')}</p>
                </div>
              )}
            </div>
          </div>
          
          <Button 
            variant="outline" 
            className="w-full h-12 rounded-xl text-sm font-black border-[#FFD3A5] text-[#FFAA6E]"
            onClick={() => setIsHistoryModalOpen(false)}
          >
            {t('customers.closeHistory', 'Close')}
          </Button>
        </div>
      </Modal>

    </PageTransition>
  );
}
