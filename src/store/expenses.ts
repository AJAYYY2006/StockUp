import { create } from 'zustand';
import { supabase } from '../lib/supabase';

export type ExpenseCategory = 'Stock' | 'Rent' | 'Electricity' | 'Salary' | 'Other';

export interface Expense {
  id: string;
  amount: number;
  vendor: string;
  category: ExpenseCategory;
  date: string; // ISO string
  imageUrl?: string;
  userId?: string;
}

interface ExpensesState {
  items: Expense[];
  loading: boolean;
  fetchExpenses: () => Promise<void>;
  addExpense: (expense: Omit<Expense, 'id' | 'userId'>) => Promise<void>;
}

export const useExpenseStore = create<ExpensesState>((set) => ({
  items: [],
  loading: false,

  fetchExpenses: async () => {
    set({ loading: true });
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .order('date', { ascending: false });

    if (!error && data) {
      const items: Expense[] = data.map((e: any) => ({
        id: e.id,
        amount: e.amount,
        vendor: e.vendor || '',
        category: e.category as ExpenseCategory,
        date: e.date,
        imageUrl: e.image_url,
        userId: e.user_id
      }));
      set({ items });
    }
    set({ loading: false });
  },

  addExpense: async (expense) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('expenses')
      .insert({
        user_id: user.id,
        amount: expense.amount,
        vendor: expense.vendor,
        category: expense.category,
        date: expense.date,
        image_url: expense.imageUrl
      })
      .select()
      .single();

    if (!error && data) {
      const newExpense: Expense = {
        id: data.id,
        amount: data.amount,
        vendor: data.vendor,
        category: data.category as ExpenseCategory,
        date: data.date,
        imageUrl: data.image_url,
        userId: data.user_id
      };
      set((state) => ({ items: [newExpense, ...state.items] }));
    }
  },
}));
