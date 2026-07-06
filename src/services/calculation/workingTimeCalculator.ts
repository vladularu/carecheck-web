import type { Shift } from "../../types/index";

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

export function calculateGrossHours(shift: Shift): number {
  const start = toDateTime(shift.date, shift.startTime);
  const end = toDateTime(shift.date, shift.endTime);

  if (end <= start) {
    end.setDate(end.getDate() + 1);
  }

  const milliseconds = end.getTime() - start.getTime();
  const hours = milliseconds / 1000 / 60 / 60;

  return roundToTwoDecimals(hours);
}

export function calculateNetHours(shift: Shift): number {
  const grossHours = calculateGrossHours(shift);
  const breakHours = shift.breakMinutes / 60;

  return roundToTwoDecimals(Math.max(0, grossHours - breakHours));
}

export function calculateWorkingTime(shift: Shift): WorkingTimeResult {
  return {
    shiftId: shift.id,
    grossHours: calculateGrossHours(shift),
    netHours: calculateNetHours(shift),
  };
}

export function calculateTotalNetHours(shifts: Shift[]): number {
  const total = shifts.reduce((sum, shift) => {
    return sum + calculateNetHours(shift);
  }, 0);

  return roundToTwoDecimals(total);
}