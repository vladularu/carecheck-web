import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Shift, UserProfile } from "../types/index";
import { demoProfile } from "../data/demoData";
import { loadProfile, saveProfile } from "../services/storage/profileStorage";
import { loadShifts, saveShifts } from "../services/storage/shiftStorage";

interface AppContextValue {
  profile: UserProfile;
  shifts: Shift[];
  setProfile: (profile: UserProfile) => void;
  addShift: (shift: Shift) => void;
  deleteShift: (id: string) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfileState] = useState<UserProfile>(
    () => loadProfile() ?? demoProfile,
  );

  const [shifts, setShifts] = useState<Shift[]>(() => loadShifts());

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

  const value = useMemo(
    () => ({
      profile,
      shifts,
      setProfile,
      addShift,
      deleteShift,
    }),
    [profile, shifts],
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