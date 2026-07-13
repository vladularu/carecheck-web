import { useEffect, useState } from "react";
import type {
  Shift,
  ShiftTemplate,
  ShiftTemplates,
  ShiftType,
  UserProfile,
} from "../types/index";
import { demoProfile } from "../data/demoData";
import { defaultShiftTemplates } from "../data/defaultShiftTemplates";
import {
  calculateDailyTargetHours,
  calculateNetHours,
} from "../services/calculation/workingTimeCalculator";
import { loadProfile, saveProfile } from "../services/storage/profileStorage";
import { loadShifts, saveShifts } from "../services/storage/shiftStorage";
import {
  loadShiftTemplates,
  saveShiftTemplates,
} from "../services/storage/shiftTemplateStorage";
import { AppContext, type AppContextValue } from "./appContextValue";

interface SelectedMonth {
  year: number;
  month: number;
}

const plannedShiftTypes = new Set<ShiftType>([
  "EARLY",
  "LATE",
  "NIGHT",
  "DAY",
  "TRAINING",
  "CUSTOM",
]);

function isPlannedShift(shift: Shift): boolean {
  return plannedShiftTypes.has(shift.type);
}

function calculateLegacyTimedNetHours(shift: Shift): number {
  return calculateNetHours({
    ...shift,
    type: "CUSTOM",
    creditedHours: undefined,
    hourCreditSource: undefined,
    sourceShiftId: undefined,
  });
}

function hasUsableLegacyTimes(shift: Shift): boolean {
  return (
    shift.startTime !== shift.endTime && calculateLegacyTimedNetHours(shift) > 0
  );
}

function removeHourCredit(shift: Shift): Shift {
  const shiftWithoutCredit = {
    ...shift,
  };

  delete shiftWithoutCredit.creditedHours;
  delete shiftWithoutCredit.hourCreditSource;
  delete shiftWithoutCredit.sourceShiftId;

  return shiftWithoutCredit;
}

function getPlannedCreditHours(shifts: Shift[]): number {
  return shifts.reduce((total, shift) => total + calculateNetHours(shift), 0);
}

function normalizeShiftForProfile(
  shift: Shift,
  profile: UserProfile,
  plannedSourceShifts: Shift[] = [],
): Shift {
  const dailyTargetHours = calculateDailyTargetHours(profile);

  if (shift.type === "FREE") {
    return {
      ...removeHourCredit(shift),
      startTime: "00:00",
      endTime: "00:00",
      breakMinutes: 0,
    };
  }

  if (shift.type === "VACATION") {
    return {
      ...shift,
      startTime: "00:00",
      endTime: "00:00",
      breakMinutes: 0,
      creditedHours: dailyTargetHours,
      hourCreditSource: "DAILY_TARGET",
      sourceShiftId: undefined,
    };
  }

  if (shift.type === "SICK") {
    if (plannedSourceShifts.length > 0) {
      return {
        ...shift,
        startTime: "00:00",
        endTime: "00:00",
        breakMinutes: 0,
        creditedHours: getPlannedCreditHours(plannedSourceShifts),
        hourCreditSource: "PLANNED_SHIFT",
        sourceShiftId: plannedSourceShifts[0]?.id,
      };
    }

    if (
      shift.hourCreditSource === "PLANNED_SHIFT" &&
      typeof shift.creditedHours === "number"
    ) {
      return {
        ...shift,
        startTime: "00:00",
        endTime: "00:00",
        breakMinutes: 0,
      };
    }

    if (shift.hourCreditSource === "DAILY_TARGET") {
      return {
        ...shift,
        startTime: "00:00",
        endTime: "00:00",
        breakMinutes: 0,
        creditedHours: dailyTargetHours,
        sourceShiftId: undefined,
      };
    }

    if (typeof shift.creditedHours === "number") {
      return {
        ...shift,
        startTime: "00:00",
        endTime: "00:00",
        breakMinutes: 0,
        hourCreditSource: shift.sourceShiftId
          ? "PLANNED_SHIFT"
          : "DAILY_TARGET",
      };
    }

    /*
     * Migration alter Krank-Einträge:
     * Waren noch konkrete Zeiten gespeichert,
     * werden deren Netto-Stunden als ursprüngliche
     * Planung übernommen. Ohne nutzbare Zeiten gilt
     * die tägliche Sollarbeitszeit.
     */
    if (hasUsableLegacyTimes(shift)) {
      return {
        ...shift,
        startTime: "00:00",
        endTime: "00:00",
        breakMinutes: 0,
        creditedHours: calculateLegacyTimedNetHours(shift),
        hourCreditSource: "PLANNED_SHIFT",
        sourceShiftId: shift.sourceShiftId,
      };
    }

    return {
      ...shift,
      startTime: "00:00",
      endTime: "00:00",
      breakMinutes: 0,
      creditedHours: dailyTargetHours,
      hourCreditSource: "DAILY_TARGET",
      sourceShiftId: undefined,
    };
  }

  return removeHourCredit(shift);
}

function normalizeLoadedShifts(shifts: Shift[], profile: UserProfile): Shift[] {
  return shifts.map((shift) => normalizeShiftForProfile(shift, profile));
}

function getPlannedShiftsForDate(
  shifts: Shift[],
  date: string,
  excludedShiftId?: string,
): Shift[] {
  return shifts.filter(
    (shift) =>
      shift.id !== excludedShiftId &&
      shift.date === date &&
      isPlannedShift(shift),
  );
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const today = new Date();

  const [profile, setProfileState] = useState<UserProfile>(
    () => loadProfile() ?? demoProfile,
  );

  const [shifts, setShifts] = useState<Shift[]>(() =>
    normalizeLoadedShifts(loadShifts(), profile),
  );

  const [shiftTemplates, setShiftTemplates] = useState<ShiftTemplates>(() =>
    loadShiftTemplates(),
  );

  const [selectedMonthState, setSelectedMonthState] = useState<SelectedMonth>({
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

  function setProfile(nextProfile: UserProfile) {
    setProfileState(nextProfile);

    setShifts((current) =>
      sortShifts(
        current.map((shift) => normalizeShiftForProfile(shift, nextProfile)),
      ),
    );
  }

  function addShift(shift: Shift) {
    setShifts((current) => {
      const plannedSourceShifts =
        shift.type === "SICK"
          ? getPlannedShiftsForDate(current, shift.date)
          : [];

      const normalizedShift = normalizeShiftForProfile(
        shift,
        profile,
        plannedSourceShifts,
      );

      const replacedShiftIds = new Set(
        plannedSourceShifts.map((plannedShift) => plannedShift.id),
      );

      return sortShifts([
        ...current.filter(
          (currentShift) => !replacedShiftIds.has(currentShift.id),
        ),
        normalizedShift,
      ]);
    });
  }

  function updateShift(updatedShift: Shift) {
    setShifts((current) => {
      const previousShift = current.find(
        (shift) => shift.id === updatedShift.id,
      );

      const additionalPlannedShifts =
        updatedShift.type === "SICK"
          ? getPlannedShiftsForDate(current, updatedShift.date, updatedShift.id)
          : [];

      const plannedSourceShifts =
        updatedShift.type === "SICK" &&
        previousShift &&
        isPlannedShift(previousShift)
          ? [previousShift, ...additionalPlannedShifts]
          : additionalPlannedShifts;

      const normalizedShift = normalizeShiftForProfile(
        updatedShift,
        profile,
        plannedSourceShifts,
      );

      const replacedShiftIds = new Set(
        plannedSourceShifts.map((plannedShift) => plannedShift.id),
      );

      return sortShifts(
        current
          .filter(
            (shift) =>
              shift.id === updatedShift.id || !replacedShiftIds.has(shift.id),
          )
          .map((shift) =>
            shift.id === normalizedShift.id ? normalizedShift : shift,
          ),
      );
    });
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

  const value: AppContextValue = {
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
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}