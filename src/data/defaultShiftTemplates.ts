import type { ShiftTemplates } from "../types/index";

export const defaultShiftTemplates: ShiftTemplates = {
  EARLY: {
    startTime: "06:00",
    endTime: "14:12",
    breakMinutes: 30,
  },
  LATE: {
    startTime: "13:18",
    endTime: "21:30",
    breakMinutes: 30,
  },
  NIGHT: {
    startTime: "21:00",
    endTime: "07:30",
    breakMinutes: 60,
  },
  DAY: {
    startTime: "08:00",
    endTime: "16:12",
    breakMinutes: 30,
  },
  TRAINING: {
    startTime: "08:00",
    endTime: "16:12",
    breakMinutes: 30,
  },
  VACATION: {
    startTime: "08:00",
    endTime: "16:12",
    breakMinutes: 30,
  },
  SICK: {
    startTime: "08:00",
    endTime: "16:12",
    breakMinutes: 30,
  },
  FREE: {
    startTime: "00:00",
    endTime: "00:00",
    breakMinutes: 0,
  },
  CUSTOM: {
    startTime: "08:00",
    endTime: "16:12",
    breakMinutes: 30,
  },
};