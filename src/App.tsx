import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { useAuthStore } from './store/auth';
import LoginScreen from './screens/LoginScreen';
import OnboardingScreen from './screens/OnboardingScreen';
import DashboardScreen from './screens/DashboardScreen';
import BillingScreen from './screens/BillingScreen';
import InventoryScreen from './screens/InventoryScreen';
import ReportsScreen from './screens/ReportsScreen';
import ExpenseScreen from './screens/ExpenseScreen';
import CustomersScreen from './screens/CustomersScreen';
import { AppLayout } from './components/layout/AppLayout';
import BooAiScreen from './screens/BooAiScreen';
import SettingsScreen from './screens/SettingsScreen';
import { ToastContainer } from './components/ui/Toast';

function ProtectedRoute({ children, requireOnboarded = true }: { children: React.ReactNode, requireOnboarded?: boolean }) {
  const { isAuthenticated, isOnboarded, loading } = useAuthStore();
  
  if (loading) {
    return (
      <div className="h-screen w-screen bg-[#FFFBDC] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#FF8237] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (requireOnboarded && !isOnboarded) {
    return <Navigate to="/onboarding" replace />;
  }

  if (!requireOnboarded && isOnboarded) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

function MainRoutes() {
  const location = useLocation();
  const { isAuthenticated, isOnboarded, loading } = useAuthStore();
  
  if (loading) {
     return (
        <div className="h-screen w-screen bg-[#FFFBDC] flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-[#FF8237] border-t-transparent rounded-full animate-spin"></div>
        </div>
      );
  }

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route 
          path="/login" 
          element={isAuthenticated ? <Navigate to={isOnboarded ? "/dashboard" : "/onboarding"} replace /> : <LoginScreen />} 
        />
        <Route path="/onboarding" element={
          <ProtectedRoute requireOnboarded={false}>
            <OnboardingScreen />
          </ProtectedRoute>
        } />
        <Route path="/dashboard" element={<ProtectedRoute><AppLayout><DashboardScreen /></AppLayout></ProtectedRoute>} />
        <Route path="/billing" element={<ProtectedRoute><AppLayout><BillingScreen /></AppLayout></ProtectedRoute>} />
        <Route path="/inventory" element={<ProtectedRoute><AppLayout><InventoryScreen /></AppLayout></ProtectedRoute>} />
        <Route path="/reports" element={<ProtectedRoute><AppLayout><ReportsScreen /></AppLayout></ProtectedRoute>} />
        <Route path="/expenses" element={<ProtectedRoute><AppLayout><ExpenseScreen /></AppLayout></ProtectedRoute>} />
        <Route path="/customers" element={<ProtectedRoute><AppLayout><CustomersScreen /></AppLayout></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><AppLayout><SettingsScreen /></AppLayout></ProtectedRoute>} />
        <Route path="/boo-ai" element={<ProtectedRoute><AppLayout><BooAiScreen /></AppLayout></ProtectedRoute>} />
        
        {/* Default route */}
        <Route path="*" element={<Navigate to={isAuthenticated ? (isOnboarded ? "/dashboard" : "/onboarding") : "/login"} replace />} />
      </Routes>
    </AnimatePresence>
  );
}

function App() {
  const checkAuth = useAuthStore((state) => state.checkAuth);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <BrowserRouter>
      <ToastContainer />
      <MainRoutes />
    </BrowserRouter>
  );
}

export default App;
