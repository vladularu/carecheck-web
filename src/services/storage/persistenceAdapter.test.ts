import {
  describe,
  expect,
  it,
} from "vitest";
import {
  createFallbackPersistenceAdapter,
  createIndexedDbPersistenceAdapter,
  createLocalStoragePersistenceAdapter,
  createMemoryPersistenceAdapter,
  type PersistenceAdapter,
} from "./persistenceAdapter";

function createMemoryStorage(): Storage {
  const values = new Map<string, string>();

  return {
    get length() {
      return values.size;
    },
    clear() {
      values.clear();
    },
    getItem(key: string) {
      return values.get(key) ?? null;
    },
    key(index: number) {
      return (
        Array.from(values.keys())[index] ??
        null
      );
    },
    removeItem(key: string) {
      values.delete(key);
    },
    setItem(key: string, value: string) {
      values.set(key, value);
    },
  };
}

function createFailingAdapter(): PersistenceAdapter {
  return {
    kind: "memory",
    isAvailable: async () => true,
    get: async () => {
      throw new Error("primary failed");
    },
    set: async () => {
      throw new Error("primary failed");
    },
    remove: async () => {
      throw new Error("primary failed");
    },
    clear: async () => {
      throw new Error("primary failed");
    },
  };
}

describe("persistenceAdapter", () => {
  it("liest und schreibt JSON ueber Local Storage", async () => {
    const adapter =
      createLocalStoragePersistenceAdapter(
        createMemoryStorage(),
      );

    await adapter.set("carecheck.test", {
      value: 1,
    });

    await expect(
      adapter.get("carecheck.test"),
    ).resolves.toEqual({
      value: 1,
    });
  });

  it("faellt bei primaerem Fehler auf den Fallback zurueck", async () => {
    const fallback =
      createMemoryPersistenceAdapter();
    const adapter =
      createFallbackPersistenceAdapter(
        createFailingAdapter(),
        fallback,
      );

    await adapter.set("carecheck.test", {
      ok: true,
    });

    await expect(
      adapter.get("carecheck.test"),
    ).resolves.toEqual({
      ok: true,
    });
  });

  it("liest bei leerem primaeren Adapter aus dem Fallback", async () => {
    const primary =
      createMemoryPersistenceAdapter();
    const fallback =
      createMemoryPersistenceAdapter({
        "carecheck.test": {
          source: "fallback",
        },
      });
    const adapter =
      createFallbackPersistenceAdapter(
        primary,
        fallback,
      );

    await expect(
      adapter.get("carecheck.test"),
    ).resolves.toEqual({
      source: "fallback",
    });
  });

  it("meldet IndexedDB ohne Factory als nicht verfuegbar", async () => {
    const adapter =
      createIndexedDbPersistenceAdapter({
        indexedDbFactory: null,
      });

    await expect(
      adapter.isAvailable(),
    ).resolves.toBe(false);
  });
});
