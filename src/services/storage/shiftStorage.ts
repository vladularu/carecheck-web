import type { Shift } from "../../types/index";

const SHIFT_KEY = "carecheck.shifts";

export function loadShifts(): Shift[] {
  const raw = localStorage.getItem(SHIFT_KEY);

  if (!raw) return [];

  try {
    return JSON.parse(raw) as Shift[];
  } catch {
    return [];
  }
}

export function saveShifts(shifts: Shift[]) {
  localStorage.setItem(SHIFT_KEY, JSON.stringify(shifts));
}