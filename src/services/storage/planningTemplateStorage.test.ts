import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import type { PlanningTemplate } from "../planning/planningComfortService";
import {
  loadPlanningTemplates,
  savePlanningTemplates,
} from "./planningTemplateStorage";

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

const template: PlanningTemplate = {
  id: "template-1",
  name: "Kurzer Wechsel",
  sourceMonthLabel: "07.2026",
  createdAt: "2026-07-14T08:00:00.000Z",
  entries: [
    {
      day: 1,
      type: "EARLY",
      startTime: "06:00",
      endTime: "14:00",
      breakMinutes: 30,
      note: "Station A",
    },
    {
      day: 2,
      type: "FREE",
      startTime: "00:00",
      endTime: "00:00",
      breakMinutes: 0,
    },
  ],
};

describe("planningTemplateStorage", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "localStorage",
      createMemoryStorage(),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("liefert ohne gespeicherte Vorlagen eine leere Liste", () => {
    expect(loadPlanningTemplates()).toEqual([]);
  });

  it("speichert und laedt gueltige Monatsvorlagen", () => {
    savePlanningTemplates([template]);

    expect(loadPlanningTemplates()).toEqual([
      template,
    ]);
  });

  it("ignoriert ungueltige Vorlagen beim Laden", () => {
    localStorage.setItem(
      "carecheck.planningTemplates.v1",
      JSON.stringify([
        template,
        {
          id: "broken",
          name: "Defekt",
          sourceMonthLabel: "07.2026",
          createdAt: "2026-07-14T08:00:00.000Z",
          entries: [
            {
              day: 99,
              type: "UNKNOWN",
              startTime: "06:00",
              endTime: "14:00",
              breakMinutes: 30,
            },
          ],
        },
      ]),
    );

    expect(loadPlanningTemplates()).toEqual([
      template,
    ]);
  });

  it("liefert bei ungueltigem JSON eine leere Liste", () => {
    localStorage.setItem(
      "carecheck.planningTemplates.v1",
      "{ungueltig",
    );

    expect(loadPlanningTemplates()).toEqual([]);
  });
});
