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
import type { FairnessTeamMemberDraft } from "./fairnessTeamStorage";
import { createMemoryPersistenceAdapter } from "./persistenceAdapter";
import {
  createPreMigrationBackup,
  inspectCareCheckPersistenceIntegrity,
  PRE_MIGRATION_BACKUPS_KEY,
  runWithPreMigrationBackup,
} from "./dataIntegrityService";

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

const planningTemplate: PlanningTemplate = {
  id: "template-1",
  name: "Fruehdienstfolge",
  sourceMonthLabel: "Juli 2026",
  createdAt: "2026-07-15T09:00:00.000Z",
  entries: [
    {
      day: 15,
      type: "EARLY",
      startTime: "06:00",
      endTime: "14:00",
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

describe("dataIntegrityService", () => {
  it("meldet gueltige lokale Daten als intakt", async () => {
    const adapter =
      createMemoryPersistenceAdapter({
        "carecheck.profile": profile,
        "carecheck.shifts": [shift],
        "carecheck.shiftTemplates":
          defaultShiftTemplates,
        "carecheck.planningTemplates.v1": [
          planningTemplate,
        ],
        "carecheck.fairnessTeam.v1": [
          fairnessMember,
        ],
        "carecheck.syncMetadata.v1": {
          schemaVersion: 1,
          deviceId: "device-1",
          createdAt:
            "2026-07-15T10:00:00.000Z",
          updatedAt:
            "2026-07-15T10:00:00.000Z",
          entities: {},
        },
      });

    await expect(
      inspectCareCheckPersistenceIntegrity(
        adapter,
        {
          nowFactory: () =>
            "2026-07-15T11:00:00.000Z",
        },
      ),
    ).resolves.toMatchObject({
      checkedAt:
        "2026-07-15T11:00:00.000Z",
      status: "ok",
      issues: [],
    });
  });

  it("erkennt beschaedigte lokale Datenbereiche", async () => {
    const adapter =
      createMemoryPersistenceAdapter({
        "carecheck.profile": {
          ...profile,
          weeklyHours: -1,
        },
        "carecheck.shifts": [
          {
            ...shift,
            date: "2026-99-99",
          },
        ],
      });

    const report =
      await inspectCareCheckPersistenceIntegrity(
        adapter,
      );

    expect(report.status).toBe("error");
    expect(report.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "carecheck.profile",
        }),
        expect.objectContaining({
          key: "carecheck.shifts",
        }),
      ]),
    );
  });

  it("erstellt eine technische Sicherung vor Migrationen", async () => {
    const adapter =
      createMemoryPersistenceAdapter({
        "carecheck.profile": profile,
        "carecheck.shifts": [shift],
      });

    const backup =
      await createPreMigrationBackup(
        adapter,
        "v1.9.1-test",
        {
          idFactory: () => "backup-1",
          nowFactory: () =>
            "2026-07-15T12:00:00.000Z",
        },
      );

    expect(backup).toMatchObject({
      id: "backup-1",
      createdAt:
        "2026-07-15T12:00:00.000Z",
      reason: "v1.9.1-test",
    });
    expect(backup.entries).toContainEqual(
      {
        key: "carecheck.profile",
        value: profile,
      },
    );
    await expect(
      adapter.get(
        PRE_MIGRATION_BACKUPS_KEY,
      ),
    ).resolves.toEqual([backup]);
  });

  it("sichert Daten automatisch vor einem Migrationsschritt", async () => {
    const adapter =
      createMemoryPersistenceAdapter({
        "carecheck.profile": profile,
      });

    const migration =
      await runWithPreMigrationBackup(
        adapter,
        "v1.9.1-migration",
        async () => {
          await adapter.set(
            "carecheck.shifts",
            [shift],
          );

          return "done";
        },
        {
          idFactory: () =>
            "backup-before-migration",
          nowFactory: () =>
            "2026-07-15T13:00:00.000Z",
        },
      );

    expect(migration.result).toBe("done");
    expect(migration.backup.entries).toContainEqual(
      {
        key: "carecheck.profile",
        value: profile,
      },
    );
    await expect(
      adapter.get("carecheck.shifts"),
    ).resolves.toEqual([shift]);
    expect(
      migration.integrityAfterMigration.status,
    ).toBe("ok");
  });
});
