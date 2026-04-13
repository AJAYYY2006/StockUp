import { create } from 'zustand';
import { supabase } from '../lib/supabase';

export interface Transaction {
  id: string;
  date: string;
  amount: number;
  type: 'debit' | 'credit';
  description: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  balance: number;
  lastTransactionDate: string;
  transactions: Transaction[];
  userId?: string;
}

interface CustomersState {
  items: Customer[];
  loading: boolean;
  fetchCustomers: () => Promise<void>;
  addCustomer: (customer: Omit<Customer, 'id' | 'transactions' | 'userId'>) => Promise<void>;
  updateBalance: (id: string, newBalance: number, amount: number, type: 'debit' | 'credit', description: string) => Promise<void>;
  deleteCustomer: (id: string) => Promise<void>;
}

export const useCustomersStore = create<CustomersState>((set) => ({
  items: [],
  loading: false,

  fetchCustomers: async () => {
    set({ loading: true });
    const { data, error } = await supabase
      .from('customers')
      .select('*, customer_transactions(*)')
      .order('created_at', { ascending: false });

    if (!error && data) {
      const items: Customer[] = data.map((c: any) => ({
        id: c.id,
        name: c.name,
        phone: c.phone || '',
        balance: c.balance || 0,
        lastTransactionDate: c.last_transaction_date || '',
        transactions: (c.customer_transactions || []).map((t: any) => ({
          id: t.id,
          date: t.date,
          amount: t.amount,
          type: t.type,
          description: t.description
        })).sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()),
        userId: c.user_id
      }));
      set({ items });
    }
    set({ loading: false });
  },

  addCustomer: async (customer) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('customers')
      .insert({
        user_id: user.id,
        name: customer.name,
        phone: customer.phone,
        balance: customer.balance,
        last_transaction_date: customer.lastTransactionDate
      })
      .select()
      .single();

    if (!error && data) {
      const newCustomer: Customer = {
        id: data.id,
        name: data.name,
        phone: data.phone || '',
        balance: data.balance || 0,
        lastTransactionDate: data.last_transaction_date || '',
        transactions: [],
        userId: data.user_id
      };
      set((state) => ({ items: [newCustomer, ...state.items] }));
    }
  },

  updateBalance: async (id, newBalance, amount, type, description) => {
    const now = new Date().toISOString();
    
    // 1. Update Customer Balance
    const { error: custError } = await supabase
      .from('customers')
      .update({ 
        balance: newBalance,
        last_transaction_date: now
      })
      .eq('id', id);

    if (custError) return;

    // 2. Add Transaction Record
    const { data: txnData, error: txnError } = await supabase
      .from('customer_transactions')
      .insert({
        customer_id: id,
        amount: amount,
        type: type,
        description: description,
        date: now
      })
      .select()
      .single();

    if (!txnError && txnData) {
      set((state) => ({
        items: state.items.map((c) => c.id === id ? { 
          ...c, 
          balance: newBalance, 
          lastTransactionDate: now,
          transactions: [{
            id: txnData.id,
            date: txnData.date,
            amount: txnData.amount,
            type: txnData.type,
            description: txnData.description
          }, ...c.transactions]
        } : c)
      }));
    }
  },

  deleteCustomer: async (id) => {
    const { error } = await supabase
      .from('customers')
      .delete()
      .eq('id', id);

    if (!error) {
      set((state) => ({
        items: state.items.filter((c) => c.id !== id)
      }));
    }
  },
}));
