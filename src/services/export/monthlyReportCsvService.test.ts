import {
  describe,
  expect,
  it,
} from "vitest";
import type {
  Shift,
  UserProfile,
} from "../../types/index";
import type { MonthlyHoursResult } from "../calculation/monthlyHoursCalculator";
import type { MonthlyPremiumResult } from "../calculation/monthlyPremiumCalculator";
import {
  createMonthlyReportCsv,
  createMonthlyReportCsvFileContent,
  createMonthlyReportCsvFileName,
} from "./monthlyReportCsvService";

const profile: UserProfile = {
  federalState: "HE",
  weeklyHours: 38.5,
  payGroup: "P8",
  payLevel: 4,
};

const monthlyHours =
  {
    targetHours: 169.4,
    actualHours: 16.95,
    balanceHours: -152.45,
    overtimeHours: 0,
    undertimeHours: 152.45,
    shiftCount: 2,
    shiftTypeCounts: [],
    calendarEntryCount: 2,
    planningEntryCount: 2,
    workShiftCount: 0,
    complianceRelevantShiftCount: 0,
    vacationDayCount: 1,
    sickDayCount: 1,
    vacationHours: 7.7,
    sickHours: 9.25,
    absenceHours: 16.95,
    trainingDayCount: 0,
    freeDayCount: 0,
    plannedDayCount: 2,
    workingDayCount: 22,
    publicHolidayCount: 0,
    holidayReductionHours: 0,
    averageDailyHours: 7.7,
  } satisfies MonthlyHoursResult;

const monthlyPremiums = {
  lines: [],
  totalAmount: 0,
  shiftCountWithPremiums: 0,
} as MonthlyPremiumResult;

const shifts: Shift[] = [
  {
    id: "vacation-1",
    date: "2026-07-15",
    startTime: "00:00",
    endTime: "00:00",
    breakMinutes: 0,
    type: "VACATION",
    creditedHours: 7.7,
    hourCreditSource:
      "DAILY_TARGET",
  },
  {
    id: "sick-1",
    date: "2026-07-16",
    startTime: "00:00",
    endTime: "00:00",
    breakMinutes: 0,
    type: "SICK",
    creditedHours: 9.25,
    hourCreditSource:
      "PLANNED_SHIFT",
    sourceShiftId: "night-1",
  },
];

function createInput(
  overrides: Partial<{
    shifts: Shift[];
    monthLabel: string;
  }> = {},
) {
  return {
    monthLabel:
      overrides.monthLabel ??
      "Juli 2026",
    profile,
    shifts:
      overrides.shifts ??
      shifts,
    monthlyHours,
    monthlyPremiums,
    complianceIssues: [],
  };
}

describe(
  "monthlyReportCsvService",
  () => {
    it("exportiert Abwesenheitsstunden mit Stundenquelle statt künstlicher Zeiten", () => {
      const csv =
        createMonthlyReportCsv(
          createInput(),
        );

      expect(csv).toContain(
        '"Urlaubsstunden";"7,7 h"',
      );

      expect(csv).toContain(
        '"Krankstunden";"9,25 h"',
      );

      expect(csv).toContain(
        '"Stundenquelle"',
      );

      expect(csv).toContain(
        '"Tägliche Sollarbeitszeit"',
      );

      expect(csv).toContain(
        '"Geplanter Dienst"',
      );

      expect(csv).not.toContain(
        '"00:00–00:00"',
      );
    });

    it("maskiert Semikolon Anführungszeichen Zeilenumbruch und Tabellenformeln", () => {
      const customShift: Shift = {
        id: "custom-1",
        date: "2026-07-17",
        startTime: "08:00",
        endTime: "16:30",
        breakMinutes: 30,
        type: "CUSTOM",
        note:
          '=SUM(A1:A2);"Zitat"\nzweite Zeile',
      };

      const csv =
        createMonthlyReportCsv(
          createInput({
            shifts: [customShift],
          }),
        );

      expect(csv).toContain(
        `"'=SUM(A1:A2);""Zitat""\nzweite Zeile"`,
      );
    });

    it("exportiert auch einen leeren Monat mit Tabellenkopf und Leerhinweis", () => {
      const csv =
        createMonthlyReportCsv(
          createInput({
            shifts: [],
          }),
        );

      expect(csv).toContain(
        '"Datum";"Eintragsart";"Zeit";"Pause";"Stunden";"Stundenquelle";"Notiz"',
      );

      expect(csv).toContain(
        '"Keine Kalendereinträge"',
      );
    });

    it("erzeugt einen sortierbaren Dateinamen mit Monatskennung", () => {
      expect(
        createMonthlyReportCsvFileName(
          "Juli 2026",
        ),
      ).toBe(
        "CareCheck_Monatsbericht_2026-07_Juli.csv",
      );
    });

    it("setzt für den Excel-Download ein UTF-8-BOM vor den Inhalt", () => {
      const content =
        createMonthlyReportCsvFileContent(
          createInput(),
        );

      expect(
        content.charCodeAt(0),
      ).toBe(0xfeff);
    });
  },
);
