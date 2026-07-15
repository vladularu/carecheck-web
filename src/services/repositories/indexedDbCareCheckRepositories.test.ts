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
import type { FairnessTeamMemberDraft } from "../storage/fairnessTeamStorage";
import {
  LOCAL_CHANGE_QUEUE_KEY,
  loadLocalChangeQueue,
} from "../storage/localChangeQueueStorage";
import { PRE_MIGRATION_BACKUPS_KEY } from "../storage/dataIntegrityService";
import { createMemoryPersistenceAdapter } from "../storage/persistenceAdapter";
import { createIndexedDbCareCheckRepositories } from "./indexedDbCareCheckRepositories";

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

describe("indexedDbCareCheckRepositories", () => {
  it("speichert und laedt CareCheck-Daten adapterunabhaengig", async () => {
    const adapter =
      createMemoryPersistenceAdapter();
    const repositories =
      createIndexedDbCareCheckRepositories(
        adapter,
      );
    const shiftTemplates = {
      ...defaultShiftTemplates,
      EARLY: {
        startTime: "05:45",
        endTime: "13:45",
        breakMinutes: 30,
      },
    };

    await repositories.profile.save(profile);
    await repositories.shifts.saveAll([
      shift,
      {
        ...shift,
        id: "",
      },
    ]);
    await repositories.shiftTemplates.save(
      shiftTemplates,
    );
    await repositories.planningTemplates.saveAll(
      [planningTemplate],
    );
    await repositories.fairnessTeam.saveAll([
      fairnessMember,
    ]);

    await expect(
      repositories.profile.load(),
    ).resolves.toEqual(profile);
    await expect(
      repositories.shifts.loadAll(),
    ).resolves.toEqual([shift]);
    await expect(
      repositories.shiftTemplates.load(),
    ).resolves.toMatchObject({
      EARLY: shiftTemplates.EARLY,
    });
    await expect(
      repositories.planningTemplates.loadAll(),
    ).resolves.toEqual([planningTemplate]);
    await expect(
      repositories.fairnessTeam.loadAll(),
    ).resolves.toEqual([fairnessMember]);
  });

  it("schreibt lokale Aenderungen in die Queue", async () => {
    const adapter =
      createMemoryPersistenceAdapter();
    const repositories =
      createIndexedDbCareCheckRepositories(
        adapter,
      );

    await repositories.profile.markChanged();
    await repositories.shifts.markDeleted(
      "shift-1",
    );
    await repositories.planningTemplates.markChanged(
      "template-1",
    );

    await expect(
      loadLocalChangeQueue(adapter),
    ).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          domain: "profile",
          entityId: "current",
          operation: "upsert",
        }),
        expect.objectContaining({
          domain: "shifts",
          entityId: "shift-1",
          operation: "delete",
        }),
        expect.objectContaining({
          domain: "planningTemplates",
          entityId: "template-1",
          operation: "upsert",
        }),
      ]),
    );
  });

  it("loescht bekannte lokale Datenbereiche ueber die AppData-Grenze", async () => {
    const adapter =
      createMemoryPersistenceAdapter({
        "carecheck.profile": profile,
        "carecheck.shifts": [shift],
        [LOCAL_CHANGE_QUEUE_KEY]: [],
        [PRE_MIGRATION_BACKUPS_KEY]: [],
      });
    const repositories =
      createIndexedDbCareCheckRepositories(
        adapter,
      );

    await repositories.appData.clearAllLocalData();

    await expect(
      adapter.get("carecheck.profile"),
    ).resolves.toBeNull();
    await expect(
      adapter.get("carecheck.shifts"),
    ).resolves.toBeNull();
    await expect(
      adapter.get(LOCAL_CHANGE_QUEUE_KEY),
    ).resolves.toBeNull();
    await expect(
      adapter.get(PRE_MIGRATION_BACKUPS_KEY),
    ).resolves.toBeNull();
  });
});
