import {
  describe,
  expect,
  it,
} from "vitest";
import type { ComplianceIssue } from "../../types/index";
import type { MonthlyHoursResult } from "../calculation/monthlyHoursCalculator";
import type { MonthlyPremiumResult } from "../calculation/monthlyPremiumCalculator";
import { createMonthlyReportExportPreview } from "./monthlyReportExportPreview";

const monthlyHours = {
  targetHours: 169.4,
  actualHours: 172.2,
  balanceHours: 2.8,
  overtimeHours: 2.8,
  undertimeHours: 0,
  shiftCount: 12,
  shiftTypeCounts: [],
  calendarEntryCount: 16,
  planningEntryCount: 14,
  workShiftCount: 10,
  complianceRelevantShiftCount: 10,
  vacationDayCount: 2,
  sickDayCount: 1,
  vacationHours: 15.4,
  sickHours: 7.7,
  absenceHours: 23.1,
  trainingDayCount: 1,
  freeDayCount: 2,
  plannedDayCount: 14,
  workingDayCount: 22,
  publicHolidayCount: 0,
  holidayReductionHours: 0,
  averageDailyHours: 7.7,
} satisfies MonthlyHoursResult;

const monthlyPremiums = {
  lines: [],
  totalAmount: 142.35,
  shiftCountWithPremiums: 4,
} satisfies MonthlyPremiumResult;

function createIssue(
  severity: ComplianceIssue["severity"],
): ComplianceIssue {
  return {
    id: `${severity}-1`,
    severity,
    title: "Prüfhinweis",
    description: "Beschreibung",
  };
}

describe(
  "monthlyReportExportPreview",
  () => {
    it("fasst die wichtigsten Exportwerte zusammen", () => {
      const preview =
        createMonthlyReportExportPreview({
          monthLabel: "Juli 2026",
          monthlyHours,
          monthlyPremiums,
          complianceIssues: [
            createIssue("warning"),
          ],
        });

      expect(preview).toEqual({
        displayMonthLabel: "Juli 2026",
        monthKey: "2026-07",
        fileBaseName:
          "CareCheck_Monatsbericht_2026-07_Juli",
        pdfFileName:
          "CareCheck_Monatsbericht_2026-07_Juli.pdf",
        calendarEntryCount: 16,
        workShiftCount: 10,
        complianceIssueCount: 1,
        criticalIssueCount: 0,
        warningIssueCount: 1,
        balanceHours: 2.8,
        totalPremiumAmount: 142.35,
        status: "warning",
        statusLabel: "Warnungen",
      });
    });

    it("priorisiert kritische Hinweise im Status", () => {
      const preview =
        createMonthlyReportExportPreview({
          monthLabel: "Juli 2026",
          monthlyHours,
          monthlyPremiums,
          complianceIssues: [
            createIssue("warning"),
            createIssue("critical"),
          ],
        });

      expect(preview.status).toBe("critical");
      expect(preview.statusLabel).toBe(
        "Kritische Hinweise",
      );
    });

    it("meldet unauffaellige Exporte ohne Hinweise", () => {
      const preview =
        createMonthlyReportExportPreview({
          monthLabel: "Juli 2026",
          monthlyHours,
          monthlyPremiums: {
            ...monthlyPremiums,
            totalAmount: null,
          },
          complianceIssues: [],
        });

      expect(preview.status).toBe("ok");
      expect(preview.statusLabel).toBe(
        "Keine Auffälligkeiten",
      );
      expect(preview.totalPremiumAmount).toBeNull();
    });
  },
);
