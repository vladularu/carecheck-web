import type { Shift, UserProfile } from "../../types/index";

export interface WorkingTimeResult {
  shiftId: string;
  grossHours: number;
  netHours: number;
}

function toDateTime(date: string, time: string): Date {
  return new Date(`${date}T${time}:00`);
}

function roundToTwoDecimals(value: number): number {
  return Math.round(value * 100) / 100;
}

function isZeroHourShift(shift: Shift): boolean {
  return shift.type === "FREE";
}

function isCreditedAbsence(shift: Shift): boolean {
  return shift.type === "VACATION" || shift.type === "SICK";
}

function getAbsenceCredit(
  shift: Shift,
  fallbackAbsenceHours?: number,
): number | null {
  if (!isCreditedAbsence(shift)) {
    return null;
  }

  const hasFallback =
    typeof fallbackAbsenceHours === "number" &&
    Number.isFinite(fallbackAbsenceHours);

  /*
   * Urlaub richtet sich immer nach der aktuell
   * gültigen täglichen Sollarbeitszeit. Dasselbe
   * gilt für Krank-Einträge, deren Gutschrift aus
   * der täglichen Sollarbeitszeit stammt.
   */
  if (
    hasFallback &&
    (shift.type === "VACATION" || shift.hourCreditSource === "DAILY_TARGET")
  ) {
    return roundToTwoDecimals(Math.max(0, fallbackAbsenceHours));
  }

  if (
    typeof shift.creditedHours === "number" &&
    Number.isFinite(shift.creditedHours)
  ) {
    return roundToTwoDecimals(Math.max(0, shift.creditedHours));
  }

  if (hasFallback) {
    return roundToTwoDecimals(Math.max(0, fallbackAbsenceHours));
  }

  /*
   * Abwesenheiten ohne gespeicherte Gutschrift und
   * ohne Profil-Fallback dürfen nicht aus neutralen
   * 00:00-Zeitwerten als 24-Stunden-Dienst berechnet
   * werden. Der AppContext normalisiert Altbestände.
   */
  return 0;
}

export function calculateDailyTargetHours(profile: UserProfile): number {
  return roundToTwoDecimals(profile.weeklyHours / 5);
}

export function calculateGrossHours(
  shift: Shift,
  fallbackAbsenceHours?: number,
): number {
  if (isZeroHourShift(shift)) {
    return 0;
  }

  const absenceCredit = getAbsenceCredit(shift, fallbackAbsenceHours);

  if (absenceCredit !== null) {
    return absenceCredit;
  }

  const start = toDateTime(shift.date, shift.startTime);

  const end = toDateTime(shift.date, shift.endTime);

  if (end <= start) {
    end.setDate(end.getDate() + 1);
  }

  const milliseconds = end.getTime() - start.getTime();

  const hours = milliseconds / 1000 / 60 / 60;

  return roundToTwoDecimals(hours);
}

export function calculateNetHours(
  shift: Shift,
  fallbackAbsenceHours?: number,
): number {
  if (isZeroHourShift(shift)) {
    return 0;
  }

  const absenceCredit = getAbsenceCredit(shift, fallbackAbsenceHours);

  if (absenceCredit !== null) {
    return absenceCredit;
  }

  const grossHours = calculateGrossHours(shift);

  const breakHours = shift.breakMinutes / 60;

  return roundToTwoDecimals(Math.max(0, grossHours - breakHours));
}

export function calculateWorkingTime(
  shift: Shift,
  fallbackAbsenceHours?: number,
): WorkingTimeResult {
  return {
    shiftId: shift.id,
    grossHours: calculateGrossHours(shift, fallbackAbsenceHours),
    netHours: calculateNetHours(shift, fallbackAbsenceHours),
  };
}

export function calculateTotalNetHours(
  shifts: Shift[],
  fallbackAbsenceHours?: number,
): number {
  const total = shifts.reduce(
    (sum, shift) => sum + calculateNetHours(shift, fallbackAbsenceHours),
    0,
  );

  return roundToTwoDecimals(total);
}