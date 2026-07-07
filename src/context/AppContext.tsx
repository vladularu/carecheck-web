import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Shift, UserProfile } from "../types/index";
import { demoProfile } from "../data/demoData";
import { loadProfile, saveProfile } from "../services/storage/profileStorage";
import { loadShifts, saveShifts } from "../services/storage/shiftStorage";

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

  const [selectedYear, setSelectedYear] = useState(today.getFullYear());
  const [selectedMonth, setSelectedMonthState] = useState(today.getMonth());

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
    setSelectedMonthState((currentMonth) => {
      if (currentMonth === 0) {
        setSelectedYear((currentYear) => currentYear - 1);
        return 11;
      }

      return currentMonth - 1;
    });
  }

  function nextMonth() {
    setSelectedMonthState((currentMonth) => {
      if (currentMonth === 11) {
        setSelectedYear((currentYear) => currentYear + 1);
        return 0;
      }

      return currentMonth + 1;
    });
  }

  function setSelectedMonth(year: number, month: number) {
    setSelectedYear(year);
    setSelectedMonthState(month);
  }

  const value = useMemo(
    () => ({
      profile,
      shifts,
      selectedYear,
      selectedMonth,
      setProfile,
      addShift,
      deleteShift,
      previousMonth,
      nextMonth,
      setSelectedMonth,
    }),
    [profile, shifts, selectedYear, selectedMonth],
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