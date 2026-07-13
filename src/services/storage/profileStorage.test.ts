import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import type { UserProfile } from "../../types/index";
import {
  loadProfile,
  saveProfile,
} from "./profileStorage";

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

const profile: UserProfile = {
  federalState: "HE",
  weeklyHours: 38.5,
  payGroup: "P8",
  payLevel: 4,
  premiumHourlyRate: 25.4,
};

describe("profileStorage", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "localStorage",
      createMemoryStorage(),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("liefert ohne gespeichertes Profil null", () => {
    expect(loadProfile()).toBeNull();
  });

  it("speichert und lädt ein vollständiges Profil", () => {
    saveProfile(profile);

    expect(loadProfile()).toEqual(profile);
  });

  it("liefert bei ungültigem JSON null", () => {
    localStorage.setItem(
      "carecheck.profile",
      "{ungueltig",
    );

    expect(loadProfile()).toBeNull();
  });

  it("weist strukturell ungültige Profile zurück", () => {
    localStorage.setItem(
      "carecheck.profile",
      JSON.stringify({
        federalState: "HE",
        weeklyHours: -1,
        payGroup: "P99",
        payLevel: 9,
      }),
    );

    expect(loadProfile()).toBeNull();
  });
});
