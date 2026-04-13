import { create } from 'zustand';

interface FinanceState {
  revenueToday: number;
  expenseToday: number;
  addRevenue: (amount: number) => void;
  addExpense: (amount: number) => void;
  getProfit: () => number;
}

export const useFinanceStore = create<FinanceState>((set, get) => ({
  revenueToday: 14680, // Initial mock from dashboard mockup
  expenseToday: 5920,   // Initial mock from dashboard mockup
  addRevenue: (amount) => set((state) => ({ revenueToday: state.revenueToday + amount })),
  addExpense: (amount) => set((state) => ({ expenseToday: state.expenseToday + amount })),
  getProfit: () => get().revenueToday - get().expenseToday,
}));
