import type { ShiftPremiumHours } from "./shiftPremiumCalculator";

export type HolidayPremiumMode = "WITH_TIME_OFF" | "WITHOUT_TIME_OFF";

export interface PremiumCalculationOptions {
  baseHourlyRate?: number;
  holidayMode: HolidayPremiumMode;
}

export interface PremiumLine {
  key: string;
  label: string;
  hours: number;
  percentage: number;
  amount: number | null;
}

export interface PremiumCalculationResult {
  lines: PremiumLine[];
  totalAmount: number | null;
}

const PREMIUM_PERCENTAGES = {
  night: 20,
  sunday: 25,
  holidayWithTimeOff: 35,
  holidayWithoutTimeOff: 135,
  saturdayAfternoon: 20,
};

function roundToTwoDecimals(value: number): number {
  return Math.round(value * 100) / 100;
}

function calculateAmount(
  hours: number,
  percentage: number,
  baseHourlyRate?: number,
): number | null {
  if (!baseHourlyRate || baseHourlyRate <= 0) {
    return null;
  }

  return roundToTwoDecimals(hours * baseHourlyRate * (percentage / 100));
}

function createLine(
  key: string,
  label: string,
  hours: number,
  percentage: number,
  baseHourlyRate?: number,
): PremiumLine | null {
  if (hours <= 0) {
    return null;
  }

  return {
    key,
    label,
    hours,
    percentage,
    amount: calculateAmount(hours, percentage, baseHourlyRate),
  };
}

export function calculatePremiumLines(
  premium: ShiftPremiumHours,
  options: PremiumCalculationOptions,
): PremiumCalculationResult {
  const holidayPercentage =
    options.holidayMode === "WITHOUT_TIME_OFF"
      ? PREMIUM_PERCENTAGES.holidayWithoutTimeOff
      : PREMIUM_PERCENTAGES.holidayWithTimeOff;

  const lines = [
    createLine(
      "night",
      "Nacht",
      premium.nightHours,
      PREMIUM_PERCENTAGES.night,
      options.baseHourlyRate,
    ),
    createLine(
      "sunday",
      "Sonntag",
      premium.sundayHours,
      PREMIUM_PERCENTAGES.sunday,
      options.baseHourlyRate,
    ),
    createLine(
      "holiday",
      options.holidayMode === "WITHOUT_TIME_OFF"
        ? "Feiertag ohne Freizeitausgleich"
        : "Feiertag mit Freizeitausgleich",
      premium.holidayHours,
      holidayPercentage,
      options.baseHourlyRate,
    ),
    createLine(
      "saturdayAfternoon",
      "Samstag 13–21",
      premium.saturdayAfternoonHours,
      PREMIUM_PERCENTAGES.saturdayAfternoon,
      options.baseHourlyRate,
    ),
  ].filter((line): line is PremiumLine => line !== null);

  const hasAmount = lines.some((line) => line.amount !== null);

  return {
    lines,
    totalAmount: hasAmount
      ? roundToTwoDecimals(
          lines.reduce((sum, line) => sum + (line.amount ?? 0), 0),
        )
      : null,
  };
}