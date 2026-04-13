import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../store/auth';
import { useInventoryStore, type InventoryItem } from '../store/inventory';
import { useTranslation } from 'react-i18next';
import { PageTransition } from '../components/layout/PageTransition';
import { EmptyState } from '../components/ui/EmptyState';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { PlanGate } from '../components/ui/PlanGate';
import { BottomSheet } from '../components/ui/BottomSheet';
import { Modal } from '../components/ui/Modal';
import { Search, Plus, Package, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { useToastStore } from '../store/toast';

const CATEGORIES = ['All', 'Dairy', 'Grains', 'Snacks', 'Beverages', 'Personal Care', 'Other'];
const CATEGORY_EMOJIS: Record<string, string> = {
  Dairy: '🥛',
  Grains: '🌾',
  Snacks: '🍪',
  Beverages: '🥤',
  'Personal Care': '🧼',
  Other: '📦',
  All: '🛍️'
};
const PLAN_LIMITS: Record<string, number> = { free: 50, basic: 99999, pro: 99999 };

interface InventoryFormProps {
  formData: any;
  setFormData: (data: any) => void;
  handleSave: (e: React.FormEvent) => void;
  isSaving: boolean;
  editingItem: InventoryItem | null;
  handleDelete: () => void;
  t: any;
}

const InventoryForm = ({ 
  formData, 
  setFormData, 
  handleSave, 
  isSaving, 
  editingItem, 
  handleDelete, 
  t 
}: InventoryFormProps) => (
  <form onSubmit={handleSave} className="flex flex-col gap-4">
    <Input 
      label={t('inventory.productName', "Product Name *")}
      placeholder={t('inventory.productNamePlaceholder', "e.g. Tomato Ketchup")}
      value={formData.name}
      onChange={(e) => setFormData({...formData, name: e.target.value})}
      required
    />
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-bold text-[#FF8237]">{t('inventory.category', "Category *")}</label>
      <select 
        value={formData.category}
        onChange={(e) => setFormData({...formData, category: e.target.value})}
        className="w-full px-4 py-3 bg-white border border-[#FFD3A5] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FFAA6E] transition-shadow text-[#FF5900] font-medium"
      >
        {CATEGORIES.filter(c => c !== 'All').map(c => <option key={c} value={c}>{t(`expenses.categories.${c.toLowerCase()}`, c)}</option>)}
      </select>
    </div>
    
    <div className="grid grid-cols-2 gap-4">
      <div className="flex gap-2">
        <div className="flex-1">
          <Input 
            label={t('inventory.quantity', "Quantity *")}
            type="number"
            placeholder="0"
            value={formData.quantity}
            onChange={(e) => setFormData({...formData, quantity: e.target.value})}
            required
          />
        </div>
        <div className="w-20">
          <Input 
            label={t('inventory.unit', "Unit")}
            placeholder={t('inventory.pcs', "pcs")}
            value={formData.unit}
            onChange={(e) => setFormData({...formData, unit: e.target.value})}
          />
        </div>
      </div>
      <Input 
        label={t('inventory.sellPrice', "Sell Price (₹) *")}
        type="number"
        placeholder="0.00"
        value={formData.sellPrice}
        onChange={(e) => setFormData({...formData, sellPrice: e.target.value})}
        required
      />
    </div>

    <div className="grid grid-cols-2 gap-4">
      <Input 
        label={t('inventory.buyPrice', "Buy Price (₹)")}
        type="number"
        placeholder="0.00"
        value={formData.buyPrice}
        onChange={(e) => setFormData({...formData, buyPrice: e.target.value})}
      />
      <Input 
        label={t('inventory.lowStockAlert', "Low Stock Alert")}
        type="number"
        placeholder="5"
        value={formData.lowStockThreshold}
        onChange={(e) => setFormData({...formData, lowStockThreshold: e.target.value})}
      />
      <Input 
        label={t('inventory.expiry', "Expiry (Optional)")}
        type="date"
        value={formData.expiryDate}
        onChange={(e) => setFormData({...formData, expiryDate: e.target.value})}
      />
    </div>

    <div className="flex gap-3 mt-4">
      {editingItem && (
        <Button 
          type="button" 
          variant="outline" 
          onClick={handleDelete}
          className="flex-1 h-12 border-red-200 text-red-500 hover:bg-red-50"
        >
          <Trash2 size={18} />
        </Button>
      )}
      <Button type="submit" isSuccess={isSaving} className="flex-[3] h-12 text-lg">
        {editingItem ? t('inventory.updateProduct', 'Update Product') : t('inventory.addToInventory', 'Add to Inventory')}
      </Button>
    </div>
  </form>
);

export default function InventoryScreen() {
  const user = useAuthStore((state) => state.user);
  const addToast = useToastStore((state) => state.addToast);
  const { items, addItem, updateItem, deleteItem, fetchItems, loading } = useInventoryStore();
  const { t } = useTranslation();
  
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeadStockOpen, setIsDeadStockOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [formData, setFormData] = useState({
    name: '', category: 'Other', quantity: '', unit: 'pcs', buyPrice: '', sellPrice: '', lowStockThreshold: '5', expiryDate: ''
  });

  useEffect(() => {
    fetchItems();
  }, []);

  const planId = user?.plan || 'free';
  const limit = PLAN_LIMITS[planId];
  const isLimitReached = items.length >= limit;

  const filteredItems = items.filter(p => {
    const matchesCat = activeCategory === 'All' || p.category === activeCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const handleOpenAddForm = () => {
    setEditingItem(null);
    setFormData({ name: '', category: 'Other', quantity: '', unit: 'pcs', buyPrice: '', sellPrice: '', lowStockThreshold: '5', expiryDate: '' });
    setIsFormOpen(true);
  };

  const handleOpenEditForm = (item: InventoryItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      category: item.category,
      quantity: item.quantity.toString(),
      unit: item.unit || 'pcs',
      buyPrice: item.buyPrice.toString(),
      sellPrice: item.sellPrice.toString(),
      lowStockThreshold: item.lowStockThreshold.toString(),
      expiryDate: item.expiryDate || '',
    });
    setIsFormOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.quantity || !formData.sellPrice) return;

    setIsSaving(true);
    
    const payload = {
      name: formData.name,
      category: formData.category,
      quantity: parseInt(formData.quantity, 10),
      unit: formData.unit,
      buyPrice: parseFloat(formData.buyPrice) || 0,
      sellPrice: parseFloat(formData.sellPrice),
      lowStockThreshold: parseInt(formData.lowStockThreshold, 10),
      expiryDate: formData.expiryDate || undefined,
    };

    try {
      if (editingItem) {
        await updateItem(editingItem.id, payload);
        addToast({ message: t('inventory.productUpdated', 'Product updated successfully'), type: 'success' });
      } else {
        await addItem(payload);
        addToast({ message: t('inventory.productAdded', 'Product added successfully'), type: 'success' });
      }
      setIsFormOpen(false);
    } catch (error) {
       addToast({ message: t('common.error', 'Something went wrong'), type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!editingItem) return;
    if (confirm(t('common.confirmDelete', 'Are you sure you want to delete this?'))) {
      setIsSaving(true);
      await deleteItem(editingItem.id);
      addToast({ message: t('inventory.productDeleted', 'Product deleted'), type: 'success' });
      setIsSaving(false);
      setIsFormOpen(false);
    }
  };

  return (
    <PageTransition className="flex flex-col h-full min-h-screen pb-20">
      {/* Header Area */}
      <div className="bg-[#FF5900] rounded-b-3xl p-4 md:p-6 shadow-xl z-20 shrink-0 sticky top-0 md:relative">
        
        <div className="flex justify-between items-center mb-4 text-[#FFFBDC]">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Package size={22} /> StockUp
          </h2>
          <div className="flex-1 max-w-[160px] ml-4">
            <div className="flex justify-between items-center mb-1">
              <span className="text-[10px] font-bold text-[#FFD3A5] uppercase tracking-wider">{planId} Plan</span>
              <span className="text-[10px] font-bold text-[#FFFBDC]">{items.length}/{limit === 99999 ? '∞' : limit}</span>
            </div>
            <div className="h-1.5 w-full bg-[#FF8237] rounded-full overflow-hidden">
              <div 
                className="h-full bg-[#FFD3A5] rounded-full transition-all duration-500" 
                style={{ width: `${Math.min((items.length / (limit === 99999 ? (items.length || 1) : limit)) * 100, 100)}%` }}
              />
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <Input 
            placeholder={t('inventory.searchPlaceholder', "Search inventory...")} 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search size={20} className="text-[#FF8237]" />}
            className="flex-1 bg-[#FFFBDC] text-[#FF5900] border-transparent focus-visible:border-[#FFD3A5] rounded-xl h-12"
          />
          <Button 
            onClick={handleOpenAddForm}
            className="hidden md:flex items-center gap-2 px-6 h-12 bg-[#FF8237] hover:bg-[#FFAA6E] text-[#FFFBDC] rounded-xl font-bold shadow-lg shrink-0 border-none"
          >
            <Plus size={20} strokeWidth={3} />
            {t('inventory.addProduct', "Add Product")}
          </Button>
        </div>
      </div>

      {/* Categories */}
      <div className="shrink-0 mt-4 px-4 overflow-x-auto no-scrollbar">
        <div className="flex gap-2 pb-2">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={cn(
                "px-4 py-1.5 rounded-full font-bold text-sm whitespace-nowrap transition-colors border",
                activeCategory === cat 
                  ? "bg-[#FF8237] text-[#FFFBDC] border-[#FF8237]" 
                  : "bg-white text-[#FFAA6E] border-[#FFD3A5]/50 hover:bg-[#FFFBDC]"
              )}
            >
              {t(`expenses.categories.${cat.toLowerCase()}`, cat)}
            </button>
          ))}
        </div>
      </div>

      {/* Product List - HIGH DENSITY */}
      <div className="flex-1 p-4 grid grid-cols-3 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3 auto-rows-max">
        {loading ? (
          <div className="col-span-full py-20 flex justify-center">
            <div className="w-10 h-10 border-4 border-[#FF8237] border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <AnimatePresence>
            {filteredItems.map(item => {
              const isLowStock = item.quantity <= item.lowStockThreshold;
              
              return (
                <motion.div
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  key={item.id}
                  className="h-full"
                >
                  <Card 
                    onClick={() => handleOpenEditForm(item)}
                    className={cn(
                      "p-2.5 h-full cursor-pointer hover:shadow-md transition-all flex flex-col justify-between border-2 rounded-xl",
                      isLowStock ? "border-[#FF5900] bg-[#FFFBDC]/50" : "border-[#FFD3A5]/30 bg-white"
                    )}
                  >
                    <div>
                      <div className="flex justify-between items-start mb-1.5">
                        <span className="text-xl" role="img" aria-label={item.category}>
                          {CATEGORY_EMOJIS[item.category] || '📦'}
                        </span>
                        <div className="flex flex-col gap-0.5 items-end">
                          {isLowStock && (
                            <span className="px-1 py-0.5 text-[7px] bg-[#FF5900] text-[#FFFBDC] rounded-md font-black uppercase whitespace-nowrap">
                              {t('inventory.low', 'Low')}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <h3 className="font-bold text-[#FF5900] text-[11px] leading-tight line-clamp-2">{item.name}</h3>
                      <p className="text-[9px] font-bold text-[#FFAA6E] mt-0.5 uppercase tracking-tighter opacity-70">{t(`expenses.categories.${item.category.toLowerCase()}`, item.category)}</p>
                    </div>

                    <div className="mt-auto pt-3">
                      <div className="flex items-baseline gap-1">
                        <span className={cn(
                          "text-base font-black tracking-tighter",
                          isLowStock ? "text-[#FF5900]" : "text-[#FF8237]"
                        )}>
                          {item.quantity}
                        </span>
                        <span className="text-[9px] font-bold text-gray-400 lowercase">{item.unit || 'pcs'}</span>
                      </div>
                      <div className="flex justify-between items-center mt-0.5">
                        <div className="text-[10px] font-black text-[#FF8237]">₹{item.sellPrice}</div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}

        {!loading && filteredItems.length === 0 && (
          <div className="col-span-full py-10">
            <EmptyState 
              icon={Package}
              title={t('inventory.noItems', "No items found")}
              description={t('inventory.emptyDesc', "Your inventory is empty or no matches were found.")}
              actionLabel={t('inventory.addItem', "Add Item")}
              onAction={handleOpenAddForm}
            />
          </div>
        )}
      </div>

      {/* Dead Stock Section */}
      <div className="px-4 mt-6 mb-20 md:mb-10">
        <button 
          onClick={() => setIsDeadStockOpen(!isDeadStockOpen)}
          className="flex items-center justify-between w-full p-4 bg-[#FF5900] text-[#FFFBDC] rounded-2xl shadow-md font-bold"
        >
          <div className="flex items-center gap-2">
            <span className="text-xl">💤</span> {t('inventory.deadStock', 'Dead Stock (30+ Days)')}
          </div>
          {isDeadStockOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </button>
        <AnimatePresence>
          {isDeadStockOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden bg-white/50 rounded-b-2xl border-x border-b border-[#FFD3A5]"
            >
              <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                {items.filter(i => i.id === '6').map(item => (
                   <Card key={item.id} className="p-3 bg-white/80 border-[#FFD3A5]/50 flex justify-between items-center">
                     <div>
                       <h4 className="font-bold text-sm text-[#FF5900]">{item.name}</h4>
                       <p className="text-[10px] text-gray-500">{t('inventory.lastSoldNever', 'Last sold: Never')}</p>
                     </div>
                     <div className="font-black text-[#FF5900]">{item.quantity} {item.unit}</div>
                   </Card>
                ))}
                {items.filter(i => i.id === '6').length === 0 && (
                  <p className="col-span-full text-center text-sm py-4 text-gray-500">{t('inventory.noDeadStock', 'No dead stock identified.')}</p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Floating Action Button with Limit Wrapper - Hidden on Desktop */}
      <div className="fixed md:hidden bottom-[88px] right-4 z-30">
        <PlanGate allowedPlans={['pro', 'basic']} currentPlan={user?.plan || 'free'} hideGate={!isLimitReached} requiredFeatureMessage={t('inventory.unlimitedNeedsBasic', 'Unlimited Inventory needs Basic')}>
          <Button 
            onClick={handleOpenAddForm}
            className="w-14 h-14 rounded-full shadow-[0_10px_25px_rgba(15,42,29,0.3)] bg-[#FF5900] hover:bg-[#FF8237] active:scale-95 transition-transform flex items-center justify-center p-0"
          >
            <Plus size={28} className="text-[#FFFBDC]" />
          </Button>
        </PlanGate>
      </div>

      {/* Add/Edit Product Container - Responsive (Modal for Desktop, BottomSheet for Mobile) */}
      <div className="hidden md:block">
        <Modal 
          isOpen={isFormOpen} 
          onClose={() => setIsFormOpen(false)} 
          title={editingItem ? t('inventory.editProduct', "Edit Product") : t('inventory.addProduct', "Add Product")}
        >
          <InventoryForm 
            formData={formData}
            setFormData={setFormData}
            handleSave={handleSave}
            isSaving={isSaving}
            editingItem={editingItem}
            handleDelete={handleDelete}
            t={t}
          />
        </Modal>
      </div>

      <div className="md:hidden">
        <BottomSheet 
          isOpen={isFormOpen} 
          onClose={() => setIsFormOpen(false)} 
          title={editingItem ? t('inventory.editProduct', "Edit Product") : t('inventory.addProduct', "Add Product")}
        >
          <InventoryForm 
            formData={formData}
            setFormData={setFormData}
            handleSave={handleSave}
            isSaving={isSaving}
            editingItem={editingItem}
            handleDelete={handleDelete}
            t={t}
          />
        </BottomSheet>
      </div>

    </PageTransition>
  );
}
