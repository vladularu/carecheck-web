import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import type {
  Shift,
  ShiftTemplates,
  UserProfile,
} from "../../types/index";
import { defaultShiftTemplates } from "../../data/defaultShiftTemplates";
import type { PlanningTemplate } from "../planning/planningComfortService";
import {
  loadFairnessTeamMembers,
  saveFairnessTeamMembers,
  type FairnessTeamMemberDraft,
} from "../storage/fairnessTeamStorage";
import {
  loadPlanningTemplates,
  savePlanningTemplates,
} from "../storage/planningTemplateStorage";
import {
  createCareCheckBackup,
  parseCareCheckBackup,
  restoreCareCheckBackup,
} from "./backupService";

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

const shiftTemplates: ShiftTemplates =
  defaultShiftTemplates;

const sickShift: Shift = {
  id: "sick-1",
  date: "2026-07-15",
  startTime: "00:00",
  endTime: "00:00",
  breakMinutes: 0,
  type: "SICK",
  creditedHours: 9.25,
  hourCreditSource:
    "PLANNED_SHIFT",
  sourceShiftId: "night-1",
};

const planningTemplate: PlanningTemplate = {
  id: "template-1",
  name: "Nachtdienstfolge",
  sourceMonthLabel: "Juli 2026",
  createdAt: "2026-07-15T09:00:00.000Z",
  entries: [
    {
      day: 15,
      type: "NIGHT",
      startTime: "21:00",
      endTime: "06:00",
      breakMinutes: 30,
    },
  ],
};

const fairnessMember: FairnessTeamMemberDraft = {
  id: "member-1",
  name: "Teammitglied",
  weeklyHours: 38.5,
  workHours: 154,
  workShiftCount: 20,
  nightShiftCount: 3,
  weekendShiftCount: 4,
  workedWeekendCount: 2,
  holidayWorkShiftCount: 1,
  maxConsecutiveWorkedWeekends: 1,
};

function createValidLegacyBackup(
  backupVersion: 1 | 2 = 2,
  overrides: Record<string, unknown> = {},
) {
  return {
    app: "CareCheck TVöD",
    backupVersion,
    exportedAt:
      "2026-07-14T10:00:00.000Z",
    profile,
    shifts: [sickShift],
    shiftTemplates,
    ...overrides,
  };
}

function createValidV3Backup(
  overrides: Record<string, unknown> = {},
) {
  return {
    ...createCareCheckBackup({
      profile,
      shifts: [sickShift],
      shiftTemplates,
      planningTemplates: [
        planningTemplate,
      ],
      fairnessTeamMembers: [
        fairnessMember,
      ],
    }),
    exportedAt:
      "2026-07-14T10:00:00.000Z",
    ...overrides,
  };
}

describe("backupService", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "localStorage",
      createMemoryStorage(),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("erstellt Backups der Version 3 mit Domain-Snapshot", () => {
    const backup =
      createCareCheckBackup({
        profile,
        shifts: [sickShift],
        shiftTemplates,
        planningTemplates: [
          planningTemplate,
        ],
        fairnessTeamMembers: [
          fairnessMember,
        ],
      });

    expect(
      backup.backupVersion,
    ).toBe(3);
    expect(
      backup.planningTemplates,
    ).toEqual([planningTemplate]);
    expect(
      backup.fairnessTeamMembers,
    ).toEqual([fairnessMember]);
    expect(
      backup.domainSnapshot.migratedAt,
    ).toBe(backup.exportedAt);
    expect(
      backup.domainSnapshot.entities.shifts,
    ).toHaveLength(1);
    expect(
      backup.domainSnapshot.entities.planningTemplates,
    ).toHaveLength(1);
  });

  it("erhaelt Krankstunden und Stundenquelle im Backup", () => {
    const backup =
      createCareCheckBackup({
        profile,
        shifts: [sickShift],
        shiftTemplates,
      });

    expect(backup.shifts[0]).toEqual(
      sickShift,
    );
  });

  it("akzeptiert alte Backups der Version 1", () => {
    const parsed =
      parseCareCheckBackup(
        createValidLegacyBackup(1, {
          shifts: [
            {
              id: "vacation-1",
              date: "2026-07-15",
              startTime: "08:00",
              endTime: "16:00",
              breakMinutes: 30,
              type: "VACATION",
            },
          ],
        }),
      );

    expect(
      parsed.backupVersion,
    ).toBe(3);
    expect(
      parsed.sourceBackupVersion,
    ).toBe(1);
    expect(
      parsed.planningTemplates,
    ).toEqual([]);
    expect(
      parsed.fairnessTeamMembers,
    ).toEqual([]);
    expect(parsed.shifts).toHaveLength(
      1,
    );
  });

  it("akzeptiert Backups der Version 2 ohne v3-Datenbereiche", () => {
    const parsed =
      parseCareCheckBackup(
        createValidLegacyBackup(2),
      );

    expect(
      parsed.backupVersion,
    ).toBe(3);
    expect(
      parsed.sourceBackupVersion,
    ).toBe(2);
    expect(
      parsed.domainSnapshot.entities.planningTemplates,
    ).toEqual([]);
  });

  it("erhaelt bei einer Migration Profil und Exportdatum", () => {
    const parsed =
      parseCareCheckBackup(
        createValidLegacyBackup(1),
      );

    expect(parsed.profile).toEqual(
      profile,
    );

    expect(parsed.exportedAt).toBe(
      "2026-07-14T10:00:00.000Z",
    );
  });

  it("weist nicht unterstuetzte zukuenftige Backup-Versionen zurueck", () => {
    expect(() =>
      parseCareCheckBackup(
        createValidV3Backup({
          backupVersion: 4,
        }),
      ),
    ).toThrow(
      "Die Datei ist kein gültiges CareCheck-Backup.",
    );
  });

  it("weist Backups mit ungueltigem Profil zurueck", () => {
    expect(() =>
      parseCareCheckBackup(
        createValidLegacyBackup(2, {
          profile: {
            federalState: "XX",
            weeklyHours: -5,
            payGroup: "P99",
            payLevel: 9,
          },
        }),
      ),
    ).toThrow(
      "Die Datei ist kein gültiges CareCheck-Backup.",
    );
  });

  it("isoliert beschaedigte Dienste beim Import", () => {
    const parsed =
      parseCareCheckBackup(
        createValidLegacyBackup(2, {
          shifts: [
            sickShift,
            {
              ...sickShift,
              date: "2026-99-99",
            },
          ],
        }),
      );

    expect(parsed.shifts).toEqual([
      sickShift,
    ]);
    expect(parsed.importIssues).toEqual(
      [
        expect.objectContaining({
          scope: "shifts",
          index: 1,
        }),
      ],
    );
  });

  it("isoliert ungueltige Planungsvorlagen in Backup v3", () => {
    const parsed =
      parseCareCheckBackup(
        createValidV3Backup({
          planningTemplates: [
            planningTemplate,
            {
              ...planningTemplate,
              entries: [
                {
                  ...planningTemplate.entries[0],
                  day: 99,
                },
              ],
            },
          ],
        }),
      );

    expect(
      parsed.planningTemplates,
    ).toEqual([planningTemplate]);
    expect(parsed.importIssues).toEqual(
      [
        expect.objectContaining({
          scope: "planningTemplates",
          index: 1,
        }),
      ],
    );
  });

  it("isoliert ungueltige Fairness-Teamdaten in Backup v3", () => {
    const parsed =
      parseCareCheckBackup(
        createValidV3Backup({
          fairnessTeamMembers: [
            fairnessMember,
            {
              ...fairnessMember,
              id: "",
            },
          ],
        }),
      );

    expect(
      parsed.fairnessTeamMembers,
    ).toEqual([fairnessMember]);
    expect(parsed.importIssues).toEqual(
      [
        expect.objectContaining({
          scope: "fairnessTeamMembers",
          index: 1,
        }),
      ],
    );
  });

  it("ersetzt beschaedigte Dienstvorlagen durch Defaults", () => {
    const parsed =
      parseCareCheckBackup(
        createValidLegacyBackup(2, {
          shiftTemplates: {
            EARLY:
              defaultShiftTemplates.EARLY,
            NIGHT: {
              ...defaultShiftTemplates.NIGHT,
              breakMinutes: -1,
            },
            UNKNOWN:
              defaultShiftTemplates.DAY,
          },
        }),
      );

    expect(
      parsed.shiftTemplates.NIGHT,
    ).toEqual(
      defaultShiftTemplates.NIGHT,
    );
    expect(parsed.importIssues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          scope: "shiftTemplates",
          key: "NIGHT",
        }),
        expect.objectContaining({
          scope: "shiftTemplates",
          key: "UNKNOWN",
        }),
      ]),
    );
  });

  it("stellt Backup-v3-Datenbereiche wieder her", () => {
    const backup =
      createCareCheckBackup({
        profile,
        shifts: [sickShift],
        shiftTemplates,
        planningTemplates: [
          planningTemplate,
        ],
        fairnessTeamMembers: [
          fairnessMember,
        ],
      });

    restoreCareCheckBackup(backup);

    expect(loadPlanningTemplates()).toEqual(
      [planningTemplate],
    );
    expect(
      loadFairnessTeamMembers(),
    ).toEqual([fairnessMember]);
  });

  it("ueberschreibt bei altem Backup-v2-Restore keine v3-Datenbereiche", () => {
    savePlanningTemplates([
      planningTemplate,
    ]);
    saveFairnessTeamMembers([
      fairnessMember,
    ]);

    restoreCareCheckBackup(
      parseCareCheckBackup(
        createValidLegacyBackup(2),
      ),
    );

    expect(loadPlanningTemplates()).toEqual(
      [planningTemplate],
    );
    expect(
      loadFairnessTeamMembers(),
    ).toEqual([fairnessMember]);
  });

  it("weist fremde JSON-Dateien zurueck", () => {
    expect(() =>
      parseCareCheckBackup({
        app: "Andere App",
      }),
    ).toThrow(
      "Die Datei ist kein gültiges CareCheck-Backup.",
    );
  });
});
