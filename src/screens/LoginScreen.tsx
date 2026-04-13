import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../store/auth';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Store, ShieldCheck, WifiOff, Sparkles, Mail, Lock } from 'lucide-react';
import { useToastStore } from '../store/toast';
import paisaLogo from '../assets/paisa_logo.png';

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिंदी' },
  { code: 'ta', label: 'தமிழ்' },
];

export default function LoginScreen() {
  const { login, signUp, language, setLanguage } = useAuthStore();
  const addToast = useToastStore((state) => state.addToast);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useTranslation();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    
    setIsLoading(true);
    try {
      if (authMode === 'login') {
        const { error } = await login(email, password);
        if (error) throw error;
        addToast({ message: t('auth.loginSuccess', 'Welcome back!'), type: 'success' });
      } else {
        const { error } = await signUp(email, password);
        if (error) throw error;
        
        // Check if we got logged in automatically
        const isAuthNow = useAuthStore.getState().isAuthenticated;
        
        if (isAuthNow) {
          addToast({ message: t('auth.signupSuccessAuto', 'Account created! Moving to setup...'), type: 'success' });
        } else {
          addToast({ 
            message: t('auth.signupSuccess', 'Account created! Please check your email for confirmation.'), 
            type: 'success',
            duration: 6000
          });
          setAuthMode('login');
        }
      }
    } catch (error: any) {
      addToast({ message: error.message || 'Authentication error', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#FF5900]">
      
      {/* Left Side: Branding */}
      <div className="flex-1 flex flex-col justify-center p-8 md:p-16 lg:p-24 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-64 h-64 bg-[#FF8237] rounded-full blur-3xl opacity-30 -translate-x-1/2 -translate-y-1/2" />
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="z-10 max-w-lg"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center overflow-hidden shrink-0">
              <img src={paisaLogo} alt="Paisa Logo" className="w-full h-full object-cover" />
            </div>
            <h1 className="text-4xl font-black tracking-tighter text-[#FFFBDC] uppercase italic">Paisa</h1>
          </div>

          <motion.h2 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-4xl md:text-5xl font-black text-white leading-tight mb-4"
          >
            {t('auth.tagline')}
          </motion.h2>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="flex flex-wrap gap-2 mb-12"
          >
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FF8237]/60 rounded-full border border-[#FFAA6E]/30">
              <ShieldCheck size={14} className="text-[#FFD3A5]" />
              <span className="text-xs font-semibold text-[#FFFBDC]">{t('auth.features.free')}</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FF8237]/60 rounded-full border border-[#FFAA6E]/30">
              <WifiOff size={14} className="text-[#FFD3A5]" />
              <span className="text-xs font-semibold text-[#FFFBDC]">{t('auth.features.offline')}</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FF8237]/60 rounded-full border border-[#FFAA6E]/30">
              <Sparkles size={14} className="text-yellow-400" />
              <span className="text-xs font-semibold text-[#FFFBDC]">{t('auth.features.ai')}</span>
            </div>
          </motion.div>

          <div className="hidden md:flex gap-3 mb-6">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                onClick={() => setLanguage(lang.code)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  language === lang.code 
                    ? 'bg-[#FFFBDC] text-[#FF5900] shadow-md' 
                    : 'bg-[#FF8237]/40 text-[#FFD3A5] hover:bg-[#FFAA6E]/40 border border-transparent hover:border-[#FFD3A5]/30'
                }`}
              >
                {lang.label}
              </button>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Right Side: Auth Form */}
      <div className="md:w-1/2 md:bg-[#FFFBDC] flex items-center justify-center p-4 md:p-8 shrink-0">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md bg-white rounded-[32px] p-6 md:p-10 shadow-2xl flex flex-col border border-[#FFD3A5]/30"
        >
          <div className="mb-8 text-center md:text-left">
            <h3 className="text-2xl font-bold text-[#FF5900] mb-2">
              {authMode === 'login' ? t('auth.welcomeBack', 'Welcome Back') : t('auth.createAccount', 'Create Account')}
            </h3>
            <p className="text-[#FFAA6E] text-sm font-medium">
              {authMode === 'login' ? t('auth.loginSubtitle', 'Sign in to manage your store') : t('auth.signupSubtitle', 'Start your digital journey with Paisa')}
            </p>
          </div>

          <form onSubmit={handleAuth} className="flex flex-col gap-5">
            <Input
              label={t('auth.email', 'Email Address')}
              type="email"
              placeholder="name@store.com"
              leftIcon={<Mail size={20} />}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoFocus
              required
            />

            <Input
              label={t('auth.password', 'Password')}
              type="password"
              placeholder="••••••••"
              leftIcon={<Lock size={20} />}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            
            <Button 
              type="submit" 
              className="w-full h-14 mt-2 shadow-md shadow-[#FF5900]/10"
              isLoading={isLoading}
            >
              {authMode === 'login' ? t('auth.loginBtn', 'Login') : t('auth.signupBtn', 'Sign Up')}
            </Button>
            
            <button
              type="button"
              onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
              className="text-center text-sm font-bold text-[#FF8237] hover:underline"
            >
              {authMode === 'login' 
                ? t('auth.needAccount', "Don't have an account? Sign Up") 
                : t('auth.haveAccount', "Already have an account? Login")}
            </button>

            <p className="text-center text-xs font-semibold text-gray-500 mt-2">
              {t('auth.terms')}
            </p>
          </form>

          {/* Mobile Only Language Switcher */}
          <div className="flex justify-center gap-3 mt-8 md:hidden">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                onClick={() => setLanguage(lang.code)}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-colors border ${
                  language === lang.code 
                    ? 'bg-[#FF8237] text-[#FFFBDC] border-[#FF8237]' 
                    : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                }`}
              >
                {lang.label}
              </button>
            ))}
          </div>
        </motion.div>
      </div>

    </div>
  );
}
