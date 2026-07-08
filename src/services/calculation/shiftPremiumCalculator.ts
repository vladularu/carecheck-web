import type { FederalState, Shift } from "../../types/index";
import { getHolidayByDate } from "../holiday/holidayService";

export interface ShiftPremiumHours {
  shiftId: string;
  grossHours: number;
  netHours: number;

  nightHours: number;
  sundayHours: number;
  holidayHours: number;
  saturdayHours: number;
  saturdayAfternoonHours: number;

  holidayNames: string[];
}

function roundToTwoDecimals(value: number): number {
  return Math.round(value * 100) / 100;
}

function emptyPremium(shiftId: string): ShiftPremiumHours {
  return {
    shiftId,
    grossHours: 0,
    netHours: 0,
    nightHours: 0,
    sundayHours: 0,
    holidayHours: 0,
    saturdayHours: 0,
    saturdayAfternoonHours: 0,
    holidayNames: [],
  };
}

function createDateTime(dateKey: string, time: string): Date {
  const [year, month, day] = dateKey.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);

  return new Date(year, month - 1, day, hour, minute, 0, 0);
}

function getShiftStart(shift: Shift): Date {
  return createDateTime(shift.date, shift.startTime);
}

function getShiftEnd(shift: Shift): Date {
  const start = getShiftStart(shift);
  const end = createDateTime(shift.date, shift.endTime);

  if (end <= start) {
    end.setDate(end.getDate() + 1);
  }

  return end;
}

function formatDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    "0",
  )}-${String(date.getDate()).padStart(2, "0")}`;
}

function minutesOfDay(date: Date): number {
  return date.getHours() * 60 + date.getMinutes();
}

function isNightMinute(date: Date): boolean {
  const minutes = minutesOfDay(date);

  return minutes >= 21 * 60 || minutes < 6 * 60;
}

function isSundayMinute(date: Date): boolean {
  return date.getDay() === 0;
}

function isSaturdayMinute(date: Date): boolean {
  return date.getDay() === 6;
}

function isSaturdayAfternoonMinute(date: Date): boolean {
  const minutes = minutesOfDay(date);

  return date.getDay() === 6 && minutes >= 13 * 60 && minutes < 21 * 60;
}

function minutesToHours(minutes: number): number {
  return roundToTwoDecimals(minutes / 60);
}

function isBreakMinute(
  minuteIndex: number,
  grossMinutes: number,
  breakMinutes: number,
): boolean {
  if (breakMinutes <= 0) {
    return false;
  }

  const safeBreakMinutes = Math.min(breakMinutes, grossMinutes);
  const breakStart = Math.floor((grossMinutes - safeBreakMinutes) / 2);
  const breakEnd = breakStart + safeBreakMinutes;

  return minuteIndex >= breakStart && minuteIndex < breakEnd;
}

export function calculateShiftPremiumHours(
  shift: Shift,
  federalState: FederalState,
): ShiftPremiumHours {
  if (shift.type === "FREE") {
    return emptyPremium(shift.id);
  }

  const start = getShiftStart(shift);
  const end = getShiftEnd(shift);

  const grossMinutes = Math.max(
    0,
    Math.round((end.getTime() - start.getTime()) / 1000 / 60),
  );

  if (grossMinutes <= 0) {
    return emptyPremium(shift.id);
  }

  let workedMinutes = 0;
  let nightMinutes = 0;
  let sundayMinutes = 0;
  let holidayMinutes = 0;
  let saturdayMinutes = 0;
  let saturdayAfternoonMinutes = 0;

  const holidayNames = new Set<string>();
  const holidayCache = new Map<string, string | null>();

  for (let minuteIndex = 0; minuteIndex < grossMinutes; minuteIndex++) {
    if (isBreakMinute(minuteIndex, grossMinutes, shift.breakMinutes)) {
      continue;
    }

    const cursor = new Date(start);
    cursor.setMinutes(start.getMinutes() + minuteIndex);

    const dateKey = formatDateKey(cursor);

    let holidayName = holidayCache.get(dateKey);

    if (holidayName === undefined) {
      holidayName = getHolidayByDate(dateKey, federalState)?.name ?? null;
      holidayCache.set(dateKey, holidayName);
    }

    workedMinutes++;

    if (isNightMinute(cursor)) {
      nightMinutes++;
    }

    if (isSundayMinute(cursor)) {
      sundayMinutes++;
    }

    if (holidayName) {
      holidayMinutes++;
      holidayNames.add(holidayName);
    }

    if (isSaturdayMinute(cursor)) {
      saturdayMinutes++;
    }

    if (isSaturdayAfternoonMinute(cursor)) {
      saturdayAfternoonMinutes++;
    }
  }

  return {
    shiftId: shift.id,
    grossHours: minutesToHours(grossMinutes),
    netHours: minutesToHours(workedMinutes),

    nightHours: minutesToHours(nightMinutes),
    sundayHours: minutesToHours(sundayMinutes),
    holidayHours: minutesToHours(holidayMinutes),
    saturdayHours: minutesToHours(saturdayMinutes),
    saturdayAfternoonHours: minutesToHours(saturdayAfternoonMinutes),

    holidayNames: Array.from(holidayNames),
  };
}