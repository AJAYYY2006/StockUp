import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, Receipt, PackageSearch, BarChart2, Settings, Users, Banknote, Menu, X, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { cn } from '../../lib/utils';

const MAIN_ITEMS = [
  { icon: Home, label: 'nav.home', path: '/dashboard' },
  { icon: Receipt, label: 'nav.billing', path: '/billing' },
  { icon: PackageSearch, label: 'nav.inventory', path: '/inventory' },
  { icon: Users, label: 'nav.customers', path: '/customers' },
];

const MORE_ITEMS = [
  { icon: Sparkles, label: 'nav.booAi', path: '/boo-ai' },
  { icon: Banknote, label: 'nav.expenses', path: '/expenses' },
  { icon: BarChart2, label: 'nav.reports', path: '/reports' },
  { icon: Settings, label: 'nav.settings', path: '/settings' },
];

export function BottomNav() {
  const [showMore, setShowMore] = useState(false);
  const location = useLocation();
  const { t } = useTranslation();

  // Close more menu on route change
  React.useEffect(() => {
    setShowMore(false);
  }, [location.pathname]);

  const isMoreActive = MORE_ITEMS.some(item => location.pathname.startsWith(item.path));

  return (
    <>
      {/* More Menu Overlay */}
      <AnimatePresence>
        {showMore && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMore(false)}
              className="fixed inset-0 bg-black/60 z-30 md:hidden backdrop-blur-sm"
            />
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed bottom-[80px] inset-x-4 bg-[#FFFBDC] rounded-3xl p-4 shadow-2xl z-40 md:hidden flex flex-col gap-2 border border-[#FFD3A5]"
            >
              <h3 className="text-[#FF5900] font-bold px-2 mb-2">{t('nav.moreOptions', 'More Options')}</h3>
              <div className="grid grid-cols-3 gap-2">
                {MORE_ITEMS.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      className={({ isActive }) => cn(
                        "flex flex-col items-center justify-center p-3 rounded-2xl transition-all",
                        isActive ? "bg-[#FF8237] text-[#FFFBDC]" : "bg-white text-[#FF5900] shadow-sm hover:!bg-[#FFD3A5]"
                      )}
                    >
                      <Icon size={24} className="mb-2" />
                      <span className="text-[11px] font-bold">{t(item.label)}</span>
                    </NavLink>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="fixed bottom-0 inset-x-0 bg-[#FF5900] flex items-center justify-around px-2 pb-safe pt-2 rounded-t-3xl shadow-2xl z-40 md:hidden">
        {MAIN_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => cn(
                "flex flex-col items-center justify-center w-[20%] h-14 rounded-2xl transition-all",
                isActive ? "text-[#FFFBDC]" : "text-[#FFAA6E]"
              )}
            >
              {({ isActive }) => (
                <>
                  <div className={cn(
                    "p-1.5 rounded-full transition-all",
                    isActive && "bg-[#FF8237]"
                  )}>
                    <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                  </div>
                  <span className="text-[10px] mt-1 font-medium">{t(item.label)}</span>
                </>
              )}
            </NavLink>
          );
        })}

        {/* More Toggle Button */}
        <button
          onClick={() => setShowMore(!showMore)}
          className={cn(
            "flex flex-col items-center justify-center w-[20%] h-14 rounded-2xl transition-all",
            (isMoreActive || showMore) ? "text-[#FFFBDC]" : "text-[#FFAA6E]"
          )}
        >
          <div className={cn(
            "p-1.5 rounded-full transition-all",
            (isMoreActive || showMore) && "bg-[#FF8237]"
          )}>
            {showMore ? <X size={22} strokeWidth={2.5} /> : <Menu size={22} strokeWidth={isMoreActive ? 2.5 : 2} />}
          </div>
          <span className="text-[10px] mt-1 font-medium">{t('nav.more', 'More')}</span>
        </button>
      </div>
    </>
  );
}
