// IndexedDB wrapper completo para o Havk - offline-first
// Armazena: user, membros, demandas, notas, chatMensagens, templates, preferencias

interface DBStore {
  name: string;
  keyPath: string;
  autoIncrement?: boolean;
  indexes?: { name: string; keyPath: string | string[]; unique?: boolean }[];
}

const DB_NAME = 'HavkDB';
const DB_VERSION = 1;

const STORES: DBStore[] = [
  {
    name: 'user',
    keyPath: 'id',
    autoIncrement: false,
    indexes: [{ name: 'email', keyPath: 'email', unique: true }],
  },
  {
    name: 'membros',
    keyPath: 'id',
    autoIncrement: false,
    indexes: [
      { name: 'email', keyPath: 'email', unique: false },
      { name: 'role', keyPath: 'role' },
      { name: 'status', keyPath: 'status' },
    ],
  },
  {
    name: 'demandas',
    keyPath: 'id',
    autoIncrement: true,           // mantido como você queria originalmente
    indexes: [
      { name: 'status', keyPath: 'status' },
      { name: 'prioridade', keyPath: 'prioridade' },
      { name: 'responsavel', keyPath: 'responsavelId' },
      { name: 'prazo', keyPath: 'prazo' },
    ],
  },
  {
    name: 'notas',
    keyPath: 'id',
    autoIncrement: true,
    indexes: [{ name: 'demandaId', keyPath: 'demandaId' }],
  },
  {
    name: 'chatMensagens',
    keyPath: 'id',
    autoIncrement: true,
    indexes: [{ name: 'demandaId', keyPath: 'demandaId' }],
  },
  {
    name: 'templates',
    keyPath: 'id',
    autoIncrement: true,
  },
  {
    name: 'preferencias',
    keyPath: 'key',
    autoIncrement: false,
  },
];

let db: IDBDatabase | null = null;

export const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (db) {
      resolve(db);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const upgradeDb = (event.target as IDBOpenDBRequest).result;

      STORES.forEach((store) => {
        if (!upgradeDb.objectStoreNames.contains(store.name)) {
          const objectStore = upgradeDb.createObjectStore(store.name, {
            keyPath: store.keyPath,
            autoIncrement: store.autoIncrement ?? false,
          });

          store.indexes?.forEach((index) => {
            objectStore.createIndex(index.name, index.keyPath, { unique: index.unique });
          });
        }
      });
    };
  });
};

export const addItem = async <T>(storeName: string, item: T): Promise<number | string> => {
  const database = await openDB();
  return new Promise((resolve, reject) => {
    const tx = database.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const request = store.add(item);

    request.onsuccess = () => resolve(request.result as number | string);
    request.onerror = () => reject(request.error);
  });
};

export const getItem = async <T>(storeName: string, key: IDBValidKey): Promise<T | undefined> => {
  const database = await openDB();
  return new Promise((resolve, reject) => {
    const tx = database.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);

    let searchKey: IDBValidKey = key;

    // Conversão inteligente para demandas (resolve o problema number vs string)
    if (storeName === 'demandas') {
      if (typeof key === 'string' && /^\d+$/.test(key)) {
        searchKey = Number(key); // tenta como número primeiro
      }
    }

    const request = store.get(searchKey);

    request.onsuccess = () => {
      if (request.result !== undefined) {
        resolve(request.result as T | undefined);
        return;
      }

      // Fallback: se não achou como number, tenta como string (para dados inconsistentes)
      if (searchKey !== key && typeof key === 'string') {
        const fallbackReq = store.get(key);
        fallbackReq.onsuccess = () => resolve(fallbackReq.result as T | undefined);
        fallbackReq.onerror = () => reject(fallbackReq.error);
      } else {
        resolve(undefined);
      }
    };

    request.onerror = () => reject(request.error);
  });
};

export const updateItem = async <T>(storeName: string, item: T): Promise<void> => {
  const database = await openDB();
  return new Promise((resolve, reject) => {
    const tx = database.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const request = store.put(item);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const deleteItem = async (storeName: string, key: IDBValidKey): Promise<void> => {
  const database = await openDB();
  return new Promise((resolve, reject) => {
    const tx = database.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);

    let deleteKey: IDBValidKey = key;

    // Mesma conversão inteligente para demandas
    if (storeName === 'demandas') {
      if (typeof key === 'string' && /^\d+$/.test(key)) {
        deleteKey = Number(key);
      }
    }

    const request = store.delete(deleteKey);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const getAll = async <T>(storeName: string): Promise<T[]> => {
  const database = await openDB();
  return new Promise((resolve, reject) => {
    const tx = database.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result as T[]);
    request.onerror = () => reject(request.error);
  });
};

export const getByIndex = async <T>(
  storeName: string,
  indexName: string,
  query: IDBValidKey | IDBKeyRange
): Promise<T[]> => {
  const database = await openDB();
  return new Promise((resolve, reject) => {
    const tx = database.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const index = store.index(indexName);
    const request = index.getAll(query);

    request.onsuccess = () => resolve(request.result as T[]);
    request.onerror = () => reject(request.error);
  });
};

export const initDevAccount = async () => {
  const existingUser = await getItem('user', 'dev-user');
  if (!existingUser) {
    const devUser = {
      id: 'dev-user',
      name: 'Usuário DEV',
      email: 'dev@havk.local',
      avatar: null,
      language: 'pt-BR',
      theme: 'system',
      createdAt: new Date().toISOString(),
      isDev: true,
    };
    await addItem('user', devUser);
    console.log('Conta DEV criada automaticamente');
  }
};

initDevAccount().catch(console.error);