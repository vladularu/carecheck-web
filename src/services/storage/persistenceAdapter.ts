export type PersistenceAdapterKind =
  | "indexeddb"
  | "local-storage"
  | "memory"
  | "fallback";

export interface PersistenceAdapter {
  kind: PersistenceAdapterKind;
  isAvailable: () => Promise<boolean>;
  get: <T>(key: string) => Promise<T | null>;
  set: (
    key: string,
    value: unknown,
  ) => Promise<void>;
  remove: (key: string) => Promise<void>;
  clear: (keys?: string[]) => Promise<void>;
}

interface LocalStorageLike {
  getItem: (key: string) => string | null;
  setItem: (
    key: string,
    value: string,
  ) => void;
  removeItem: (key: string) => void;
}

interface IndexedDbRecord {
  key: string;
  value: unknown;
}

interface IndexedDbPersistenceOptions {
  databaseName?: string;
  storeName?: string;
  version?: number;
  indexedDbFactory?: IDBFactory | null;
}

interface FallbackPersistenceOptions {
  readFallbackOnMiss?: boolean;
}

const DEFAULT_INDEXED_DB_NAME =
  "carecheck-local-data";
const DEFAULT_INDEXED_DB_STORE =
  "key-value";
const DEFAULT_INDEXED_DB_VERSION = 1;

function getDefaultLocalStorage(): LocalStorageLike | null {
  try {
    return typeof localStorage ===
      "undefined"
      ? null
      : localStorage;
  } catch {
    return null;
  }
}

function getDefaultIndexedDbFactory(): IDBFactory | null {
  try {
    return typeof indexedDB === "undefined"
      ? null
      : indexedDB;
  } catch {
    return null;
  }
}

function readRequest<T>(
  request: IDBRequest<T>,
): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () =>
      resolve(request.result);
    request.onerror = () =>
      reject(
        request.error ??
          new Error(
            "IndexedDB request failed.",
          ),
      );
  });
}

function openIndexedDb(
  options: IndexedDbPersistenceOptions = {},
): Promise<IDBDatabase> {
  const factory =
    options.indexedDbFactory ??
    getDefaultIndexedDbFactory();
  const databaseName =
    options.databaseName ??
    DEFAULT_INDEXED_DB_NAME;
  const storeName =
    options.storeName ??
    DEFAULT_INDEXED_DB_STORE;
  const version =
    options.version ??
    DEFAULT_INDEXED_DB_VERSION;

  if (!factory) {
    return Promise.reject(
      new Error(
        "IndexedDB ist nicht verfuegbar.",
      ),
    );
  }

  return new Promise((resolve, reject) => {
    const request = factory.open(
      databaseName,
      version,
    );

    request.onupgradeneeded = () => {
      const database = request.result;

      if (
        !database.objectStoreNames.contains(
          storeName,
        )
      ) {
        database.createObjectStore(storeName, {
          keyPath: "key",
        });
      }
    };

    request.onsuccess = () =>
      resolve(request.result);
    request.onerror = () =>
      reject(
        request.error ??
          new Error(
            "IndexedDB konnte nicht geoeffnet werden.",
          ),
      );
  });
}

async function withIndexedDbStore<T>(
  mode: IDBTransactionMode,
  action: (
    store: IDBObjectStore,
  ) => Promise<T>,
  options: IndexedDbPersistenceOptions = {},
): Promise<T> {
  const database =
    await openIndexedDb(options);
  const storeName =
    options.storeName ??
    DEFAULT_INDEXED_DB_STORE;

  try {
    const transaction =
      database.transaction(
        storeName,
        mode,
      );
    const store =
      transaction.objectStore(storeName);

    return await action(store);
  } finally {
    database.close();
  }
}

export function createMemoryPersistenceAdapter(
  initialValues: Record<
    string,
    unknown
  > = {},
): PersistenceAdapter {
  const values = new Map<string, unknown>(
    Object.entries(initialValues),
  );

  return {
    kind: "memory",
    isAvailable: async () => true,
    get: async <T>(key: string) =>
      values.has(key)
        ? (values.get(key) as T)
        : null,
    set: async (key, value) => {
      values.set(key, value);
    },
    remove: async (key) => {
      values.delete(key);
    },
    clear: async (keys) => {
      if (!keys) {
        values.clear();
        return;
      }

      keys.forEach((key) => {
        values.delete(key);
      });
    },
  };
}

export function createLocalStoragePersistenceAdapter(
  storage: LocalStorageLike | null =
    getDefaultLocalStorage(),
): PersistenceAdapter {
  return {
    kind: "local-storage",
    isAvailable: async () => Boolean(storage),
    get: async <T>(key: string) => {
      if (!storage) {
        return null;
      }

      const raw = storage.getItem(key);

      return raw === null
        ? null
        : (JSON.parse(raw) as T);
    },
    set: async (key, value) => {
      if (!storage) {
        throw new Error(
          "Local Storage ist nicht verfuegbar.",
        );
      }

      storage.setItem(
        key,
        JSON.stringify(value),
      );
    },
    remove: async (key) => {
      if (!storage) {
        return;
      }

      storage.removeItem(key);
    },
    clear: async (keys) => {
      if (!storage) {
        return;
      }

      if (!keys) {
        return;
      }

      keys.forEach((key) => {
        storage.removeItem(key);
      });
    },
  };
}

export function createIndexedDbPersistenceAdapter(
  options: IndexedDbPersistenceOptions = {},
): PersistenceAdapter {
  return {
    kind: "indexeddb",
    isAvailable: async () => {
      try {
        const database =
          await openIndexedDb(options);
        database.close();
        return true;
      } catch {
        return false;
      }
    },
    get: async <T>(key: string) =>
      withIndexedDbStore(
        "readonly",
        async (store) => {
          const record =
            await readRequest<
              IndexedDbRecord | undefined
            >(store.get(key));

          return record
            ? (record.value as T)
            : null;
        },
        options,
      ),
    set: async (key, value) =>
      withIndexedDbStore(
        "readwrite",
        async (store) => {
          await readRequest(
            store.put({
              key,
              value,
            }),
          );
        },
        options,
      ),
    remove: async (key) =>
      withIndexedDbStore(
        "readwrite",
        async (store) => {
          await readRequest(
            store.delete(key),
          );
        },
        options,
      ),
    clear: async (keys) =>
      withIndexedDbStore(
        "readwrite",
        async (store) => {
          if (!keys) {
            await readRequest(
              store.clear(),
            );
            return;
          }

          await Promise.all(
            keys.map((key) =>
              readRequest(
                store.delete(key),
              ),
            ),
          );
        },
        options,
      ),
  };
}

export function createFallbackPersistenceAdapter(
  primary: PersistenceAdapter,
  fallback: PersistenceAdapter,
  options: FallbackPersistenceOptions = {},
): PersistenceAdapter {
  const readFallbackOnMiss =
    options.readFallbackOnMiss ?? true;

  async function canUsePrimary(): Promise<boolean> {
    try {
      return await primary.isAvailable();
    } catch {
      return false;
    }
  }

  return {
    kind: "fallback",
    isAvailable: async () =>
      (await canUsePrimary()) ||
      fallback.isAvailable(),
    get: async <T>(key: string) => {
      if (await canUsePrimary()) {
        try {
          const value =
            await primary.get<T>(key);

          if (
            value !== null ||
            !readFallbackOnMiss
          ) {
            return value;
          }
        } catch {
          // Fall through to fallback storage.
        }
      }

      return fallback.get<T>(key);
    },
    set: async (key, value) => {
      if (await canUsePrimary()) {
        try {
          await primary.set(key, value);
          return;
        } catch {
          // Fall through to fallback storage.
        }
      }

      await fallback.set(key, value);
    },
    remove: async (key) => {
      if (await canUsePrimary()) {
        try {
          await primary.remove(key);
          return;
        } catch {
          // Fall through to fallback storage.
        }
      }

      await fallback.remove(key);
    },
    clear: async (keys) => {
      if (await canUsePrimary()) {
        try {
          await primary.clear(keys);
          return;
        } catch {
          // Fall through to fallback storage.
        }
      }

      await fallback.clear(keys);
    },
  };
}
