import type {
  ComplianceIssue,
  Shift,
} from "../../types/index";
import { filterShiftsByMonth } from "../calculation/monthlyHoursCalculator";
import { filterComplianceRelevantShifts } from "../calculation/shiftTypeRules";
import { checkCompliance } from "./complianceService";

export interface MonthlyComplianceResult {
  issues: ComplianceIssue[];
  shiftsInSelectedMonth: Shift[];
  complianceRelevantShiftsInSelectedMonth: Shift[];
  complianceWindowShifts: Shift[];
}

function createLocalDate(
  year: number,
  monthIndex: number,
  day: number,
): Date {
  return new Date(
    year,
    monthIndex,
    day,
    0,
    0,
    0,
    0,
  );
}

function formatDateKey(date: Date): string {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function getComplianceWindow(
  year: number,
  monthIndex: number,
): {
  startDateKey: string;
  endDateKey: string;
} {
  const firstDayOfMonth = createLocalDate(
    year,
    monthIndex,
    1,
  );

  const firstDayOfNextMonth = createLocalDate(
    year,
    monthIndex + 1,
    1,
  );

  const windowStart = new Date(
    firstDayOfMonth,
  );

  windowStart.setDate(
    windowStart.getDate() - 8,
  );

  const windowEnd = new Date(
    firstDayOfNextMonth,
  );

  windowEnd.setDate(
    windowEnd.getDate() - 1,
  );

  return {
    startDateKey: formatDateKey(windowStart),
    endDateKey: formatDateKey(windowEnd),
  };
}

function filterShiftsByDateRange(
  shifts: Shift[],
  startDateKey: string,
  endDateKey: string,
): Shift[] {
  return shifts.filter(
    (shift) =>
      shift.date >= startDateKey &&
      shift.date <= endDateKey,
  );
}

function filterIssuesForSelectedMonth(
  issues: ComplianceIssue[],
  shiftsInSelectedMonth: Shift[],
): ComplianceIssue[] {
  const selectedMonthShiftIds = new Set(
    shiftsInSelectedMonth.map(
      (shift) => shift.id,
    ),
  );

  return issues.filter((issue) => {
    if (!issue.relatedShiftId) {
      return false;
    }

    return selectedMonthShiftIds.has(
      issue.relatedShiftId,
    );
  });
}

export function calculateMonthlyCompliance(
  shifts: Shift[],
  year: number,
  monthIndex: number,
): MonthlyComplianceResult {
  const shiftsInSelectedMonth =
    filterShiftsByMonth(
      shifts,
      year,
      monthIndex,
    );

  const complianceRelevantShiftsInSelectedMonth =
    filterComplianceRelevantShifts(
      shiftsInSelectedMonth,
    );

  const {
    startDateKey,
    endDateKey,
  } = getComplianceWindow(
    year,
    monthIndex,
  );

  const complianceWindowShifts =
    filterComplianceRelevantShifts(
      filterShiftsByDateRange(
        shifts,
        startDateKey,
        endDateKey,
      ),
    );

  const windowIssues = checkCompliance(
    complianceWindowShifts,
  );

  const issues =
    filterIssuesForSelectedMonth(
      windowIssues,
      shiftsInSelectedMonth,
    );

  return {
    issues,
    shiftsInSelectedMonth,
    complianceRelevantShiftsInSelectedMonth,
    complianceWindowShifts,
  };
}