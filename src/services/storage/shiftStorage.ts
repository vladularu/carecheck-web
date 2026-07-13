import type {
  HourCreditSource,
  Shift,
  ShiftType,
} from "../../types/index";

const SHIFT_KEY = "carecheck.shifts";

const shiftTypes = new Set<ShiftType>([
  "EARLY",
  "LATE",
  "NIGHT",
  "DAY",
  "TRAINING",
  "VACATION",
  "SICK",
  "FREE",
  "CUSTOM",
]);

const hourCreditSources =
  new Set<HourCreditSource>([
    "DAILY_TARGET",
    "PLANNED_SHIFT",
  ]);

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return Boolean(
    value &&
      typeof value === "object" &&
      !Array.isArray(value),
  );
}

function isDateKey(
  value: unknown,
): value is string {
  if (
    typeof value !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(value)
  ) {
    return false;
  }

  const [year, month, day] = value
    .split("-")
    .map(Number);

  const date = new Date(
    year,
    month - 1,
    day,
  );

  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

function isTime(
  value: unknown,
): value is string {
  if (
    typeof value !== "string" ||
    !/^\d{2}:\d{2}$/.test(value)
  ) {
    return false;
  }

  const [hour, minute] = value
    .split(":")
    .map(Number);

  return (
    hour >= 0 &&
    hour <= 23 &&
    minute >= 0 &&
    minute <= 59
  );
}

export function isShift(
  value: unknown,
): value is Shift {
  if (!isRecord(value)) {
    return false;
  }

  const noteIsValid =
    value.note === undefined ||
    typeof value.note === "string";

  const creditedHoursIsValid =
    value.creditedHours === undefined ||
    (typeof value.creditedHours === "number" &&
      Number.isFinite(value.creditedHours) &&
      value.creditedHours >= 0);

  const hourCreditSourceIsValid =
    value.hourCreditSource === undefined ||
    hourCreditSources.has(
      value.hourCreditSource as HourCreditSource,
    );

  const sourceShiftIdIsValid =
    value.sourceShiftId === undefined ||
    typeof value.sourceShiftId === "string";

  return (
    typeof value.id === "string" &&
    value.id.length > 0 &&
    isDateKey(value.date) &&
    isTime(value.startTime) &&
    isTime(value.endTime) &&
    typeof value.breakMinutes === "number" &&
    Number.isFinite(value.breakMinutes) &&
    shiftTypes.has(value.type as ShiftType) &&
    noteIsValid &&
    creditedHoursIsValid &&
    hourCreditSourceIsValid &&
    sourceShiftIdIsValid
  );
}

export function loadShifts(): Shift[] {
  const raw = localStorage.getItem(SHIFT_KEY);

  if (!raw) {
    return [];
  }

  try {
    const parsed: unknown = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(isShift);
  } catch {
    return [];
  }
}

export function saveShifts(
  shifts: Shift[],
): void {
  localStorage.setItem(
    SHIFT_KEY,
    JSON.stringify(shifts),
  );
}
