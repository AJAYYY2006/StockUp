import { NavLink } from 'react-router-dom';
import { Home, Receipt, PackageSearch, BarChart2, Settings, Users, Banknote, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '../../lib/utils';
import { useAuthStore } from '../../store/auth';

const NAV_ITEMS = [
  { icon: Home, label: 'nav.home', path: '/dashboard' },
  { icon: Receipt, label: 'nav.billing', path: '/billing' },
  { icon: PackageSearch, label: 'nav.inventory', path: '/inventory' },
  { icon: Users, label: 'nav.customers', path: '/customers' },
  { icon: Sparkles, label: 'nav.booAi', path: '/boo-ai' },
  { icon: Banknote, label: 'nav.expenses', path: '/expenses' },
  { icon: BarChart2, label: 'nav.reports', path: '/reports' },
  { icon: Settings, label: 'nav.settings', path: '/settings' },
];


import paisaLogo from '../../assets/paisa_logo.png';

export function Sidebar() {
  const user = useAuthStore((state) => state.user);
  const { t } = useTranslation();

  return (
    <aside className="hidden md:flex flex-col w-[240px] bg-[#FF5900] h-screen fixed top-0 left-0 text-[#FFFBDC] py-6 px-4 shrink-0 shadow-lg z-40">
      <div className="flex items-center gap-3 px-2 mb-10">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center overflow-hidden shrink-0">
          <img src={paisaLogo} alt="Paisa Logo" className="w-full h-full object-cover" />
        </div>
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white mb-0.5">Paisa</h2>
          <p className="text-[#FFD3A5] text-[10px] font-black uppercase tracking-widest leading-none">{t('nav.storePos')}</p>
        </div>
      </div>

      <nav className="flex-1 flex flex-col gap-2 overflow-y-auto no-scrollbar">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => cn(
                "flex items-center gap-3 px-4 py-3 rounded-2xl transition-colors font-medium text-sm shrink-0",
                isActive 
                  ? "bg-[#FF8237] text-[#FFFBDC]" 
                  : "text-[#FFD3A5] hover:bg-[#FF8237]/50 hover:text-[#FFFBDC]"
              )}
            >
              <Icon size={20} />
              {t(item.label)}
            </NavLink>
          );
        })}
      </nav>

      <div className="mt-auto px-2 pb-4">
        <div className="bg-gradient-to-br from-[#FF8237] to-[#FF5900] p-5 rounded-[24px] flex flex-col gap-4 border border-[#FFAA6E]/20 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-xs font-bold text-[#FFD3A5] uppercase tracking-wider mb-1">{t('plan.currentPlan')}</span>
              <span className="text-sm font-black text-white truncate">
                {user?.plan === 'pro' ? t('plan.proMerchant') : (user?.phone || t('plan.storeUser'))}
              </span>
            </div>
            <div className="bg-[#FFFBDC] text-[#FF5900] text-[10px] font-black px-2.5 py-1 rounded-lg shadow-sm">
              PRO
            </div>
          </div>
          <div className="h-1.5 bg-[#FF5900]/50 rounded-full overflow-hidden">
            <div className="h-full bg-[#FFD3A5] w-[85%] rounded-full shadow-[0_0_8px_rgba(174,195,176,0.4)]" />
          </div>
          <p className="text-[10px] text-[#FFD3A5] font-medium leading-relaxed">{t('plan.storage')}</p>
        </div>
      </div>
    </aside>
  );
}
