import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type {
  Shift,
  ShiftTemplate,
  ShiftTemplates,
  ShiftType,
  UserProfile,
} from "../types/index";
import { demoProfile } from "../data/demoData";
import { defaultShiftTemplates } from "../data/defaultShiftTemplates";
import { loadProfile, saveProfile } from "../services/storage/profileStorage";
import { loadShifts, saveShifts } from "../services/storage/shiftStorage";
import {
  loadShiftTemplates,
  saveShiftTemplates,
} from "../services/storage/shiftTemplateStorage";

interface SelectedMonth {
  year: number;
  month: number;
}

interface AppContextValue {
  profile: UserProfile;
  shifts: Shift[];
  shiftTemplates: ShiftTemplates;

  selectedYear: number;
  selectedMonth: number;

  setProfile: (profile: UserProfile) => void;
  addShift: (shift: Shift) => void;
  updateShift: (shift: Shift) => void;
  deleteShift: (id: string) => void;

  updateShiftTemplate: (type: ShiftType, template: ShiftTemplate) => void;
  resetShiftTemplates: () => void;

  previousMonth: () => void;
  nextMonth: () => void;
  setSelectedMonth: (year: number, month: number) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const today = new Date();

  const [profile, setProfileState] = useState<UserProfile>(
    () => loadProfile() ?? demoProfile,
  );

  const [shifts, setShifts] = useState<Shift[]>(() => loadShifts());

  const [shiftTemplates, setShiftTemplates] = useState<ShiftTemplates>(() =>
    loadShiftTemplates(),
  );

  const [selectedMonthState, setSelectedMonthState] =
    useState<SelectedMonth>({
      year: today.getFullYear(),
      month: today.getMonth(),
    });

  useEffect(() => {
    saveProfile(profile);
  }, [profile]);

  useEffect(() => {
    saveShifts(shifts);
  }, [shifts]);

  useEffect(() => {
    saveShiftTemplates(shiftTemplates);
  }, [shiftTemplates]);

  function sortShifts(shiftsToSort: Shift[]): Shift[] {
    return [...shiftsToSort].sort((a, b) =>
      `${a.date}${a.startTime}`.localeCompare(`${b.date}${b.startTime}`),
    );
  }

  function setProfile(profile: UserProfile) {
    setProfileState(profile);
  }

  function addShift(shift: Shift) {
    setShifts((current) => sortShifts([...current, shift]));
  }

  function updateShift(updatedShift: Shift) {
    setShifts((current) =>
      sortShifts(
        current.map((shift) =>
          shift.id === updatedShift.id ? updatedShift : shift,
        ),
      ),
    );
  }

  function deleteShift(id: string) {
    setShifts((current) => current.filter((shift) => shift.id !== id));
  }

  function updateShiftTemplate(type: ShiftType, template: ShiftTemplate) {
    setShiftTemplates((current) => ({
      ...current,
      [type]: template,
    }));
  }

  function resetShiftTemplates() {
    setShiftTemplates(defaultShiftTemplates);
  }

  function previousMonth() {
    setSelectedMonthState((current) => {
      if (current.month === 0) {
        return {
          year: current.year - 1,
          month: 11,
        };
      }

      return {
        year: current.year,
        month: current.month - 1,
      };
    });
  }

  function nextMonth() {
    setSelectedMonthState((current) => {
      if (current.month === 11) {
        return {
          year: current.year + 1,
          month: 0,
        };
      }

      return {
        year: current.year,
        month: current.month + 1,
      };
    });
  }

  function setSelectedMonth(year: number, month: number) {
    setSelectedMonthState({
      year,
      month,
    });
  }

  const value = useMemo(
    () => ({
      profile,
      shifts,
      shiftTemplates,
      selectedYear: selectedMonthState.year,
      selectedMonth: selectedMonthState.month,
      setProfile,
      addShift,
      updateShift,
      deleteShift,
      updateShiftTemplate,
      resetShiftTemplates,
      previousMonth,
      nextMonth,
      setSelectedMonth,
    }),
    [profile, shifts, shiftTemplates, selectedMonthState],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const context = useContext(AppContext);

  if (!context) {
    throw new Error("useAppContext muss innerhalb von AppProvider verwendet werden.");
  }

  return context;
}