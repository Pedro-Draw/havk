// store/useAppStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { getAll, getItem, addItem, updateItem, deleteItem } from '../db/indexedDB';
import toast from 'react-hot-toast';
import { moveColumnOnBoard, placeOnBoard, reconcileDemanda } from '../lib/kanban';
import { GERAL_EMPRESA_ID, empresaIdForNew, ensureEmpresas, purgeEmpresa, rememberEmpresa, sortEmpresas, visibleInWorkspace, type Empresa } from '../lib/workspace';
import { ensureCompanyDemandas } from '../lib/seedDemandas';
import { ALL_PERMISSION_IDS } from '../lib/permissions';

let demandaWrite: Promise<unknown> = Promise.resolve();

async function collapseNotifications(items: Notification[]) {
  const kept = new Map<string, Notification>();
  const remove: string[] = [];
  items.forEach((item) => {
    const key = item.demandaId ? `${item.demandaId}:${item.type}:${item.title}` : item.id;
    const previous = kept.get(key);
    if (!previous) {
      kept.set(key, item);
      return;
    }
    const previousTime = new Date(previous.createdAt || 0).getTime();
    const nextTime = new Date(item.createdAt || 0).getTime();
    if (nextTime >= previousTime) {
      remove.push(previous.id);
      kept.set(key, item);
    } else {
      remove.push(item.id);
    }
  });
  await Promise.all(remove.map((id) => deleteItem('notifications', id)));
  return [...kept.values()];
}

function enqueueDemanda<T>(job: () => Promise<T>): Promise<T> {
  const run = demandaWrite.then(job, job);
  demandaWrite = run.then(
    () => undefined,
    () => undefined
  );
  return run;
}

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
  empresaId?: string;
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
  // Campos adicionais usados no DemandaDetail e Kanban
  responsavel?: string;
  tipo?: 'bug' | 'feature' | 'melhoria' | 'inovacao' | 'outro';
  dificuldade?: 'muito-facil' | 'facil' | 'media' | 'dificil' | 'muito-dificil';
  esforcoEstimado?: number;
  createdBy?: string;
  parentId?: string;
  seguidores?: string[];
  progresso?: number;
  boardColumn?: string;
  boardOrder?: number;
  sprint?: string;
  sprintInicio?: string;
  sprintFim?: string;
  anexos?: Array<{
    id: string;
    demandaId: string;
    name: string;
    type: string;
    data: string;
    size: number;
    uploadedAt: string;
  }>;
}

interface Nota extends BaseEntity {
  title?: string;
  content: string;
  demandaId?: string;
}

interface ChatMensagem extends BaseEntity {
  message: string;
  senderId?: string;
  senderName?: string;
  demandaId?: string;
  channel?: 'global' | string;
  replyToId?: string;
  reactions?: string[];
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
  // Campos adicionais usados no Objetivos.tsx
  description?: string;
  progress?: number;
  status?: 'completed' | 'in_progress' | 'not_started' | 'overdue' | 'archived';
  tags?: string[];
  owner?: { id: string; name: string };
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
  phone?: string;
  cpf?: string;
  department?: string;
  notes?: string;
  admin?: boolean;
  master?: boolean;
  permissions?: string[];
  gender?: string;
  maritalStatus?: string;
  age?: number;
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
  empresas: Empresa[];
  activeEmpresaId: string | null;

  // Preferências de notificações
  notificationPreferences: {
    newDemanda: boolean;
    chat: boolean;
    prazos: boolean;
    system: boolean;
    emailMarketing: boolean;   // extra
    device: boolean;
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
  updateDemanda: (id: string, data: Partial<Demanda>, options?: { silent?: boolean }) => Promise<void>;
  patchDemandas: (patches: { id: string; data: Partial<Demanda> }[], options?: { silent?: boolean }) => Promise<void>;
  moveDemandaOnBoard: (id: string, columnId: string, index: number) => Promise<void>;
  moveColumnDemandas: (fromColumn: string, toColumn: string) => Promise<number>;
  deleteDemanda: (id: string, options?: { silent?: boolean }) => Promise<void>;

  // Notas
  addNota: (data: Omit<Nota, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateNota: (id: string, data: Partial<Nota>) => Promise<void>;
  deleteNota: (id: string) => Promise<void>;

  // Chat
  addChatMensagem: (data: Omit<ChatMensagem, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateChatMensagem: (id: string, data: Partial<ChatMensagem>) => Promise<void>;

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
  deleteMembros: (ids: string[]) => Promise<void>;

  addEmpresa: (data: Omit<Empresa, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateEmpresa: (id: string, data: Partial<Empresa>) => Promise<void>;
  deleteEmpresa: (id: string) => Promise<void>;
  setActiveEmpresa: (id: string) => Promise<void>;
  toggleEmpresaPin: (id: string) => Promise<void>;
  reorderEmpresas: (ids: string[]) => Promise<void>;

  // Templates
  addTemplate: (data: Omit<Template, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateTemplate: (id: string, data: Partial<Template>) => Promise<void>;
  deleteTemplate: (id: string) => Promise<void>;

  // Time Entries
  addTimeEntry: (data: Omit<TimeEntry, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  deleteTimeEntry: (id: string) => Promise<void>;

  // Tradução
  translateContent: (text: string, targetLang: 'pt-BR' | 'en') => string;
  translateAllUserContent: (targetLang: 'pt-BR' | 'en') => Promise<void>;
}

async function applyDemandaPatches(
  get: () => { demandas: Demanda[] },
  set: (partial: { demandas: Demanda[] } | ((state: { demandas: Demanda[] }) => { demandas: Demanda[] })) => void,
  patches: { id: string; data: Partial<Demanda> }[],
  options?: { silent?: boolean }
) {
  if (!patches.length) return;
  const previous = get().demandas;
  const byId = new Map(patches.map((patch) => [patch.id, patch.data]));
  const stamp = new Date().toISOString();
  const next = previous.map((demanda) => {
    const data = byId.get(demanda.id);
    if (!data) return demanda;
    return {
      ...demanda,
      ...reconcileDemanda(demanda, data),
      updatedAt: stamp,
    };
  });

  set({ demandas: next });

  try {
    await Promise.all(
      next
        .filter((demanda) => byId.has(demanda.id))
        .map((demanda) => updateItem('demandas', demanda))
    );
    if (!options?.silent) toast.success('Quadro atualizado');
  } catch (err) {
    set((state) => ({
      demandas: state.demandas.map((item) => {
        if (!byId.has(item.id) || item.updatedAt !== stamp) return item;
        return previous.find((old) => old.id === item.id) || item;
      }),
    }));
    toast.error('Não foi possível salvar o quadro');
    throw err;
  }
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isAuthLoading: true,
      isLoading: false,

      theme: 'dark',
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
      empresas: [],
      activeEmpresaId: null,

      notificationPreferences: {
        newDemanda: true,
        chat: true,
        prazos: true,
        system: true,
        emailMarketing: true,
        device: true,
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
        set({ user, isAuthenticated: !!user, isAuthLoading: false });

        if (!user) return;

        try {
          await updateItem('user', user);
        } catch (err) {
          console.error('Falha ao salvar usuário localmente:', err);
        }

        try {
          set({ isLoading: true });
          await get().loadAll();
        } catch (err) {
          console.error('Falha ao carregar dados após login:', err);
        } finally {
          set({ isLoading: false });
        }
      },

      login: async (email, _password) => {
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
        try {
          sessionStorage.removeItem('havk-dev-session');
        } catch {
          /* sessão indisponível */
        }
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
          empresas: [],
          activeEmpresaId: null,
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
          const { empresas, activeId } = await ensureEmpresas();
          await ensureCompanyDemandas(empresas);
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
            getAll<Notification>('notifications').then(collapseNotifications),
            getAll<Membro>('membros'),
            getAll<Template>('templates'),
            getAll<TimeEntry>('timeEntries'),
          ]);

          const author = get().user?.name || get().user?.email;
          if (author) {
            await Promise.all(demandas.filter((item) => !item.createdBy).map((item) => {
              item.createdBy = author;
              return updateItem('demandas', item);
            }));
          }

          set({
            empresas: sortEmpresas(empresas),
            activeEmpresaId: activeId,
            demandas: visibleInWorkspace(demandas, activeId),
            notas: visibleInWorkspace(notas, activeId),
            chatMensagens: visibleInWorkspace(chatMensagens, activeId),
            projetos: visibleInWorkspace(projetos, activeId),
            objetivos: visibleInWorkspace(objetivos, activeId),
            notifications: visibleInWorkspace(notifications, activeId),
            membros: visibleInWorkspace(membros, activeId),
            templates: visibleInWorkspace(templates, activeId),
            timeEntries: visibleInWorkspace(timeEntries, activeId),
          });
        } catch (err) {
          console.error('Erro ao carregar dados do IndexedDB:', err);
          toast.error('Falha ao carregar dados do banco local');
        } finally {
          set({ isLoading: false });
        }
      },

      /* DEMANDAS */
      addDemanda: (data) => enqueueDemanda(async () => {
        const id = crypto.randomUUID();
        const reconciled = reconcileDemanda(data, data);
        const nova: Demanda = {
          ...data,
          ...reconciled,
          id,
          empresaId: empresaIdForNew(get().activeEmpresaId),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        try {
          await addItem('demandas', nova);
          set((state) => ({ demandas: [...state.demandas.filter((item) => item.id !== id), nova] }));
          toast.success('Demanda criada com sucesso');
          return id;
        } catch (err) {
          toast.error('Erro ao criar demanda');
          throw err;
        }
      }),

      updateDemanda: (id, data, options) => enqueueDemanda(async () => {
        const current = get().demandas.find((d) => d.id === id);
        if (!current) return;

        const updated: Demanda = {
          ...current,
          ...reconcileDemanda(current, data),
          updatedAt: new Date().toISOString(),
        };

        try {
          await updateItem('demandas', updated);
          set((state) => ({
            demandas: state.demandas.map((d) => (d.id === id ? updated : d)),
          }));
          if (!options?.silent) toast.success('Demanda atualizada');
        } catch (err) {
          toast.error('Erro ao atualizar demanda');
          throw err;
        }
      }),

      patchDemandas: (patches, options) => enqueueDemanda(() => applyDemandaPatches(get, set, patches, options)),

      moveDemandaOnBoard: (id, columnId, index) => enqueueDemanda(async () => {
        const changes = placeOnBoard(get().demandas, { id, columnId, index });
        await applyDemandaPatches(
          get,
          set,
          changes.map((change) => ({
            id: change.id,
            data: { boardColumn: change.boardColumn, boardOrder: change.boardOrder, status: change.status },
          })),
          { silent: true }
        );
      }),

      moveColumnDemandas: (fromColumn, toColumn) => enqueueDemanda(async () => {
        const before = new Map(get().demandas.map((item) => [item.id, item.boardColumn]));
        const changes = moveColumnOnBoard(get().demandas, fromColumn, toColumn);
        const moved = changes.filter((change) => change.boardColumn === toColumn && before.get(change.id) !== toColumn).length;
        await applyDemandaPatches(
          get,
          set,
          changes.map((change) => ({
            id: change.id,
            data: { boardColumn: change.boardColumn, boardOrder: change.boardOrder, status: change.status },
          })),
          { silent: true }
        );
        return moved;
      }),

      deleteDemanda: (id, options) => enqueueDemanda(async () => {
        try {
          await deleteItem('demandas', id);
          set((state) => ({
            demandas: state.demandas.filter((d) => d.id !== id),
          }));
          if (!options?.silent) toast.success('Demanda excluída');
        } catch (err) {
          toast.error('Erro ao excluir demanda');
          throw err;
        }
      }),

      /* NOTAS */
      addNota: async (data) => {
        const id = crypto.randomUUID();
        const nova: Nota = {
          ...data,
          id,
          empresaId: empresaIdForNew(get().activeEmpresaId),
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
          empresaId: empresaIdForNew(get().activeEmpresaId),
          createdAt: new Date().toISOString(),
        };

        await addItem('chatMensagens', nova);
        set((state) => ({ chatMensagens: [...state.chatMensagens, nova] }));
        return id;
      },

      updateChatMensagem: async (id, data) => {
        const current = get().chatMensagens.find((item) => item.id === id);
        if (!current) return;
        const updated = { ...current, ...data, updatedAt: new Date().toISOString() };
        await updateItem('chatMensagens', updated);
        set((state) => ({
          chatMensagens: state.chatMensagens.map((item) => (item.id === id ? updated : item)),
        }));
      },

      /* PROJETOS */
      addProjeto: async (data) => {
        const id = crypto.randomUUID();
        const novo: Projeto = {
          ...data,
          id,
          empresaId: empresaIdForNew(get().activeEmpresaId),
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
          empresaId: empresaIdForNew(get().activeEmpresaId),
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
    empresaId: empresaIdForNew(get().activeEmpresaId),
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
          empresaId: data.empresaId || empresaIdForNew(get().activeEmpresaId),
          createdAt: new Date().toISOString(),
        };

        await addItem('membros', novo);
        set((state) => ({ membros: [...state.membros, novo] }));
        toast.success('Membro adicionado');
        return id;
      },

      updateMembro: async (id: string, data: Partial<Membro>) => {
        const current = get().membros.find((m) => m.id === id) || await getItem<Membro>('membros', id);
        if (!current) return;

        const updated: Membro = current.master
          ? {
              ...current,
              ...data,
              master: true,
              admin: true,
              role: 'Admin',
              permissions: [...ALL_PERMISSION_IDS],
              updatedAt: new Date().toISOString(),
            }
          : {
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
        const current = get().membros.find((m) => m.id === id);
        if (current?.master) {
          toast.error('A conta principal não pode ser removida');
          return;
        }
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

      deleteMembros: async (ids: string[]) => {
        const blocked = new Set(get().membros.filter((member) => member.master).map((member) => member.id));
        const removable = ids.filter((id) => !blocked.has(id));
        if (!removable.length) {
          toast.error('A conta principal não pode ser removida');
          return;
        }
        try {
          for (const id of removable) await deleteItem('membros', id);
          const gone = new Set(removable);
          set((state) => ({ membros: state.membros.filter((m) => !gone.has(m.id)) }));
          toast.success(removable.length === 1 ? 'Membro removido' : `${removable.length} membros removidos`);
        } catch (err) {
          toast.error('Erro ao remover os membros');
        }
      },

      /* TEMPLATES */
      addTemplate: async (data) => {
        const id = crypto.randomUUID();
        const novo: Template = {
          ...data,
          id,
          empresaId: empresaIdForNew(get().activeEmpresaId),
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
          empresaId: empresaIdForNew(get().activeEmpresaId),
          createdAt: new Date().toISOString(),
        };

        await addItem('timeEntries', novo);
        set((state) => ({ timeEntries: [...state.timeEntries, novo] }));
        return id;
      },
      deleteTimeEntry: async (id) => {
        await deleteItem('timeEntries', id);
        set((state) => ({ timeEntries: state.timeEntries.filter((e) => e.id !== id) }));
      },

      addEmpresa: async (data) => {
        const id = crypto.randomUUID();
        const now = new Date().toISOString();
        const order = get().empresas.reduce((max, empresa) => Math.max(max, empresa.order ?? 0), -1) + 1;
        const empresa: Empresa = { ...data, id, pinned: false, order, createdAt: now, updatedAt: now };
        await addItem('empresas', empresa);
        await rememberEmpresa(id);
        await get().loadAll();
        toast.success(`${empresa.name} criada. Os dados dela ficam separados.`);
        return id;
      },

      updateEmpresa: async (id, data) => {
        const current = get().empresas.find((empresa) => empresa.id === id);
        if (!current) return;
        const updated: Empresa = { ...current, ...data, updatedAt: new Date().toISOString() };
        await updateItem('empresas', updated);
        set((state) => ({
          empresas: state.empresas.map((empresa) => (empresa.id === id ? updated : empresa)),
        }));
        toast.success('Empresa atualizada');
      },

      deleteEmpresa: async (id) => {
        if (get().empresas.length <= 1) {
          toast.error('Mantenha ao menos uma empresa.');
          return;
        }
        const removed = get().empresas.find((empresa) => empresa.id === id);
        await purgeEmpresa(id);
        if (get().activeEmpresaId === id) {
          const next = get().empresas.find((empresa) => empresa.id !== id);
          if (next) await rememberEmpresa(next.id);
        }
        await get().loadAll();
        toast.success(removed ? `${removed.name} removida com os dados dela.` : 'Empresa removida');
      },

      setActiveEmpresa: async (id) => {
        if (id === get().activeEmpresaId) return;
        if (id === GERAL_EMPRESA_ID) {
          await rememberEmpresa(id);
          await get().loadAll();
          toast.success('Geral reúne todas as empresas. O que você criar aqui aparece em todas.');
          return;
        }
        const empresa = get().empresas.find((item) => item.id === id);
        if (!empresa) return;
        await rememberEmpresa(id);
        await get().loadAll();
        toast.success(`Agora você está em ${empresa.name}`);
      },

      toggleEmpresaPin: async (id) => {
        const current = get().empresas.find((empresa) => empresa.id === id);
        if (!current) return;
        const updated: Empresa = {
          ...current,
          pinned: !current.pinned,
          order: 0,
          updatedAt: new Date().toISOString(),
        };
        await updateItem('empresas', updated);
        set((state) => ({
          empresas: sortEmpresas(state.empresas.map((empresa) => (empresa.id === id ? updated : empresa))),
        }));
        toast.success(updated.pinned ? `${current.name} fixada no topo` : `${current.name} desafixada`);
      },

      reorderEmpresas: async (ids) => {
        const byId = new Map(get().empresas.map((empresa) => [empresa.id, empresa]));
        const next: Empresa[] = [];
        ids.forEach((id, index) => {
          const current = byId.get(id);
          if (!current) return;
          next.push({ ...current, order: index, updatedAt: new Date().toISOString() });
        });
        await Promise.all(next.map((empresa) => updateItem('empresas', empresa)));
        const untouched = get().empresas.filter((empresa) => !ids.includes(empresa.id));
        set({ empresas: sortEmpresas([...untouched, ...next]) });
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

          await get().loadAll();
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
      version: 2,
      storage: createJSONStorage(() => localStorage),
      migrate: (persistedState) => {
        if (!persistedState || typeof persistedState !== 'object') return persistedState as never;
        const next = { ...(persistedState as Record<string, unknown>) };
        delete next.user;
        return next as never;
      },
      partialize: (state) => ({
        theme: state.theme,
        language: state.language,
        notificationPreferences: state.notificationPreferences,
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
