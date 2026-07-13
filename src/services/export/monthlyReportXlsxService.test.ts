import * as XLSX from "xlsx";
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
  createMonthlyReportWorkbook,
  createMonthlyReportXlsxFileName,
} from "./monthlyReportXlsxService";

const profile: UserProfile = {
  federalState: "HE",
  weeklyHours: 38.5,
  payGroup: "P8",
  payLevel: 4,
};

const monthlyHours = {
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

function createWorkbook(
  currentShifts: Shift[] = shifts,
) {
  return createMonthlyReportWorkbook({
    monthLabel: "Juli 2026",
    profile,
    shifts: currentShifts,
    monthlyHours,
    monthlyPremiums,
    complianceIssues: [],
  });
}

function getRows(
  workbook: XLSX.WorkBook,
  sheetName: string,
): Array<Array<string | number>> {
  const sheet =
    workbook.Sheets[sheetName];

  return XLSX.utils.sheet_to_json(
    sheet,
    {
      header: 1,
      raw: true,
      defval: "",
    },
  ) as Array<Array<string | number>>;
}

describe(
  "monthlyReportXlsxService",
  () => {
    it("erstellt alle vorgesehenen Tabellenblätter", () => {
      const workbook =
        createWorkbook();

      expect(
        workbook.SheetNames,
      ).toEqual([
        "Übersicht",
        "Zuschläge",
        "Prüfung",
        "Kalendereinträge",
      ]);
    });

    it("exportiert Urlaub und Krank ohne künstliche Zeitwerte", () => {
      const workbook =
        createWorkbook();

      const rows = getRows(
        workbook,
        "Kalendereinträge",
      );

      expect(rows[1]).toEqual([
        "15.07.2026",
        "Urlaub",
        "—",
        "—",
        7.7,
        "Tägliche Sollarbeitszeit",
        "",
      ]);

      expect(rows[2]).toEqual([
        "16.07.2026",
        "Krank",
        "—",
        "—",
        9.25,
        "Geplanter Dienst",
        "",
      ]);
    });

    it("enthält die Abwesenheitsstunden in der Übersicht", () => {
      const workbook =
        createWorkbook();

      const rows = getRows(
        workbook,
        "Übersicht",
      );

      expect(rows).toContainEqual([
        "Urlaubsstunden",
        7.7,
      ]);

      expect(rows).toContainEqual([
        "Krankstunden",
        9.25,
      ]);

      expect(rows).toContainEqual([
        "Abwesenheitsstunden",
        16.95,
      ]);
    });

    it("erstellt für einen leeren Monat weiterhin Kopfzeile und Leerhinweis", () => {
      const workbook =
        createWorkbook([]);

      const rows = getRows(
        workbook,
        "Kalendereinträge",
      );

      expect(rows[0]).toEqual([
        "Datum",
        "Eintragsart",
        "Zeit",
        "Pause",
        "Stunden",
        "Stundenquelle",
        "Notiz",
      ]);

      expect(rows[1]).toEqual([
        "Keine Kalendereinträge",
        "",
        "",
        "",
        "",
        "",
        "",
      ]);
    });

    it("erzeugt einen sicheren XLSX-Dateinamen", () => {
      expect(
        createMonthlyReportXlsxFileName(
          'Juli/2026: "Test"',
        ),
      ).toBe(
        "CareCheck_Monatsbericht_Juli2026_Test.xlsx",
      );
    });
  },
);
