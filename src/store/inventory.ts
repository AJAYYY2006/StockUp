import { create } from 'zustand';
import { supabase } from '../lib/supabase';

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit?: string;
  buyPrice: number;
  sellPrice: number;
  lowStockThreshold: number;
  expiryDate?: string;
  userId?: string;
}

interface InventoryState {
  items: InventoryItem[];
  loading: boolean;
  fetchItems: () => Promise<void>;
  addItem: (item: Omit<InventoryItem, 'id' | 'userId'>) => Promise<void>;
  updateItem: (id: string, updates: Partial<InventoryItem>) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
}

export const useInventoryStore = create<InventoryState>((set) => ({
  items: [],
  loading: false,

  fetchItems: async () => {
    set({ loading: true });
    const { data, error } = await supabase
      .from('inventory')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      const items: InventoryItem[] = data.map((item: any) => ({
        id: item.id,
        name: item.name,
        category: item.category,
        quantity: item.quantity,
        unit: item.unit,
        buyPrice: item.buy_price,
        sellPrice: item.sell_price,
        lowStockThreshold: item.low_stock_threshold,
        expiryDate: item.expiry_date,
        userId: item.user_id
      }));
      set({ items });
    }
    set({ loading: false });
  },

  addItem: async (item) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('inventory')
      .insert({
        user_id: user.id,
        name: item.name,
        category: item.category,
        quantity: item.quantity,
        unit: item.unit,
        buy_price: item.buyPrice,
        sell_price: item.sellPrice,
        low_stock_threshold: item.lowStockThreshold,
        expiry_date: item.expiryDate
      })
      .select()
      .single();

    if (!error && data) {
      const newItem: InventoryItem = {
        id: data.id,
        name: data.name,
        category: data.category,
        quantity: data.quantity,
        unit: data.unit,
        buyPrice: data.buy_price,
        sellPrice: data.sell_price,
        lowStockThreshold: data.low_stock_threshold,
        expiryDate: data.expiry_date,
        userId: data.user_id
      };
      set((state) => ({ items: [newItem, ...state.items] }));
    }
  },

  updateItem: async (id, updates) => {
    const payload: any = {};
    if (updates.name !== undefined) payload.name = updates.name;
    if (updates.category !== undefined) payload.category = updates.category;
    if (updates.quantity !== undefined) payload.quantity = updates.quantity;
    if (updates.unit !== undefined) payload.unit = updates.unit;
    if (updates.buyPrice !== undefined) payload.buy_price = updates.buyPrice;
    if (updates.sellPrice !== undefined) payload.sell_price = updates.sellPrice;
    if (updates.lowStockThreshold !== undefined) payload.low_stock_threshold = updates.lowStockThreshold;
    if (updates.expiryDate !== undefined) payload.expiry_date = updates.expiryDate;

    const { error } = await supabase
      .from('inventory')
      .update(payload)
      .eq('id', id);

    if (!error) {
      set((state) => ({
        items: state.items.map((item) => item.id === id ? { ...item, ...updates } : item)
      }));
    }
  },

  deleteItem: async (id) => {
    const { error } = await supabase
      .from('inventory')
      .delete()
      .eq('id', id);

    if (!error) {
      set((state) => ({
        items: state.items.filter((item) => item.id !== id)
      }));
    }
  },
}));
