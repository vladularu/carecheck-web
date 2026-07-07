import type { Shift, ShiftType, UserProfile } from "../../types/index";
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
  shiftCount: number;
  shiftTypeCounts: ShiftTypeCount[];
}

function roundToTwoDecimals(value: number): number {
  return Math.round(value * 100) / 100;
}

export function calculateTargetHours(
  profile: UserProfile,
  year: number,
  monthIndex: number,
): number {
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const weeksInMonth = daysInMonth / 7;

  return roundToTwoDecimals(profile.weeklyHours * weeksInMonth);
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

export function countShiftTypes(shifts: Shift[]): ShiftTypeCount[] {
  const counts = new Map<ShiftType, number>();

  for (const shift of shifts) {
    counts.set(shift.type, (counts.get(shift.type) ?? 0) + 1);
  }

  return Array.from(counts.entries()).map(([type, count]) => ({
    type,
    count,
  }));
}

export function calculateMonthlyHours(
  shifts: Shift[],
  profile: UserProfile,
  year: number,
  monthIndex: number,
): MonthlyHoursResult {
  const shiftsInMonth = filterShiftsByMonth(shifts, year, monthIndex);
  const targetHours = calculateTargetHours(profile, year, monthIndex);
  const actualHours = calculateTotalNetHours(shiftsInMonth);
  const balanceHours = roundToTwoDecimals(actualHours - targetHours);

  return {
    targetHours,
    actualHours,
    balanceHours,
    overtimeHours: Math.max(0, balanceHours),
    undertimeHours: Math.max(0, roundToTwoDecimals(targetHours - actualHours)),
    shiftCount: shiftsInMonth.length,
    shiftTypeCounts: countShiftTypes(shiftsInMonth),
  };
}