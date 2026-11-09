import { addItem, deleteItem, getAll, getItem, updateItem } from '../db/indexedDB';

export interface Empresa {
  id: string;
  name: string;
  description?: string;
  segment?: string;
  email?: string;
  phone?: string;
  website?: string;
  city?: string;
  logo?: string | null;
  createdAt: string;
  updatedAt?: string;
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
      segment: 'Geral',
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

  const pref = await getItem<Pref>('preferencias', 'activeEmpresaId');
  const activeId = empresas.some((empresa) => empresa.id === pref?.value) ? pref!.value : empresas[0].id;
  return { empresas, activeId };
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
