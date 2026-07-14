import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import {
  loadFairnessTeamMembers,
  saveFairnessTeamMembers,
  type FairnessTeamMemberDraft,
} from "./fairnessTeamStorage";

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

const member: FairnessTeamMemberDraft = {
  id: "peer-1",
  name: "Teammitglied",
  weeklyHours: 30,
  workHours: 120,
  workShiftCount: 14,
  nightShiftCount: 2,
  weekendShiftCount: 3,
  workedWeekendCount: 2,
  holidayWorkShiftCount: 1,
  maxConsecutiveWorkedWeekends: 1,
};

describe("fairnessTeamStorage", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "localStorage",
      createMemoryStorage(),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("liefert ohne gespeicherte Teamdaten eine leere Liste", () => {
    expect(loadFairnessTeamMembers()).toEqual(
      [],
    );
  });

  it("speichert und laedt gueltige Teamdaten", () => {
    saveFairnessTeamMembers([member]);

    expect(loadFairnessTeamMembers()).toEqual(
      [member],
    );
  });

  it("ignoriert ungueltige Eintraege", () => {
    localStorage.setItem(
      "carecheck.fairnessTeam.v1",
      JSON.stringify([
        member,
        {
          id: "broken",
          name: "",
          weeklyHours: -10,
        },
      ]),
    );

    expect(loadFairnessTeamMembers()).toEqual(
      [member],
    );
  });

  it("liefert bei ungueltigem JSON eine leere Liste", () => {
    localStorage.setItem(
      "carecheck.fairnessTeam.v1",
      "{ungueltig",
    );

    expect(loadFairnessTeamMembers()).toEqual(
      [],
    );
  });
});
