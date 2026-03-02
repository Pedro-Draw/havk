import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { getAll, getItem, addItem, updateItem, deleteItem } from '../db/indexedDB'; // ← importe deleteItem e addItem!
import toast from 'react-hot-toast';

/* =====================================================
   🔐 TYPES
===================================================== */

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

interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt?: string;
  translations?: Record<string, any>;
}

interface Demanda extends BaseEntity {
  title: string;
  description?: string;
  status: 'aberta' | 'em-progresso' | 'concluida' | 'bloqueada';
  priority: 'baixa' | 'media' | 'alta' | 'urgente';
  projectId?: string;
  assignee?: string;
}

interface Nota extends BaseEntity {
  title?: string;
  content: string;
  demandaId?: string; // opcional: vincular a demanda
}

interface ChatMensagem extends BaseEntity {
  message: string;
  senderId?: string;
  demandaId?: string; // para chat por demanda
  channel?: 'global' | string; // para chat global ou por projeto
}

interface Projeto extends BaseEntity {
  name: string;
  description?: string;
}

interface Objetivo extends BaseEntity {
  title: string;
  completed: boolean;
  deadline?: string;
}

/* =====================================================
   🤖 MOCK AI TRANSLATE
===================================================== */

const mockAITranslate = (text: string, targetLang: 'pt-BR' | 'en'): string => {
  if (!text?.trim()) return text;
  const prefix = targetLang === 'pt-BR' ? 'Havk IA traduziu: ' : 'Havk AI translated: ';
  return prefix + text;
};

/* =====================================================
   🧠 STORE
===================================================== */

interface AppState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  theme: 'light' | 'dark' | 'system' | 'gray';
  language: 'pt-BR' | 'en';

  demandas: Demanda[];
  notas: Nota[];
  chatMensagens: ChatMensagem[];
  projetos: Projeto[];
  objetivos: Objetivo[];

  setUser: (user: User | null) => void;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;

  setTheme: (theme: 'light' | 'dark' | 'system' | 'gray') => void;
  setLanguage: (lang: 'pt-BR' | 'en') => Promise<void>;

  loadAll: () => Promise<void>;

  // Demandas
  addDemanda: (data: Omit<Demanda, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateDemanda: (id: string, data: Partial<Demanda>) => Promise<void>;
  deleteDemanda: (id: string) => Promise<void>;

  // Notas
  addNota: (data: Omit<Nota, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateNota: (id: string, data: Partial<Nota>) => Promise<void>;
  deleteNota: (id: string) => Promise<void>;

  // Chat
  addChatMensagem: (data: Omit<ChatMensagem, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;

  // Projetos
  addProjeto: (data: Omit<Projeto, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateProjeto: (id: string, data: Partial<Projeto>) => Promise<void>;
  deleteProjeto: (id: string) => Promise<void>;

  // Objetivos
  addObjetivo: (data: Omit<Objetivo, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateObjetivo: (id: string, data: Partial<Objetivo>) => Promise<void>;
  deleteObjetivo: (id: string) => Promise<void>;

  // Tradução
  translateContent: (text: string, targetLang: 'pt-BR' | 'en') => string;
  translateAllUserContent: (targetLang: 'pt-BR' | 'en') => Promise<void>;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,

      theme: 'system',
      language: 'pt-BR',

      demandas: [],
      notas: [],
      chatMensagens: [],
      projetos: [],
      objetivos: [],

      /* AUTH */
      setUser: (user) => set({ user, isAuthenticated: !!user }),

      login: async (email, password) => {
        if (email.includes('dev')) {
          const devUser = await getItem<User>('user', 'dev-user');
          if (devUser) {
            set({
              user: devUser,
              isAuthenticated: true,
              language: devUser.language,
              theme: devUser.theme,
              isLoading: true,
            });
            await get().loadAll(); // Carrega tudo após login
            return true;
          }
        }
        toast.error('Login falhou');
        return false;
      },

      logout: () => {
        set({
          user: null,
          isAuthenticated: false,
          demandas: [],
          notas: [],
          chatMensagens: [],
          projetos: [],
          objetivos: [],
        });
        toast.success('Logout realizado');
      },

      /* CONFIG */
      setTheme: (theme) => {
        set({ theme });
        if (get().user) updateItem('user', { ...get().user, theme });

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
        if (get().user) await updateItem('user', { ...get().user, language: lang });
        toast.success(`Idioma alterado para ${lang}`);
      },

      /* LOAD ALL */
      loadAll: async () => {
        set({ isLoading: true });
        try {
          const [demandas, notas, chatMensagens, projetos, objetivos] = await Promise.all([
            getAll<Demanda>('demandas'),
            getAll<Nota>('notas'),
            getAll<ChatMensagem>('chatMensagens'),
            getAll<Projeto>('projetos'),
            getAll<Objetivo>('objetivos'),
          ]);

          set({ demandas, notas, chatMensagens, projetos, objetivos });
        } catch (err) {
          console.error('Erro ao carregar dados:', err);
          toast.error('Falha ao carregar dados do banco local');
        } finally {
          set({ isLoading: false });
        }
      },

      /* DEMANDAS */
      addDemanda: async (data) => {
        const id = crypto.randomUUID();
        const nova: Demanda = {
          ...data,
          id,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        try {
          await addItem('demandas', nova); // ← addItem, não updateItem!
          set((state) => ({ demandas: [...state.demandas, nova] }));
          toast.success('Demanda criada');
          return id;
        } catch (err) {
          toast.error('Erro ao criar demanda');
          throw err;
        }
      },

      updateDemanda: async (id, data) => {
        const current = get().demandas.find((d) => d.id === id);
        if (!current) return;

        const updated: Demanda = {
          ...current,
          ...data,
          updatedAt: new Date().toISOString(),
        };

        try {
          await updateItem('demandas', updated);
          set((state) => ({
            demandas: state.demandas.map((d) => (d.id === id ? updated : d)),
          }));
          toast.success('Demanda atualizada');
        } catch (err) {
          toast.error('Erro ao atualizar demanda');
        }
      },

      deleteDemanda: async (id) => {
        try {
          await deleteItem('demandas', id);
          set((state) => ({
            demandas: state.demandas.filter((d) => d.id !== id),
          }));
          toast.success('Demanda excluída');
        } catch (err) {
          toast.error('Erro ao excluir demanda');
        }
      },

      /* NOTAS (similar para as outras entidades) */
      addNota: async (data) => {
        const id = crypto.randomUUID();
        const nova: Nota = {
          ...data,
          id,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        await addItem('notas', nova);
        set((state) => ({ notas: [...state.notas, nova] }));
        toast.success('Nota adicionada');
        return id;
      },

      updateNota: async (id, data) => {
        const current = get().notas.find((n) => n.id === id);
        if (!current) return;

        const updated: Nota = {
          ...current,
          ...data,
          updatedAt: new Date().toISOString(),
        };

        await updateItem('notas', updated);
        set((state) => ({
          notas: state.notas.map((n) => (n.id === id ? updated : n)),
        }));
        toast.success('Nota atualizada');
      },

      deleteNota: async (id) => {
        await deleteItem('notas', id);
        set((state) => ({
          notas: state.notas.filter((n) => n.id !== id),
        }));
        toast.success('Nota excluída');
      },

      /* CHAT */
      addChatMensagem: async (data) => {
        const id = crypto.randomUUID();
        const nova: ChatMensagem = {
          ...data,
          id,
          createdAt: new Date().toISOString(),
        };

        await addItem('chatMensagens', nova);
        set((state) => ({ chatMensagens: [...state.chatMensagens, nova] }));
        return id;
      },

      /* PROJETOS */
      addProjeto: async (data) => {
        const id = crypto.randomUUID();
        const novo: Projeto = {
          ...data,
          id,
          createdAt: new Date().toISOString(),
        };

        await addItem('projetos', novo);
        set((state) => ({ projetos: [...state.projetos, novo] }));
        toast.success('Projeto criado');
        return id;
      },

      updateProjeto: async (id, data) => {
        const current = get().projetos.find((p) => p.id === id);
        if (!current) return;

        const updated = { ...current, ...data, updatedAt: new Date().toISOString() };
        await updateItem('projetos', updated);
        set((state) => ({
          projetos: state.projetos.map((p) => (p.id === id ? updated : p)),
        }));
      },

      deleteProjeto: async (id) => {
        // Opcional: remover referências em demandas
        const demandas = get().demandas.map((d) =>
          d.projectId === id ? { ...d, projectId: undefined } : d
        );
        set({ demandas });

        await deleteItem('projetos', id);
        set((state) => ({
          projetos: state.projetos.filter((p) => p.id !== id),
        }));
        toast.success('Projeto excluído');
      },

      /* OBJETIVOS (similar) */
      addObjetivo: async (data) => {
        const id = crypto.randomUUID();
        const novo: Objetivo = {
          ...data,
          id,
          createdAt: new Date().toISOString(),
        };

        await addItem('objetivos', novo);
        set((state) => ({ objetivos: [...state.objetivos, novo] }));
        toast.success('Objetivo adicionado');
        return id;
      },

      updateObjetivo: async (id, data) => {
        const current = get().objetivos.find((o) => o.id === id);
        if (!current) return;

        const updated = { ...current, ...data, updatedAt: new Date().toISOString() };
        await updateItem('objetivos', updated);
        set((state) => ({
          objetivos: state.objetivos.map((o) => (o.id === id ? updated : o)),
        }));
      },

      deleteObjetivo: async (id) => {
        await deleteItem('objetivos', id);
        set((state) => ({
          objetivos: state.objetivos.filter((o) => o.id !== id),
        }));
        toast.success('Objetivo removido');
      },

      /* TRADUÇÃO */
      translateContent: (text, targetLang) => mockAITranslate(text, targetLang),

      translateAllUserContent: async (targetLang) => {
        set({ isLoading: true });
        try {
          // Demandas
          let demandas = await getAll<Demanda>('demandas');
          for (const d of demandas) {
            if (!d.translations) d.translations = {};
            if (!d.translations[targetLang]) {
              d.translations[targetLang] = {
                title: mockAITranslate(d.title || '', targetLang),
                description: mockAITranslate(d.description || '', targetLang),
              };
              await updateItem('demandas', d);
            }
          }

          // Notas
          let notas = await getAll<Nota>('notas');
          for (const n of notas) {
            if (!n.translations) n.translations = {};
            if (!n.translations[targetLang]) {
              n.translations[targetLang] = { content: mockAITranslate(n.content || '', targetLang) };
              await updateItem('notas', n);
            }
          }

          // Chat (opcional, pode ser pesado)
          // let chats = await getAll<ChatMensagem>('chatMensagens');
          // ... similar

          set({ demandas, notas /* , chatMensagens: chats */ });
          toast.success('Conteúdo traduzido');
        } catch (err) {
          toast.error('Erro na tradução');
        } finally {
          set({ isLoading: false });
        }
      },
    }),
    {
      name: 'havk-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        theme: state.theme,
        language: state.language,
        // Não persistir listas grandes — elas vêm do IndexedDB
      }),
    }
  )
);

/* =====================================================
   🌗 THEME LISTENER
===================================================== */

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