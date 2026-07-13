import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import type { Shift } from "../../types/index";
import {
  loadShifts,
  saveShifts,
} from "./shiftStorage";

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

const sickShift: Shift = {
  id: "sick-1",
  date: "2026-07-15",
  startTime: "00:00",
  endTime: "00:00",
  breakMinutes: 0,
  type: "SICK",
  creditedHours: 9.25,
  hourCreditSource: "PLANNED_SHIFT",
  sourceShiftId: "night-1",
  note: "Krankmeldung",
};

describe("shiftStorage", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "localStorage",
      createMemoryStorage(),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("liefert ohne gespeicherte Einträge eine leere Liste", () => {
    expect(loadShifts()).toEqual([]);
  });

  it("erhält Abwesenheitsstunden und Stundenquelle", () => {
    saveShifts([sickShift]);

    expect(loadShifts()).toEqual([
      sickShift,
    ]);
  });

  it("liefert bei ungültigem JSON eine leere Liste", () => {
    localStorage.setItem(
      "carecheck.shifts",
      "[ungueltig",
    );

    expect(loadShifts()).toEqual([]);
  });

  it("weist einen gespeicherten Wert zurück der keine Liste ist", () => {
    localStorage.setItem(
      "carecheck.shifts",
      JSON.stringify({
        id: "kein-array",
      }),
    );

    expect(loadShifts()).toEqual([]);
  });

  it("behält gültige Einträge und entfernt beschädigte Einträge", () => {
    localStorage.setItem(
      "carecheck.shifts",
      JSON.stringify([
        sickShift,
        {
          id: "broken",
          date: "2026-99-99",
          startTime: "25:00",
          endTime: "16:00",
          breakMinutes: 0,
          type: "UNKNOWN",
        },
      ]),
    );

    expect(loadShifts()).toEqual([
      sickShift,
    ]);
  });
});
