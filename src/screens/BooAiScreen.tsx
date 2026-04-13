import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Leaf, 
  Sparkles, 
  TrendingUp, 
  Zap, 
  Sun, 
  Tag, 
  Send, 
  ArrowRight
} from 'lucide-react';
import { useAuthStore } from '../store/auth';
import { useTranslation } from 'react-i18next';
import { PageTransition } from '../components/layout/PageTransition';
import { Card } from '../components/ui/Card';
import { PlanGate } from '../components/ui/PlanGate';
import { useToastStore } from '../store/toast';
import { cn } from '../lib/utils';

// --- INSIGHT CATEGORIES & DATA ---
interface Insight {
  id: string;
  category: 'Top Seller' | 'Dead Stock' | 'Seasonal Tip' | 'Pricing Tip';
  content: string;
  icon: any;
  accent: string;
}

const ALL_INSIGHTS: Insight[] = [
  {
    id: '1',
    category: 'Top Seller',
    content: "Your Aashirvaad Atta is selling 40% faster than last week. Consider restocking before the weekend rush.",
    icon: TrendingUp,
    accent: '#FF8237'
  },
  {
    id: '2',
    category: 'Dead Stock',
    content: 'Parle-G (Small pack) has not moved in 15 days. Try a "Buy 4 Get 1 Free" offer to clear stock quickly.',
    icon: Zap,
    accent: '#FFAA6E'
  },
  {
    id: '3',
    category: 'Seasonal Tip',
    content: 'Temperatures are rising! Soft drink demand is expected to spike by 25%. Restock your chiller now.',
    icon: Sun,
    accent: '#FFD3A5'
  },
  {
    id: '4',
    category: 'Pricing Tip',
    content: 'Neighboring stores are selling Maggi (70g) at ₹14. You are at ₹12. You have room to increase your margin.',
    icon: Tag,
    accent: '#FF8237'
  }
];

// --- MOCK CONVERSATIONAL HISTORY ---
const MOCK_HISTORY = [
  {
    role: 'user',
    content: "What was my highest selling item today?"
  },
  {
    role: 'ai',
    content: "Your highest selling item today is **Amul Butter (500g)** with 15 units sold, followed by **India Gate Basmati Rice**."
  },
  {
    role: 'user',
    content: "How does my revenue compare to last Monday?"
  },
  {
    role: 'ai',
    content: "Your current revenue (₹4,250) is **18% higher** than last Monday at this same time. Great progress!"
  }
];

export default function BooAiScreen() {
  const user = useAuthStore((state) => state.user);
  const addToast = useToastStore((state) => state.addToast);
  const { t } = useTranslation();
  const [question, setQuestion] = useState('');
  
  const isPro = user?.plan === 'pro';
  // If free, show only the first insight as a teaser
  const insightsToShow = isPro ? ALL_INSIGHTS : [ALL_INSIGHTS[0]];

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;
    
    addToast({ 
      message: t('boo.thinking', "BOO AI is thinking... (Beta feature)"), 
      type: 'info' 
    });
    setQuestion('');
  };

  return (
    <PageTransition className="flex flex-col h-full min-h-screen bg-[#FFFBDC] text-[#FF5900] transition-all overflow-y-auto no-scrollbar pb-40">
      
      <div className="max-w-5xl mx-auto w-full flex flex-col items-center">
        {/* Premium Avatar & Intro */}
        <div className="flex flex-col items-center justify-center pt-10 md:pt-16 pb-8 text-center px-6">
          <div className="relative mb-6 md:mb-10">
            <motion.div
              animate={{ 
                y: [0, -12, 0],
                rotate: [0, 1, -1, 0]
              }}
              transition={{ repeat: Infinity, duration: 5, ease: 'easeInOut' }}
              className="w-28 h-28 md:w-36 md:h-36 bg-[#FF5900] rounded-[2.5rem] rounded-tr-[5rem] rounded-bl-[5rem] shadow-[0_20px_50px_rgba(15,42,29,0.2)] flex items-center justify-center relative border-4 border-white/10"
            >
              <Leaf size={52} strokeWidth={1.5} className="text-[#FFD3A5] md:scale-125" />
              
              <motion.div 
                animate={{ scale: [1, 1.2, 1], rotate: [0, 20, -20, 0] }}
                transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut', delay: 0.5 }}
                className="absolute -top-1 -right-1 bg-white p-2 rounded-full shadow-lg border-2 border-[#FFFBDC]"
              >
                <Sparkles size={18} className="text-[#FF5900] md:scale-110" />
              </motion.div>
            </motion.div>
            
            <div className="absolute -bottom-2 -left-1 w-6 h-6 bg-[#FFD3A5] rounded-full blur-md opacity-20" />
          </div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-black text-[#FF5900] tracking-tighter"
          >
            {t('boo.title', "BOO AI")}
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="font-bold text-[#FFAA6E] mt-1 text-sm md:text-base tracking-wide uppercase opacity-80"
          >
            {t('boo.subtitle', "Your smart store assistant")}
          </motion.p>
        </div>

        {/* Dynamic Insight Cards - Responsive Grid */}
        <div className="flex flex-col gap-4 px-4 w-full mb-12">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xs font-black text-[#FF8237] uppercase tracking-[0.2em] ml-1">{t('boo.liveInsights', "Live Insights")}</h2>
            {!isPro && (
               <span className="text-[10px] font-black bg-white/50 text-[#FF8237] px-2 py-0.5 rounded-full border border-[#FF8237]/10">{t('boo.locked', "LOCKED 🔒")}</span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <AnimatePresence>
              {insightsToShow.map((insight, idx) => (
                <motion.div
                  key={insight.id}
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <Card className="bg-[#FF5900] border-none text-[#FFFBDC] p-5 md:p-6 shadow-xl relative overflow-hidden group hover:scale-[1.02] transition-transform duration-300 h-full">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full blur-3xl opacity-[0.03] -translate-y-1/2 translate-x-1/2" />
                    
                    <div className="relative z-10 flex flex-col gap-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className={cn("p-2 rounded-xl bg-opacity-20 flex items-center justify-center")} style={{ backgroundColor: insight.accent }}>
                             <insight.icon size={18} className="text-[#FFD3A5]" />
                          </div>
                          <span className="text-[10px] font-black uppercase tracking-[0.15em] text-[#FFD3A5]">{t(`boo.categories.${insight.category.replace(' ', '')}`, insight.category)}</span>
                        </div>
                        <ArrowRight size={14} className="text-[#FFD3A5]/30 group-hover:text-[#FFD3A5] transition-colors" />
                      </div>
                      
                      <p className="text-base font-medium leading-relaxed tracking-tight antialiased">
                        {t(`boo.insights.${insight.id}`, insight.content)}
                      </p>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {!isPro && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-4"
            >
              <PlanGate 
                allowedPlans={['pro']} 
                currentPlan={user?.plan || 'free'}
                requiredFeatureMessage={t('boo.upgradeToPro', "Unlock 3 additional smart insights by upgrading to Pro.")}
              >
                {/* Visual placeholder for the locked insights */}
                <div className="h-20" />
              </PlanGate>
            </motion.div>
          )}
        </div>

        {/* Conversational Layout (Desktop History + Input) */}
        {isPro && (
          <div className="flex flex-col gap-6 px-4 w-full max-w-3xl mb-10">
            <h3 className="text-xs font-black text-[#FF8237] uppercase tracking-[0.2em] ml-1 mb-2">{t('boo.recentThinking', "Recent Thinking")}</h3>
            
            <div className="flex flex-col gap-5">
              {MOCK_HISTORY.map((chat, idx) => (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0, x: chat.role === 'user' ? 20 : -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.2 }}
                  className={cn(
                    "flex flex-col gap-1.5 max-w-[85%]",
                    chat.role === 'user' ? "self-end items-end" : "self-start items-start"
                  )}
                >
                  <span className="text-[10px] font-black text-[#FFAA6E] uppercase tracking-[0.1em] px-2">
                    {chat.role === 'user' ? user?.name || t('boo.you', "You") : t('boo.title', 'BOO AI')}
                  </span>
                  <div className={cn(
                    "px-4 py-3 rounded-2xl text-sm font-medium leading-normal shadow-sm",
                    chat.role === 'user' 
                      ? "bg-[#FF8237] text-white rounded-tr-none" 
                      : "bg-white text-[#FF5900] rounded-tl-none border border-[#FFD3A5]/30"
                  )}>
                    {t(`boo.history.${idx}`, chat.content).split('**').map((part, i) => i % 2 === 1 ? <strong key={part}>{part}</strong> : part)}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Freeform Question Input - Fixed at bottom for Pro users */}
      {isPro && (
        <div className="fixed bottom-24 md:bottom-12 left-0 w-full px-4 z-40 pointer-events-none">
          <motion.form 
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            onSubmit={handleSend}
            className="max-w-2xl mx-auto w-full bg-white rounded-[24px] p-2 md:p-3 shadow-[0_20px_50px_rgba(15,42,29,0.15)] flex items-center gap-2 pointer-events-auto border border-[#FFFBDC]"
          >
            <div className="w-10 h-10 md:w-12 md:h-12 bg-[#FFFBDC]/50 rounded-2xl flex items-center justify-center shrink-0">
               <Sparkles size={18} className="text-[#FF8237] md:scale-125" />
            </div>
            <input 
              type="text" 
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder={t('boo.placeholder', "Ask BOO AI anything about your store...")}
              className="flex-1 bg-transparent border-none outline-none text-sm md:text-base font-bold placeholder-[#FF8237]/40 py-2 px-2"
            />
            <button 
              type="submit"
              disabled={!question.trim()}
              className="w-10 h-10 md:w-12 md:h-12 bg-[#FF5900] text-white rounded-2xl flex items-center justify-center shrink-0 shadow-lg disabled:opacity-30 transition-all hover:scale-105 active:scale-95"
            >
              <Send size={18} className="md:scale-110" />
            </button>
          </motion.form>
        </div>
      )}

    </PageTransition>
  );
}
