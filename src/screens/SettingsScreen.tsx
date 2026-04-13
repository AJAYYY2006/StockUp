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
  const [udharReminders, setUdharReminders] = useState(false);
  const [threshold, setThreshold] = useState('10');

  const isPro = user?.plan === 'pro';

  const handleSave = () => {
    updateUser({ storeName, ownerName });
  };

  const handleExport = () => {
    window.dispatchEvent(new CustomEvent('show-toast', { 
      detail: { message: t('settings.exportingData', "Exporting all data as CSV..."), type: 'success' } 
    }));
  };

  return (
    <PageTransition className="flex flex-col h-full min-h-screen bg-[#FFFBDC] text-[#FF5900] p-4 md:p-12 lg:p-16 gap-8 pb-32 font-plus-jakarta overflow-x-hidden">
      
      <div className="max-w-4xl mx-auto w-full flex flex-col gap-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div className="flex flex-col">
            <h1 className="text-3xl md:text-5xl font-black text-[#FF5900] tracking-tighter">{user?.storeName || t('settings.store', "Store")}</h1>
            <p className="text-sm md:text-base font-bold text-[#FFAA6E] mt-1 uppercase tracking-widest opacity-80">{t('settings.storeControlCenter', "Store Control Center")}</p>
          </div>
          <div className="flex items-center gap-3 self-end md:self-auto bg-white/50 px-4 py-2 rounded-2xl border border-[#FFD3A5]/30">
            <div className="text-right">
              <p className="text-[10px] font-black text-[#FFAA6E] uppercase tracking-widest leading-none mb-1">{t('common.owner', 'Owner')}</p>
              <p className="text-sm font-black text-[#FF5900]">{user?.ownerName || user?.email?.split('@')[0] || t('common.user', 'User')}</p>
            </div>
            <div className="w-10 h-10 bg-[#FF8237] rounded-xl flex items-center justify-center text-white shadow-lg shadow-orange-500/20">
              <User size={20} />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-6 md:gap-8">
          
          {/* Store Profile Section - 2 columns on desktop */}
          <Card className="p-6 md:p-10 border-none shadow-[0_8px_40px_rgba(15,42,29,0.04)] bg-white rounded-[32px] flex flex-col gap-8">
            <div className="flex items-center justify-between">
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#FFFBDC]/50 rounded-2xl flex items-center justify-center">
                    <Store size={20} className="text-[#FF8237]" />
                  </div>
                  <h2 className="text-xs font-black text-[#FF5900] uppercase tracking-[0.2em]">{t('settings.storeProfile', "Store Profile")}</h2>
               </div>
               <button className="hidden md:flex items-center gap-2 px-4 py-2 bg-[#FFFBDC]/50 hover:bg-[#FF8237] hover:text-white text-[#FF8237] text-[10px] font-black uppercase tracking-widest rounded-xl transition-all" onClick={handleSave}>
                  {t('settings.saveChanges', "Save Changes")}
               </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
              <div className="group space-y-3">
                <label className="text-[10px] font-black text-[#FF8237] uppercase tracking-widest ml-1 block">{t('settings.storeName', "Store Name")}</label>
                <div className="flex items-center gap-4 bg-[#FFFBDC]/30 p-4 rounded-2xl border-2 border-transparent group-focus-within:border-[#FFD3A5]/50 transition-all">
                  <input 
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    onBlur={handleSave}
                    className="bg-transparent border-none outline-none text-base font-black text-[#FF5900] w-full"
                  />
                  <Edit2 size={16} className="text-[#FF8237]/30" />
                </div>
              </div>

              <div className="group space-y-3">
                <label className="text-[10px] font-black text-[#FF8237] uppercase tracking-widest ml-1 block">{t('settings.ownerName', "Owner Name")}</label>
                <div className="flex items-center gap-4 bg-[#FFFBDC]/30 p-4 rounded-2xl border-2 border-transparent group-focus-within:border-[#FFD3A5]/50 transition-all">
                  <input 
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    onBlur={handleSave}
                    className="bg-transparent border-none outline-none text-base font-black text-[#FF5900] w-full"
                  />
                  <User size={16} className="text-[#FF8237]/30" />
                </div>
              </div>
            </div>
          </Card>

          {/* Membership & Language - Side by side or horizontal on desktop */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 md:gap-8">
            
            {/* Membership Section */}
            <Card className="lg:col-span-3 p-6 md:p-8 border-none shadow-[0_8px_40px_rgba(15,42,29,0.04)] bg-white rounded-[32px] flex flex-col gap-6">
              <h2 className="text-[10px] font-black text-[#FFAA6E] uppercase tracking-[0.2em]">{t('settings.planDetails', "Plan Details")}</h2>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-5 md:p-6 bg-gradient-to-br from-[#FF5900] to-[#FF8237] rounded-[24px] text-white relative overflow-hidden group">
                <div className="absolute top-[-20%] right-[-10%] w-32 h-32 bg-white rounded-full blur-3xl opacity-10 group-hover:opacity-20 transition-opacity" />
                <div className="flex items-center gap-4 relative z-10">
                   <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-xl border border-white/10">
                     <Sparkles size={28} className="text-[#FFD3A5]" />
                   </div>
                   <div className="flex flex-col">
                     <span className="text-[10px] font-black text-[#FFD3A5] uppercase tracking-widest leading-none mb-1.5">{t('settings.activePlan', "Active Plan")}</span>
                     <span className="text-2xl font-black capitalize tracking-tighter">{user?.plan || 'PRO'} {t('settings.account', "Account")}</span>
                   </div>
                </div>
                <Button className="h-12 px-8 bg-[#FFFBDC] hover:bg-white text-[#FF5900] font-black text-xs rounded-xl border-none shadow-xl relative z-10">
                   {t('settings.upgradePlan', "UPGRADE PLAN")}
                </Button>
              </div>
            </Card>

            {/* Language Selection */}
            <Card className="lg:col-span-2 p-6 md:p-8 border-none shadow-[0_8px_40px_rgba(15,42,29,0.04)] bg-white rounded-[32px] flex flex-col justify-between">
              <div className="flex items-center gap-2 mb-6">
                <Globe size={16} className="text-[#FFAA6E]" />
                <h2 className="text-[10px] font-black text-[#FFAA6E] uppercase tracking-[0.2em]">{t('settings.displayLanguage', "Display Language")}</h2>
              </div>
              <div className="flex p-1.5 bg-[#FFFBDC]/30 rounded-[20px] gap-1">
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => setLanguage(lang.code)}
                    className={cn(
                      "flex-1 py-3.5 text-xs font-black rounded-link transition-all rounded-[14px]",
                      language === lang.code 
                        ? "bg-[#FF8237] text-white shadow-xl shadow-[#FF8237]/30" 
                        : "text-[#FFAA6E] hover:text-[#FF8237] hover:bg-white/50"
                    )}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>
            </Card>

          </div>

          {/* Preferences Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            
            {/* Notifications Section */}
            <Card className="p-8 border-none shadow-[0_8px_40px_rgba(15,42,29,0.04)] bg-white rounded-[32px] flex flex-col gap-8">
              <div className="flex items-center gap-2">
                <Bell size={18} className="text-[#FFAA6E]" />
                <h2 className="text-[10px] font-black text-[#FFAA6E] uppercase tracking-[0.2em]">{t('settings.notificationAlerts', "Notification Alerts")}</h2>
              </div>
              
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col gap-1">
                    <span className="text-base font-black text-[#FF5900]">{t('settings.lowStockAlerts', "Low Stock Alerts")}</span>
                    <span className="text-[10px] font-bold text-[#FFAA6E] uppercase tracking-wider">{t('settings.dynamicNotifications', "Dynamic notifications")}</span>
                  </div>
                  <Switch checked={lowStockAlerts} onChange={setLowStockAlerts} />
                </div>
                
                <div className="h-px bg-[#FFFBDC] w-full" />

                <div className="flex items-center justify-between">
                  <div className="flex flex-col gap-1">
                    <span className="text-base font-black text-[#FF5900]">{t('settings.udharReminders', "Udhar Reminders")}</span>
                    <span className="text-[10px] font-bold text-[#FFAA6E] uppercase tracking-wider">{t('settings.automaticFollowUps', "Automatic follow-ups")}</span>
                  </div>
                  <Switch checked={udharReminders} onChange={setUdharReminders} />
                </div>
              </div>
            </Card>

            {/* Inventory Defaults */}
            <Card className="p-8 border-none shadow-[0_8px_40px_rgba(15,42,29,0.04)] bg-white rounded-[32px] flex flex-col gap-8">
              <div className="flex items-center gap-2">
                <PackageSearch size={18} className="text-[#FFAA6E]" />
                <h2 className="text-[10px] font-black text-[#FFAA6E] uppercase tracking-[0.2em]">{t('settings.inventory', "Inventory")}</h2>
              </div>
              
              <div className="group space-y-4">
                <label className="text-[10px] font-black text-[#FF8237] uppercase tracking-widest ml-1 block">{t('settings.lowStockThreshold', "Low Stock Threshold")}</label>
                <div className="flex items-center gap-4 bg-[#FFFBDC]/30 p-4 rounded-2xl border-2 border-transparent focus-within:border-[#FFD3A5]/50 transition-all">
                  <input 
                    type="number"
                    value={threshold}
                    onChange={(e) => setThreshold(e.target.value)}
                    className="bg-transparent border-none outline-none text-xl font-black text-[#FF5900] w-full"
                  />
                  <span className="text-[10px] font-black text-[#FF8237]">{t('settings.units', "UNITS")}</span>
                </div>
              </div>
            </Card>

          </div>

          {/* Professional Actions & Footer */}
          <div className="flex flex-col items-center gap-8 md:gap-12 mt-4">
            
            {/* Export Section (Pro only) */}
            {isPro && (
              <div className="w-full flex flex-col items-center gap-4">
                 <h3 className="text-[10px] font-black text-[#FFAA6E] uppercase tracking-[0.3em]">{t('settings.advancedDataTools', "Advanced Data Tools")}</h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                    <Button 
                      onClick={handleExport}
                      className="h-16 bg-white text-[#FF5900] border-2 border-[#FFD3A5]/30 hover:border-[#FF8237] rounded-2xl flex items-center justify-center gap-3 shadow-sm font-black text-sm transition-all group"
                    >
                      <Download size={20} className="text-[#FF8237] group-hover:scale-110 transition-transform" />
                      {t('settings.exportCsv', "Export CSV Report")}
                    </Button>
                    <Button 
                      onClick={handleExport}
                      className="h-16 bg-white text-[#FF5900] border-2 border-[#FFD3A5]/30 hover:border-[#FF8237] rounded-2xl flex items-center justify-center gap-3 shadow-sm font-black text-sm transition-all group"
                    >
                      <Download size={20} className="text-[#FF8237] group-hover:scale-110 transition-transform" />
                      {t('settings.exportJson', "Export JSON Raw Data")}
                    </Button>
                 </div>
              </div>
            )}

            <button 
              onClick={logout} 
              className="flex items-center gap-3 px-12 py-5 text-red-600 font-black text-sm uppercase tracking-[0.2em] hover:bg-red-50 rounded-2xl transition-all"
            >
              <LogOut size={20} />
              {t('settings.logout', "Logout from Store")}
            </button>

            <div className="flex flex-col items-center justify-center opacity-40">
               <span className="text-[10px] font-black text-[#FF8237] uppercase tracking-[0.4em] mb-3">StockUp Engine v2.4.1</span>
               <div className="flex items-center gap-2 text-xs font-bold text-[#FFAA6E]">
                 {t('settings.craftedWith', "Crafted with")} <motion.span animate={{ scale: [1, 1.3, 1] }} transition={{ repeat: Infinity, duration: 2 }}>❤️</motion.span> {t('settings.forKirana', "for the Indian Kirana owner")}
               </div>
            </div>
          </div>

        </div>
      </div>

    </PageTransition>
  );
}
