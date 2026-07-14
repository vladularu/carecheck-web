import type { Shift, UserProfile } from "../../types/index";
import { calculateMonthlyHours } from "../calculation/monthlyHoursCalculator";
import { calculateMonthlyPremiums } from "../calculation/monthlyPremiumCalculator";
import { calculateShiftPremiumHours } from "../calculation/shiftPremiumCalculator";
import { filterWorkShifts } from "../calculation/shiftTypeRules";
import { calculateTotalNetHours } from "../calculation/workingTimeCalculator";
import type { HolidayPremiumMode } from "../calculation/premiumAmountCalculator";
import {
  TVOED_P_PREMIUM_PERCENTAGES,
} from "../calculation/premiumAmountCalculator";
import {
  getTvoedPPremiumHourlyRate,
  getTvoedPTariffVersion,
  type TvoedPTariffVersion,
} from "./tvoedPTariffService";

export type TvoedPAssessmentStatus =
  | "detected"
  | "not_detected"
  | "review_required";

export interface TvoedPShiftPatternAssessment {
  status: TvoedPAssessmentStatus;
  label: string;
  evidence: string[];
}

export interface TvoedPWeekendAssessment {
  totalWeekends: number;
  freeWeekends: number;
  workWeekends: number;
  weekendWorkDays: number;
  expectationMet: boolean;
  label: string;
}

export interface TvoedPWorkingTimeAssessment {
  targetHours: number;
  plannedHours: number;
  actualWorkHours: number;
  absenceHours: number;
}

export interface TvoedPModuleResult {
  tariffVersion: TvoedPTariffVersion;
  premiumHourlyRate: number;
  workingTime: TvoedPWorkingTimeAssessment;
  premiumSummary: ReturnType<typeof calculateMonthlyPremiums>;
  shiftWork: TvoedPShiftPatternAssessment;
  alternatingShiftWork: TvoedPShiftPatternAssessment;
  weekendAssessment: TvoedPWeekendAssessment;
  notes: string[];
}

export const TVOED_P_RULESET = {
  id: "tvoed-p-zeitzuschlaege-v1",
  label: "TVoeD-P Zeitzuschlaege",
  nightWindow: "21:00-06:00",
  saturdayWindow: "13:00-21:00",
  premiumPercentages: TVOED_P_PREMIUM_PERCENTAGES,
  conflictRule:
    "Bei tagesbezogenen Zuschlaegen wird je Minute der hoechste Satz gezaehlt; Nacht wird separat addiert.",
};

interface TvoedPModuleOptions {
  holidayMode?: HolidayPremiumMode;
}

function roundToTwoDecimals(value: number): number {
  return Math.round(value * 100) / 100;
}

function getMonthDateKey(year: number, monthIndex: number): string {
  return `${year}-${String(monthIndex + 1).padStart(2, "0")}-01`;
}

function filterShiftsByMonth(
  shifts: Shift[],
  year: number,
  monthIndex: number,
): Shift[] {
  return shifts.filter((shift) => {
    const date = new Date(`${shift.date}T00:00:00`);

    return date.getFullYear() === year && date.getMonth() === monthIndex;
  });
}

function getShiftStartMinutes(shift: Shift): number {
  const [hour, minute] = shift.startTime.split(":").map(Number);

  return hour * 60 + minute;
}

function getShiftWindow(shift: Shift): string {
  const minutes = getShiftStartMinutes(shift);

  if (minutes < 6 * 60 || minutes >= 20 * 60) {
    return "Nacht";
  }

  if (minutes < 11 * 60) {
    return "Frueh";
  }

  if (minutes < 15 * 60) {
    return "Tag";
  }

  return "Spaet";
}

function createPatternAssessment(
  status: TvoedPAssessmentStatus,
  label: string,
  evidence: string[],
): TvoedPShiftPatternAssessment {
  return {
    status,
    label,
    evidence,
  };
}

function assessShiftWork(
  workShifts: Shift[],
): TvoedPShiftPatternAssessment {
  const windows = new Set(workShifts.map(getShiftWindow));
  const startTimes = new Set(workShifts.map((shift) => shift.startTime));

  if (workShifts.length === 0) {
    return createPatternAssessment("not_detected", "Keine Arbeitsdienste", [
      "Im ausgewaehlten Monat liegen keine tariflich bewerteten Arbeitsdienste vor.",
    ]);
  }

  if (workShifts.length >= 4 && windows.size >= 2) {
    return createPatternAssessment("detected", "Schichtarbeit erkennbar", [
      `${workShifts.length} Arbeitsdienste`,
      `${windows.size} Dienstlagen: ${Array.from(windows).join(", ")}`,
      `${startTimes.size} unterschiedliche Startzeiten`,
    ]);
  }

  return createPatternAssessment("review_required", "Schichtmuster pruefen", [
    `${workShifts.length} Arbeitsdienste`,
    `${windows.size} Dienstlagen: ${Array.from(windows).join(", ")}`,
    "Die Monatsdaten reichen fuer eine sichere Einordnung noch nicht aus.",
  ]);
}

function assessAlternatingShiftWork(
  workShifts: Shift[],
  profile: UserProfile,
): TvoedPShiftPatternAssessment {
  const windows = new Set(workShifts.map(getShiftWindow));
  const hasNightWork = workShifts.some(
    (shift) =>
      calculateShiftPremiumHours(shift, profile.federalState)
        .tvoedPremiumHours.nightHours > 0,
  );

  if (workShifts.length === 0) {
    return createPatternAssessment("not_detected", "Keine Wechselschicht", [
      "Keine Arbeitsdienste im ausgewaehlten Monat.",
    ]);
  }

  if (hasNightWork && windows.size >= 3 && workShifts.length >= 4) {
    return createPatternAssessment(
      "detected",
      "Wechselschicht-Indiz erkennbar",
      [
        "Nachtarbeit vorhanden",
        `${windows.size} Dienstlagen im Monat`,
        "Bitte betriebliche Regelmaessigkeit separat bestaetigen.",
      ],
    );
  }

  if (hasNightWork && windows.size >= 2) {
    return createPatternAssessment(
      "review_required",
      "Wechselschicht moeglich",
      [
        "Nachtarbeit vorhanden",
        `${windows.size} Dienstlagen im Monat`,
        "Regelmaessiger Wechsel ist aus Monatsdaten allein nicht sicher ableitbar.",
      ],
    );
  }

  return createPatternAssessment("not_detected", "Keine Wechselschicht", [
    "Keine Nachtarbeit im tariflichen Nachtfenster erkannt.",
  ]);
}

function getWeekendKey(date: Date): string {
  const saturday = new Date(date);
  const day = saturday.getDay();

  if (day === 0) {
    saturday.setDate(saturday.getDate() - 1);
  }

  return `${saturday.getFullYear()}-${String(
    saturday.getMonth() + 1,
  ).padStart(2, "0")}-${String(saturday.getDate()).padStart(2, "0")}`;
}

function assessWeekends(
  workShifts: Shift[],
  year: number,
  monthIndex: number,
): TvoedPWeekendAssessment {
  const totalWeekends = new Set<string>();
  const workWeekends = new Set<string>();
  const weekendWorkDays = new Set<string>();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, monthIndex, day);

    if (date.getDay() === 0 || date.getDay() === 6) {
      totalWeekends.add(getWeekendKey(date));
    }
  }

  for (const shift of workShifts) {
    const date = new Date(`${shift.date}T00:00:00`);

    if (date.getDay() === 0 || date.getDay() === 6) {
      workWeekends.add(getWeekendKey(date));
      weekendWorkDays.add(shift.date);
    }
  }

  const freeWeekends = totalWeekends.size - workWeekends.size;
  const expectationMet = freeWeekends >= Math.floor(totalWeekends.size / 2);

  return {
    totalWeekends: totalWeekends.size,
    freeWeekends,
    workWeekends: workWeekends.size,
    weekendWorkDays: weekendWorkDays.size,
    expectationMet,
    label: expectationMet
      ? "Mindestens jedes zweite Wochenende frei"
      : "Wochenendfolge pruefen",
  };
}

export function calculateTvoedPModule(
  shifts: Shift[],
  profile: UserProfile,
  year: number,
  monthIndex: number,
  options: TvoedPModuleOptions = {},
): TvoedPModuleResult {
  const monthDateKey = getMonthDateKey(year, monthIndex);
  const shiftsInMonth = filterShiftsByMonth(shifts, year, monthIndex);
  const workShifts = filterWorkShifts(shiftsInMonth);
  const monthlyHours = calculateMonthlyHours(
    shifts,
    profile,
    year,
    monthIndex,
  );
  const premiumHourlyRate = getTvoedPPremiumHourlyRate(
    profile.payGroup,
    monthDateKey,
  );
  const premiumSummary = calculateMonthlyPremiums(
    shifts,
    year,
    monthIndex,
    {
      federalState: profile.federalState,
      baseHourlyRate: premiumHourlyRate,
      holidayMode: options.holidayMode ?? "WITH_TIME_OFF",
    },
  );

  return {
    tariffVersion: getTvoedPTariffVersion(monthDateKey),
    premiumHourlyRate,
    workingTime: {
      targetHours: monthlyHours.targetHours,
      plannedHours: monthlyHours.actualHours,
      actualWorkHours: roundToTwoDecimals(
        calculateTotalNetHours(workShifts, monthlyHours.averageDailyHours),
      ),
      absenceHours: monthlyHours.absenceHours,
    },
    premiumSummary,
    shiftWork: assessShiftWork(workShifts),
    alternatingShiftWork: assessAlternatingShiftWork(workShifts, profile),
    weekendAssessment: assessWeekends(workShifts, year, monthIndex),
    notes: [
      "TVoeD-P-Auswertung ist getrennt von ArbZG-/Compliance-Pruefungen.",
      "Urlaub und Krankheit erzeugen keine tatsaechlichen Zuschlagsstunden.",
      "Schicht- und Wechselschichtstatus ist ein Indikator und ersetzt keine betriebliche Rechtspruefung.",
    ],
  };
}
