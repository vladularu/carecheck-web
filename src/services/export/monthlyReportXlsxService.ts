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
import { createMonthlyReportExportFileName } from "./monthlyReportExportMetadata";
import {
  monthlyReportLabels,
  monthlyReportSeverityLabels,
  monthlyReportShiftLabels,
} from "./monthlyReportLabels";

export interface MonthlyReportXlsxInput {
  monthLabel: string;
  profile: UserProfile;
  shifts: Shift[];
  monthlyHours: MonthlyHoursResult;
  monthlyPremiums: MonthlyPremiumResult;
  complianceIssues: ComplianceIssue[];
}

export function createMonthlyReportXlsxFileName(
  monthLabel: string,
): string {
  return createMonthlyReportExportFileName(
    monthLabel,
    "xlsx",
  );
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
    [monthlyReportLabels.title],
    [],
    [
      monthlyReportLabels.fields.month,
      monthLabel,
    ],
    [
      monthlyReportLabels.fields.federalState,
      profile.federalState,
    ],
    [
      monthlyReportLabels.fields.weeklyHours,
      `${profile.weeklyHours} h`,
    ],
    [
      monthlyReportLabels.fields.payGroup,
      profile.payGroup,
    ],
    [
      monthlyReportLabels.fields.payLevel,
      profile.payLevel,
    ],
    [],
    [monthlyReportLabels.sections.workingTime],
    [
      monthlyReportLabels.workingTime.targetHours,
      monthlyHours.targetHours,
    ],
    [
      monthlyReportLabels.workingTime.actualHours,
      monthlyHours.actualHours,
    ],
    [
      monthlyReportLabels.workingTime.balance,
      monthlyHours.balanceHours,
    ],
    [
      monthlyReportLabels.workingTime.overtime,
      monthlyHours.overtimeHours,
    ],
    [
      monthlyReportLabels.workingTime.undertime,
      monthlyHours.undertimeHours,
    ],
    [
      monthlyReportLabels.workingTime.workingDays,
      monthlyHours.workingDayCount,
    ],
    [
      monthlyReportLabels.workingTime.holidays,
      monthlyHours.publicHolidayCount,
    ],
    [
      monthlyReportLabels.workingTime
        .holidayReduction,
      monthlyHours.holidayReductionHours,
    ],
    [
      monthlyReportLabels.workingTime
        .averageDailyHours,
      monthlyHours.averageDailyHours,
    ],
    [],
    [monthlyReportLabels.sections.planning],
    [
      monthlyReportLabels.planning.workShifts,
      monthlyHours.workShiftCount,
    ],
    [
      monthlyReportLabels.planning
        .planningEntries,
      monthlyHours.planningEntryCount,
    ],
    [
      monthlyReportLabels.planning.plannedDays,
      monthlyHours.plannedDayCount,
    ],
    [
      monthlyReportLabels.planning
        .calendarEntries,
      monthlyHours.calendarEntryCount,
    ],
    [
      monthlyReportLabels.planning.vacationDays,
      monthlyHours.vacationDayCount,
    ],
    [
      monthlyReportLabels.planning.sickDays,
      monthlyHours.sickDayCount,
    ],
    [
      monthlyReportLabels.planning
        .vacationHours,
      monthlyHours.vacationHours,
    ],
    [
      monthlyReportLabels.planning.sickHours,
      monthlyHours.sickHours,
    ],
    [
      monthlyReportLabels.planning.absenceHours,
      monthlyHours.absenceHours,
    ],
    [
      monthlyReportLabels.planning
        .trainingDays,
      monthlyHours.trainingDayCount,
    ],
    [
      monthlyReportLabels.planning.freeDays,
      monthlyHours.freeDayCount,
    ],
    [
      monthlyReportLabels.planning
        .complianceRelevantEntries,
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
    monthlyReportLabels.sections.overview,
  );

  const premiumRows = [
    [...monthlyReportLabels.tables.premiums],
    ...monthlyPremiums.lines.map((line) => [
      line.label,
      line.hours,
      `${line.percentage} %`,
      formatEuro(line.amount),
    ]),
    [],
    [
      monthlyReportLabels.totals.premiums,
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
    monthlyReportLabels.sections.premiums,
  );

  const complianceRows =
    complianceIssues.length === 0
      ? [
          [
            monthlyReportLabels.emptyStates
              .compliance,
          ],
        ]
      : [
          [
            ...monthlyReportLabels.tables
              .compliance,
          ],
          ...complianceIssues.map((issue) => [
            monthlyReportSeverityLabels[
              issue.severity
            ],
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
    monthlyReportLabels.sections.compliance,
  );

  const shiftRows: Array<
    Array<string | number>
  > = [
    [
      ...monthlyReportLabels.tables
        .calendarEntries,
    ],
  ];

  if (shifts.length === 0) {
    shiftRows.push([
      monthlyReportLabels.emptyStates
        .calendarEntries,
    ]);
  } else {
    shiftRows.push(
      ...shifts.map((shift) => [
        formatDateGerman(shift.date),
        monthlyReportShiftLabels[shift.type],
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
    monthlyReportLabels.sections
      .calendarEntries,
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
