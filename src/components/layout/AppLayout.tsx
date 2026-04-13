import React, { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';
import { ToastContainer } from '../ui/Toast';
import { Header } from './Header';
import { useLocation } from 'react-router-dom';

interface AppLayoutProps {
  children: React.ReactNode;
  fab?: React.ReactNode;
}

const ROUTE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/billing': 'Billing',
  '/inventory': 'Inventory',
  '/customers': 'Customers',
  '/expenses': 'Expenses',
  '/reports': 'Reports',
  '/settings': 'Settings',
  '/boo-ai': 'BOO AI'
};

export function AppLayout({ children, fab }: AppLayoutProps) {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const location = useLocation();
  const currentTitle = ROUTE_TITLES[location.pathname] || 'Dashboard';

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <div className="flex min-h-screen bg-[#FFFBDC] text-[#FF5900] w-full">
      <ToastContainer />
      
      {/* Laptop Layout Sidebar */}
      <Sidebar />
      
      {/* Main Content Area */}
      <div className="flex-1 md:pl-[240px] flex flex-col min-h-screen relative overflow-hidden">
        {/* Desktop Header */}
        <Header title={currentTitle} />

        <main className="flex-1 w-full max-w-[960px] mx-auto pb-24 md:pb-8 pt-safe md:pt-2 overflow-y-auto no-scrollbar relative min-h-screen">
          {/* Offline Banner */}
          {isOffline && (
            <div className="bg-[#FF5900] text-[#FFFBDC] text-xs font-bold text-center py-2 px-4 shadow-md z-50 sticky top-0 md:rounded-b-2xl mx-auto w-full md:w-11/12 max-w-sm mb-2">
              You are currently offline. Some features may be limited.
            </div>
          )}
          {children}
        </main>
        
        {/* Floating Action Button (FAB) Slot - Mobile Only (or universal if styled) */}
        {fab && (
          <div className="fixed md:absolute bottom-[88px] md:bottom-8 right-4 md:right-8 z-30">
            {fab}
          </div>
        )}
      </div>

      {/* Mobile Layout Bottom Nav */}
      <BottomNav />
    </div>
  );
}
