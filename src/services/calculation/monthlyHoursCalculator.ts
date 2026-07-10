import type { Shift, ShiftType, UserProfile } from "../../types/index";
import { getHolidaysForState } from "../holiday/holidayService";
import {
  countsAsPlanningDay,
  countsAsShift,
} from "./shiftTypeRules";
import { calculateTotalNetHours } from "./workingTimeCalculator";

export interface ShiftTypeCount {
  type: ShiftType;
  count: number;
}

export interface MonthlyHoursResult {
  targetHours: number;
  actualHours: number;
  balanceHours: number;
  overtimeHours: number;
  undertimeHours: number;

  /**
   * Anzahl der planungsrelevanten Einträge.
   * FREE wird ausdrücklich nicht mitgezählt.
   */
  shiftCount: number;

  /**
   * Verteilung aller planungsrelevanten Dienstarten.
   * FREE wird ausdrücklich nicht mitgezählt.
   */
  shiftTypeCounts: ShiftTypeCount[];

  /**
   * Tatsächlich belegte planungsrelevante Kalendertage.
   * Mehrere Dienste am selben Tag zählen nur als ein Planungstag.
   */
  plannedDayCount: number;

  /**
   * Reguläre Soll-Arbeitstage des Monats:
   * Montag bis Freitag abzüglich gesetzlicher Feiertage.
   */
  workingDayCount: number;

  publicHolidayCount: number;
  holidayReductionHours: number;
  averageDailyHours: number;
}

export interface MonthlyTargetResult {
  targetHours: number;
  workingDayCount: number;
  publicHolidayCount: number;
  holidayReductionHours: number;
  averageDailyHours: number;
}

function roundToTwoDecimals(value: number): number {
  return Math.round(value * 100) / 100;
}

function formatDateKey(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(
    2,
    "0",
  )}`;
}

function isWeekday(date: Date): boolean {
  const day = date.getDay();

  return day >= 1 && day <= 5;
}

export function calculateMonthlyTargetHours(
  profile: UserProfile,
  year: number,
  monthIndex: number,
): MonthlyTargetResult {
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const averageDailyHours = roundToTwoDecimals(profile.weeklyHours / 5);

  const holidays = getHolidaysForState(year, profile.federalState);
  const holidayDates = new Set(holidays.map((holiday) => holiday.date));

  let weekdayCount = 0;
  let publicHolidayCount = 0;

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, monthIndex, day);
    const dateKey = formatDateKey(year, monthIndex + 1, day);

    if (!isWeekday(date)) {
      continue;
    }

    weekdayCount++;

    if (holidayDates.has(dateKey)) {
      publicHolidayCount++;
    }
  }

  const workingDayCount = weekdayCount - publicHolidayCount;
  const targetHours = roundToTwoDecimals(
    workingDayCount * averageDailyHours,
  );
  const holidayReductionHours = roundToTwoDecimals(
    publicHolidayCount * averageDailyHours,
  );

  return {
    targetHours,
    workingDayCount,
    publicHolidayCount,
    holidayReductionHours,
    averageDailyHours,
  };
}

export function calculateTargetHours(
  profile: UserProfile,
  year: number,
  monthIndex: number,
): number {
  return calculateMonthlyTargetHours(profile, year, monthIndex).targetHours;
}

export function filterShiftsByMonth(
  shifts: Shift[],
  year: number,
  monthIndex: number,
): Shift[] {
  return shifts.filter((shift) => {
    const date = new Date(`${shift.date}T00:00:00`);

    return date.getFullYear() === year && date.getMonth() === monthIndex;
  });
}

export function filterCountedShifts(shifts: Shift[]): Shift[] {
  return shifts.filter(countsAsShift);
}

export function countShiftTypes(shifts: Shift[]): ShiftTypeCount[] {
  const counts = new Map<ShiftType, number>();

  for (const shift of filterCountedShifts(shifts)) {
    counts.set(shift.type, (counts.get(shift.type) ?? 0) + 1);
  }

  return Array.from(counts.entries()).map(([type, count]) => ({
    type,
    count,
  }));
}

export function countPlannedDays(shifts: Shift[]): number {
  const dateKeys = new Set(
    shifts
      .filter(countsAsPlanningDay)
      .map((shift) => shift.date),
  );

  return dateKeys.size;
}

export function calculateMonthlyHours(
  shifts: Shift[],
  profile: UserProfile,
  year: number,
  monthIndex: number,
): MonthlyHoursResult {
  const shiftsInMonth = filterShiftsByMonth(shifts, year, monthIndex);
  const countedShifts = filterCountedShifts(shiftsInMonth);

  const target = calculateMonthlyTargetHours(profile, year, monthIndex);
  const actualHours = calculateTotalNetHours(countedShifts);
  const balanceHours = roundToTwoDecimals(
    actualHours - target.targetHours,
  );

  return {
    targetHours: target.targetHours,
    actualHours,
    balanceHours,
    overtimeHours: Math.max(0, balanceHours),
    undertimeHours: Math.max(
      0,
      roundToTwoDecimals(target.targetHours - actualHours),
    ),

    shiftCount: countedShifts.length,
    shiftTypeCounts: countShiftTypes(countedShifts),
    plannedDayCount: countPlannedDays(countedShifts),

    workingDayCount: target.workingDayCount,
    publicHolidayCount: target.publicHolidayCount,
    holidayReductionHours: target.holidayReductionHours,
    averageDailyHours: target.averageDailyHours,
  };
}