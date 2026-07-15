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
import { createCareCheckBackup } from "../backup/backupService";
import { createCareCheckPortabilityExport } from "../export/portabilityExportService";
import type { PlanningTemplate } from "../planning/planningComfortService";
import { CARECHECK_LOCAL_STORAGE_KEYS } from "../storage/appDataStorage";
import type { FairnessTeamMemberDraft } from "../storage/fairnessTeamStorage";
import {
  getCareCheckDataProtectionInventory,
  getCareCheckExportScope,
  getCareCheckStoredDataKeys,
  getExcludedLocalDataForPortabilityExport,
  validateCareCheckExportScope,
} from "./dataProtectionRegistry";

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
  type: "SICK",
  creditedHours: 7.5,
  hourCreditSource: "DAILY_TARGET",
};

const planningTemplate: PlanningTemplate = {
  id: "template-1",
  name: "Sicherheitsprobe",
  sourceMonthLabel: "Juli 2026",
  createdAt: "2026-07-15T10:00:00.000Z",
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
  nightShiftCount: 2,
  weekendShiftCount: 3,
  workedWeekendCount: 2,
  holidayWorkShiftCount: 1,
  maxConsecutiveWorkedWeekends: 1,
};

describe("dataProtectionRegistry", () => {
  it("deckt alle bekannten lokalen CareCheck-Speicherschluessel ab", () => {
    expect(
      getCareCheckStoredDataKeys().sort(),
    ).toEqual(
      [...CARECHECK_LOCAL_STORAGE_KEYS].sort(),
    );
  });

  it("klassifiziert sensible Dienst- und technische Daten getrennt", () => {
    const inventory =
      getCareCheckDataProtectionInventory();

    expect(inventory).toContainEqual(
      expect.objectContaining({
        id: "shifts",
        sensitivity: "sensitive",
        backupExport: "included",
        portabilityExport: "included",
      }),
    );
    expect(inventory).toContainEqual(
      expect.objectContaining({
        id: "preMigrationBackups",
        sensitivity: "sensitive",
        backupExport: "excluded",
        portabilityExport: "excluded",
      }),
    );
  });

  it("weist technische lokale Daten im Portabilitaetsexport als ausgeschlossen aus", () => {
    expect(
      getExcludedLocalDataForPortabilityExport(),
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "carecheck.syncMetadata.v1",
        }),
        expect.objectContaining({
          key: "carecheck.localChangeQueue.v1",
        }),
        expect.objectContaining({
          key: "carecheck.preMigrationBackups.v1",
        }),
      ]),
    );
  });

  it("akzeptiert den aktuellen Backup-v3-Schluesselumfang", () => {
    const backup =
      createCareCheckBackup({
        profile,
        shifts: [shift],
        shiftTemplates:
          defaultShiftTemplates,
        planningTemplates: [
          planningTemplate,
        ],
        fairnessTeamMembers: [
          fairnessMember,
        ],
      });

    expect(
      validateCareCheckExportScope({
        kind: "backup",
        rootKeys: Object.keys(backup),
      }),
    ).toMatchObject({
      ok: true,
      issues: [],
    });
  });

  it("erkennt technische Daten als unzulassige Backup-Exportfelder", () => {
    const result =
      validateCareCheckExportScope({
        kind: "backup",
        rootKeys: [
          ...getCareCheckExportScope(
            "backup",
          ).allowedRootKeys,
          "syncMetadata",
          "preMigrationBackups",
        ],
      });

    expect(result.ok).toBe(false);
    expect(result.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "syncMetadata",
        }),
        expect.objectContaining({
          key: "preMigrationBackups",
        }),
      ]),
    );
  });

  it("akzeptiert den aktuellen Portabilitaets-Exportumfang", () => {
    const dataExport =
      createCareCheckPortabilityExport({
        profile,
        shifts: [shift],
        shiftTemplates:
          defaultShiftTemplates,
        planningTemplates: [
          planningTemplate,
        ],
        fairnessTeamMembers: [
          fairnessMember,
        ],
      });

    expect(
      validateCareCheckExportScope({
        kind: "portability",
        rootKeys: Object.keys(dataExport),
        dataKeys: Object.keys(
          dataExport.data,
        ),
      }),
    ).toMatchObject({
      ok: true,
      issues: [],
    });
  });

  it("erkennt technische Daten als unzulassige Portabilitaets-Datenfelder", () => {
    const result =
      validateCareCheckExportScope({
        kind: "portability",
        rootKeys:
          getCareCheckExportScope(
            "portability",
          ).allowedRootKeys,
        dataKeys: [
          ...getCareCheckExportScope(
            "portability",
          ).allowedDataKeys,
          "syncMetadata",
          "localChangeQueue",
        ],
      });

    expect(result.ok).toBe(false);
    expect(result.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: "data.syncMetadata",
        }),
        expect.objectContaining({
          path: "data.localChangeQueue",
        }),
      ]),
    );
  });
});
