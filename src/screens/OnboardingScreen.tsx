import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../store/auth';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { Check, Store, User } from 'lucide-react';
import { PageTransition } from '../components/layout/PageTransition';
import { useToastStore } from '../store/toast';

const LANGUAGES = [
  { code: 'en', label: 'English', native: 'English' },
  { code: 'hi', label: 'Hindi', native: 'हिंदी' },
  { code: 'ta', label: 'Tamil', native: 'தமிழ்' },
];

const PLANS = [
  { id: 'free', name: 'Free', price: '₹0 / mo', features: ['100 Bills per month', 'Basic Inventory'] },
  { id: 'basic', name: 'Basic', price: '₹299 / mo', features: ['Unlimited Bills', 'Offline Mode', 'WhatsApp Sync'], popular: true },
  { id: 'pro', name: 'Pro', price: '₹999 / mo', features: ['Voice AI Billing', 'Multiple Staff', 'GST Reports'] },
];

const step2Schema = z.object({
  storeName: z.string().min(3, 'Store name must be at least 3 characters'),
  ownerName: z.string().min(3, 'Owner name must be at least 3 characters'),
});

export default function OnboardingScreen() {
  const { completeOnboarding, setLanguage, language } = useAuthStore();
  const addToast = useToastStore((state) => state.addToast);
  const [step, setStep] = useState(1);
  const { t } = useTranslation();
  
  // Step 2 State
  const [storeName, setStoreName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [errors, setErrors] = useState<{ storeName?: string; ownerName?: string }>({});
  
  // Step 3 State
  const [selectedPlan, setSelectedPlan] = useState('basic');
  const [isLoading, setIsLoading] = useState(false);

  const handleNext = () => {
    if (step === 2) {
      const result = step2Schema.safeParse({ storeName, ownerName });
      if (!result.success) {
        const fieldErrors = result.error.flatten().fieldErrors;
        setErrors({
          storeName: fieldErrors.storeName?.[0],
          ownerName: fieldErrors.ownerName?.[0],
        });
        return;
      }
      setErrors({});
    }
    setStep((s) => s + 1);
  };
  
  const handleBack = () => setStep((s) => s - 1);

  const handleFinish = async () => {
    setIsLoading(true);
    try {
      await completeOnboarding({ 
        storeName, 
        ownerName, 
        plan: selectedPlan 
      });
      addToast({ message: t('onboarding.setupComplete', 'Setup complete! Welcome to StockUp'), type: 'success' });
    } catch (error: any) {
      addToast({ message: error.message || 'Error saving profile', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const slideVariants = {
    enter: (direction: number) => ({ x: direction > 0 ? 50 : -50, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (direction: number) => ({ x: direction < 0 ? 50 : -50, opacity: 0 })
  };

  return (
    <PageTransition className="min-h-screen bg-[#FFFBDC] flex flex-col items-center justify-center p-6 text-[#FF5900]">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-xl overflow-hidden min-h-[500px] flex flex-col border border-[#FFD3A5]">
        {/* Header Progress */}
        <div className="pt-8 px-8 flex flex-col items-center">
          <div className="w-full flex items-center justify-center gap-2 mb-4">
            {[1, 2, 3].map((i) => (
              <div 
                key={i} 
                className={`h-2 rounded-full transition-all duration-300 ${
                  i === step ? 'w-8 bg-[#FF5900]' : i < step ? 'w-4 bg-[#FF8237]' : 'w-4 bg-[#FFFBDC]'
                }`} 
              />
            ))}
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            {step === 1 && t('onboarding.step1')}
            {step === 2 && t('onboarding.step2')}
            {step === 3 && t('onboarding.step3')}
          </h1>
        </div>

        <div className="flex-1 relative overflow-x-hidden flex items-stretch">
          <AnimatePresence mode="wait" initial={false} custom={step}>
            {step === 1 && (
              <motion.div 
                key="step1"
                custom={1}
                variants={slideVariants}
                initial="enter" animate="center" exit="exit"
                transition={{ duration: 0.3 }}
                className="w-full p-8 flex flex-col gap-4 absolute inset-0"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1">
                  {LANGUAGES.map((lang) => (
                    <Card 
                      key={lang.code}
                      animated
                      onClick={() => setLanguage(lang.code)}
                      className={`cursor-pointer flex flex-col items-center justify-center gap-2 h-32 border-2 transition-all ${
                        language === lang.code ? 'border-[#FF5900] bg-[#FFFBDC]' : 'border-[#FFD3A5] hover:border-[#FFAA6E]'
                      }`}
                    >
                      <span className="text-3xl font-bold">{lang.native}</span>
                      <span className="text-sm font-medium text-gray-600">{lang.label}</span>
                      {language === lang.code && <Check className="absolute top-3 right-3 text-[#FF5900]" size={20} />}
                    </Card>
                  ))}
                </div>
                <Button onClick={handleNext} className="w-full mt-auto">{t('common.continue')}</Button>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div 
                key="step2"
                custom={1}
                variants={slideVariants}
                initial="enter" animate="center" exit="exit"
                transition={{ duration: 0.3 }}
                className="w-full p-8 flex flex-col gap-6 absolute inset-0"
              >
                <Input 
                  label={t('onboarding.storeName')} 
                  placeholder={t('onboarding.storePlaceholder')}
                  leftIcon={<Store size={20} />}
                  value={storeName}
                  error={errors.storeName}
                  onChange={(e) => {
                    setStoreName(e.target.value);
                    if (errors.storeName) setErrors({ ...errors, storeName: undefined });
                  }}
                />
                <Input 
                  label={t('onboarding.ownerName')} 
                  placeholder={t('onboarding.ownerPlaceholder')}
                  leftIcon={<User size={20} />}
                  value={ownerName}
                  error={errors.ownerName}
                  onChange={(e) => {
                    setOwnerName(e.target.value);
                    if (errors.ownerName) setErrors({ ...errors, ownerName: undefined });
                  }}
                />
                <div className="mt-auto flex gap-3">
                  <Button variant="outline" onClick={handleBack} className="flex-1">{t('common.back')}</Button>
                  <Button onClick={handleNext} className="flex-[2]">
                    {t('common.next')}
                  </Button>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div 
                key="step3"
                custom={1}
                variants={slideVariants}
                initial="enter" animate="center" exit="exit"
                transition={{ duration: 0.3 }}
                className="w-full p-8 flex flex-col gap-4 absolute inset-0 overflow-y-auto no-scrollbar"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1">
                  {PLANS.map((plan) => (
                    <Card 
                      key={plan.id}
                      animated
                      onClick={() => setSelectedPlan(plan.id)}
                      className={`cursor-pointer flex flex-col relative transition-all border-2 ${
                        selectedPlan === plan.id ? 'border-[#FF5900] shadow-md bg-[#FFFBDC]/30' : 'border-[#FFD3A5] hover:border-[#FFAA6E]'
                      }`}
                    >
                      {plan.popular && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                          <Badge variant="pro">{t('common.mostPopular')}</Badge>
                        </div>
                      )}
                      <div className="mb-4 pt-4">
                        <h3 className="font-bold text-lg">{plan.name}</h3>
                        <p className="text-2xl font-black text-[#FF8237]">{plan.price}</p>
                      </div>
                      <ul className="flex-1 flex flex-col gap-2 mb-4">
                        {plan.features.map((f, i) => (
                          <li key={i} className="flex items-center text-sm font-medium text-gray-700">
                            <Check size={16} className="text-[#FF8237] mr-2 shrink-0" />
                            {f}
                          </li>
                        ))}
                      </ul>
                      {selectedPlan === plan.id && <div className="absolute top-4 right-4"><Check className="text-[#FF5900]" size={24} /></div>}
                    </Card>
                  ))}
                </div>
                <div className="mt-4 flex gap-3 shrink-0">
                  <Button variant="outline" onClick={handleBack} className="flex-1">{t('common.back')}</Button>
                  <Button onClick={handleFinish} className="flex-[2]" isLoading={isLoading}>
                    {t('onboarding.completeSetup')}
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </PageTransition>
  );
}
