import * as XLSX from "xlsx";
import type { MonthlyHoursResult } from "../calculation/monthlyHoursCalculator";
import type { MonthlyPremiumResult } from "../calculation/monthlyPremiumCalculator";
import type { ComplianceIssue, Shift, UserProfile } from "../../types/index";
import {
  formatDateGerman,
  formatTimeRange24,
} from "../format/dateTimeFormat";
import { calculateNetHours } from "../calculation/workingTimeCalculator";

interface MonthlyReportXlsxInput {
  monthLabel: string;
  profile: UserProfile;
  shifts: Shift[];
  monthlyHours: MonthlyHoursResult;
  monthlyPremiums: MonthlyPremiumResult;
  complianceIssues: ComplianceIssue[];
}

const shiftLabels: Record<Shift["type"], string> = {
  EARLY: "Frühdienst",
  LATE: "Spätdienst",
  NIGHT: "Nachtdienst",
  DAY: "Tagdienst",
  TRAINING: "Fortbildung",
  VACATION: "Urlaub",
  SICK: "Krank",
  FREE: "Frei",
  CUSTOM: "Individuell",
};

const severityLabels: Record<ComplianceIssue["severity"], string> = {
  info: "Info",
  warning: "Warnung",
  critical: "Kritisch",
};

function createFileName(monthLabel: string): string {
  return `CareCheck_Monatsbericht_${monthLabel.replace(/\s+/g, "_")}.xlsx`;
}

function formatEuro(value: number | null): string {
  if (value === null) {
    return "";
  }

  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
  }).format(value);
}

function setColumnWidths(sheet: XLSX.WorkSheet, widths: number[]) {
  sheet["!cols"] = widths.map((width) => ({ wch: width }));
}

export function downloadMonthlyReportXlsx({
  monthLabel,
  profile,
  shifts,
  monthlyHours,
  monthlyPremiums,
  complianceIssues,
}: MonthlyReportXlsxInput): void {
  const workbook = XLSX.utils.book_new();

  const overviewRows = [
    ["CareCheck TVöD Monatsbericht"],
    [],
    ["Monat", monthLabel],
    ["Bundesland", profile.federalState],
    ["Wochenarbeitszeit", `${profile.weeklyHours} h`],
    ["TVöD-P Gruppe", profile.payGroup],
    ["Stufe", profile.payLevel],
    [],
    ["Arbeitszeit"],
    ["Sollstunden", monthlyHours.targetHours],
    ["Iststunden", monthlyHours.actualHours],
    ["Saldo", monthlyHours.balanceHours],
    ["Überstunden", monthlyHours.overtimeHours],
    ["Unterstunden", monthlyHours.undertimeHours],
    ["Arbeitstage", monthlyHours.workingDayCount],
    ["Feiertage", monthlyHours.publicHolidayCount],
    ["Feiertagsabzug", monthlyHours.holidayReductionHours],
    ["Ø Tagesarbeitszeit", monthlyHours.averageDailyHours],
  ];

  const overviewSheet = XLSX.utils.aoa_to_sheet(overviewRows);
  setColumnWidths(overviewSheet, [28, 28]);
  XLSX.utils.book_append_sheet(workbook, overviewSheet, "Übersicht");

  const premiumRows = [
    ["Art", "Stunden", "Prozent", "Betrag"],
    ...monthlyPremiums.lines.map((line) => [
      line.label,
      line.hours,
      `${line.percentage} %`,
      formatEuro(line.amount),
    ]),
    [],
    ["Summe Zuschläge", "", "", formatEuro(monthlyPremiums.totalAmount)],
  ];

  const premiumSheet = XLSX.utils.aoa_to_sheet(premiumRows);
  setColumnWidths(premiumSheet, [30, 14, 14, 18]);
  XLSX.utils.book_append_sheet(workbook, premiumSheet, "Zuschläge");

  const complianceRows =
    complianceIssues.length === 0
      ? [["Keine Auffälligkeiten"]]
      : [
          ["Schweregrad", "Titel", "Beschreibung"],
          ...complianceIssues.map((issue) => [
            severityLabels[issue.severity],
            issue.title,
            issue.description,
          ]),
        ];

  const complianceSheet = XLSX.utils.aoa_to_sheet(complianceRows);
  setColumnWidths(complianceSheet, [16, 32, 90]);
  XLSX.utils.book_append_sheet(workbook, complianceSheet, "Prüfung");

  const shiftRows = [
    ["Datum", "Dienstart", "Zeit", "Pause Minuten", "Netto Stunden", "Notiz"],
    ...shifts.map((shift) => [
      formatDateGerman(shift.date),
      shiftLabels[shift.type],
      formatTimeRange24(shift.startTime, shift.endTime),
      shift.breakMinutes,
      calculateNetHours(shift),
      shift.note ?? "",
    ]),
  ];

  const shiftsSheet = XLSX.utils.aoa_to_sheet(shiftRows);
  setColumnWidths(shiftsSheet, [14, 18, 18, 16, 16, 36]);
  XLSX.utils.book_append_sheet(workbook, shiftsSheet, "Dienste");

  XLSX.writeFile(workbook, createFileName(monthLabel));
}