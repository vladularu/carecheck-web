import type { FederalState, Shift } from "../../types/index";
import {
  calculatePremiumLines,
  type HolidayPremiumMode,
  type PremiumLine,
} from "./premiumAmountCalculator";
import { calculateShiftPremiumHours } from "./shiftPremiumCalculator";
import { filterShiftsByMonth } from "./monthlyHoursCalculator";

export interface MonthlyPremiumLine {
  key: string;
  label: string;
  hours: number;
  percentage: number;
  amount: number | null;
}

export interface MonthlyPremiumResult {
  lines: MonthlyPremiumLine[];
  totalAmount: number | null;
  shiftCountWithPremiums: number;
}

interface MonthlyPremiumOptions {
  federalState: FederalState;
  baseHourlyRate?: number;
  holidayMode: HolidayPremiumMode;
}

function roundToTwoDecimals(value: number): number {
  return Math.round(value * 100) / 100;
}

function mergeLine(
  current: MonthlyPremiumLine | undefined,
  line: PremiumLine,
): MonthlyPremiumLine {
  if (!current) {
    return {
      key: line.key,
      label: line.label,
      hours: line.hours,
      percentage: line.percentage,
      amount: line.amount,
    };
  }

  return {
    ...current,
    hours: roundToTwoDecimals(current.hours + line.hours),
    amount:
      current.amount === null || line.amount === null
        ? null
        : roundToTwoDecimals(current.amount + line.amount),
  };
}

export function calculateMonthlyPremiums(
  shifts: Shift[],
  year: number,
  monthIndex: number,
  options: MonthlyPremiumOptions,
): MonthlyPremiumResult {
  const shiftsInMonth = filterShiftsByMonth(shifts, year, monthIndex);
  const lineMap = new Map<string, MonthlyPremiumLine>();

  let shiftCountWithPremiums = 0;

  for (const shift of shiftsInMonth) {
    const premiumHours = calculateShiftPremiumHours(
      shift,
      options.federalState,
    );

    const premiumResult = calculatePremiumLines(premiumHours, {
      holidayMode: options.holidayMode,
      baseHourlyRate: options.baseHourlyRate,
    });

    if (premiumResult.lines.length > 0) {
      shiftCountWithPremiums++;
    }

    for (const line of premiumResult.lines) {
      lineMap.set(line.key, mergeLine(lineMap.get(line.key), line));
    }
  }

  const lines = Array.from(lineMap.values());

  const hasAmounts = lines.some((line) => line.amount !== null);

  return {
    lines,
    totalAmount: hasAmounts
      ? roundToTwoDecimals(
          lines.reduce((sum, line) => sum + (line.amount ?? 0), 0),
        )
      : null,
    shiftCountWithPremiums,
  };
}