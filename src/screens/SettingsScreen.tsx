import { useState } from 'react';
import { useAuthStore } from '../store/auth';
import { useTranslation } from 'react-i18next';
import { PageTransition } from '../components/layout/PageTransition';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Switch } from '../components/ui/Switch';
import { motion } from 'framer-motion';
import {
  LogOut,
  Globe,
  Store,
  User,
  Sparkles,
  Bell,
  PackageSearch,
  Download,
  Edit2
} from 'lucide-react';
import { cn } from '../lib/utils';

type SettingsTab = 'profile' | 'plan' | 'notifications' | 'data';

const LANGUAGES = [
  { code: 'ta', label: 'தமிழ்' },
  { code: 'hi', label: 'हिंदी' },
  { code: 'en', label: 'English' },
];

export default function SettingsScreen() {
  const { user, updateUser, setLanguage, logout, language } = useAuthStore();
  const { t } = useTranslation();

  const [storeName, setStoreName] = useState(user?.storeName || '');
  const [ownerName, setOwnerName] = useState(user?.ownerName || '');
  const [lowStockAlerts, setLowStockAlerts] = useState(true);
  const [creditReminders, setCreditReminders] = useState(false);
  const [threshold, setThreshold] = useState('10');
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');

  const isPro = user?.plan === 'pro';

  const handleSave = () => {
    updateUser({ storeName, ownerName });
  };

  const handleExport = () => {
    window.dispatchEvent(new CustomEvent('show-toast', { 
      detail: { message: t('settings.exportingData', "Exporting all data as CSV..."), type: 'success' } 
    }));
  };

  const TABS: { id: SettingsTab; label: string; icon: React.ElementType }[] = [
    { id: 'profile', label: t('settings.storeProfile', 'Store Profile'), icon: Store },
    { id: 'plan', label: t('settings.planDetails', 'Plan & Language'), icon: Sparkles },
    { id: 'notifications', label: t('settings.notificationAlerts', 'Notifications'), icon: Bell },
    { id: 'data', label: t('settings.inventory', 'Data & Inventory'), icon: PackageSearch },
  ];

  const TabContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black text-[#5F714B]">{t('settings.storeProfile', 'Store Profile')}</h2>
              <button onClick={handleSave} className="px-4 py-2 bg-[#95A07A] text-white text-xs font-black rounded-xl hover:bg-[#5F714B] transition-all">
                {t('settings.saveChanges', 'Save Changes')}
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="group space-y-3">
                <label className="text-[10px] font-black text-[#95A07A] uppercase tracking-widest ml-1 block">{t('settings.storeName', 'Store Name')}</label>
                <div className="flex items-center gap-4 bg-[#F8F3E5]/30 p-4 rounded-2xl border-2 border-transparent group-focus-within:border-[#CFC3A7]/50 transition-all">
                  <input value={storeName} onChange={(e) => setStoreName(e.target.value)} onBlur={handleSave} className="bg-transparent border-none outline-none text-base font-black text-[#5F714B] w-full" />
                  <Edit2 size={16} className="text-[#95A07A]/30" />
                </div>
              </div>
              <div className="group space-y-3">
                <label className="text-[10px] font-black text-[#95A07A] uppercase tracking-widest ml-1 block">{t('settings.ownerName', 'Owner Name')}</label>
                <div className="flex items-center gap-4 bg-[#F8F3E5]/30 p-4 rounded-2xl border-2 border-transparent group-focus-within:border-[#CFC3A7]/50 transition-all">
                  <input value={ownerName} onChange={(e) => setOwnerName(e.target.value)} onBlur={handleSave} className="bg-transparent border-none outline-none text-base font-black text-[#5F714B] w-full" />
                  <User size={16} className="text-[#95A07A]/30" />
                </div>
              </div>
            </div>
            <div className="p-4 bg-white/50 rounded-2xl border border-[#CFC3A7]/30 flex items-center gap-4">
              <div className="w-12 h-12 bg-[#95A07A] rounded-xl flex items-center justify-center text-white shrink-0">
                <User size={22} />
              </div>
              <div>
                <p className="text-sm font-black text-[#5F714B]">{user?.ownerName || user?.email?.split('@')[0] || 'User'}</p>
                <p className="text-[10px] font-bold text-[#9BA88D]">{user?.email}</p>
              </div>
            </div>
          </div>
        );
      case 'plan':
        return (
          <div className="flex flex-col gap-6">
            <h2 className="text-lg font-black text-[#5F714B]">{t('settings.planDetails', 'Plan & Language')}</h2>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 bg-gradient-to-br from-[#5F714B] to-[#95A07A] rounded-[24px] text-white relative overflow-hidden">
              <div className="absolute top-[-20%] right-[-10%] w-32 h-32 bg-white rounded-full blur-3xl opacity-10" />
              <div className="flex items-center gap-4 z-10">
                <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center border border-white/10">
                  <Sparkles size={28} className="text-[#CFC3A7]" />
                </div>
                <div>
                  <span className="text-[10px] font-black text-[#CFC3A7] uppercase tracking-widest block mb-1">{t('settings.activePlan', 'Active Plan')}</span>
                  <span className="text-2xl font-black capitalize">{user?.plan || 'PRO'} Account</span>
                </div>
              </div>
              <Button className="h-12 px-8 bg-[#F8F3E5] hover:bg-white text-[#5F714B] font-black text-xs rounded-xl border-none shadow-xl z-10">
                {t('settings.upgradePlan', 'UPGRADE PLAN')}
              </Button>
            </div>
            <div className="p-6 bg-white rounded-2xl border border-[#CFC3A7]/30 flex flex-col gap-4">
              <div className="flex items-center gap-2 mb-2">
                <Globe size={16} className="text-[#9BA88D]" />
                <h3 className="text-[10px] font-black text-[#9BA88D] uppercase tracking-widest">{t('settings.displayLanguage', 'Display Language')}</h3>
              </div>
              <div className="flex p-1.5 bg-[#F8F3E5]/30 rounded-[20px] gap-1">
                {LANGUAGES.map((lang) => (
                  <button key={lang.code} onClick={() => setLanguage(lang.code)}
                    className={cn("flex-1 py-3.5 text-xs font-black rounded-[14px] transition-all",
                      language === lang.code ? "bg-[#95A07A] text-white shadow-lg" : "text-[#9BA88D] hover:bg-white/50"
                    )}>
                    {lang.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );
      case 'notifications':
        return (
          <div className="flex flex-col gap-6">
            <h2 className="text-lg font-black text-[#5F714B]">{t('settings.notificationAlerts', 'Notifications')}</h2>
            <Card className="p-6 border-none shadow-sm bg-white rounded-2xl flex flex-col gap-6">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-base font-black text-[#5F714B] block">{t('settings.lowStockAlerts', 'Low Stock Alerts')}</span>
                  <span className="text-[10px] font-bold text-[#9BA88D] uppercase tracking-wider">{t('settings.dynamicNotifications', 'Dynamic notifications')}</span>
                </div>
                <Switch checked={lowStockAlerts} onChange={setLowStockAlerts} />
              </div>
              <div className="h-px bg-[#F8F3E5]" />
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-base font-black text-[#5F714B] block">{t('settings.udharReminders', 'Credit Reminders')}</span>
                  <span className="text-[10px] font-bold text-[#9BA88D] uppercase tracking-wider">{t('settings.automaticFollowUps', 'Automatic follow-ups')}</span>
                </div>
                <Switch checked={creditReminders} onChange={setCreditReminders} />
              </div>
            </Card>
          </div>
        );
      case 'data':
        return (
          <div className="flex flex-col gap-6">
            <h2 className="text-lg font-black text-[#5F714B]">{t('settings.inventory', 'Data & Inventory')}</h2>
            <Card className="p-6 border-none shadow-sm bg-white rounded-2xl flex flex-col gap-4">
              <div className="flex items-center gap-2 mb-2">
                <PackageSearch size={16} className="text-[#9BA88D]" />
                <h3 className="text-[10px] font-black text-[#9BA88D] uppercase tracking-widest">{t('settings.lowStockThreshold', 'Low Stock Threshold')}</h3>
              </div>
              <div className="flex items-center gap-4 bg-[#F8F3E5]/30 p-4 rounded-2xl border-2 border-transparent focus-within:border-[#CFC3A7]/50 transition-all">
                <input type="number" value={threshold} onChange={(e) => setThreshold(e.target.value)} className="bg-transparent border-none outline-none text-xl font-black text-[#5F714B] w-full" />
                <span className="text-[10px] font-black text-[#95A07A]">UNITS</span>
              </div>
            </Card>
            {isPro && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button onClick={handleExport} className="h-16 bg-white text-[#5F714B] border-2 border-[#CFC3A7]/30 hover:border-[#95A07A] rounded-2xl flex items-center justify-center gap-3 shadow-sm font-black text-sm group">
                  <Download size={20} className="text-[#95A07A] group-hover:scale-110 transition-transform" />
                  {t('settings.exportCsv', 'Export CSV Report')}
                </Button>
                <Button onClick={handleExport} className="h-16 bg-white text-[#5F714B] border-2 border-[#CFC3A7]/30 hover:border-[#95A07A] rounded-2xl flex items-center justify-center gap-3 shadow-sm font-black text-sm group">
                  <Download size={20} className="text-[#95A07A] group-hover:scale-110 transition-transform" />
                  {t('settings.exportJson', 'Export JSON Raw Data')}
                </Button>
              </div>
            )}
          </div>
        );
    }
  };

  return (
    <PageTransition className="flex flex-col h-[100dvh] bg-[#F8F3E5] text-[#5F714B] overflow-hidden">

      {/* ── Mobile Layout: all sections stacked ── */}
      <div className="md:hidden p-4 flex flex-col gap-6 pb-32 overflow-y-auto flex-1">
        <div className="flex flex-col">
          <h1 className="text-3xl font-black text-[#5F714B] tracking-tighter">{user?.storeName || t('settings.store', 'Store')}</h1>
          <p className="text-sm font-bold text-[#9BA88D] mt-1 uppercase tracking-widest opacity-80">{t('settings.storeControlCenter', 'Store Control Center')}</p>
        </div>

        {/* Store Profile */}
        <Card className="p-6 border-none shadow-sm bg-white rounded-2xl flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2"><Store size={16} className="text-[#95A07A]" /><h2 className="text-[10px] font-black text-[#9BA88D] uppercase tracking-widest">{t('settings.storeProfile', 'Store Profile')}</h2></div>
            <button onClick={handleSave} className="text-[10px] font-black text-[#95A07A] px-3 py-1.5 bg-[#F8F3E5] rounded-lg">{t('settings.saveChanges', 'Save')}</button>
          </div>
          <div className="group space-y-2">
            <label className="text-[10px] font-black text-[#95A07A] uppercase tracking-widest block">{t('settings.storeName', 'Store Name')}</label>
            <div className="flex items-center gap-3 bg-[#F8F3E5]/30 p-3 rounded-xl border-2 border-transparent group-focus-within:border-[#CFC3A7]/50">
              <input value={storeName} onChange={(e) => setStoreName(e.target.value)} onBlur={handleSave} className="bg-transparent border-none outline-none font-black text-[#5F714B] w-full" />
              <Edit2 size={14} className="text-[#95A07A]/30 shrink-0" />
            </div>
          </div>
          <div className="group space-y-2">
            <label className="text-[10px] font-black text-[#95A07A] uppercase tracking-widest block">{t('settings.ownerName', 'Owner Name')}</label>
            <div className="flex items-center gap-3 bg-[#F8F3E5]/30 p-3 rounded-xl border-2 border-transparent group-focus-within:border-[#CFC3A7]/50">
              <input value={ownerName} onChange={(e) => setOwnerName(e.target.value)} onBlur={handleSave} className="bg-transparent border-none outline-none font-black text-[#5F714B] w-full" />
              <User size={14} className="text-[#95A07A]/30 shrink-0" />
            </div>
          </div>
        </Card>

        {/* Notifications */}
        <Card className="p-6 border-none shadow-sm bg-white rounded-2xl flex flex-col gap-5">
          <div className="flex items-center gap-2"><Bell size={16} className="text-[#9BA88D]" /><h2 className="text-[10px] font-black text-[#9BA88D] uppercase tracking-widest">{t('settings.notificationAlerts', 'Notifications')}</h2></div>
          <div className="flex items-center justify-between">
            <div><span className="text-sm font-black text-[#5F714B] block">{t('settings.lowStockAlerts', 'Low Stock Alerts')}</span><span className="text-[10px] font-bold text-[#9BA88D]">{t('settings.dynamicNotifications', 'Dynamic notifications')}</span></div>
            <Switch checked={lowStockAlerts} onChange={setLowStockAlerts} />
          </div>
          <div className="h-px bg-[#F8F3E5]" />
          <div className="flex items-center justify-between">
            <div><span className="text-sm font-black text-[#5F714B] block">{t('settings.udharReminders', 'Credit Reminders')}</span><span className="text-[10px] font-bold text-[#9BA88D]">{t('settings.automaticFollowUps', 'Automatic follow-ups')}</span></div>
            <Switch checked={creditReminders} onChange={setCreditReminders} />
          </div>
        </Card>

        {/* Language */}
        <Card className="p-6 border-none shadow-sm bg-white rounded-2xl flex flex-col gap-4">
          <div className="flex items-center gap-2"><Globe size={16} className="text-[#9BA88D]" /><h3 className="text-[10px] font-black text-[#9BA88D] uppercase tracking-widest">{t('settings.displayLanguage', 'Language')}</h3></div>
          <div className="flex p-1.5 bg-[#F8F3E5]/30 rounded-[20px] gap-1">
            {LANGUAGES.map((lang) => (
              <button key={lang.code} onClick={() => setLanguage(lang.code)} className={cn("flex-1 py-3 text-xs font-black rounded-[14px] transition-all", language === lang.code ? "bg-[#95A07A] text-white shadow-lg" : "text-[#9BA88D] hover:bg-white/50")}>{lang.label}</button>
            ))}
          </div>
        </Card>

        <button onClick={logout} className="flex items-center justify-center gap-3 py-4 text-red-600 font-black text-sm uppercase tracking-widest hover:bg-red-50 rounded-2xl transition-all">
          <LogOut size={18} /> {t('settings.logout', 'Logout from Store')}
        </button>
        <div className="flex flex-col items-center opacity-40 pb-4">
          <span className="text-[10px] font-black text-[#95A07A] uppercase tracking-[0.4em] mb-2">Paisa v2.4.1</span>
          <div className="flex items-center gap-2 text-xs font-bold text-[#9BA88D]">
            {t('settings.craftedWith', 'Crafted with')} <motion.span animate={{ scale: [1, 1.3, 1] }} transition={{ repeat: Infinity, duration: 2 }}>❤️</motion.span> {t('settings.forKirana', 'for Kirana owners')}
          </div>
        </div>
      </div>

      {/* ── Desktop Layout: sidebar tabs + content ── */}
      <div className="hidden md:flex flex-1 overflow-hidden">

        {/* Left Tab Nav */}
        <aside className="w-[220px] shrink-0 border-r border-[#CFC3A7]/40 bg-white/40 flex flex-col p-4 gap-1 overflow-y-auto">
          <div className="mb-6 px-2">
            <h1 className="text-lg font-black text-[#5F714B] tracking-tight truncate">{user?.storeName || 'Store'}</h1>
            <p className="text-[10px] font-bold text-[#9BA88D] uppercase tracking-widest">{t('settings.storeControlCenter', 'Control Center')}</p>
          </div>

          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all text-left",
                  activeTab === tab.id
                    ? "bg-[#95A07A] text-white shadow-md"
                    : "text-[#9BA88D] hover:bg-[#F8F3E5] hover:text-[#5F714B]"
                )}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}

          <div className="mt-auto pt-4 flex flex-col gap-2">
            <button onClick={logout} className="flex items-center gap-2 px-4 py-3 rounded-2xl text-sm font-bold text-red-500 hover:bg-red-50 transition-all">
              <LogOut size={16} /> {t('settings.logout', 'Logout')}
            </button>
            <p className="text-[9px] text-center text-[#CFC3A7] font-bold tracking-widest px-2">Paisa v2.4.1</p>
          </div>
        </aside>

        {/* Right Content */}
        <div className="flex-1 overflow-y-auto no-scrollbar p-8 lg:p-12">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="max-w-2xl"
          >
            <TabContent />
          </motion.div>
        </div>
      </div>

    </PageTransition>
  );
}
