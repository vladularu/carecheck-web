import {
  describe,
  expect,
  it,
} from "vitest";
import type {
  Shift,
  ShiftTemplates,
  UserProfile,
} from "../../types/index";
import {
  createCareCheckBackup,
  parseCareCheckBackup,
} from "./backupService";

const profile: UserProfile = {
  federalState: "HE",
  weeklyHours: 38.5,
  payGroup: "P8",
  payLevel: 4,
};

const shiftTemplates =
  {} as ShiftTemplates;

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

function createValidBackup(
  overrides: Record<string, unknown> = {},
) {
  return {
    app: "CareCheck TVöD",
    backupVersion: 2,
    exportedAt:
      "2026-07-14T10:00:00.000Z",
    profile,
    shifts: [sickShift],
    shiftTemplates,
    ...overrides,
  };
}

describe("backupService", () => {
  it("erstellt Backups der Version 2", () => {
    const backup =
      createCareCheckBackup({
        profile,
        shifts: [sickShift],
        shiftTemplates,
      });

    expect(
      backup.backupVersion,
    ).toBe(2);
  });

  it("erhält Krankstunden und Stundenquelle im Backup", () => {
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
      parseCareCheckBackup({
        app: "CareCheck TVöD",
        backupVersion: 1,
        exportedAt:
          "2026-07-14T10:00:00.000Z",
        profile,
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
        shiftTemplates,
      });

    expect(
      parsed.backupVersion,
    ).toBe(2);

    expect(parsed.shifts).toHaveLength(
      1,
    );
  });

  it("erhält bei einer Migration Profil und Exportdatum", () => {
    const parsed =
      parseCareCheckBackup({
        ...createValidBackup({
          backupVersion: 1,
        }),
      });

    expect(parsed.profile).toEqual(
      profile,
    );

    expect(parsed.exportedAt).toBe(
      "2026-07-14T10:00:00.000Z",
    );
  });

  it("weist nicht unterstützte zukünftige Backup-Versionen zurück", () => {
    expect(() =>
      parseCareCheckBackup(
        createValidBackup({
          backupVersion: 3,
        }),
      ),
    ).toThrow(
      "Die Datei ist kein gültiges CareCheck-Backup.",
    );
  });

  it("weist Backups mit ungültigem Profil zurück", () => {
    expect(() =>
      parseCareCheckBackup(
        createValidBackup({
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

  it("weist Backups mit beschädigten Diensten zurück", () => {
    expect(() =>
      parseCareCheckBackup(
        createValidBackup({
          shifts: [
            {
              ...sickShift,
              date: "2026-99-99",
            },
          ],
        }),
      ),
    ).toThrow(
      "Die Datei ist kein gültiges CareCheck-Backup.",
    );
  });

  it("weist fremde JSON-Dateien zurück", () => {
    expect(() =>
      parseCareCheckBackup({
        app: "Andere App",
      }),
    ).toThrow(
      "Die Datei ist kein gültiges CareCheck-Backup.",
    );
  });
});
