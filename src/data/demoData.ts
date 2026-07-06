import type { Shift, UserProfile } from "../types/index";
export const demoProfile: UserProfile = {
  federalState: "HE",
  weeklyHours: 38.5,
  payGroup: "P8",
  payLevel: 4,
};

export const demoShifts: Shift[] = [
  {
    id: "shift-1",
    date: "2026-07-06",
    startTime: "06:00",
    endTime: "14:12",
    breakMinutes: 30,
    type: "EARLY",
    note: "Frühdienst",
  },
  {
    id: "shift-2",
    date: "2026-07-07",
    startTime: "12:00",
    endTime: "20:12",
    breakMinutes: 30,
    type: "LATE",
    note: "Spätdienst",
  },
  {
    id: "shift-3",
    date: "2026-07-08",
    startTime: "20:00",
    endTime: "06:12",
    breakMinutes: 45,
    type: "NIGHT",
    note: "Nachtdienst",
  },
];