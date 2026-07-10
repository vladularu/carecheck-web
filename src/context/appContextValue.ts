import { createContext } from "react";
import type {
  Shift,
  ShiftTemplate,
  ShiftTemplates,
  ShiftType,
  UserProfile,
} from "../types/index";

export interface AppContextValue {
  profile: UserProfile;
  shifts: Shift[];
  shiftTemplates: ShiftTemplates;

  selectedYear: number;
  selectedMonth: number;

  setProfile: (profile: UserProfile) => void;
  addShift: (shift: Shift) => void;
  updateShift: (shift: Shift) => void;
  deleteShift: (id: string) => void;

  updateShiftTemplate: (
    type: ShiftType,
    template: ShiftTemplate,
  ) => void;

  resetShiftTemplates: () => void;

  previousMonth: () => void;
  nextMonth: () => void;
  setSelectedMonth: (year: number, month: number) => void;
}

export const AppContext = createContext<AppContextValue | null>(null);