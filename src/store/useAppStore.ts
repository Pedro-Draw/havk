import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { getAll, updateItem, getItem } from '../db/indexedDB';

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string | null;
  language: 'pt-BR' | 'en';
  theme: 'light' | 'dark' | 'system' | 'gray';
  isDev?: boolean;
  createdAt: string;
}

interface AppState {
  user: User | null;
  isAuthenticated: boolean;
  theme: 'light' | 'dark' | 'system' | 'gray';
  language: 'pt-BR' | 'en';
  setUser: (user: User | null) => void;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  setTheme: (theme: 'light' | 'dark' | 'system' | 'gray') => void;
  setLanguage: (lang: 'pt-BR' | 'en') => Promise<void>;
  translateContent: (text: string, targetLang: 'pt-BR' | 'en') => string;
  translateAllUserContent: (targetLang: 'pt-BR' | 'en') => Promise<void>;
}

const mockAITranslate = (text: string, targetLang: 'pt-BR' | 'en'): string => {
  if (!text.trim()) return text;
  const prefix = targetLang === 'pt-BR' ? 'Havk IA traduziu: ' : 'Havk AI translated: ';
  return prefix + text;
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      theme: 'system',
      language: 'pt-BR',

      setUser: (user) => set({ user, isAuthenticated: !!user }),

      login: async (email, password) => {
        if (email === 'dev@havk.local' || email.includes('dev')) {
          const devUser = await getItem<User>('user', 'dev-user');
          if (devUser) {
            set({ user: devUser, isAuthenticated: true, language: devUser.language, theme: devUser.theme });
            return true;
          }
        }
        return false;
      },

      logout: () => set({ user: null, isAuthenticated: false }),

      setTheme: (theme) => {
        set({ theme });
        if (get().user) {
          updateItem('user', { ...get().user, theme });
        }
        document.documentElement.classList.remove('light', 'dark', 'gray');
        if (theme === 'system') {
          const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
          document.documentElement.classList.add(prefersDark ? 'dark' : 'light');
        } else {
          document.documentElement.classList.add(theme);
        }
      },

      setLanguage: async (lang) => {
        set({ language: lang });
        await get().translateAllUserContent(lang);
        if (get().user) {
          await updateItem('user', { ...get().user, language: lang });
        }
      },

      translateContent: (text: string, targetLang: 'pt-BR' | 'en') => {
        return mockAITranslate(text, targetLang);
      },

      translateAllUserContent: async (targetLang: 'pt-BR' | 'en') => {
        console.log(`Traduzindo conteúdo para ${targetLang}`);

        const demandas = await getAll<any>('demandas');
        for (const d of demandas) {
          if (!d.translations) d.translations = {};
          if (!d.translations[targetLang]) {
            d.translations[targetLang] = {
              title: get().translateContent(d.title || '', targetLang),
              description: get().translateContent(d.description || '', targetLang),
            };
            await updateItem('demandas', d);
          }
        }

        const notas = await getAll<any>('notas');
        for (const n of notas) {
          if (!n.translations) n.translations = {};
          if (!n.translations[targetLang]) {
            n.translations[targetLang] = get().translateContent(n.content || '', targetLang);
            await updateItem('notas', n);
          }
        }

        const chats = await getAll<any>('chatMensagens');
        for (const c of chats) {
          if (!c.translations) c.translations = {};
          if (!c.translations[targetLang]) {
            c.translations[targetLang] = get().translateContent(c.message || '', targetLang);
            await updateItem('chatMensagens', c);
          }
        }
      },
    }),
    {
      name: 'havk-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

if (typeof window !== 'undefined') {
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  const handleChange = () => {
    const store = useAppStore.getState();
    if (store.theme === 'system') {
      document.documentElement.classList.toggle('dark', mediaQuery.matches);
      document.documentElement.classList.toggle('light', !mediaQuery.matches);
    }
  };
  mediaQuery.addEventListener('change', handleChange);
  handleChange();
}