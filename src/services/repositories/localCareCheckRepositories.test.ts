import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { defaultShiftTemplates } from "../../data/defaultShiftTemplates";
import type {
  Shift,
  UserProfile,
} from "../../types/index";
import { loadSyncMetadataState } from "../storage/syncMetadataStorage";
import {
  localAppDataRepository,
  localPlanningTemplateRepository,
  localProfileRepository,
  localShiftRepository,
  localShiftTemplateRepository,
} from "./localCareCheckRepositories";

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
};

const shift: Shift = {
  id: "shift-1",
  date: "2026-07-15",
  startTime: "06:00",
  endTime: "14:00",
  breakMinutes: 30,
  type: "EARLY",
};

describe("localCareCheckRepositories", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "localStorage",
      createMemoryStorage(),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("persistiert Fachdaten ueber lokale Repository-Adapter", () => {
    localProfileRepository.save(profile);
    localShiftRepository.saveAll([shift]);
    localShiftTemplateRepository.save(
      defaultShiftTemplates,
    );

    expect(
      localProfileRepository.load(),
    ).toEqual(profile);
    expect(
      localShiftRepository.loadAll(),
    ).toEqual([shift]);
    expect(
      localShiftTemplateRepository.load(),
    ).toEqual(defaultShiftTemplates);
  });

  it("markiert lokale Revisionen weiterhin getrennt von Fachdaten", () => {
    localProfileRepository.markChanged();
    localShiftRepository.markChanged("shift-1");
    localPlanningTemplateRepository.markDeleted(
      "template-1",
    );

    const state =
      loadSyncMetadataState({
        idFactory: () => "test-device",
      });

    expect(
      state.entities["profile:current"]
        .localRevision,
    ).toBe(1);
    expect(
      state.entities["shifts:shift-1"]
        .localRevision,
    ).toBe(1);
    expect(
      state.entities[
        "planningTemplates:template-1"
      ].deletedAt,
    ).toBeDefined();
  });

  it("loescht lokale CareCheck-Daten ueber das App-Repository", () => {
    localProfileRepository.save(profile);
    localShiftRepository.saveAll([shift]);
    localAppDataRepository.clearAllLocalData();

    expect(
      localProfileRepository.load(),
    ).toBeNull();
    expect(
      localShiftRepository.loadAll(),
    ).toEqual([]);
  });
});
