import type { Shift, ShiftType } from "../../types/index";

export interface ShiftTypeRule {
  countsAsShift: boolean;
  countsAsPlanningDay: boolean;
  countsAsHours: boolean;
  complianceRelevant: boolean;
}

export const shiftTypeRules: Record<ShiftType, ShiftTypeRule> = {
  EARLY: {
    countsAsShift: true,
    countsAsPlanningDay: true,
    countsAsHours: true,
    complianceRelevant: true,
  },

  LATE: {
    countsAsShift: true,
    countsAsPlanningDay: true,
    countsAsHours: true,
    complianceRelevant: true,
  },

  NIGHT: {
    countsAsShift: true,
    countsAsPlanningDay: true,
    countsAsHours: true,
    complianceRelevant: true,
  },

  DAY: {
    countsAsShift: true,
    countsAsPlanningDay: true,
    countsAsHours: true,
    complianceRelevant: true,
  },

  TRAINING: {
    countsAsShift: true,
    countsAsPlanningDay: true,
    countsAsHours: true,
    complianceRelevant: true,
  },

  VACATION: {
    countsAsShift: true,
    countsAsPlanningDay: true,
    countsAsHours: true,
    complianceRelevant: false,
  },

  SICK: {
    countsAsShift: true,
    countsAsPlanningDay: true,
    countsAsHours: true,
    complianceRelevant: false,
  },

  FREE: {
    countsAsShift: false,
    countsAsPlanningDay: false,
    countsAsHours: false,
    complianceRelevant: false,
  },

  CUSTOM: {
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