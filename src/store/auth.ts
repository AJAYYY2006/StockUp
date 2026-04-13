import { create } from 'zustand';
import i18n from '../lib/i18n';
import { supabase } from '../lib/supabase';

interface AuthState {
  isAuthenticated: boolean;
  isOnboarded: boolean;
  user: any | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  logout: () => Promise<void>;
  completeOnboarding: (data: any) => Promise<void>;
  updateUser: (data: any) => void;
  setLanguage: (lang: string) => void;
  checkAuth: () => Promise<void>;
  language: string;
  _handleSession: (session: any) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  isAuthenticated: false,
  isOnboarded: false,
  user: null,
  loading: true,
  language: 'en',

  _handleSession: async (session: any) => {
    console.log('[Auth] _handleSession called, session:', session?.user?.id ?? 'null');
    if (session?.user) {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle();

      console.log('[Auth] Profile fetch result:', { profile, profileError });
      const isOnboarded = !!(profile?.store_name && profile?.owner_name);
      console.log('[Auth] isOnboarded:', isOnboarded);

      set({
        isAuthenticated: true,
        isOnboarded,
        user: { 
          ...session.user, 
          ...profile,
          // Map DB snake_case to app camelCase
          storeName: profile?.store_name,
          ownerName: profile?.owner_name
        },
        language: profile?.language || 'en'
      });

      if (profile?.language) {
        i18n.changeLanguage(profile.language);
      }
    } else {
      console.log('[Auth] No session user — setting unauthenticated');
      set({ isAuthenticated: false, user: null, isOnboarded: false });
    }
  },
  
  checkAuth: async () => {
    set({ loading: true });
    const { data: { session } } = await supabase.auth.getSession();
    await get()._handleSession(session);
    set({ loading: false });
  },

  login: async (email, password) => {
    console.log('[Auth] login() called with email:', email);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    console.log('[Auth] signInWithPassword result:', { userId: data?.user?.id, error });
    if (!error && data.session) {
      await get()._handleSession(data.session);
    }
    return { error };
  },

  signUp: async (email, password) => {
    console.log('[Auth] signUp() called with email:', email);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    console.log('[Auth] signUp result:', { userId: data?.user?.id, sessionExists: !!data?.session, error });
    // If session is created (auto-login enabled in Supabase), update state
    if (!error && data?.session) {
      await get()._handleSession(data.session);
    }
    return { error };
  },
  
  logout: async () => {
    await supabase.auth.signOut();
    set({ isAuthenticated: false, isOnboarded: false, user: null });
  },
  
  completeOnboarding: async (data: any) => {
    const { user } = get();
    if (!user) return;

    console.log('[Auth] Starting onboarding for user:', user.id, data);

    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        phone: user.phone || null,
        store_name: data.storeName,
        owner_name: data.ownerName,
        plan: data.plan,
        language: get().language,
        updated_at: new Date().toISOString()
      });

    if (error) {
      console.error('[Auth] completeOnboarding error:', error);
      throw error;
    }

    console.log('[Auth] Onboarding successful');
    set((state) => ({ 
      isOnboarded: true, 
      user: { ...state.user, ...data } 
    }));
  },

  updateUser: (data: any) => {
    set((state) => ({ user: { ...state.user, ...data } }));
  },

  setLanguage: (lang: string) => {
    i18n.changeLanguage(lang);
    set({ language: lang });
    
    // Persist to profile if logged in
    const { user } = get();
    if (user) {
      supabase.from('profiles').update({ language: lang }).eq('id', user.id).then();
    }
  },
}));
