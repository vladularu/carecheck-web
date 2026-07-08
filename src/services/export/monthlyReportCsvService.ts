import type { MonthlyHoursResult } from "../calculation/monthlyHoursCalculator";
import type { MonthlyPremiumResult } from "../calculation/monthlyPremiumCalculator";
import type { ComplianceIssue, Shift, UserProfile } from "../../types/index";
import {
  formatDateGerman,
  formatTimeRange24,
} from "../format/dateTimeFormat";
import { calculateNetHours } from "../calculation/workingTimeCalculator";

interface MonthlyReportCsvInput {
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

function escapeCsv(value: string | number | null | undefined): string {
  const text = String(value ?? "");
  const escaped = text.replace(/"/g, '""');

  return `"${escaped}"`;
}

function createRow(values: Array<string | number | null | undefined>): string {
  return values.map(escapeCsv).join(";");
}

function formatNumber(value: number): string {
  return String(value).replace(".", ",");
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

function createDownloadFileName(monthLabel: string): string {
  return `CareCheck_Monatsbericht_${monthLabel.replace(/\s+/g, "_")}.csv`;
}

export function createMonthlyReportCsv({
  monthLabel,
  profile,
  shifts,
  monthlyHours,
  monthlyPremiums,
  complianceIssues,
}: MonthlyReportCsvInput): string {
  const rows: string[] = [];

  rows.push(createRow(["CareCheck TVöD Monatsbericht"]));
  rows.push(createRow(["Monat", monthLabel]));
  rows.push(createRow(["Bundesland", profile.federalState]));
  rows.push(createRow(["Wochenarbeitszeit", `${formatNumber(profile.weeklyHours)} h`]));
  rows.push(createRow(["TVöD-P Gruppe", profile.payGroup]));
  rows.push(createRow(["Stufe", profile.payLevel]));
  rows.push("");

  rows.push(createRow(["Arbeitszeit"]));
  rows.push(createRow(["Sollstunden", `${formatNumber(monthlyHours.targetHours)} h`]));
  rows.push(createRow(["Iststunden", `${formatNumber(monthlyHours.actualHours)} h`]));
  rows.push(createRow(["Saldo", `${formatNumber(monthlyHours.balanceHours)} h`]));
  rows.push(createRow(["Überstunden", `${formatNumber(monthlyHours.overtimeHours)} h`]));
  rows.push(createRow(["Unterstunden", `${formatNumber(monthlyHours.undertimeHours)} h`]));
  rows.push(createRow(["Arbeitstage", monthlyHours.workingDayCount]));
  rows.push(createRow(["Feiertage", monthlyHours.publicHolidayCount]));
  rows.push(createRow(["Feiertagsabzug", `${formatNumber(monthlyHours.holidayReductionHours)} h`]));
  rows.push("");

  rows.push(createRow(["Zuschläge"]));

  if (monthlyPremiums.lines.length === 0) {
    rows.push(createRow(["Keine zuschlagspflichtigen Zeiten erkannt"]));
  } else {
    rows.push(createRow(["Art", "Stunden", "Prozent", "Betrag"]));

    for (const line of monthlyPremiums.lines) {
      rows.push(
        createRow([
          line.label,
          `${formatNumber(line.hours)} h`,
          `${line.percentage} %`,
          formatEuro(line.amount),
        ]),
      );
    }

    rows.push(
      createRow([
        "Summe Zuschläge",
        "",
        "",
        formatEuro(monthlyPremiums.totalAmount),
      ]),
    );
  }

  rows.push("");

  rows.push(createRow(["Prüfhinweise"]));

  if (complianceIssues.length === 0) {
    rows.push(createRow(["Keine Auffälligkeiten"]));
  } else {
    rows.push(createRow(["Schweregrad", "Titel", "Beschreibung"]));

    for (const issue of complianceIssues) {
      rows.push(
        createRow([
          severityLabels[issue.severity],
          issue.title,
          issue.description,
        ]),
      );
    }
  }

  rows.push("");

  rows.push(createRow(["Dienste"]));
  rows.push(
    createRow([
      "Datum",
      "Dienstart",
      "Beginn-Ende",
      "Pause Minuten",
      "Netto Stunden",
      "Notiz",
    ]),
  );

  for (const shift of shifts) {
    rows.push(
      createRow([
        formatDateGerman(shift.date),
        shiftLabels[shift.type],
        formatTimeRange24(shift.startTime, shift.endTime),
        shift.breakMinutes,
        `${formatNumber(calculateNetHours(shift))} h`,
        shift.note ?? "",
      ]),
    );
  }

  return rows.join("\n");
}

export function downloadMonthlyReportCsv(
  input: MonthlyReportCsvInput,
): void {
  const csv = createMonthlyReportCsv(input);
  const blob = new Blob([`\uFEFF${csv}`], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = createDownloadFileName(input.monthLabel);
  document.body.appendChild(link);
  link.click();

  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}