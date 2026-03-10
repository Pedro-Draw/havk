// store/useAppStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { getAll, getItem, addItem, updateItem, deleteItem } from '../db/indexedDB';
import toast from 'react-hot-toast';

/* =====================================================
   🔐 TYPES
===================================================== */

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string | null;

  // Campos novos adicionados na tela de configurações (para persistir corretamente)
  username?: string;
  bio?: string;
  role?: string;
  website?: string;
  instagram?: string;
  linkedin?: string;
  github?: string;

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
  prazo?: string;
  prazoInicio?: string;
}

interface Nota extends BaseEntity {
  title?: string;
  content: string;
  demandaId?: string;
}

interface ChatMensagem extends BaseEntity {
  message: string;
  senderId?: string;
  demandaId?: string;
  channel?: 'global' | string;
}

interface Projeto extends BaseEntity {
  name: string;
  description?: string;
  status?: 'ativo' | 'em andamento' | 'concluído' | 'pausado';
  demandas?: number;
}

interface Objetivo extends BaseEntity {
  title: string;
  completed: boolean;
  deadline?: string;
}

interface Notification extends BaseEntity {
  type: 'success' | 'warning' | 'error';
  title: string;
  message: string;
  demandaId?: string;
  read: boolean;
}

interface Membro extends BaseEntity {
  name: string;
  email: string;
  role: string;
  avatar?: string | null;
  status: 'ativo' | 'inativo';
}

interface Template extends BaseEntity {
  name: string;
  category: string;
  description: string;
  content: string;
  favorite: boolean;
}

interface TimeEntry extends BaseEntity {
  task: string;
  time: number; // segundos
  date: string;
}

/* =====================================================
   🤖 MOCK AI TRANSLATE (pode trocar por API real)
===================================================== */

const mockAITranslate = (text: string, targetLang: 'pt-BR' | 'en'): string => {
  if (!text?.trim()) return text;
  const prefix = targetLang === 'pt-BR' ? 'Havk IA traduziu: ' : 'Havk AI translated: ';
  return prefix + text;
};

/* =====================================================
   🧠 STORE - ÚNICA FONTE DA VERDADE
===================================================== */

interface AppState {
  user: User | null;
  isAuthenticated: boolean;
  isAuthLoading: boolean;
  isLoading: boolean;

  theme: 'light' | 'dark' | 'system' | 'gray';
  language: 'pt-BR' | 'en';

  demandas: Demanda[];
  notas: Nota[];
  chatMensagens: ChatMensagem[];
  projetos: Projeto[];
  objetivos: Objetivo[];
  notifications: Notification[];
  membros: Membro[];
  templates: Template[];
  timeEntries: TimeEntry[];

  // Preferências de notificações
  notificationPreferences: {
    newDemanda: boolean;
    chat: boolean;
    prazos: boolean;
    system: boolean;
    emailMarketing: boolean;   // extra
  };
  setNotificationPref: (key: keyof AppState['notificationPreferences'], value: boolean) => void;

  // Auth & Config
  setUser: (user: User | null) => Promise<void>;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;

  setTheme: (theme: 'light' | 'dark' | 'system' | 'gray') => void;
  setLanguage: (lang: 'pt-BR' | 'en') => Promise<void>;

  // Load all data from IndexedDB
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

  // Notificações
  // Notificações
addNotification: (data: Omit<Notification, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
updateNotification: (id: string, data: Partial<Notification>) => Promise<void>;
deleteNotification: (id: string) => Promise<void>;
markAllNotificationsRead: () => Promise<void>;
clearNotifications: () => Promise<void>;

  // Membros
  addMembro: (data: Omit<Membro, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateMembro: (id: string, data: Partial<Membro>) => Promise<void>;
  deleteMembro: (id: string) => Promise<void>;

  // Templates
  addTemplate: (data: Omit<Template, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateTemplate: (id: string, data: Partial<Template>) => Promise<void>;
  deleteTemplate: (id: string) => Promise<void>;

  // Time Entries
  addTimeEntry: (data: Omit<TimeEntry, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;

  // Tradução
  translateContent: (text: string, targetLang: 'pt-BR' | 'en') => string;
  translateAllUserContent: (targetLang: 'pt-BR' | 'en') => Promise<void>;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isAuthLoading: true,
      isLoading: false,

      theme: 'system',
      language: 'pt-BR',

      demandas: [],
      notas: [],
      chatMensagens: [],
      projetos: [],
      objetivos: [],
      notifications: [],
      membros: [],
      templates: [],
      timeEntries: [],

      notificationPreferences: {
        newDemanda: true,
        chat: true,
        prazos: true,
        system: true,
        emailMarketing: true,
      },

      setNotificationPref: (key, value) =>
        set(state => ({
          notificationPreferences: {
            ...state.notificationPreferences,
            [key]: value
          }
        })),

      /* AUTH & CONFIG */
      setUser: async (user) => {
  set({ user, isAuthenticated: !!user });

  if (!user) return;

  try {
    await updateItem('user', user); // atualiza
  } catch {
    // se não existir ainda
    await addItem('user', user);
  }

  set({ isLoading: true });
  await get().loadAll();
  set({ isLoading: false });
},

      login: async (email, password) => {
  // TODO: trocar por API real quando tiver backend

  const users = await getAll<User>('user');

  const user = users.find((u) => u.email === email);

  if (user) {
    await get().setUser(user);
    toast.success('Login realizado com sucesso');
    return true;
  }

  // Aqui você pode adicionar login real com Firebase ou outra API
  toast.error('Credenciais inválidas');
  return false;
},

      logout: async () => {
        set({
          user: null,
          isAuthenticated: false,
          demandas: [],
          notas: [],
          chatMensagens: [],
          projetos: [],
          objetivos: [],
          notifications: [],
          membros: [],
          templates: [],
          timeEntries: [],
        });
        // Limpa IndexedDB se quiser (opcional)
        // await clearAllStores(); // função que você pode criar
        toast.success('Logout realizado');
      },

      setTheme: (newTheme) => {
        set({ theme: newTheme });

        // Salva no user se estiver logado
        if (get().user) {
          updateItem('user', { ...get().user, theme: newTheme });
        }

        const root = document.documentElement;

        // Remove classes antigas
        root.classList.remove('light', 'dark', 'gray');

        if (newTheme === 'system') {
          // Segue preferência do sistema
          const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
          root.classList.add(prefersDark ? 'dark' : 'light');
        } else {
          // Aplica o tema escolhido diretamente
          root.classList.add(newTheme);
        }
      },

      setLanguage: async (lang) => {
        set({ language: lang });
        await get().translateAllUserContent(lang);
        if (get().user) {
          await updateItem('user', { ...get().user, language: lang });
        }
        toast.success(`Idioma alterado para ${lang === 'pt-BR' ? 'Português' : 'English'}`);
      },

      /* CARREGAMENTO AUTOMÁTICO DE TODOS OS DADOS */
      loadAll: async () => {
        set({ isLoading: true });
        try {
          const [
            demandas,
            notas,
            chatMensagens,
            projetos,
            objetivos,
            notifications,
            membros,
            templates,
            timeEntries,
          ] = await Promise.all([
            getAll<Demanda>('demandas'),
            getAll<Nota>('notas'),
            getAll<ChatMensagem>('chatMensagens'),
            getAll<Projeto>('projetos'),
            getAll<Objetivo>('objetivos'),
            getAll<Notification>('notifications'),
            getAll<Membro>('membros'),
            getAll<Template>('templates'),
            getAll<TimeEntry>('timeEntries'),
          ]);

          set({
            demandas: demandas || [],
            notas: notas || [],
            chatMensagens: chatMensagens || [],
            projetos: projetos || [],
            objetivos: objetivos || [],
            notifications: notifications || [],
            membros: membros || [],
            templates: templates || [],
            timeEntries: timeEntries || [],
          });
        } catch (err) {
          console.error('Erro ao carregar dados do IndexedDB:', err);
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
          await addItem('demandas', nova);
          set((state) => ({ demandas: [...state.demandas, nova] }));
          toast.success('Demanda criada com sucesso');
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

      /* NOTAS */
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
        const demandasAtualizadas = get().demandas.map((d) =>
          d.projectId === id ? { ...d, projectId: undefined } : d
        );
        set({ demandas: demandasAtualizadas });

        await deleteItem('projetos', id);
        set((state) => ({
          projetos: state.projetos.filter((p) => p.id !== id),
        }));
        toast.success('Projeto excluído');
      },

      /* OBJETIVOS */
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

      deleteObjetivo: async (id: string) => {
        try {
          await deleteItem('objetivos', id);
          set((state) => ({
            objetivos: state.objetivos.filter((o) => o.id !== id),
          }));
          toast.success('Objetivo excluído');
        } catch (err) {
          toast.error('Erro ao excluir objetivo');
        }
      },

      /* NOTIFICAÇÕES */

addNotification: async (data) => {
  const id = crypto.randomUUID();

  const nova: Notification = {
    ...data,
    id,
    createdAt: new Date().toISOString(),
  };

  await addItem('notifications', nova);

  set((state) => ({
    notifications: [...state.notifications, nova],
  }));

  return id;
},

updateNotification: async (id, data) => {
  const current = get().notifications.find((n) => n.id === id);
  if (!current) return;

  const updated: Notification = {
    ...current,
    ...data,
    updatedAt: new Date().toISOString(),
  };

  await updateItem('notifications', updated);

  set((state) => ({
    notifications: state.notifications.map((n) =>
      n.id === id ? updated : n
    ),
  }));
},

deleteNotification: async (id) => {
  try {
    await deleteItem('notifications', id);

    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    }));

    toast.success('Notificação removida');
  } catch (err) {
    toast.error('Erro ao excluir notificação');
  }
},

markAllNotificationsRead: async () => {
  const list = get().notifications;

  try {
    for (const notif of list) {
      if (!notif.read) {
        const updated = {
          ...notif,
          read: true,
          updatedAt: new Date().toISOString(),
        };

        await updateItem('notifications', updated);
      }
    }

    set((state) => ({
      notifications: state.notifications.map((n) => ({
        ...n,
        read: true,
      })),
    }));

    toast.success('Todas notificações marcadas como lidas');
  } catch (err) {
    toast.error('Erro ao atualizar notificações');
  }
},

clearNotifications: async () => {
  try {
    const list = get().notifications;

    for (const notif of list) {
      await deleteItem('notifications', notif.id);
    }

    set({ notifications: [] });

    toast.success('Todas notificações removidas');
  } catch (err) {
    toast.error('Erro ao limpar notificações');
  }
},

      /* MEMBROS */
      addMembro: async (data) => {
        const id = crypto.randomUUID();
        const novo: Membro = {
          ...data,
          id,
          createdAt: new Date().toISOString(),
        };

        await addItem('membros', novo);
        set((state) => ({ membros: [...state.membros, novo] }));
        toast.success('Membro adicionado');
        return id;
      },

      updateMembro: async (id: string, data: Partial<Membro>) => {
        const current = get().membros.find((m) => m.id === id);
        if (!current) return;

        const updated: Membro = {
          ...current,
          ...data,
          updatedAt: new Date().toISOString(),
        };

        try {
          await updateItem('membros', updated);
          set((state) => ({
            membros: state.membros.map((m) => (m.id === id ? updated : m)),
          }));
          toast.success('Membro atualizado');
        } catch (err) {
          toast.error('Erro ao atualizar membro');
        }
      },

      deleteMembro: async (id: string) => {
        try {
          await deleteItem('membros', id);
          set((state) => ({
            membros: state.membros.filter((m) => m.id !== id),
          }));
          toast.success('Membro excluído');
        } catch (err) {
          toast.error('Erro ao excluir membro');
        }
      },

      /* TEMPLATES */
      addTemplate: async (data) => {
        const id = crypto.randomUUID();
        const novo: Template = {
          ...data,
          id,
          createdAt: new Date().toISOString(),
        };

        await addItem('templates', novo);
        set((state) => ({ templates: [...state.templates, novo] }));
        toast.success('Template criado');
        return id;
      },

      updateTemplate: async (id: string, data: Partial<Template>) => {
        const current = get().templates.find((t) => t.id === id);
        if (!current) return;

        const updated: Template = {
          ...current,
          ...data,
          updatedAt: new Date().toISOString(),
        };

        await updateItem('templates', updated);
        set((state) => ({
          templates: state.templates.map((t) => (t.id === id ? updated : t)),
        }));
        toast.success('Template atualizado');
      },

      deleteTemplate: async (id: string) => {
        try {
          await deleteItem('templates', id);
          set((state) => ({
            templates: state.templates.filter((t) => t.id !== id),
          }));
          toast.success('Template excluído');
        } catch (err) {
          toast.error('Erro ao excluir template');
        }
      },

      /* TIME ENTRIES */
      addTimeEntry: async (data) => {
        const id = crypto.randomUUID();
        const novo: TimeEntry = {
          ...data,
          id,
          createdAt: new Date().toISOString(),
        };

        await addItem('timeEntries', novo);
        set((state) => ({ timeEntries: [...state.timeEntries, novo] }));
        return id;
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

          set({ demandas, notas });
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
        notificationPreferences: state.notificationPreferences,
        // As listas grandes são salvas no IndexedDB pelas actions, não no localStorage
      }),
    }
  )
);

/* =====================================================
   🌗 APPLY THEME ON STARTUP
===================================================== */

if (typeof window !== 'undefined') {
  const applyTheme = (theme: 'light' | 'dark' | 'system' | 'gray') => {
    document.documentElement.classList.remove('light', 'dark', 'gray');

    if (theme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.classList.add(prefersDark ? 'dark' : 'light');
    } else {
      document.documentElement.classList.add(theme);
    }
  };

  // aplica ao iniciar
  const state = useAppStore.getState();
  applyTheme(state.theme);

  // reaplica sempre que mudar
  useAppStore.subscribe((state) => {
    applyTheme(state.theme);
  });
}

/* =====================================================
   🔄 RESTORE USER SESSION ON START
===================================================== */

if (typeof window !== 'undefined') {
  const restoreSession = async () => {
    try {
      const users = await getAll<User>('user');
      const user = users?.[0] || null;

      if (user) {
        useAppStore.setState({
          user,
          isAuthenticated: true
        });

        // IMPORTANTE: carrega todos os dados salvos
        await useAppStore.getState().loadAll();
      }

    } catch (err) {
      console.error('Erro ao restaurar sessão:', err);
    } finally {
      useAppStore.setState({
        isAuthLoading: false
      });
    }
  };

  restoreSession();
}