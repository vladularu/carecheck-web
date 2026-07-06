export type FederalState =
  | "BW" | "BY" | "BE" | "BB" | "HB" | "HH"
  | "HE" | "MV" | "NI" | "NW" | "RP" | "SL"
  | "SN" | "ST" | "SH" | "TH";

export type ShiftType =
  | "EARLY"
  | "LATE"
  | "NIGHT"
  | "DAY"
  | "TRAINING"
  | "VACATION"
  | "SICK"
  | "FREE"
  | "CUSTOM";

export type PayGroup =
  | "P7" | "P8" | "P9" | "P10" | "P11" | "P12" | "P13" | "P14" | "P15" | "P16";

export type PayLevel = 1 | 2 | 3 | 4 | 5 | 6;

export interface UserProfile {
  federalState: FederalState;
  weeklyHours: number;
  payGroup: PayGroup;
  payLevel: PayLevel;
}

export interface Shift {
  id: string;
  date: string;      // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string;   // HH:mm
  breakMinutes: number;
  type: ShiftType;
  note?: string;
}

export interface ShiftCalculation {
  shiftId: string;
  grossHours: number;
  netHours: number;
  isSunday: boolean;
  isSaturday: boolean;
  isHoliday: boolean;
  nightHours: number;
}

export interface ComplianceIssue {
  id: string;
  severity: "info" | "warning" | "critical";
  title: string;
  description: string;
  relatedShiftId?: string;
}