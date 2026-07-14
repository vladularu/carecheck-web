import type {
  ComplianceIssue,
  Shift,
  UserProfile,
} from "../../types/index";
import {
  calculateMonthlyHours,
  filterShiftsByMonth,
  type MonthlyHoursResult,
} from "../calculation/monthlyHoursCalculator";
import {
  calculateMonthlyPremiums,
  type MonthlyPremiumLine,
  type MonthlyPremiumResult,
} from "../calculation/monthlyPremiumCalculator";
import { calculateShiftPremiumHours } from "../calculation/shiftPremiumCalculator";
import { filterWorkShifts } from "../calculation/shiftTypeRules";
import { calculateMonthlyCompliance } from "../compliance/monthlyComplianceService";
import { getTvoedPPremiumHourlyRate } from "../tariff/tvoedPTariffService";

export const yearlyMonthNames = [
  "Januar",
  "Februar",
  "Maerz",
  "April",
  "Mai",
  "Juni",
  "Juli",
  "August",
  "September",
  "Oktober",
  "November",
  "Dezember",
];

export interface YearlyComplianceSummary {
  issueCount: number;
  criticalCount: number;
  warningCount: number;
  infoCount: number;
}

export interface YearlyDistribution {
  nightHours: number;
  nightShiftCount: number;
  weekendShiftCount: number;
  holidayWorkHours: number;
  holidayWorkShiftCount: number;
}

export interface YearlyMonthAnalysis {
  monthIndex: number;
  monthLabel: string;
  monthlyHours: MonthlyHoursResult;
  monthlyPremiums: MonthlyPremiumResult;
  compliance: YearlyComplianceSummary;
  distribution: YearlyDistribution;
  calendarEntryCount: number;
}

export interface YearlyTrendMonth {
  monthIndex: number;
  monthLabel: string;
  value: number;
}

export interface YearlyTrendSummary {
  bestBalanceMonth: YearlyTrendMonth | null;
  weakestBalanceMonth: YearlyTrendMonth | null;
  busiestMonth: YearlyTrendMonth | null;
  strongestNightMonth: YearlyTrendMonth | null;
}

export interface YearlyAnalysisSummary {
  targetHours: number;
  actualHours: number;
  balanceHours: number;
  overtimeHours: number;
  undertimeHours: number;
  workShiftCount: number;
  planningEntryCount: number;
  calendarEntryCount: number;
  vacationDays: number;
  sickDays: number;
  trainingDays: number;
  freeDays: number;
  vacationHours: number;
  sickHours: number;
  absenceHours: number;
  premiumLines: MonthlyPremiumLine[];
  premiumTotalAmount: number | null;
  premiumShiftCount: number;
  compliance: YearlyComplianceSummary;
  distribution: YearlyDistribution;
  monthsWithEntries: number;
  averageMonthlyBalance: number;
}

export interface YearlyAnalysisResult {
  year: number;
  months: YearlyMonthAnalysis[];
  summary: YearlyAnalysisSummary;
  trends: YearlyTrendSummary;
}

function roundToTwoDecimals(value: number): number {
  return Math.round(value * 100) / 100;
}

function createEmptyComplianceSummary(): YearlyComplianceSummary {
  return {
    issueCount: 0,
    criticalCount: 0,
    warningCount: 0,
    infoCount: 0,
  };
}

function summarizeCompliance(
  issues: ComplianceIssue[],
): YearlyComplianceSummary {
  return {
    issueCount: issues.length,
    criticalCount: issues.filter(
      (issue) => issue.severity === "critical",
    ).length,
    warningCount: issues.filter(
      (issue) => issue.severity === "warning",
    ).length,
    infoCount: issues.filter((issue) => issue.severity === "info").length,
  };
}

function mergeCompliance(
  current: YearlyComplianceSummary,
  next: YearlyComplianceSummary,
): YearlyComplianceSummary {
  return {
    issueCount: current.issueCount + next.issueCount,
    criticalCount: current.criticalCount + next.criticalCount,
    warningCount: current.warningCount + next.warningCount,
    infoCount: current.infoCount + next.infoCount,
  };
}

function createEmptyDistribution(): YearlyDistribution {
  return {
    nightHours: 0,
    nightShiftCount: 0,
    weekendShiftCount: 0,
    holidayWorkHours: 0,
    holidayWorkShiftCount: 0,
  };
}

function mergeDistribution(
  current: YearlyDistribution,
  next: YearlyDistribution,
): YearlyDistribution {
  return {
    nightHours: roundToTwoDecimals(current.nightHours + next.nightHours),
    nightShiftCount: current.nightShiftCount + next.nightShiftCount,
    weekendShiftCount: current.weekendShiftCount + next.weekendShiftCount,
    holidayWorkHours: roundToTwoDecimals(
      current.holidayWorkHours + next.holidayWorkHours,
    ),
    holidayWorkShiftCount:
      current.holidayWorkShiftCount + next.holidayWorkShiftCount,
  };
}

function hasWeekendHours(premium: ReturnType<typeof calculateShiftPremiumHours>): boolean {
  return premium.saturdayHours > 0 || premium.sundayHours > 0;
}

function calculateMonthDistribution(
  shifts: Shift[],
  profile: UserProfile,
): YearlyDistribution {
  return filterWorkShifts(shifts).reduce(
    (summary, shift) => {
      const premium = calculateShiftPremiumHours(
        shift,
        profile.federalState,
      );

      return {
        nightHours: roundToTwoDecimals(
          summary.nightHours + premium.nightHours,
        ),
        nightShiftCount:
          summary.nightShiftCount + (premium.nightHours > 0 ? 1 : 0),
        weekendShiftCount:
          summary.weekendShiftCount + (hasWeekendHours(premium) ? 1 : 0),
        holidayWorkHours: roundToTwoDecimals(
          summary.holidayWorkHours + premium.holidayHours,
        ),
        holidayWorkShiftCount:
          summary.holidayWorkShiftCount +
          (premium.holidayHours > 0 ? 1 : 0),
      };
    },
    createEmptyDistribution(),
  );
}

function mergePremiumLines(
  current: Map<string, MonthlyPremiumLine>,
  lines: MonthlyPremiumLine[],
): Map<string, MonthlyPremiumLine> {
  const next = new Map(current);

  for (const line of lines) {
    const existing = next.get(line.key);

    if (!existing) {
      next.set(line.key, {
        ...line,
      });
      continue;
    }

    next.set(line.key, {
      ...existing,
      hours: roundToTwoDecimals(existing.hours + line.hours),
      amount:
        existing.amount === null || line.amount === null
          ? null
          : roundToTwoDecimals(existing.amount + line.amount),
    });
  }

  return next;
}

function createTrend(
  months: YearlyMonthAnalysis[],
  selector: (month: YearlyMonthAnalysis) => number,
  mode: "min" | "max",
): YearlyTrendMonth | null {
  const monthsWithEntries = months.filter(
    (month) => month.calendarEntryCount > 0,
  );

  if (monthsWithEntries.length === 0) {
    return null;
  }

  const selected = monthsWithEntries.reduce((current, next) => {
    if (mode === "max") {
      return selector(next) > selector(current) ? next : current;
    }

    return selector(next) < selector(current) ? next : current;
  });

  return {
    monthIndex: selected.monthIndex,
    monthLabel: selected.monthLabel,
    value: selector(selected),
  };
}

export function calculateYearlyAnalysis(
  shifts: Shift[],
  profile: UserProfile,
  year: number,
): YearlyAnalysisResult {
  const premiumHourlyRate = getTvoedPPremiumHourlyRate(profile.payGroup);
  let premiumLineMap = new Map<string, MonthlyPremiumLine>();

  const months = yearlyMonthNames.map((monthName, monthIndex) => {
    const monthLabel = `${monthName} ${year}`;
    const shiftsInMonth = filterShiftsByMonth(shifts, year, monthIndex);
    const monthlyHours = calculateMonthlyHours(
      shifts,
      profile,
      year,
      monthIndex,
    );
    const monthlyPremiums = calculateMonthlyPremiums(
      shifts,
      year,
      monthIndex,
      {
        federalState: profile.federalState,
        baseHourlyRate: premiumHourlyRate,
        holidayMode: "WITH_TIME_OFF",
      },
    );
    const compliance = summarizeCompliance(
      calculateMonthlyCompliance(shifts, year, monthIndex).issues,
    );
    const distribution = calculateMonthDistribution(shiftsInMonth, profile);

    premiumLineMap = mergePremiumLines(premiumLineMap, monthlyPremiums.lines);

    return {
      monthIndex,
      monthLabel,
      monthlyHours,
      monthlyPremiums,
      compliance,
      distribution,
      calendarEntryCount: shiftsInMonth.length,
    };
  });

  const summaryBase = months.reduce(
    (summary, month) => {
      const monthlyHours = month.monthlyHours;

      return {
        ...summary,
        targetHours: roundToTwoDecimals(
          summary.targetHours + monthlyHours.targetHours,
        ),
        actualHours: roundToTwoDecimals(
          summary.actualHours + monthlyHours.actualHours,
        ),
        overtimeHours: roundToTwoDecimals(
          summary.overtimeHours + monthlyHours.overtimeHours,
        ),
        undertimeHours: roundToTwoDecimals(
          summary.undertimeHours + monthlyHours.undertimeHours,
        ),
        workShiftCount: summary.workShiftCount + monthlyHours.workShiftCount,
        planningEntryCount:
          summary.planningEntryCount + monthlyHours.planningEntryCount,
        calendarEntryCount:
          summary.calendarEntryCount + monthlyHours.calendarEntryCount,
        vacationDays: summary.vacationDays + monthlyHours.vacationDayCount,
        sickDays: summary.sickDays + monthlyHours.sickDayCount,
        trainingDays: summary.trainingDays + monthlyHours.trainingDayCount,
        freeDays: summary.freeDays + monthlyHours.freeDayCount,
        vacationHours: roundToTwoDecimals(
          summary.vacationHours + monthlyHours.vacationHours,
        ),
        sickHours: roundToTwoDecimals(
          summary.sickHours + monthlyHours.sickHours,
        ),
        absenceHours: roundToTwoDecimals(
          summary.absenceHours + monthlyHours.absenceHours,
        ),
        premiumShiftCount:
          summary.premiumShiftCount +
          month.monthlyPremiums.shiftCountWithPremiums,
        compliance: mergeCompliance(summary.compliance, month.compliance),
        distribution: mergeDistribution(
          summary.distribution,
          month.distribution,
        ),
      };
    },
    {
      targetHours: 0,
      actualHours: 0,
      overtimeHours: 0,
      undertimeHours: 0,
      workShiftCount: 0,
      planningEntryCount: 0,
      calendarEntryCount: 0,
      vacationDays: 0,
      sickDays: 0,
      trainingDays: 0,
      freeDays: 0,
      vacationHours: 0,
      sickHours: 0,
      absenceHours: 0,
      premiumShiftCount: 0,
      compliance: createEmptyComplianceSummary(),
      distribution: createEmptyDistribution(),
    },
  );

  const premiumLines = Array.from(premiumLineMap.values());
  const hasPremiumAmounts = premiumLines.some((line) => line.amount !== null);
  const premiumTotalAmount = hasPremiumAmounts
    ? roundToTwoDecimals(
        premiumLines.reduce((sum, line) => sum + (line.amount ?? 0), 0),
      )
    : null;
  const monthsWithEntries = months.filter(
    (month) => month.calendarEntryCount > 0,
  ).length;

  const summary: YearlyAnalysisSummary = {
    ...summaryBase,
    balanceHours: roundToTwoDecimals(
      summaryBase.actualHours - summaryBase.targetHours,
    ),
    premiumLines,
    premiumTotalAmount,
    monthsWithEntries,
    averageMonthlyBalance: roundToTwoDecimals(
      (summaryBase.actualHours - summaryBase.targetHours) / 12,
    ),
  };

  return {
    year,
    months,
    summary,
    trends: {
      bestBalanceMonth: createTrend(
        months,
        (month) => month.monthlyHours.balanceHours,
        "max",
      ),
      weakestBalanceMonth: createTrend(
        months,
        (month) => month.monthlyHours.balanceHours,
        "min",
      ),
      busiestMonth: createTrend(
        months,
        (month) => month.monthlyHours.actualHours,
        "max",
      ),
      strongestNightMonth: createTrend(
        months,
        (month) => month.distribution.nightHours,
        "max",
      ),
    },
  };
}
