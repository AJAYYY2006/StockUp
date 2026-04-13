import { create } from 'zustand';
import React from 'react';

interface LayoutState {
  headerActions: React.ReactNode | null;
  setHeaderActions: (actions: React.ReactNode | null) => void;
}

export const useLayoutStore = create<LayoutState>((set) => ({
  headerActions: null,
  setHeaderActions: (actions) => set({ headerActions: actions }),
}));
