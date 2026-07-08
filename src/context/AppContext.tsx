import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Shift, UserProfile } from "../types/index";
import { demoProfile } from "../data/demoData";
import { loadProfile, saveProfile } from "../services/storage/profileStorage";
import { loadShifts, saveShifts } from "../services/storage/shiftStorage";

interface SelectedMonth {
  year: number;
  month: number;
}

interface AppContextValue {
  profile: UserProfile;
  shifts: Shift[];

  selectedYear: number;
  selectedMonth: number;

  setProfile: (profile: UserProfile) => void;
  addShift: (shift: Shift) => void;
  deleteShift: (id: string) => void;

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

  function setProfile(profile: UserProfile) {
    setProfileState(profile);
  }

  function addShift(shift: Shift) {
    setShifts((current) =>
      [...current, shift].sort((a, b) =>
        `${a.date}${a.startTime}`.localeCompare(`${b.date}${b.startTime}`),
      ),
    );
  }

  function deleteShift(id: string) {
    setShifts((current) => current.filter((shift) => shift.id !== id));
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
      selectedYear: selectedMonthState.year,
      selectedMonth: selectedMonthState.month,
      setProfile,
      addShift,
      deleteShift,
      previousMonth,
      nextMonth,
      setSelectedMonth,
    }),
    [profile, shifts, selectedMonthState],
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