import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useCartStore } from '../store/cart';
import { useToastStore } from '../store/toast';
import { useCustomersStore } from '../store/customers';
import { useInventoryStore, type InventoryItem } from '../store/inventory';
import { PageTransition } from '../components/layout/PageTransition';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import { Search, Mic, Plus, Minus, CheckCircle2, UserPlus, Users, ArrowRight, Zap } from 'lucide-react';
import { cn } from '../lib/utils';
import { supabase } from '../lib/supabase';

const CATEGORIES = ['All', 'Dairy', 'Grains', 'Snacks', 'Beverages', 'Personal Care', 'Other'];

// Temporary helper to map InventoryItem to Product expected by CartStore
const toProduct = (item: InventoryItem) => ({
  id: item.id,
  name: item.name,
  price: item.sellPrice,
  category: item.category,
  emoji: '📦' // Default emoji for database items
});

export default function BillingScreen() {
  const { t } = useTranslation();
  const { items: cartItems, addItem, updateQuantity, getTotal, clearCart } = useCartStore();
  const addToast = useToastStore((state) => state.addToast);
  const { items: customers, updateBalance, fetchCustomers } = useCustomersStore();
  const { items: inventory, fetchItems: fetchInventory, updateItem } = useInventoryStore();

  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [flyingDots, setFlyingDots] = useState<{ id: string; x: number; y: number }[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Quick Bill Modal States
  const [isQuickBillOpen, setIsQuickBillOpen] = useState(false);
  const [quickBillItems, setQuickBillItems] = useState<Array<{ product: any; quantity: number }>>([]);
  const [quickBillSearch, setQuickBillSearch] = useState('');
  const [quickBillCategory, setQuickBillCategory] = useState('All');
  // Quick Bill Udhar States
  const [qbView, setQbView] = useState<'products' | 'udhar'>('products');
  const [qbCustomerMode, setQbCustomerMode] = useState<'existing' | 'new'>('existing');
  const [qbCustomerSearch, setQbCustomerSearch] = useState('');
  const [qbNewCustomer, setQbNewCustomer] = useState({ name: '', phone: '' });
  const [qbPartialPayment, setQbPartialPayment] = useState('0');

  // Udhar Selection Modal States
  const [isUdharModalOpen, setIsUdharModalOpen] = useState(false);
  const [customerMode, setCustomerMode] = useState<'existing' | 'new'>('existing');
  const [customerSearch, setCustomerSearch] = useState('');
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '' });
  const [partialPayment, setPartialPayment] = useState('0');

  // Ref for the cart target position
  const cartIconRef = useRef<HTMLDivElement>(null);
  const [cartTargetPos, setCartTargetPos] = useState({ x: window.innerWidth / 2, y: window.innerHeight - 100 });

  useEffect(() => {
    fetchInventory();
    fetchCustomers();
  }, []);

  useEffect(() => {
    if (cartIconRef.current) {
      const rect = cartIconRef.current.getBoundingClientRect();
      setCartTargetPos({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
    }
  }, [cartItems.length]);

  const filteredProducts = inventory.filter(p => {
    const matchesCat = activeCategory === 'All' || p.category === activeCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
    c.phone.includes(customerSearch)
  );

  const qbFilteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(qbCustomerSearch.toLowerCase()) ||
    c.phone.includes(qbCustomerSearch)
  );

  const handleAddWithAnimation = (e: React.MouseEvent, product: any) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const dotId = Math.random().toString();
    setFlyingDots((prev) => [...prev, { id: dotId, x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }]);
    addItem(product);
    setTimeout(() => {
      setFlyingDots((prev) => prev.filter(dot => dot.id !== dotId));
    }, 600);
  };

  const quickBillAddItem = (product: any) => {
    setQuickBillItems(prev => {
      const existing = prev.find(i => i.product.id === product.id);
      if (existing) return prev.map(i => i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { product, quantity: 1 }];
    });
  };

  const quickBillUpdateQty = (productId: string, qty: number) => {
    if (qty <= 0) {
      setQuickBillItems(prev => prev.filter(i => i.product.id !== productId));
    } else {
      setQuickBillItems(prev => prev.map(i => i.product.id === productId ? { ...i, quantity: qty } : i));
    }
  };

  const quickBillGetTotal = () => quickBillItems.reduce((sum, i) => sum + i.product.price * i.quantity, 0);

  const resetQuickBill = () => {
    setIsQuickBillOpen(false);
    setQuickBillItems([]);
    setQuickBillSearch('');
    setQuickBillCategory('All');
    setQbView('products');
    setQbCustomerMode('existing');
    setQbCustomerSearch('');
    setQbNewCustomer({ name: '', phone: '' });
    setQbPartialPayment('0');
  };

  // COMPLETE REAL CHECKOUT LOGIC
  const completeTransaction = async ({ 
    items, 
    total, 
    paid, 
    udhar, 
    customerId,
    newCustomerData
  }: { 
    items: Array<{ product: any; quantity: number }>, 
    total: number, 
    paid: number, 
    udhar: number,
    customerId?: string,
    newCustomerData?: { name: string, phone: string }
  }) => {
    setIsProcessing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      let finalCustomerId = customerId;

      // 1. If new customer, create it
      if (newCustomerData) {
        const { data: custData, error: custError } = await supabase
          .from('customers')
          .insert({
            user_id: user.id,
            name: newCustomerData.name,
            phone: newCustomerData.phone,
            balance: udhar,
            last_transaction_date: new Date().toISOString()
          })
          .select()
          .single();
        
        if (custError) throw custError;
        finalCustomerId = custData.id;
        // Refresh local store
        fetchCustomers();
      } else if (finalCustomerId && udhar > 0) {
        // 2. If existing customer with udhar, update balance
        const customer = customers.find(c => c.id === finalCustomerId);
        if (customer) {
          await updateBalance(finalCustomerId, customer.balance + udhar, udhar, 'debit', `Bill ₹${total} (Paid ₹${paid})`);
        }
      }

      // 3. Create Sale Record
      const { data: saleData, error: saleError } = await supabase
        .from('sales')
        .insert({
          user_id: user.id,
          customer_id: finalCustomerId || null,
          total_amount: total,
          paid_amount: paid,
          udhar_amount: udhar
        })
        .select()
        .single();
      
      if (saleError) throw saleError;

      // 4. Create Sale Items & Deduct Inventory
      const saleItemsPayload = items.map(item => ({
        sale_id: saleData.id,
        inventory_id: item.product.id,
        quantity: item.quantity,
        unit_price: item.product.price
      }));

      const { error: itemsError } = await supabase.from('sale_items').insert(saleItemsPayload);
      if (itemsError) throw itemsError;

      // 5. Deduct Quantities
      for (const item of items) {
        const invItem = inventory.find(i => i.id === item.product.id);
        if (invItem) {
          await updateItem(invItem.id, { quantity: invItem.quantity - item.quantity });
        }
      }

      addToast({ message: t('billing.savedSuccess', 'Transaction saved successfully!'), type: 'success' });
      return true;
    } catch (error: any) {
      console.error(error);
      addToast({ message: error.message || t('common.error'), type: 'error' });
      return false;
    } finally {
      setIsProcessing(false);
    }
  };

  const processQuickBill = async () => {
    const total = quickBillGetTotal();
    if (total <= 0) return;
    
    const success = await completeTransaction({
      items: quickBillItems,
      total,
      paid: total,
      udhar: 0
    });

    if (success) resetQuickBill();
  };

  const processQuickBillUdhar = async (customerId: string) => {
    const total = quickBillGetTotal();
    const paid = parseFloat(qbPartialPayment) || 0;
    const udharAmount = total - paid;
    
    const success = await completeTransaction({
      items: quickBillItems,
      total,
      paid,
      udhar: udharAmount,
      customerId
    });

    if (success) resetQuickBill();
  };

  const handleQbCreateAndCheckout = async () => {
    if (!qbNewCustomer.name || !qbNewCustomer.phone) {
      addToast({ message: 'Name and Phone are mandatory!', type: 'error' });
      return;
    }
    const total = quickBillGetTotal();
    const paid = parseFloat(qbPartialPayment) || 0;
    const udharAmount = total - paid;

    const success = await completeTransaction({
      items: quickBillItems,
      total,
      paid,
      udhar: udharAmount,
      newCustomerData: qbNewCustomer
    });

    if (success) resetQuickBill();
  };

  const processPaidCheckout = async () => {
    const total = getTotal();
    
    const success = await completeTransaction({
      items: cartItems.map(i => ({ product: i, quantity: i.quantity })),
      total,
      paid: total, // For the "Paid" button, we assume 100% paid
      udhar: 0
    });

    if (success) {
      clearCart();
      setPartialPayment('0');
    }
  };

  const processUdharCheckout = async (customerId: string) => {
    const total = getTotal();
    const paid = parseFloat(partialPayment) || 0;
    const udharAmount = total - paid;

    const success = await completeTransaction({
      items: cartItems.map(i => ({ product: i, quantity: i.quantity })),
      total,
      paid,
      udhar: udharAmount,
      customerId
    });

    if (success) {
      clearCart();
      setIsUdharModalOpen(false);
      setPartialPayment('0');
    }
  };

  const handleCreateAndCheckout = async () => {
    if (!newCustomer.name || !newCustomer.phone) {
      addToast({ message: 'Name and Phone are mandatory!', type: 'error' });
      return;
    }
    const total = getTotal();
    const paid = parseFloat(partialPayment) || 0;
    const udharAmount = total - paid;

    const success = await completeTransaction({
      items: cartItems.map(i => ({ product: i, quantity: i.quantity })),
      total,
      paid,
      udhar: udharAmount,
      newCustomerData: newCustomer
    });

    if (success) {
      clearCart();
      setIsUdharModalOpen(false);
      setPartialPayment('0');
      setNewCustomer({ name: '', phone: '' });
    }
  };

  return (
    <PageTransition className="flex flex-col md:flex-row gap-4 md:gap-6 p-2 md:p-6 h-[calc(100vh-80px)] md:h-[calc(100vh-56px)] bg-[#F8F3E5] overflow-hidden">

      {/* ── LEFT COLUMN: Catalog ── */}
      <div className="flex flex-col flex-1 min-w-0 bg-white rounded-[32px] overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-[#CFC3A7]/30">

      {/* Top Header & Search */}
      <div className="bg-gradient-to-r from-[#5F714B] to-[#95A07A] p-4 md:p-5 shadow-sm z-20 shrink-0 sticky top-0 md:relative border-b border-[#CFC3A7]/20">
        <div className="flex items-center gap-3 w-full relative">
          <Input
            placeholder={t('billing.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search size={20} className="text-[#95A07A]" />}
            className="w-full bg-[#F8F3E5] text-[#5F714B] border-transparent focus-visible:border-[#CFC3A7] pl-11 pr-12 rounded-xl"
          />
          <button className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-[#CFC3A7]/20 rounded-lg text-[#95A07A] hover:bg-[#CFC3A7]/40 transition-colors">
            <Mic size={18} />
          </button>
        </div>
        <div className="flex justify-end mt-3 gap-3">
          <button
            onClick={() => setIsQuickBillOpen(true)}
            className="flex items-center gap-1.5 bg-[#F8F3E5]/20 hover:bg-[#F8F3E5]/30 text-[#F8F3E5] px-3 py-1.5 rounded-lg text-xs font-black transition-all active:scale-95"
          >
            <Zap size={14} /> {t('billing.quickBill')}
          </button>
          <button
            onClick={() => addToast({ message: "Voice Billing coming soon!", type: 'info' })}
            className="flex items-center gap-1.5 bg-[#F8F3E5]/20 hover:bg-[#F8F3E5]/30 text-[#F8F3E5] px-3 py-1.5 rounded-lg text-xs font-black transition-all active:scale-95"
          >
            <Mic size={14} /> Voice Bill
          </button>
        </div>
      </div>

      {/* Category Horizontal Scroll */}
      <div className="shrink-0 mt-4 px-4 overflow-x-auto no-scrollbar">
        <div className="flex gap-2 pb-2">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={cn(
                "px-5 py-2 rounded-full font-bold text-sm whitespace-nowrap transition-colors border",
                activeCategory === cat
                  ? "bg-[#95A07A] text-[#F8F3E5] border-[#95A07A]"
                  : "bg-white text-[#9BA88D] border-[#CFC3A7]/50 hover:bg-[#F8F3E5]"
              )}
            >
              {t(`expenses.categories.${cat.toLowerCase()}`, cat)}
            </button>
          ))}
        </div>
      </div>

      {/* Product Grid - HIGH DENSITY */}
      <div className="flex-1 overflow-y-auto no-scrollbar p-4 relative z-10 pb-[200px] md:pb-4">
        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          <AnimatePresence>
            {filteredProducts.map(p => {
              const product = toProduct(p);
              const cartItem = cartItems.find(i => i.id === product.id);
              return (
              <motion.div 
                key={product.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
              >
                <Card 
                  onClick={(e) => !cartItem && handleAddWithAnimation(e, product)}
                  className={cn(
                    "flex flex-col h-full border-[#CFC3A7] p-2 shadow-sm hover:shadow-md transition-all rounded-xl cursor-pointer active:scale-95 relative",
                    cartItem ? "ring-2 ring-[#95A07A] bg-[#F8F3E5]/30" : "bg-white"
                  )}
                >
                  <div className="w-full aspect-square bg-[#F8F3E5] rounded-lg flex items-center justify-center mb-2 text-2xl">
                    {product.name.charAt(0)}
                  </div>
                  <div className="flex flex-col flex-1 min-w-0">
                    <p className="text-[9px] font-black text-[#9BA88D] uppercase tracking-tighter truncate opacity-70">{product.category}</p>
                    <h3 className="text-[11px] font-bold text-[#5F714B] line-clamp-2 leading-tight mt-0.5">{product.name}</h3>
                    <div className="flex items-center justify-between mt-auto pt-2">
                       <p className="text-sm font-black text-[#5F714B]">₹{product.price}</p>
                    </div>
                  </div>
                  
                  {/* Persistent Add/Remove Controls */}
                  <div className="absolute top-1 right-1 flex flex-col gap-1 z-30 pointer-events-auto">
                    {cartItem ? (
                      <>
                        <button 
                          onClick={(e) => { e.stopPropagation(); updateQuantity(product.id, cartItem.quantity + 1); }}
                          className="w-7 h-7 bg-[#95A07A] text-white rounded-lg flex items-center justify-center shadow-lg active:scale-90 transition-transform"
                        >
                          <Plus size={16} strokeWidth={3} />
                        </button>
                        <div className="bg-white border border-[#95A07A]/30 rounded-lg h-7 flex items-center justify-center shadow-sm">
                          <span className="text-[11px] font-black text-[#5F714B]">{cartItem.quantity}</span>
                        </div>
                        <button 
                          onClick={(e) => { e.stopPropagation(); updateQuantity(product.id, cartItem.quantity - 1); }}
                          className="w-7 h-7 bg-white border-2 border-[#95A07A] text-[#95A07A] rounded-lg flex items-center justify-center shadow-lg active:scale-90 transition-transform"
                        >
                          <Minus size={16} strokeWidth={3} />
                        </button>
                      </>
                    ) : (
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleAddWithAnimation(e, product); }}
                        className="w-7 h-7 bg-white border-2 border-[#95A07A] text-[#95A07A] rounded-lg flex items-center justify-center hover:bg-[#95A07A] hover:text-white transition-all active:scale-90 shadow-sm"
                      >
                        <Plus size={16} strokeWidth={3} />
                      </button>
                    )}
                  </div>
                </Card>
              </motion.div>
            )})}
          </AnimatePresence>
        </div>
      </div>

      {/* Quick Bill Modal */}
      <Modal
        isOpen={isQuickBillOpen}
        onClose={resetQuickBill}
        title={qbView === 'products' ? t('billing.quickBill') : t('billing.quickBillUdhar')}
      >
        {qbView === 'products' ? (
          <div className="flex flex-col gap-3">
            {/* Search */}
            <Input
              placeholder={t('billing.searchPlaceholder')}
              value={quickBillSearch}
              onChange={(e) => setQuickBillSearch(e.target.value)}
              leftIcon={<Search size={18} className="text-[#95A07A]" />}
              className="bg-[#F8F3E5] border-transparent"
            />

            {/* Categories */}
            <div className="overflow-x-auto no-scrollbar">
              <div className="flex gap-2 pb-1">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setQuickBillCategory(cat)}
                    className={cn(
                      "px-4 py-1.5 rounded-full font-bold text-xs whitespace-nowrap transition-colors border",
                      quickBillCategory === cat
                        ? "bg-[#95A07A] text-[#F8F3E5] border-[#95A07A]"
                        : "bg-white text-[#9BA88D] border-[#CFC3A7]/50 hover:bg-[#F8F3E5]"
                    )}
                  >
                    {t(`expenses.categories.${cat.toLowerCase()}`, cat)}
                  </button>
                ))}
              </div>
            </div>

            {/* Product Grid */}
            <div className="overflow-y-auto no-scrollbar max-h-[40vh]">
              <div className="grid grid-cols-3 gap-2">
                {inventory.filter(p => {
                  const matchesCat = quickBillCategory === 'All' || p.category === quickBillCategory;
                  const matchesSearch = p.name.toLowerCase().includes(quickBillSearch.toLowerCase());
                  return matchesCat && matchesSearch;
                }).map(p => {
                  const product = toProduct(p);
                  const qbItem = quickBillItems.find(i => i.product.id === product.id);
                  return (
                    <div
                      key={product.id}
                      onClick={() => !qbItem && quickBillAddItem(product)}
                      className={cn(
                        "relative flex flex-col rounded-xl border p-2 cursor-pointer active:scale-95 transition-all",
                        qbItem ? "ring-2 ring-[#95A07A] bg-[#F8F3E5]/30 border-[#95A07A]" : "bg-white border-[#CFC3A7]"
                      )}
                    >
                      <div className="w-full aspect-square bg-[#F8F3E5] rounded-lg flex items-center justify-center mb-1 text-xl">
                        {product.name.charAt(0)}
                      </div>
                      <h3 className="text-[10px] font-bold text-[#5F714B] line-clamp-2 leading-tight">{product.name}</h3>
                      <p className="text-xs font-black text-[#5F714B] mt-0.5">₹{product.price}</p>
                      <div className="absolute top-1 right-1 flex flex-col gap-1 z-10">
                        {qbItem ? (
                          <>
                            <button onClick={(e) => { e.stopPropagation(); quickBillUpdateQty(product.id, qbItem.quantity + 1); }} className="w-6 h-6 bg-[#95A07A] text-white rounded-md flex items-center justify-center active:scale-90 transition-transform">
                              <Plus size={12} strokeWidth={3} />
                            </button>
                            <div className="bg-white border border-[#95A07A]/30 rounded-md h-6 flex items-center justify-center">
                              <span className="text-[10px] font-black text-[#5F714B]">{qbItem.quantity}</span>
                            </div>
                            <button onClick={(e) => { e.stopPropagation(); quickBillUpdateQty(product.id, qbItem.quantity - 1); }} className="w-6 h-6 bg-white border-2 border-[#95A07A] text-[#95A07A] rounded-md flex items-center justify-center active:scale-90 transition-transform">
                              <Minus size={12} strokeWidth={3} />
                            </button>
                          </>
                        ) : (
                          <button onClick={(e) => { e.stopPropagation(); quickBillAddItem(product); }} className="w-6 h-6 bg-white border-2 border-[#95A07A] text-[#95A07A] rounded-md flex items-center justify-center hover:bg-[#95A07A] hover:text-white transition-all active:scale-90">
                            <Plus size={12} strokeWidth={3} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Cart Summary — PAID + UDHAR */}
            <div className="flex flex-col gap-2 pt-3 border-t border-[#CFC3A7]/40">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-[#9BA88D]">{quickBillItems.reduce((s, i) => s + i.quantity, 0)} {t('billing.items')}</p>
                  <p className="text-2xl font-black text-[#5F714B]">₹{quickBillGetTotal()}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => setQbView('udhar')}
                    disabled={quickBillItems.length === 0 || isProcessing}
                    className="bg-[#95A07A] hover:bg-[#5F714B] text-white rounded-xl h-12 px-4 font-black"
                  >
                    {t('billing.udhar')}
                  </Button>
                  <Button
                    onClick={processQuickBill}
                    disabled={quickBillItems.length === 0 || isProcessing}
                    className="bg-[#95A07A] hover:bg-[#5F714B] text-white rounded-xl h-12 px-4 font-black"
                  >
                    {isProcessing ? '...' : t('billing.paid')}
                  </Button>
                </div>
              </div>
              <p className="text-[10px] text-center text-[#9BA88D] font-bold">{t('billing.quickBillNote')}</p>
            </div>
          </div>
        ) : (
          /* Udhar View */
          <div className="flex flex-col gap-4">
            <button
              onClick={() => setQbView('products')}
              className="flex items-center gap-1 text-[#95A07A] text-sm font-bold hover:opacity-70 transition-opacity self-start"
            >
              {t('billing.backToProducts')}
            </button>

            {/* Existing / New tabs */}
            <div className="flex p-1 bg-[#F8F3E5] rounded-xl">
              <button
                onClick={() => setQbCustomerMode('existing')}
                className={cn("flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-black text-sm transition-all",
                  qbCustomerMode === 'existing' ? "bg-white text-[#95A07A] shadow-sm" : "text-[#9BA88D]")}
              >
                <Users size={16} /> {t('common.existing')}
              </button>
              <button
                onClick={() => setQbCustomerMode('new')}
                className={cn("flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-black text-sm transition-all",
                  qbCustomerMode === 'new' ? "bg-white text-[#95A07A] shadow-sm" : "text-[#9BA88D]")}
              >
                <UserPlus size={16} /> {t('common.new')}
              </button>
            </div>

            {/* Partial payment */}
            <div className="bg-[#F8F3E5]/50 p-4 rounded-2xl border border-[#CFC3A7]/30">
              <h5 className="text-[10px] font-black text-[#95A07A] uppercase tracking-[0.2em] mb-3">{t('billing.partialPaymentInfo')}</h5>
              <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center bg-white px-4 py-3 rounded-xl border border-[#CFC3A7]/30">
                  <span className="text-xs font-bold text-[#9BA88D]">{t('billing.billAmount')}</span>
                  <span className="text-sm font-black text-[#5F714B]">₹{quickBillGetTotal()}</span>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] font-black text-[#9BA88D] uppercase tracking-widest px-1">{t('billing.amountReceived')}</label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={qbPartialPayment}
                    onChange={(e) => setQbPartialPayment(e.target.value)}
                    className="bg-white border-2 border-[#95A07A]/20 focus:border-[#95A07A]"
                  />
                </div>
                <div className="flex justify-between items-center bg-[#5F714B] px-4 py-3 rounded-xl shadow-lg">
                  <span className="text-xs font-bold text-[#CFC3A7]">{t('billing.remainingUdhar')}</span>
                  <span className="text-lg font-black text-white">₹{Math.max(quickBillGetTotal() - (parseFloat(qbPartialPayment) || 0), 0)}</span>
                </div>
              </div>
            </div>

            {qbCustomerMode === 'existing' ? (
              <div className="flex flex-col gap-4">
                <Input
                  placeholder={t('billing.searchCustomer')}
                  value={qbCustomerSearch}
                  onChange={(e) => setQbCustomerSearch(e.target.value)}
                  leftIcon={<Search size={18} />}
                  className="bg-white"
                />
                <div className="max-h-[240px] overflow-y-auto no-scrollbar flex flex-col gap-2">
                  {qbFilteredCustomers.map(c => (
                    <button
                      key={c.id}
                      onClick={() => processQuickBillUdhar(c.id)}
                      disabled={isProcessing}
                      className="flex items-center justify-between p-4 bg-white border border-[#CFC3A7]/30 rounded-2xl hover:bg-[#F8F3E5]/30 transition-all text-left"
                    >
                      <div className="flex flex-col">
                        <span className="font-black text-[#5F714B]">{c.name}</span>
                        <span className="text-[10px] font-bold text-[#9BA88D] tracking-widest">{c.phone}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <span className="text-[9px] font-black text-[#9BA88D] uppercase block">{t('common.balance')}</span>
                          <span className="font-black text-[#5F714B]">₹{c.balance}</span>
                        </div>
                        <ArrowRight size={18} className="text-[#CFC3A7]" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black text-[#9BA88D] uppercase tracking-widest px-1">{t('billing.customerName')}</label>
                  <Input
                    placeholder="e.g. Ramesh Kumar"
                    value={qbNewCustomer.name}
                    onChange={(e) => setQbNewCustomer(prev => ({ ...prev, name: e.target.value }))}
                    className="bg-white"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black text-[#9BA88D] uppercase tracking-widest px-1">{t('billing.phoneNumber')}</label>
                  <Input
                    placeholder="+91 00000 00000"
                    value={qbNewCustomer.phone}
                    onChange={(e) => setQbNewCustomer(prev => ({ ...prev, phone: e.target.value }))}
                    className="bg-white"
                  />
                </div>
                <Button
                  onClick={handleQbCreateAndCheckout}
                  disabled={isProcessing}
                  className="mt-2 bg-[#95A07A] hover:bg-[#5F714B] text-white rounded-xl h-14 font-black"
                >
                  {isProcessing ? 'Processing...' : t('billing.createAndAddUdhar')}
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Checkout Selection Modal */}
      <Modal
        isOpen={isUdharModalOpen}
        onClose={() => setIsUdharModalOpen(false)}
        title={t('billing.udharSelection')}
      >
        <div className="flex flex-col gap-6">
          <div className="flex p-1 bg-[#F8F3E5] rounded-xl">
            <button
              onClick={() => setCustomerMode('existing')}
              className={cn("flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-black text-sm transition-all",
                customerMode === 'existing' ? "bg-white text-[#95A07A] shadow-sm" : "text-[#9BA88D]")}
            >
              <Users size={16} /> {t('common.existing')}
            </button>
            <button
              onClick={() => setCustomerMode('new')}
              className={cn("flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-black text-sm transition-all",
                customerMode === 'new' ? "bg-white text-[#95A07A] shadow-sm" : "text-[#9BA88D]")}
            >
              <UserPlus size={16} /> {t('common.new')}
            </button>
          </div>

          <div className="bg-[#F8F3E5]/50 p-4 rounded-2xl border border-[#CFC3A7]/30">
            <h5 className="text-[10px] font-black text-[#95A07A] uppercase tracking-[0.2em] mb-3">{t('billing.partialPaymentInfo')}</h5>
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-center bg-white px-4 py-3 rounded-xl border border-[#CFC3A7]/30">
                <span className="text-xs font-bold text-[#9BA88D]">{t('billing.billAmount')}</span>
                <span className="text-sm font-black text-[#5F714B]">₹{getTotal()}</span>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-black text-[#9BA88D] uppercase tracking-widest px-1">{t('billing.amountReceived')}</label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={partialPayment}
                  onChange={(e) => setPartialPayment(e.target.value)}
                  className="bg-white border-2 border-[#95A07A]/20 focus:border-[#95A07A]"
                />
              </div>
              <div className="flex justify-between items-center bg-[#5F714B] px-4 py-3 rounded-xl shadow-lg">
                <span className="text-xs font-bold text-[#CFC3A7]">{t('billing.remainingUdhar')}</span>
                <span className="text-lg font-black text-white">₹{Math.max(getTotal() - (parseFloat(partialPayment) || 0), 0)}</span>
              </div>
            </div>
          </div>

          {customerMode === 'existing' ? (
            <div className="flex flex-col gap-4">
              <Input
                placeholder={t('billing.searchCustomer')}
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
                leftIcon={<Search size={18} />}
                className="bg-white"
              />
              <div className="max-h-[300px] overflow-y-auto no-scrollbar flex flex-col gap-2">
                {filteredCustomers.map(c => (
                  <button
                    key={c.id}
                    onClick={() => processUdharCheckout(c.id)}
                    disabled={isProcessing}
                    className="flex items-center justify-between p-4 bg-white border border-[#CFC3A7]/30 rounded-2xl hover:bg-[#F8F3E5]/30 transition-all text-left"
                  >
                    <div className="flex flex-col">
                      <span className="font-black text-[#5F714B]">{c.name}</span>
                      <span className="text-[10px] font-bold text-[#9BA88D] tracking-widest">{c.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <span className="text-[9px] font-black text-[#9BA88D] uppercase block">{t('common.balance')}</span>
                        <span className="font-black text-[#5F714B]">₹{c.balance}</span>
                      </div>
                      <ArrowRight size={18} className="text-[#CFC3A7]" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-[#9BA88D] uppercase tracking-widest px-1">{t('billing.customerName')}</label>
                <Input
                  placeholder={t('onboarding.ownerPlaceholder', "Enter full name")}
                  value={newCustomer.name}
                  onChange={(e) => setNewCustomer(prev => ({ ...prev, name: e.target.value }))}
                  className="bg-white"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-[#9BA88D] uppercase tracking-widest px-1">{t('billing.phoneNumber')}</label>
                <Input
                  placeholder={t('common.phonePlaceholder', "+91 00000 00000")}
                  value={newCustomer.phone}
                  onChange={(e) => setNewCustomer(prev => ({ ...prev, phone: e.target.value }))}
                  className="bg-white"
                />
              </div>
              <Button
                onClick={handleCreateAndCheckout}
                disabled={isProcessing}
                className="mt-4 bg-[#95A07A] hover:bg-[#5F714B] text-white rounded-xl h-14 font-black"
              >
                {t('billing.createAndAddUdhar')}
              </Button>
            </div>
          )}
        </div>
      </Modal>

      {/* Fly-to-cart dots animation fallback */}
      <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
        {flyingDots.map(dot => (
          <motion.div
            key={dot.id}
            initial={{ x: dot.x, y: dot.y, scale: 1 }}
            animate={{ x: cartTargetPos.x, y: cartTargetPos.y, scale: 0.2, opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute w-8 h-8 rounded-full bg-[#95A07A] z-50"
          />
        ))}
      </div>

      {/* Mobile-only sticky bottom bill bar */}
      <div className="md:hidden absolute bottom-24 left-4 right-4 bg-white rounded-3xl shadow-[0_-10px_40px_rgba(15,42,29,0.1)] border-2 border-[#CFC3A7] p-4 z-40 flex flex-col gap-3">
        <div className="flex items-center justify-between px-2">
          <div ref={cartIconRef} className="flex items-center gap-2">
            <div className="w-10 h-10 bg-[#F8F3E5] rounded-full flex items-center justify-center relative shadow-inner">
              <CheckCircle2 size={20} className="text-[#95A07A]" />
              {cartItems.length > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                  {cartItems.reduce((acc, i) => acc + i.quantity, 0)}
                </span>
              )}
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-[#5F714B]">{t('billing.totalBill')}</span>
              <span className="text-[11px] font-semibold text-[#9BA88D]">{cartItems.length} {t('billing.items')}</span>
            </div>
          </div>
          <p className="text-2xl font-black text-[#5F714B]">₹{getTotal()}</p>
        </div>
        <div className="flex gap-4">
          <Button
            onClick={processPaidCheckout}
            disabled={cartItems.length === 0 || isProcessing}
            className="flex-1 bg-[#95A07A] hover:bg-[#5F714B] text-white rounded-xl h-12 font-black"
          >
            {isProcessing ? '...' : t('billing.paid')}
          </Button>
          <Button
            onClick={() => setIsUdharModalOpen(true)}
            disabled={cartItems.length === 0 || isProcessing}
            className="flex-1 bg-[#95A07A] hover:bg-[#5F714B] text-white rounded-xl h-12 font-black"
          >
            {t('billing.udhar')}
          </Button>
        </div>
      </div>

      </div>{/* end left column */}

      {/* ── RIGHT COLUMN: Active Bill (desktop only) ── */}
      <div className="hidden md:flex flex-col w-[360px] shrink-0 bg-white rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-[#CFC3A7]/40 p-5 gap-4 overflow-y-auto no-scrollbar">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black text-[#5F714B] tracking-tight">{t('billing.totalBill')}</h2>
            <p className="text-[11px] font-bold text-[#9BA88D] uppercase tracking-widest">
              {cartItems.reduce((acc, i) => acc + i.quantity, 0)} {t('billing.items')}
            </p>
          </div>
          <div ref={cartIconRef} className="w-10 h-10 bg-[#F8F3E5] rounded-full flex items-center justify-center relative shadow-inner">
            <CheckCircle2 size={20} className="text-[#95A07A]" />
            {cartItems.length > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                {cartItems.reduce((acc, i) => acc + i.quantity, 0)}
              </span>
            )}
          </div>
        </div>

        {/* Cart Items */}
        <div className="flex-1 flex flex-col gap-2 overflow-y-auto no-scrollbar">
          {cartItems.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 bg-[#F8F3E5] rounded-2xl flex items-center justify-center mb-3">
                <CheckCircle2 size={28} className="text-[#CFC3A7]" />
              </div>
              <p className="text-sm font-black text-[#9BA88D]">Cart is empty</p>
              <p className="text-xs text-[#CFC3A7] font-bold mt-1">Add products from the catalog</p>
            </div>
          ) : (
            cartItems.map(item => (
              <div key={item.id} className="flex items-center justify-between p-3 bg-[#F8F3E5]/60 rounded-2xl border border-[#CFC3A7]/30">
                <div className="flex flex-col flex-1 min-w-0 mr-2">
                  <p className="text-sm font-black text-[#5F714B] truncate">{item.name}</p>
                  <p className="text-xs font-bold text-[#9BA88D]">₹{item.price} × {item.quantity}</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="w-7 h-7 bg-white border-2 border-[#95A07A] text-[#95A07A] rounded-lg flex items-center justify-center active:scale-90 transition-transform">
                    <Minus size={14} strokeWidth={3} />
                  </button>
                  <span className="text-sm font-black text-[#5F714B] w-5 text-center">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="w-7 h-7 bg-[#95A07A] text-white rounded-lg flex items-center justify-center active:scale-90 transition-transform">
                    <Plus size={14} strokeWidth={3} />
                  </button>
                </div>
                <p className="text-sm font-black text-[#5F714B] ml-3 shrink-0">₹{item.price * item.quantity}</p>
              </div>
            ))
          )}
        </div>

        {/* Total + Checkout */}
        <div className="flex flex-col gap-3 pt-4 border-t border-[#CFC3A7]/40 shrink-0">
          <div className="flex justify-between items-center px-1">
            <span className="text-sm font-bold text-[#9BA88D]">Total</span>
            <span className="text-3xl font-black text-[#5F714B]">₹{getTotal()}</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Button variant="primary" className="w-full bg-[#95A07A] hover:bg-[#5F714B] text-white rounded-xl h-12 font-black" onClick={() => setIsUdharModalOpen(true)} disabled={cartItems.length === 0 || isProcessing}>
              {t('billing.udhar')}
            </Button>
            <Button variant="primary" className="w-full bg-[#95A07A] hover:bg-[#5F714B] text-[#F8F3E5] rounded-xl h-12 font-black" onClick={processPaidCheckout} disabled={cartItems.length === 0 || isProcessing}>
              {isProcessing ? 'Processing...' : t('billing.paid')}
            </Button>
          </div>
        </div>
      </div>

    </PageTransition>
  );
}
