import { addItem, deleteItem, getAll, getItem, updateItem } from '../db/indexedDB';

export const GERAL_EMPRESA_ID = 'geral';

export interface Empresa {
  id: string;
  name: string;
  description?: string;
  segment?: string;
  size?: string;
  kind?: string;
  state?: string;
  email?: string;
  phone?: string;
  website?: string;
  city?: string;
  logo?: string | null;
  pinned?: boolean;
  order?: number;
  createdAt: string;
  updatedAt?: string;
}

export function sortEmpresas(list: Empresa[]) {
  return [...list].sort((a, b) => {
    if (Boolean(a.pinned) !== Boolean(b.pinned)) return a.pinned ? -1 : 1;
    const orderA = a.order ?? Number.MAX_SAFE_INTEGER;
    const orderB = b.order ?? Number.MAX_SAFE_INTEGER;
    if (orderA !== orderB) return orderA - orderB;
    return (a.createdAt || '').localeCompare(b.createdAt || '');
  });
}

export function isSharedRecord(empresaId?: string | null) {
  return !empresaId || empresaId === GERAL_EMPRESA_ID;
}

export function visibleInWorkspace<T extends { empresaId?: string | null }>(list: T[] | undefined, activeId: string) {
  const items = list || [];
  if (activeId === GERAL_EMPRESA_ID) return items;
  return items.filter((item) => item.empresaId === activeId || isSharedRecord(item.empresaId));
}

export function empresaIdForNew(activeId: string | null) {
  if (!activeId || activeId === GERAL_EMPRESA_ID) return GERAL_EMPRESA_ID;
  return activeId;
}

const SCOPED_STORES = [
  'demandas',
  'notas',
  'chatMensagens',
  'projetos',
  'objetivos',
  'notifications',
  'membros',
  'templates',
  'timeEntries',
] as const;

type Pref = { key: string; value: string };

export async function ensureEmpresas(): Promise<{ empresas: Empresa[]; activeId: string }> {
  let empresas = await getAll<Empresa>('empresas');

  if (empresas.length === 0) {
    const now = new Date().toISOString();
    const empresa: Empresa = {
      id: crypto.randomUUID(),
      name: 'Minha empresa',
      description: 'Espaço inicial. O que já existia continua aqui, separado das próximas empresas.',
      segment: '',
      createdAt: now,
      updatedAt: now,
    };
    await addItem('empresas', empresa);

    for (const store of SCOPED_STORES) {
      const items = await getAll<Record<string, unknown>>(store);
      for (const item of items) {
        if (!item.empresaId) {
          await updateItem(store, { ...item, empresaId: empresa.id });
        }
      }
    }

    await addItem('preferencias', { key: 'activeEmpresaId', value: empresa.id });
    empresas = [empresa];
  }

  const now = new Date().toISOString();
  for (const empresa of empresas) {
    if (empresa.segment === 'Geral') {
      empresa.segment = '';
      empresa.updatedAt = now;
      await updateItem('empresas', empresa);
    }
  }

  const pref = await getItem<Pref>('preferencias', 'activeEmpresaId');
  const saved = pref?.value;
  const activeId = saved === GERAL_EMPRESA_ID || empresas.some((empresa) => empresa.id === saved)
    ? saved!
    : empresas[0].id;
  return { empresas: sortEmpresas(empresas), activeId };
}

export async function rememberEmpresa(id: string) {
  await addItem('preferencias', { key: 'activeEmpresaId', value: id });
}

export async function purgeEmpresa(id: string) {
  for (const store of SCOPED_STORES) {
    const items = await getAll<{ id: string | number; empresaId?: string }>(store);
    for (const item of items) {
      if (item.empresaId === id) await deleteItem(store, item.id);
    }
  }
  await deleteItem('empresas', id);
}
