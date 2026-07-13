import type { Shift, ShiftType } from "../../types/index";

export type ShiftCategory =
  | "WORK"
  | "TRAINING"
  | "VACATION"
  | "SICK"
  | "FREE";

export interface ShiftTypeRule {
  category: ShiftCategory;
  countsAsShift: boolean;
  countsAsPlanningDay: boolean;
  countsAsHours: boolean;
  complianceRelevant: boolean;
}

export const shiftTypeRules: Record<ShiftType, ShiftTypeRule> = {
  EARLY: {
    category: "WORK",
    countsAsShift: true,
    countsAsPlanningDay: true,
    countsAsHours: true,
    complianceRelevant: true,
  },

  LATE: {
    category: "WORK",
    countsAsShift: true,
    countsAsPlanningDay: true,
    countsAsHours: true,
    complianceRelevant: true,
  },

  NIGHT: {
    category: "WORK",
    countsAsShift: true,
    countsAsPlanningDay: true,
    countsAsHours: true,
    complianceRelevant: true,
  },

  DAY: {
    category: "WORK",
    countsAsShift: true,
    countsAsPlanningDay: true,
    countsAsHours: true,
    complianceRelevant: true,
  },

  TRAINING: {
    category: "TRAINING",
    countsAsShift: true,
    countsAsPlanningDay: true,
    countsAsHours: true,
    complianceRelevant: true,
  },

  VACATION: {
    category: "VACATION",
    countsAsShift: true,
    countsAsPlanningDay: true,
    countsAsHours: true,
    complianceRelevant: false,
  },

  SICK: {
    category: "SICK",
    countsAsShift: true,
    countsAsPlanningDay: true,
    countsAsHours: true,
    complianceRelevant: false,
  },

  FREE: {
    category: "FREE",
    countsAsShift: false,
    countsAsPlanningDay: false,
    countsAsHours: false,
    complianceRelevant: false,
  },

  CUSTOM: {
    category: "WORK",
    countsAsShift: true,
    countsAsPlanningDay: true,
    countsAsHours: true,
    complianceRelevant: true,
  },
};

export function getShiftTypeRule(type: ShiftType): ShiftTypeRule {
  return shiftTypeRules[type];
}

export function countsAsShift(shift: Shift): boolean {
  return getShiftTypeRule(shift.type).countsAsShift;
}

export function countsAsPlanningDay(shift: Shift): boolean {
  return getShiftTypeRule(shift.type).countsAsPlanningDay;
}

export function countsAsHours(shift: Shift): boolean {
  return getShiftTypeRule(shift.type).countsAsHours;
}

export function isComplianceRelevant(shift: Shift): boolean {
  return getShiftTypeRule(shift.type).complianceRelevant;
}

export function filterComplianceRelevantShifts(
  shifts: Shift[],
): Shift[] {
  return shifts.filter(isComplianceRelevant);
}

export function hasShiftCategory(
  shift: Shift,
  category: ShiftCategory,
): boolean {
  return getShiftTypeRule(shift.type).category === category;
}

export function isWorkShift(shift: Shift): boolean {
  return hasShiftCategory(shift, "WORK");
}

export function filterWorkShifts(shifts: Shift[]): Shift[] {
  return shifts.filter(isWorkShift);
}