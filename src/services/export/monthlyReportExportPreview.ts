import type { ComplianceIssue } from "../../types/index";
import type { MonthlyHoursResult } from "../calculation/monthlyHoursCalculator";
import type { MonthlyPremiumResult } from "../calculation/monthlyPremiumCalculator";
import { createMonthlyReportExportMetadata } from "./monthlyReportExportMetadata";

export type MonthlyReportExportPreviewStatus =
  | "ok"
  | "warning"
  | "critical";

export interface MonthlyReportExportPreviewInput {
  monthLabel: string;
  monthlyHours: MonthlyHoursResult;
  monthlyPremiums: MonthlyPremiumResult;
  complianceIssues: ComplianceIssue[];
}

export interface MonthlyReportExportPreview {
  displayMonthLabel: string;
  monthKey: string;
  fileBaseName: string;
  calendarEntryCount: number;
  workShiftCount: number;
  complianceIssueCount: number;
  criticalIssueCount: number;
  warningIssueCount: number;
  balanceHours: number;
  totalPremiumAmount: number | null;
  status: MonthlyReportExportPreviewStatus;
  statusLabel: string;
}

function getPreviewStatus(
  criticalIssueCount: number,
  warningIssueCount: number,
): {
  status: MonthlyReportExportPreviewStatus;
  statusLabel: string;
} {
  if (criticalIssueCount > 0) {
    return {
      status: "critical",
      statusLabel: "Kritische Hinweise",
    };
  }

  if (warningIssueCount > 0) {
    return {
      status: "warning",
      statusLabel: "Warnungen",
    };
  }

  return {
    status: "ok",
    statusLabel: "Keine Auffälligkeiten",
  };
}

export function createMonthlyReportExportPreview({
  monthLabel,
  monthlyHours,
  monthlyPremiums,
  complianceIssues,
}: MonthlyReportExportPreviewInput): MonthlyReportExportPreview {
  const metadata =
    createMonthlyReportExportMetadata(monthLabel);

  const criticalIssueCount =
    complianceIssues.filter(
      (issue) => issue.severity === "critical",
    ).length;

  const warningIssueCount =
    complianceIssues.filter(
      (issue) => issue.severity === "warning",
    ).length;

  const { status, statusLabel } =
    getPreviewStatus(
      criticalIssueCount,
      warningIssueCount,
    );

  return {
    displayMonthLabel: metadata.displayMonthLabel,
    monthKey: metadata.monthKey,
    fileBaseName: metadata.fileBaseName,
    calendarEntryCount:
      monthlyHours.calendarEntryCount,
    workShiftCount: monthlyHours.workShiftCount,
    complianceIssueCount: complianceIssues.length,
    criticalIssueCount,
    warningIssueCount,
    balanceHours: monthlyHours.balanceHours,
    totalPremiumAmount:
      monthlyPremiums.totalAmount,
    status,
    statusLabel,
  };
}
