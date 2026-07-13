export type FederalState =
  | "BW"
  | "BY"
  | "BE"
  | "BB"
  | "HB"
  | "HH"
  | "HE"
  | "MV"
  | "NI"
  | "NW"
  | "RP"
  | "SL"
  | "SN"
  | "ST"
  | "SH"
  | "TH";

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
  "P7" | "P8" | "P9" | "P10" | "P11" | "P12" | "P13" | "P14" | "P15" | "P16";

export type PayLevel = 1 | 2 | 3 | 4 | 5 | 6;

export type HourCreditSource = "DAILY_TARGET" | "PLANNED_SHIFT";

export interface UserProfile {
  federalState: FederalState;
  weeklyHours: number;
  payGroup: PayGroup;
  payLevel: PayLevel;
  premiumHourlyRate?: number;
}

export interface ShiftTemplate {
  startTime: string;
  endTime: string;
  breakMinutes: number;
}

export type ShiftTemplates = Record<ShiftType, ShiftTemplate>;

export interface Shift {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  breakMinutes: number;
  type: ShiftType;
  note?: string;

  /**
   * Stunden-Gutschrift für Abwesenheiten.
   *
   * VACATION:
   * klassische tägliche Sollarbeitszeit.
   *
   * SICK:
   * geplante Nettoarbeitszeit oder, falls keine
   * Planung vorhanden war, tägliche Sollarbeitszeit.
   */
  creditedHours?: number;

  /**
   * Herkunft der Stunden-Gutschrift.
   */
  hourCreditSource?: HourCreditSource;

  /**
   * Ursprünglicher Dienst, dessen Nettoarbeitszeit
   * für einen Krank-Eintrag übernommen wurde.
   */
  sourceShiftId?: string;
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