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

  const AvatarHeader = () => (
    <div className="flex flex-col items-center text-center pt-8 pb-6 px-4">
      <div className="relative mb-4">
        <motion.div
          animate={{ y: [0, -10, 0], rotate: [0, 1, -1, 0] }}
          transition={{ repeat: Infinity, duration: 5, ease: 'easeInOut' }}
          className="w-24 h-24 bg-[#FF5900] rounded-[2rem] rounded-tr-[4rem] rounded-bl-[4rem] shadow-xl flex items-center justify-center relative border-4 border-white/10"
        >
          <Leaf size={40} strokeWidth={1.5} className="text-[#FFD3A5]" />
          <motion.div
            animate={{ scale: [1, 1.2, 1], rotate: [0, 20, -20, 0] }}
            transition={{ repeat: Infinity, duration: 3, delay: 0.5 }}
            className="absolute -top-1 -right-1 bg-white p-1.5 rounded-full shadow-lg"
          >
            <Sparkles size={14} className="text-[#FF5900]" />
          </motion.div>
        </motion.div>
      </div>
      <h1 className="text-3xl font-black text-[#FF5900] tracking-tighter">{t('boo.title', 'BOO AI')}</h1>
      <p className="font-bold text-[#FFAA6E] mt-1 text-sm tracking-wide uppercase opacity-80">{t('boo.subtitle', 'Your smart store assistant')}</p>
    </div>
  );

  const InsightCards = () => (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-xs font-black text-[#FF8237] uppercase tracking-[0.2em]">{t('boo.liveInsights', 'Live Insights')}</h2>
        {!isPro && <span className="text-[10px] font-black bg-white/50 text-[#FF8237] px-2 py-0.5 rounded-full border border-[#FF8237]/10">LOCKED</span>}
      </div>
      <AnimatePresence>
        {insightsToShow.map((insight, idx) => (
          <motion.div key={insight.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.08 }}>
            <Card className="bg-[#FF5900] border-none text-[#FFFBDC] p-4 shadow-lg relative overflow-hidden group hover:scale-[1.01] transition-transform h-full">
              <div className="absolute top-0 right-0 w-24 h-24 bg-white rounded-full blur-3xl opacity-[0.03] -translate-y-1/2 translate-x-1/2" />
              <div className="relative z-10 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-xl" style={{ backgroundColor: insight.accent }}>
                      <insight.icon size={15} className="text-[#FFD3A5]" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-[0.15em] text-[#FFD3A5]">{insight.category}</span>
                  </div>
                  <ArrowRight size={13} className="text-[#FFD3A5]/40 group-hover:text-[#FFD3A5] transition-colors" />
                </div>
                <p className="text-sm font-medium leading-relaxed">{insight.content}</p>
              </div>
            </Card>
          </motion.div>
        ))}
      </AnimatePresence>
      {!isPro && (
        <PlanGate allowedPlans={['pro']} currentPlan={user?.plan || 'free'} requiredFeatureMessage={t('boo.upgradeToPro', 'Unlock 3 additional smart insights by upgrading to Pro.')}>
          <div className="h-10" />
        </PlanGate>
      )}
    </div>
  );

  const ChatHistory = () => (
    <div className="flex flex-col gap-4">
      <h3 className="text-xs font-black text-[#FF8237] uppercase tracking-[0.2em] px-1">{t('boo.recentThinking', 'Recent Thinking')}</h3>
      {MOCK_HISTORY.map((chat, idx) => (
        <motion.div
          key={idx}
          initial={{ opacity: 0, x: chat.role === 'user' ? 16 : -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: idx * 0.15 }}
          className={cn("flex flex-col gap-1 max-w-[88%]", chat.role === 'user' ? "self-end items-end" : "self-start items-start")}
        >
          <span className="text-[10px] font-black text-[#FFAA6E] uppercase tracking-widest px-1">
            {chat.role === 'user' ? t('boo.you', 'You') : t('boo.title', 'BOO AI')}
          </span>
          <div className={cn("px-4 py-3 rounded-2xl text-sm font-medium leading-normal shadow-sm",
            chat.role === 'user' ? "bg-[#FF8237] text-white rounded-tr-none" : "bg-white text-[#FF5900] rounded-tl-none border border-[#FFD3A5]/30"
          )}>
            {chat.content.split('**').map((part, i) => i % 2 === 1 ? <strong key={i}>{part}</strong> : part)}
          </div>
        </motion.div>
      ))}
    </div>
  );

  const ChatInput = ({ className }: { className?: string }) => (
    <form onSubmit={handleSend} className={cn("bg-white rounded-[20px] p-2 shadow-lg flex items-center gap-2 border border-[#FFFBDC]", className)}>
      <div className="w-9 h-9 bg-[#FFFBDC]/50 rounded-xl flex items-center justify-center shrink-0">
        <Sparkles size={16} className="text-[#FF8237]" />
      </div>
      <input
        type="text"
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        placeholder={t('boo.placeholder', 'Ask BOO AI anything...')}
        className="flex-1 bg-transparent border-none outline-none text-sm font-bold placeholder-[#FF8237]/40 py-1"
      />
      <button
        type="submit"
        disabled={!question.trim()}
        className="w-9 h-9 bg-[#FF5900] text-white rounded-xl flex items-center justify-center shrink-0 shadow-md disabled:opacity-30 hover:bg-[#FF8237] transition-all active:scale-95"
      >
        <Send size={16} />
      </button>
    </form>
  );

  return (
    <PageTransition className="flex flex-col md:flex-row h-full min-h-screen bg-[#FFFBDC] text-[#FF5900] overflow-hidden">

      {/* ── Mobile Layout ── */}
      <div className="md:hidden flex flex-col flex-1 overflow-y-auto no-scrollbar pb-40">
        <AvatarHeader />
        <div className="px-4 flex flex-col gap-6 mb-8">
          <InsightCards />
          {isPro && <ChatHistory />}
        </div>
        {isPro && (
          <div className="fixed bottom-24 left-0 w-full px-4 z-40">
            <ChatInput />
          </div>
        )}
      </div>

      {/* ── Desktop: Left Chat Pane ── */}
      <div className="hidden md:flex flex-col flex-1 min-w-0 border-r border-[#FFD3A5]/40 overflow-hidden">
        <AvatarHeader />

        {/* Chat messages */}
        <div className="flex-1 overflow-y-auto no-scrollbar px-6 pb-4">
          {isPro ? <ChatHistory /> : (
            <div className="flex flex-col items-center justify-center h-full py-12 text-center">
              <Sparkles size={36} className="text-[#FFD3A5] mb-4" />
              <p className="text-sm font-black text-[#FFAA6E]">Upgrade to Pro to chat with BOO AI</p>
            </div>
          )}
        </div>

        {/* Chat input pinned at bottom of left pane */}
        {isPro && (
          <div className="shrink-0 p-4 border-t border-[#FFD3A5]/30">
            <ChatInput />
          </div>
        )}
      </div>

      {/* ── Desktop: Right Insights Pane ── */}
      <div className="hidden md:flex flex-col w-[360px] shrink-0 overflow-y-auto no-scrollbar p-6 gap-4">
        <InsightCards />
      </div>

    </PageTransition>
  );
}
