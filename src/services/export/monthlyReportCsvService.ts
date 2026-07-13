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

export interface MonthlyReportCsvInput {
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

function protectSpreadsheetFormula(
  value: string,
): string {
  if (
    /^[=+@]/.test(value) ||
    /^-\D/.test(value) ||
    /^[\t\r]/.test(value)
  ) {
    return `'${value}`;
  }

  return value;
}

function escapeCsv(
  value: string | number | null | undefined,
): string {
  const text =
    typeof value === "string"
      ? protectSpreadsheetFormula(value)
      : String(value ?? "");

  const escaped = text.replace(/"/g, '""');

  return `"${escaped}"`;
}

function createRow(
  values: Array<
    string | number | null | undefined
  >,
): string {
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

export function createMonthlyReportCsvFileName(
  monthLabel: string,
): string {
  return `CareCheck_Monatsbericht_${sanitizeFileNamePart(
    monthLabel,
  )}.csv`;
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

  rows.push(
    createRow(["CareCheck TVöD Monatsbericht"]),
  );
  rows.push(createRow(["Monat", monthLabel]));
  rows.push(
    createRow([
      "Bundesland",
      profile.federalState,
    ]),
  );
  rows.push(
    createRow([
      "Wochenarbeitszeit",
      `${formatNumber(profile.weeklyHours)} h`,
    ]),
  );
  rows.push(
    createRow([
      "TVöD-P Gruppe",
      profile.payGroup,
    ]),
  );
  rows.push(
    createRow(["Stufe", profile.payLevel]),
  );
  rows.push("");

  rows.push(createRow(["Arbeitszeit"]));
  rows.push(
    createRow([
      "Sollstunden",
      `${formatNumber(
        monthlyHours.targetHours,
      )} h`,
    ]),
  );
  rows.push(
    createRow([
      "Iststunden",
      `${formatNumber(
        monthlyHours.actualHours,
      )} h`,
    ]),
  );
  rows.push(
    createRow([
      "Saldo",
      `${formatNumber(
        monthlyHours.balanceHours,
      )} h`,
    ]),
  );
  rows.push(
    createRow([
      "Überstunden",
      `${formatNumber(
        monthlyHours.overtimeHours,
      )} h`,
    ]),
  );
  rows.push(
    createRow([
      "Unterstunden",
      `${formatNumber(
        monthlyHours.undertimeHours,
      )} h`,
    ]),
  );
  rows.push(
    createRow([
      "Soll-Arbeitstage",
      monthlyHours.workingDayCount,
    ]),
  );
  rows.push(
    createRow([
      "Feiertage",
      monthlyHours.publicHolidayCount,
    ]),
  );
  rows.push(
    createRow([
      "Feiertagsabzug",
      `${formatNumber(
        monthlyHours.holidayReductionHours,
      )} h`,
    ]),
  );
  rows.push(
    createRow([
      "Durchschnittliche tägliche Sollzeit",
      `${formatNumber(
        monthlyHours.averageDailyHours,
      )} h`,
    ]),
  );
  rows.push("");

  rows.push(createRow(["Monatsplanung"]));
  rows.push(
    createRow([
      "Arbeitsdienste",
      monthlyHours.workShiftCount,
    ]),
  );
  rows.push(
    createRow([
      "Planungseinträge",
      monthlyHours.planningEntryCount,
    ]),
  );
  rows.push(
    createRow([
      "Planungstage",
      monthlyHours.plannedDayCount,
    ]),
  );
  rows.push(
    createRow([
      "Kalendereinträge",
      monthlyHours.calendarEntryCount,
    ]),
  );
  rows.push(
    createRow([
      "Urlaubstage",
      monthlyHours.vacationDayCount,
    ]),
  );
  rows.push(
    createRow([
      "Krankheitstage",
      monthlyHours.sickDayCount,
    ]),
  );
  rows.push(
    createRow([
      "Urlaubsstunden",
      `${formatNumber(
        monthlyHours.vacationHours,
      )} h`,
    ]),
  );
  rows.push(
    createRow([
      "Krankstunden",
      `${formatNumber(
        monthlyHours.sickHours,
      )} h`,
    ]),
  );
  rows.push(
    createRow([
      "Abwesenheitsstunden",
      `${formatNumber(
        monthlyHours.absenceHours,
      )} h`,
    ]),
  );
  rows.push(
    createRow([
      "Fortbildungstage",
      monthlyHours.trainingDayCount,
    ]),
  );
  rows.push(
    createRow([
      "Frei-Tage",
      monthlyHours.freeDayCount,
    ]),
  );
  rows.push(
    createRow([
      "Compliance-relevante Einträge",
      monthlyHours.complianceRelevantShiftCount,
    ]),
  );
  rows.push("");

  rows.push(createRow(["Zuschläge"]));

  if (monthlyPremiums.lines.length === 0) {
    rows.push(
      createRow([
        "Keine zuschlagspflichtigen Zeiten erkannt",
      ]),
    );
  } else {
    rows.push(
      createRow([
        "Art",
        "Stunden",
        "Prozent",
        "Betrag",
      ]),
    );

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
        formatEuro(
          monthlyPremiums.totalAmount,
        ),
      ]),
    );
  }

  rows.push("");

  rows.push(createRow(["Prüfhinweise"]));

  if (complianceIssues.length === 0) {
    rows.push(
      createRow(["Keine Auffälligkeiten"]),
    );
  } else {
    rows.push(
      createRow([
        "Schweregrad",
        "Titel",
        "Beschreibung",
      ]),
    );

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

  rows.push(createRow(["Kalendereinträge"]));
  rows.push(
    createRow([
      "Datum",
      "Eintragsart",
      "Zeit",
      "Pause",
      "Stunden",
      "Stundenquelle",
      "Notiz",
    ]),
  );

  if (shifts.length === 0) {
    rows.push(
      createRow([
        "Keine Kalendereinträge",
      ]),
    );
  } else {
    for (const shift of shifts) {
      rows.push(
        createRow([
          formatDateGerman(shift.date),
          shiftLabels[shift.type],
          getReportTimeLabel(shift),
          getReportBreakLabel(shift),
          `${formatNumber(
            getReportNetHours(
              shift,
              monthlyHours.averageDailyHours,
            ),
          )} h`,
          getReportHourSourceLabel(shift),
          shift.note ?? "",
        ]),
      );
    }
  }

  return rows.join("\r\n");
}

export function createMonthlyReportCsvFileContent(
  input: MonthlyReportCsvInput,
): string {
  return `\uFEFF${createMonthlyReportCsv(input)}`;
}

export function downloadMonthlyReportCsv(
  input: MonthlyReportCsvInput,
): void {
  const content =
    createMonthlyReportCsvFileContent(
      input,
    );

  const blob = new Blob(
    [content],
    {
      type: "text/csv;charset=utf-8;",
    },
  );

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download =
    createMonthlyReportCsvFileName(
      input.monthLabel,
    );

  document.body.appendChild(link);
  link.click();

  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
