import type {
  Shift,
  UserProfile,
} from "../../types/index";
import {
  calculateMonthlyHours,
  filterShiftsByMonth,
} from "../calculation/monthlyHoursCalculator";
import { calculateShiftPremiumHours } from "../calculation/shiftPremiumCalculator";
import { filterWorkShifts } from "../calculation/shiftTypeRules";
import { calculateTotalNetHours } from "../calculation/workingTimeCalculator";

export type FairnessMemberSource =
  | "current-user"
  | "manual";

export type FairnessDeviationStatus =
  | "balanced"
  | "above-share"
  | "below-share"
  | "no-team-data";

export type WeekendFairnessStatus =
  | "ok"
  | "review"
  | "critical";

export interface FairnessMemberInput {
  id: string;
  name: string;
  weeklyHours: number;
  workHours: number;
  workShiftCount: number;
  nightShiftCount: number;
  weekendShiftCount: number;
  workedWeekendCount: number;
  holidayWorkShiftCount: number;
  maxConsecutiveWorkedWeekends: number;
  source: FairnessMemberSource;
}

export type FairnessMetricKey =
  | "workHours"
  | "workShiftCount"
  | "nightShiftCount"
  | "weekendShiftCount"
  | "workedWeekendCount"
  | "holidayWorkShiftCount";

export interface FairnessMetricResult {
  key: FairnessMetricKey;
  label: string;
  actual: number;
  expected: number;
  difference: number;
  tolerance: number;
  status: FairnessDeviationStatus;
}

export interface WeekendFairnessResult {
  workedWeekendCount: number;
  maxAllowedWorkedWeekends: number;
  maxConsecutiveWorkedWeekends: number;
  status: WeekendFairnessStatus;
  message: string;
}

export interface FairnessMemberResult {
  input: FairnessMemberInput;
  employmentShare: number;
  burdenScore: number;
  expectedBurdenScore: number;
  burdenDifference: number;
  metrics: FairnessMetricResult[];
  weekendRule: WeekendFairnessResult;
  status: FairnessDeviationStatus;
  notes: string[];
}

export interface FairnessTeamTotals {
  weeklyHours: number;
  workHours: number;
  workShiftCount: number;
  nightShiftCount: number;
  weekendShiftCount: number;
  workedWeekendCount: number;
  holidayWorkShiftCount: number;
  burdenScore: number;
}

export interface FairnessAnalysisResult {
  year: number;
  monthIndex: number;
  teamSize: number;
  monthWeekendCount: number;
  hasTeamComparison: boolean;
  totals: FairnessTeamTotals;
  members: FairnessMemberResult[];
  alerts: string[];
}

interface FairnessAnalysisOptions {
  year: number;
  monthIndex: number;
}

interface WeekendStats {
  workedWeekendCount: number;
  maxConsecutiveWorkedWeekends: number;
}

const metricLabels: Record<
  FairnessMetricKey,
  string
> = {
  workHours: "Arbeitsstunden",
  workShiftCount: "Arbeitsdienste",
  nightShiftCount: "Nachtdienste",
  weekendShiftCount: "Wochenenddienste",
  workedWeekendCount: "Gearbeitete Wochenenden",
  holidayWorkShiftCount: "Feiertagsdienste",
};

const burdenWeights: Record<
  Exclude<
    FairnessMetricKey,
    "workHours" | "workShiftCount"
  >,
  number
> = {
  nightShiftCount: 1.4,
  weekendShiftCount: 1.2,
  workedWeekendCount: 1.2,
  holidayWorkShiftCount: 1.5,
};

function roundToTwoDecimals(
  value: number,
): number {
  return Math.round(value * 100) / 100;
}

function createDateTime(
  dateKey: string,
  time: string,
): Date {
  const [year, month, day] = dateKey
    .split("-")
    .map(Number);

  const [hour, minute] = time
    .split(":")
    .map(Number);

  return new Date(
    year,
    month - 1,
    day,
    hour,
    minute,
  );
}

function getShiftStart(shift: Shift): Date {
  return createDateTime(
    shift.date,
    shift.startTime,
  );
}

function getShiftEnd(shift: Shift): Date {
  const start = getShiftStart(shift);
  const end = createDateTime(
    shift.date,
    shift.endTime,
  );

  if (end <= start) {
    end.setDate(end.getDate() + 1);
  }

  return end;
}

function formatDateKey(date: Date): string {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function startOfDay(date: Date): Date {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  );
}

function addDays(
  date: Date,
  days: number,
): Date {
  const result = new Date(date);

  result.setDate(result.getDate() + days);

  return result;
}

function getWeekendStartDate(
  date: Date,
): Date | null {
  const day = date.getDay();

  if (day === 6) {
    return startOfDay(date);
  }

  if (day === 0) {
    return addDays(startOfDay(date), -1);
  }

  return null;
}

function getWeekendKeysForShift(
  shift: Shift,
): string[] {
  const start = getShiftStart(shift);
  const end = getShiftEnd(shift);
  const weekendKeys = new Set<string>();
  let cursor = startOfDay(start);

  while (cursor < end) {
    const nextDay = addDays(cursor, 1);

    if (start < nextDay && end > cursor) {
      const weekendStart =
        getWeekendStartDate(cursor);

      if (weekendStart) {
        weekendKeys.add(
          formatDateKey(weekendStart),
        );
      }
    }

    cursor = nextDay;
  }

  return Array.from(weekendKeys);
}

function daysBetween(
  firstDate: Date,
  secondDate: Date,
): number {
  return Math.round(
    (secondDate.getTime() -
      firstDate.getTime()) /
      1000 /
      60 /
      60 /
      24,
  );
}

function dateFromDateKey(
  dateKey: string,
): Date {
  const [year, month, day] = dateKey
    .split("-")
    .map(Number);

  return new Date(year, month - 1, day);
}

export function countWeekendsInMonth(
  year: number,
  monthIndex: number,
): number {
  const daysInMonth = new Date(
    year,
    monthIndex + 1,
    0,
  ).getDate();
  const weekendKeys = new Set<string>();

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, monthIndex, day);
    const weekendStart =
      getWeekendStartDate(date);

    if (weekendStart) {
      weekendKeys.add(
        formatDateKey(weekendStart),
      );
    }
  }

  return weekendKeys.size;
}

function calculateWeekendStats(
  shifts: Shift[],
): WeekendStats {
  const weekendKeys = Array.from(
    new Set(
      shifts.flatMap(getWeekendKeysForShift),
    ),
  ).sort();

  if (weekendKeys.length === 0) {
    return {
      workedWeekendCount: 0,
      maxConsecutiveWorkedWeekends: 0,
    };
  }

  let currentStreak = 1;
  let maxStreak = 1;

  for (
    let index = 1;
    index < weekendKeys.length;
    index++
  ) {
    const previousDate = dateFromDateKey(
      weekendKeys[index - 1],
    );
    const currentDate = dateFromDateKey(
      weekendKeys[index],
    );

    if (
      daysBetween(
        previousDate,
        currentDate,
      ) === 7
    ) {
      currentStreak++;
      maxStreak = Math.max(
        maxStreak,
        currentStreak,
      );
    } else {
      currentStreak = 1;
    }
  }

  return {
    workedWeekendCount: weekendKeys.length,
    maxConsecutiveWorkedWeekends: maxStreak,
  };
}

function getMetricValue(
  member: FairnessMemberInput,
  key: FairnessMetricKey,
): number {
  return member[key];
}

function calculateBurdenScore(
  member: Pick<
    FairnessMemberInput,
    | "nightShiftCount"
    | "weekendShiftCount"
    | "workedWeekendCount"
    | "holidayWorkShiftCount"
  >,
): number {
  return roundToTwoDecimals(
    member.nightShiftCount *
      burdenWeights.nightShiftCount +
      member.weekendShiftCount *
        burdenWeights.weekendShiftCount +
      member.workedWeekendCount *
        burdenWeights.workedWeekendCount +
      member.holidayWorkShiftCount *
        burdenWeights.holidayWorkShiftCount,
  );
}

function calculateTotals(
  members: FairnessMemberInput[],
): FairnessTeamTotals {
  const totals = members.reduce(
    (summary, member) => ({
      weeklyHours:
        summary.weeklyHours + member.weeklyHours,
      workHours:
        summary.workHours + member.workHours,
      workShiftCount:
        summary.workShiftCount +
        member.workShiftCount,
      nightShiftCount:
        summary.nightShiftCount +
        member.nightShiftCount,
      weekendShiftCount:
        summary.weekendShiftCount +
        member.weekendShiftCount,
      workedWeekendCount:
        summary.workedWeekendCount +
        member.workedWeekendCount,
      holidayWorkShiftCount:
        summary.holidayWorkShiftCount +
        member.holidayWorkShiftCount,
      burdenScore:
        summary.burdenScore +
        calculateBurdenScore(member),
    }),
    {
      weeklyHours: 0,
      workHours: 0,
      workShiftCount: 0,
      nightShiftCount: 0,
      weekendShiftCount: 0,
      workedWeekendCount: 0,
      holidayWorkShiftCount: 0,
      burdenScore: 0,
    },
  );

  return {
    weeklyHours: roundToTwoDecimals(
      totals.weeklyHours,
    ),
    workHours: roundToTwoDecimals(
      totals.workHours,
    ),
    workShiftCount: totals.workShiftCount,
    nightShiftCount: totals.nightShiftCount,
    weekendShiftCount: totals.weekendShiftCount,
    workedWeekendCount: totals.workedWeekendCount,
    holidayWorkShiftCount:
      totals.holidayWorkShiftCount,
    burdenScore: roundToTwoDecimals(
      totals.burdenScore,
    ),
  };
}

function calculateTolerance(
  key: FairnessMetricKey,
  expected: number,
): number {
  if (key === "workHours") {
    return roundToTwoDecimals(
      Math.max(4, expected * 0.15),
    );
  }

  return roundToTwoDecimals(
    Math.max(1, expected * 0.25),
  );
}

function classifyDeviation(
  actual: number,
  expected: number,
  tolerance: number,
  hasTeamComparison: boolean,
): FairnessDeviationStatus {
  if (!hasTeamComparison) {
    return "no-team-data";
  }

  if (actual > expected + tolerance) {
    return "above-share";
  }

  if (actual < expected - tolerance) {
    return "below-share";
  }

  return "balanced";
}

function createMetricResult(
  member: FairnessMemberInput,
  key: FairnessMetricKey,
  totals: FairnessTeamTotals,
  employmentShare: number,
  hasTeamComparison: boolean,
): FairnessMetricResult {
  const actual = getMetricValue(member, key);
  const expected = roundToTwoDecimals(
    totals[key] * employmentShare,
  );
  const difference = roundToTwoDecimals(
    actual - expected,
  );
  const tolerance = calculateTolerance(
    key,
    expected,
  );

  return {
    key,
    label: metricLabels[key],
    actual: roundToTwoDecimals(actual),
    expected,
    difference,
    tolerance,
    status: classifyDeviation(
      actual,
      expected,
      tolerance,
      hasTeamComparison,
    ),
  };
}

function evaluateWeekendRule(
  member: FairnessMemberInput,
  monthWeekendCount: number,
): WeekendFairnessResult {
  const maxAllowedWorkedWeekends = Math.ceil(
    monthWeekendCount / 2,
  );
  const exceedsWorkedWeekendShare =
    member.workedWeekendCount >
    maxAllowedWorkedWeekends;
  const hasConsecutiveWeekendWork =
    member.maxConsecutiveWorkedWeekends >= 2;

  if (
    exceedsWorkedWeekendShare &&
    hasConsecutiveWeekendWork
  ) {
    return {
      workedWeekendCount:
        member.workedWeekendCount,
      maxAllowedWorkedWeekends,
      maxConsecutiveWorkedWeekends:
        member.maxConsecutiveWorkedWeekends,
      status: "critical",
      message:
        "Mehr als jedes zweite Wochenende und mindestens zwei Wochenenden in Folge gearbeitet.",
    };
  }

  if (exceedsWorkedWeekendShare) {
    return {
      workedWeekendCount:
        member.workedWeekendCount,
      maxAllowedWorkedWeekends,
      maxConsecutiveWorkedWeekends:
        member.maxConsecutiveWorkedWeekends,
      status: "review",
      message:
        "Mehr als jedes zweite Wochenende gearbeitet.",
    };
  }

  if (hasConsecutiveWeekendWork) {
    return {
      workedWeekendCount:
        member.workedWeekendCount,
      maxAllowedWorkedWeekends,
      maxConsecutiveWorkedWeekends:
        member.maxConsecutiveWorkedWeekends,
      status: "review",
      message:
        "Mindestens zwei Wochenenden in Folge gearbeitet.",
    };
  }

  return {
    workedWeekendCount:
      member.workedWeekendCount,
    maxAllowedWorkedWeekends,
    maxConsecutiveWorkedWeekends:
      member.maxConsecutiveWorkedWeekends,
    status: "ok",
    message:
      "Wochenendfolge im Monatsfenster unauffällig.",
  };
}

function createMemberNotes(
  metrics: FairnessMetricResult[],
  weekendRule: WeekendFairnessResult,
): string[] {
  const notes: string[] = [];

  for (const metric of metrics) {
    if (metric.status === "above-share") {
      notes.push(
        `${metric.label} liegt über dem anteiligen Teamwert.`,
      );
    }
  }

  if (weekendRule.status !== "ok") {
    notes.push(weekendRule.message);
  }

  return notes;
}

function createMemberResult(
  member: FairnessMemberInput,
  totals: FairnessTeamTotals,
  monthWeekendCount: number,
  hasTeamComparison: boolean,
): FairnessMemberResult {
  const employmentShare =
    totals.weeklyHours > 0
      ? member.weeklyHours / totals.weeklyHours
      : 0;

  const burdenScore =
    calculateBurdenScore(member);
  const expectedBurdenScore =
    roundToTwoDecimals(
      totals.burdenScore * employmentShare,
    );
  const burdenDifference =
    roundToTwoDecimals(
      burdenScore - expectedBurdenScore,
    );
  const burdenTolerance =
    Math.max(1, expectedBurdenScore * 0.25);

  const metrics = (
    Object.keys(metricLabels) as FairnessMetricKey[]
  ).map((key) =>
    createMetricResult(
      member,
      key,
      totals,
      employmentShare,
      hasTeamComparison,
    ),
  );

  const weekendRule = evaluateWeekendRule(
    member,
    monthWeekendCount,
  );

  const status = classifyDeviation(
    burdenScore,
    expectedBurdenScore,
    burdenTolerance,
    hasTeamComparison,
  );

  return {
    input: member,
    employmentShare: roundToTwoDecimals(
      employmentShare,
    ),
    burdenScore,
    expectedBurdenScore,
    burdenDifference,
    metrics,
    weekendRule,
    status,
    notes: createMemberNotes(
      metrics,
      weekendRule,
    ),
  };
}

function createAlerts(
  members: FairnessMemberResult[],
  hasTeamComparison: boolean,
): string[] {
  if (!hasTeamComparison) {
    return [
      "Teamvergleich benötigt mindestens eine weitere Person mit Monatswerten.",
    ];
  }

  return members.flatMap((member) =>
    member.notes.map(
      (note) => `${member.input.name}: ${note}`,
    ),
  );
}

export function calculateCurrentUserFairnessInput(
  shifts: Shift[],
  profile: UserProfile,
  year: number,
  monthIndex: number,
): FairnessMemberInput {
  const shiftsInMonth = filterShiftsByMonth(
    shifts,
    year,
    monthIndex,
  );
  const workShifts =
    filterWorkShifts(shiftsInMonth);
  const monthlyHours = calculateMonthlyHours(
    shifts,
    profile,
    year,
    monthIndex,
  );

  const premiumSummaries = workShifts.map(
    (shift) =>
      calculateShiftPremiumHours(
        shift,
        profile.federalState,
      ),
  );

  const weekendStats =
    calculateWeekendStats(workShifts);

  return {
    id: "current-user",
    name: "Ich",
    weeklyHours: profile.weeklyHours,
    workHours: calculateTotalNetHours(
      workShifts,
      monthlyHours.averageDailyHours,
    ),
    workShiftCount:
      monthlyHours.workShiftCount,
    nightShiftCount: premiumSummaries.filter(
      (premium) => premium.nightHours > 0,
    ).length,
    weekendShiftCount:
      premiumSummaries.filter(
        (premium) =>
          premium.saturdayHours > 0 ||
          premium.sundayHours > 0,
      ).length,
    workedWeekendCount:
      weekendStats.workedWeekendCount,
    holidayWorkShiftCount:
      premiumSummaries.filter(
        (premium) => premium.holidayHours > 0,
      ).length,
    maxConsecutiveWorkedWeekends:
      weekendStats.maxConsecutiveWorkedWeekends,
    source: "current-user",
  };
}

export function calculateFairnessAnalysis(
  members: FairnessMemberInput[],
  options: FairnessAnalysisOptions,
): FairnessAnalysisResult {
  const normalizedMembers = members.filter(
    (member) =>
      member.weeklyHours > 0 &&
      Number.isFinite(member.weeklyHours),
  );
  const totals = calculateTotals(
    normalizedMembers,
  );
  const monthWeekendCount =
    countWeekendsInMonth(
      options.year,
      options.monthIndex,
    );
  const hasTeamComparison =
    normalizedMembers.length >= 2 &&
    totals.weeklyHours > 0;

  const memberResults =
    normalizedMembers.map((member) =>
      createMemberResult(
        member,
        totals,
        monthWeekendCount,
        hasTeamComparison,
      ),
    );

  return {
    year: options.year,
    monthIndex: options.monthIndex,
    teamSize: normalizedMembers.length,
    monthWeekendCount,
    hasTeamComparison,
    totals,
    members: memberResults,
    alerts: createAlerts(
      memberResults,
      hasTeamComparison,
    ),
  };
}
