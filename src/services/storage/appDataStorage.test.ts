import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import {
  CARECHECK_LOCAL_STORAGE_KEYS,
  clearCareCheckLocalData,
} from "./appDataStorage";

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
      return Array.from(values.keys())[index] ?? null;
    },

    removeItem(key: string) {
      values.delete(key);
    },

    setItem(key: string, value: string) {
      values.set(key, value);
    },
  };
}

describe("appDataStorage", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "localStorage",
      createMemoryStorage(),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("entfernt alle lokalen CareCheck-Datenkategorien", () => {
    for (const key of CARECHECK_LOCAL_STORAGE_KEYS) {
      localStorage.setItem(key, "value");
    }

    clearCareCheckLocalData();

    for (const key of CARECHECK_LOCAL_STORAGE_KEYS) {
      expect(localStorage.getItem(key)).toBeNull();
    }
  });

  it("laesst fremde lokale Browserdaten unveraendert", () => {
    localStorage.setItem("carecheck.profile", "value");
    localStorage.setItem("other.app.key", "value");

    clearCareCheckLocalData();

    expect(
      localStorage.getItem("other.app.key"),
    ).toBe("value");
  });
});
