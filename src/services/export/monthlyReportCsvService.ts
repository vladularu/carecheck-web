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
import { createMonthlyReportExportFileName } from "./monthlyReportExportMetadata";
import {
  monthlyReportLabels,
  monthlyReportSeverityLabels,
  monthlyReportShiftLabels,
} from "./monthlyReportLabels";

export interface MonthlyReportCsvInput {
  monthLabel: string;
  profile: UserProfile;
  shifts: Shift[];
  monthlyHours: MonthlyHoursResult;
  monthlyPremiums: MonthlyPremiumResult;
  complianceIssues: ComplianceIssue[];
}

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

export function createMonthlyReportCsvFileName(
  monthLabel: string,
): string {
  return createMonthlyReportExportFileName(
    monthLabel,
    "csv",
  );
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
    createRow([monthlyReportLabels.title]),
  );
  rows.push(
    createRow([
      monthlyReportLabels.fields.month,
      monthLabel,
    ]),
  );
  rows.push(
    createRow([
      monthlyReportLabels.fields.federalState,
      profile.federalState,
    ]),
  );
  rows.push(
    createRow([
      monthlyReportLabels.fields.weeklyHours,
      `${formatNumber(profile.weeklyHours)} h`,
    ]),
  );
  rows.push(
    createRow([
      monthlyReportLabels.fields.payGroup,
      profile.payGroup,
    ]),
  );
  rows.push(
    createRow([
      monthlyReportLabels.fields.payLevel,
      profile.payLevel,
    ]),
  );
  rows.push("");

  rows.push(
    createRow([
      monthlyReportLabels.sections.workingTime,
    ]),
  );
  rows.push(
    createRow([
      monthlyReportLabels.workingTime.targetHours,
      `${formatNumber(
        monthlyHours.targetHours,
      )} h`,
    ]),
  );
  rows.push(
    createRow([
      monthlyReportLabels.workingTime.actualHours,
      `${formatNumber(
        monthlyHours.actualHours,
      )} h`,
    ]),
  );
  rows.push(
    createRow([
      monthlyReportLabels.workingTime.balance,
      `${formatNumber(
        monthlyHours.balanceHours,
      )} h`,
    ]),
  );
  rows.push(
    createRow([
      monthlyReportLabels.workingTime.overtime,
      `${formatNumber(
        monthlyHours.overtimeHours,
      )} h`,
    ]),
  );
  rows.push(
    createRow([
      monthlyReportLabels.workingTime.undertime,
      `${formatNumber(
        monthlyHours.undertimeHours,
      )} h`,
    ]),
  );
  rows.push(
    createRow([
      monthlyReportLabels.workingTime.workingDays,
      monthlyHours.workingDayCount,
    ]),
  );
  rows.push(
    createRow([
      monthlyReportLabels.workingTime.holidays,
      monthlyHours.publicHolidayCount,
    ]),
  );
  rows.push(
    createRow([
      monthlyReportLabels.workingTime
        .holidayReduction,
      `${formatNumber(
        monthlyHours.holidayReductionHours,
      )} h`,
    ]),
  );
  rows.push(
    createRow([
      monthlyReportLabels.workingTime
        .averageDailyHours,
      `${formatNumber(
        monthlyHours.averageDailyHours,
      )} h`,
    ]),
  );
  rows.push("");

  rows.push(
    createRow([
      monthlyReportLabels.sections.planning,
    ]),
  );
  rows.push(
    createRow([
      monthlyReportLabels.planning.workShifts,
      monthlyHours.workShiftCount,
    ]),
  );
  rows.push(
    createRow([
      monthlyReportLabels.planning
        .planningEntries,
      monthlyHours.planningEntryCount,
    ]),
  );
  rows.push(
    createRow([
      monthlyReportLabels.planning.plannedDays,
      monthlyHours.plannedDayCount,
    ]),
  );
  rows.push(
    createRow([
      monthlyReportLabels.planning
        .calendarEntries,
      monthlyHours.calendarEntryCount,
    ]),
  );
  rows.push(
    createRow([
      monthlyReportLabels.planning.vacationDays,
      monthlyHours.vacationDayCount,
    ]),
  );
  rows.push(
    createRow([
      monthlyReportLabels.planning.sickDays,
      monthlyHours.sickDayCount,
    ]),
  );
  rows.push(
    createRow([
      monthlyReportLabels.planning
        .vacationHours,
      `${formatNumber(
        monthlyHours.vacationHours,
      )} h`,
    ]),
  );
  rows.push(
    createRow([
      monthlyReportLabels.planning.sickHours,
      `${formatNumber(
        monthlyHours.sickHours,
      )} h`,
    ]),
  );
  rows.push(
    createRow([
      monthlyReportLabels.planning.absenceHours,
      `${formatNumber(
        monthlyHours.absenceHours,
      )} h`,
    ]),
  );
  rows.push(
    createRow([
      monthlyReportLabels.planning
        .trainingDays,
      monthlyHours.trainingDayCount,
    ]),
  );
  rows.push(
    createRow([
      monthlyReportLabels.planning.freeDays,
      monthlyHours.freeDayCount,
    ]),
  );
  rows.push(
    createRow([
      monthlyReportLabels.planning
        .complianceRelevantEntries,
      monthlyHours.complianceRelevantShiftCount,
    ]),
  );
  rows.push("");

  rows.push(
    createRow([
      monthlyReportLabels.sections.premiums,
    ]),
  );

  if (monthlyPremiums.lines.length === 0) {
    rows.push(
      createRow([
        monthlyReportLabels.emptyStates.premiums,
      ]),
    );
  } else {
    rows.push(
      createRow([
        ...monthlyReportLabels.tables.premiums,
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
        monthlyReportLabels.totals.premiums,
        "",
        "",
        formatEuro(
          monthlyPremiums.totalAmount,
        ),
      ]),
    );
  }

  rows.push("");

  rows.push(
    createRow([
      monthlyReportLabels.sections.compliance,
    ]),
  );

  if (complianceIssues.length === 0) {
    rows.push(
      createRow([
        monthlyReportLabels.emptyStates.compliance,
      ]),
    );
  } else {
    rows.push(
      createRow([
        ...monthlyReportLabels.tables.compliance,
      ]),
    );

    for (const issue of complianceIssues) {
      rows.push(
        createRow([
          monthlyReportSeverityLabels[
            issue.severity
          ],
          issue.title,
          issue.description,
        ]),
      );
    }
  }

  rows.push("");

  rows.push(
    createRow([
      monthlyReportLabels.sections
        .calendarEntries,
    ]),
  );
  rows.push(
    createRow([
      ...monthlyReportLabels.tables
        .calendarEntries,
    ]),
  );

  if (shifts.length === 0) {
    rows.push(
      createRow([
        monthlyReportLabels.emptyStates
          .calendarEntries,
      ]),
    );
  } else {
    for (const shift of shifts) {
      rows.push(
        createRow([
          formatDateGerman(shift.date),
          monthlyReportShiftLabels[shift.type],
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
