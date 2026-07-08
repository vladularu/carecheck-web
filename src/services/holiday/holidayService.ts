import type { FederalState } from "../../types/index";

export interface Holiday {
  date: string;
  name: string;
  federalStates: FederalState[] | "ALL";
}

function formatDateKey(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(
    2,
    "0",
  )}`;
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function toDateKey(date: Date): string {
  return formatDateKey(date.getFullYear(), date.getMonth() + 1, date.getDate());
}

function getEasterSunday(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;

  return new Date(year, month - 1, day);
}

export function getHolidaysForYear(year: number): Holiday[] {
  const easterSunday = getEasterSunday(year);

  return [
    {
      date: formatDateKey(year, 1, 1),
      name: "Neujahr",
      federalStates: "ALL",
    },
    {
      date: toDateKey(addDays(easterSunday, -2)),
      name: "Karfreitag",
      federalStates: "ALL",
    },
    {
      date: toDateKey(addDays(easterSunday, 1)),
      name: "Ostermontag",
      federalStates: "ALL",
    },
    {
      date: formatDateKey(year, 5, 1),
      name: "Tag der Arbeit",
      federalStates: "ALL",
    },
    {
      date: toDateKey(addDays(easterSunday, 39)),
      name: "Christi Himmelfahrt",
      federalStates: "ALL",
    },
    {
      date: toDateKey(addDays(easterSunday, 50)),
      name: "Pfingstmontag",
      federalStates: "ALL",
    },
    {
      date: toDateKey(addDays(easterSunday, 60)),
      name: "Fronleichnam",
      federalStates: ["BW", "BY", "HE", "NW", "RP", "SL"],
    },
    {
      date: formatDateKey(year, 10, 3),
      name: "Tag der Deutschen Einheit",
      federalStates: "ALL",
    },
    {
      date: formatDateKey(year, 12, 25),
      name: "1. Weihnachtstag",
      federalStates: "ALL",
    },
    {
      date: formatDateKey(year, 12, 26),
      name: "2. Weihnachtstag",
      federalStates: "ALL",
    },
  ];
}

export function getHolidaysForState(
  year: number,
  federalState: FederalState,
): Holiday[] {
  return getHolidaysForYear(year).filter((holiday) => {
    return (
      holiday.federalStates === "ALL" ||
      holiday.federalStates.includes(federalState)
    );
  });
}

export function getHolidayByDate(
  dateKey: string,
  federalState: FederalState,
): Holiday | null {
  const year = Number(dateKey.slice(0, 4));

  if (!year) {
    return null;
  }

  return (
    getHolidaysForState(year, federalState).find(
      (holiday) => holiday.date === dateKey,
    ) ?? null
  );
}