import {
  describe,
  expect,
  it,
} from "vitest";
import { defaultShiftTemplates } from "../../data/defaultShiftTemplates";
import type {
  Shift,
  UserProfile,
} from "../../types/index";
import type { PlanningTemplate } from "../planning/planningComfortService";
import type { FairnessTeamMemberDraft } from "../repositories/careCheckRepositories";
import {
  createDeterministicMigrationId,
  migrateLegacyCareCheckData,
  type LegacyCareCheckDataSnapshot,
} from "./domainMigrationService";

const migratedAt =
  "2026-07-15T10:00:00.000Z";

const profile: UserProfile = {
  federalState: "HE",
  weeklyHours: 38.5,
  payGroup: "P8",
  payLevel: 4,
};

const shift: Shift = {
  id: "shift-1",
  date: "2026-07-15",
  startTime: "21:00",
  endTime: "06:00",
  breakMinutes: 30,
  type: "NIGHT",
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

function createSnapshot(
  overrides: Partial<LegacyCareCheckDataSnapshot> = {},
): LegacyCareCheckDataSnapshot {
  return {
    profile,
    shifts: [shift],
    shiftTemplates: defaultShiftTemplates,
    planningTemplates: [
      planningTemplate,
    ],
    fairnessTeamMembers: [
      fairnessMember,
    ],
    ...overrides,
  };
}

describe("domainMigrationService", () => {
  it("migriert lokale Fachdaten deterministisch in Domain-Entitaeten", () => {
    const result =
      migrateLegacyCareCheckData(
        createSnapshot(),
        {
          migratedAt,
        },
      );

    expect(result.issues).toEqual([]);
    expect(result.migratedAt).toBe(
      migratedAt,
    );
    expect(
      result.entities.profile?.metadata,
    ).toMatchObject({
      id: "profile-current",
      origin: "migration",
      revision: 1,
      createdAt: migratedAt,
      updatedAt: migratedAt,
    });
    expect(
      result.entities.shifts[0].metadata.id,
    ).toBe("shift-1");
    expect(
      result.entities.shifts[0].data,
    ).toEqual(shift);
    expect(
      result.entities.planningTemplates[0].metadata.id,
    ).toBe("template-1");
    expect(
      result.entities.fairnessTeam[0].metadata.id,
    ).toBe("member-1");
    expect(
      result.entities.shiftTemplates.NIGHT.data.template,
    ).toEqual(defaultShiftTemplates.NIGHT);
  });

  it("erzeugt bei fehlenden IDs wiederholbar stabile IDs", () => {
    const shiftWithoutId = {
      ...shift,
      id: undefined,
      note: "ohne legacy id",
    };

    const first =
      migrateLegacyCareCheckData(
        createSnapshot({
          shifts: [shiftWithoutId],
        }),
        {
          migratedAt,
        },
      );
    const second =
      migrateLegacyCareCheckData(
        createSnapshot({
          shifts: [shiftWithoutId],
        }),
        {
          migratedAt,
        },
      );

    expect(
      first.entities.shifts[0].metadata.id,
    ).toBe(
      second.entities.shifts[0].metadata.id,
    );
    expect(
      first.entities.shifts[0].data.id,
    ).toBe(
      first.entities.shifts[0].metadata.id,
    );
    expect(first.issues).toEqual([
      expect.objectContaining({
        code: "missing-id",
        entityType: "shifts",
        sourceIndex: 0,
      }),
    ]);
  });

  it("trennt doppelte IDs deterministisch ohne den ersten Datensatz umzuschreiben", () => {
    const duplicateShift = {
      ...shift,
      date: "2026-07-16",
      note: "zweiter Datensatz",
    };

    const result =
      migrateLegacyCareCheckData(
        createSnapshot({
          shifts: [
            shift,
            duplicateShift,
          ],
        }),
        {
          migratedAt,
        },
      );

    expect(
      result.entities.shifts[0].metadata.id,
    ).toBe("shift-1");
    expect(
      result.entities.shifts[1].metadata.id,
    ).not.toBe("shift-1");
    expect(
      result.entities.shifts[1].data.id,
    ).toBe(
      result.entities.shifts[1].metadata.id,
    );
    expect(result.issues).toContainEqual(
      expect.objectContaining({
        code: "duplicate-id",
        entityType: "shifts",
        sourceIndex: 1,
      }),
    );
  });

  it("nutzt fuer denselben Seed dieselbe deterministische Migrations-ID", () => {
    expect(
      createDeterministicMigrationId(
        "shifts:0::payload",
      ),
    ).toBe(
      createDeterministicMigrationId(
        "shifts:0::payload",
      ),
    );
  });
});
