import * as XLSX from "xlsx";
import type {
  ComplianceIssue,
  Shift,
  UserProfile,
} from "../../types/index";
import type { MonthlyHoursResult } from "../calculation/monthlyHoursCalculator";
import type { MonthlyPremiumResult } from "../calculation/monthlyPremiumCalculator";
import {
  formatDateGerman,
} from "../format/dateTimeFormat";
import {
  getReportBreakLabel,
  getReportHourSourceLabel,
  getReportNetHours,
  getReportTimeLabel,
} from "./monthlyReportEntryFormatter";

export interface MonthlyReportXlsxInput {
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

const severityLabels: Record<
  ComplianceIssue["severity"],
  string
> = {
  info: "Info",
  warning: "Warnung",
  critical: "Kritisch",
};

function removeControlCharacters(
  value: string,
): string {
  return Array.from(value)
    .filter((character) => {
      const codePoint =
        character.codePointAt(0) ?? 0;

      return (
        codePoint >= 32 &&
        codePoint !== 127
      );
    })
    .join("");
}

function sanitizeFileNamePart(
  value: string,
): string {
  const sanitized =
    removeControlCharacters(value)
      .trim()
      .replace(/[<>:"/\\|?*]/g, "")
      .replace(/\s+/g, "_")
      .replace(/_+/g, "_")
      .replace(/^\.+|\.+$/g, "");

  return sanitized || "Monatsbericht";
}

export function createMonthlyReportXlsxFileName(
  monthLabel: string,
): string {
  return `CareCheck_Monatsbericht_${sanitizeFileNamePart(
    monthLabel,
  )}.xlsx`;
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

function setColumnWidths(
  sheet: XLSX.WorkSheet,
  widths: number[],
) {
  sheet["!cols"] = widths.map((width) => ({
    wch: width,
  }));
}

export function createMonthlyReportWorkbook({
  monthLabel,
  profile,
  shifts,
  monthlyHours,
  monthlyPremiums,
  complianceIssues,
}: MonthlyReportXlsxInput): XLSX.WorkBook {
  const workbook = XLSX.utils.book_new();

  const overviewRows = [
    ["CareCheck TVöD Monatsbericht"],
    [],
    ["Monat", monthLabel],
    ["Bundesland", profile.federalState],
    [
      "Wochenarbeitszeit",
      `${profile.weeklyHours} h`,
    ],
    ["TVöD-P Gruppe", profile.payGroup],
    ["Stufe", profile.payLevel],
    [],
    ["Arbeitszeit"],
    [
      "Sollstunden",
      monthlyHours.targetHours,
    ],
    [
      "Iststunden",
      monthlyHours.actualHours,
    ],
    ["Saldo", monthlyHours.balanceHours],
    [
      "Überstunden",
      monthlyHours.overtimeHours,
    ],
    [
      "Unterstunden",
      monthlyHours.undertimeHours,
    ],
    [
      "Soll-Arbeitstage",
      monthlyHours.workingDayCount,
    ],
    [
      "Feiertage",
      monthlyHours.publicHolidayCount,
    ],
    [
      "Feiertagsabzug",
      monthlyHours.holidayReductionHours,
    ],
    [
      "Durchschnittliche tägliche Sollzeit",
      monthlyHours.averageDailyHours,
    ],
    [],
    ["Monatsplanung"],
    [
      "Arbeitsdienste",
      monthlyHours.workShiftCount,
    ],
    [
      "Planungseinträge",
      monthlyHours.planningEntryCount,
    ],
    [
      "Planungstage",
      monthlyHours.plannedDayCount,
    ],
    [
      "Kalendereinträge",
      monthlyHours.calendarEntryCount,
    ],
    [
      "Urlaubstage",
      monthlyHours.vacationDayCount,
    ],
    [
      "Krankheitstage",
      monthlyHours.sickDayCount,
    ],
    [
      "Urlaubsstunden",
      monthlyHours.vacationHours,
    ],
    [
      "Krankstunden",
      monthlyHours.sickHours,
    ],
    [
      "Abwesenheitsstunden",
      monthlyHours.absenceHours,
    ],
    [
      "Fortbildungstage",
      monthlyHours.trainingDayCount,
    ],
    [
      "Frei-Tage",
      monthlyHours.freeDayCount,
    ],
    [
      "Compliance-relevante Einträge",
      monthlyHours.complianceRelevantShiftCount,
    ],
  ];

  const overviewSheet =
    XLSX.utils.aoa_to_sheet(overviewRows);

  setColumnWidths(
    overviewSheet,
    [38, 28],
  );

  XLSX.utils.book_append_sheet(
    workbook,
    overviewSheet,
    "Übersicht",
  );

  const premiumRows = [
    ["Art", "Stunden", "Prozent", "Betrag"],
    ...monthlyPremiums.lines.map((line) => [
      line.label,
      line.hours,
      `${line.percentage} %`,
      formatEuro(line.amount),
    ]),
    [],
    [
      "Summe Zuschläge",
      "",
      "",
      formatEuro(
        monthlyPremiums.totalAmount,
      ),
    ],
  ];

  const premiumSheet =
    XLSX.utils.aoa_to_sheet(premiumRows);

  setColumnWidths(
    premiumSheet,
    [30, 14, 14, 18],
  );

  XLSX.utils.book_append_sheet(
    workbook,
    premiumSheet,
    "Zuschläge",
  );

  const complianceRows =
    complianceIssues.length === 0
      ? [["Keine Auffälligkeiten"]]
      : [
          [
            "Schweregrad",
            "Titel",
            "Beschreibung",
          ],
          ...complianceIssues.map((issue) => [
            severityLabels[issue.severity],
            issue.title,
            issue.description,
          ]),
        ];

  const complianceSheet =
    XLSX.utils.aoa_to_sheet(
      complianceRows,
    );

  setColumnWidths(
    complianceSheet,
    [16, 32, 90],
  );

  XLSX.utils.book_append_sheet(
    workbook,
    complianceSheet,
    "Prüfung",
  );

  const shiftRows: Array<
    Array<string | number>
  > = [
    [
      "Datum",
      "Eintragsart",
      "Zeit",
      "Pause",
      "Stunden",
      "Stundenquelle",
      "Notiz",
    ],
  ];

  if (shifts.length === 0) {
    shiftRows.push([
      "Keine Kalendereinträge",
    ]);
  } else {
    shiftRows.push(
      ...shifts.map((shift) => [
        formatDateGerman(shift.date),
        shiftLabels[shift.type],
        getReportTimeLabel(shift),
        getReportBreakLabel(shift),
        getReportNetHours(
          shift,
          monthlyHours.averageDailyHours,
        ),
        getReportHourSourceLabel(shift),
        shift.note ?? "",
      ]),
    );
  }

  const shiftsSheet =
    XLSX.utils.aoa_to_sheet(shiftRows);

  setColumnWidths(
    shiftsSheet,
    [14, 18, 18, 16, 16, 28, 36],
  );

  XLSX.utils.book_append_sheet(
    workbook,
    shiftsSheet,
    "Kalendereinträge",
  );

  return workbook;
}

export function downloadMonthlyReportXlsx(
  input: MonthlyReportXlsxInput,
): void {
  const workbook =
    createMonthlyReportWorkbook(input);

  XLSX.writeFile(
    workbook,
    createMonthlyReportXlsxFileName(
      input.monthLabel,
    ),
  );
}
