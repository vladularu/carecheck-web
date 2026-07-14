import type {
  Shift,
  ShiftTemplates,
  ShiftType,
} from "../../types/index";

export type PlanningConflictSeverity =
  | "info"
  | "warning"
  | "critical";

export interface PlanningConflict {
  severity: PlanningConflictSeverity;
  title: string;
  description: string;
  date: string;
  relatedShiftId?: string;
}

export interface RecurringPatternInput {
  startDate: string;
  days: number;
  pattern: ShiftType[];
  shiftTemplates: ShiftTemplates;
  note?: string;
  idFactory?: () => string;
}

export interface PlanningTemplateEntry {
  day: number;
  type: ShiftType;
  startTime: string;
  endTime: string;
  breakMinutes: number;
  note?: string;
}

export interface PlanningTemplate {
  id: string;
  name: string;
  sourceMonthLabel: string;
  entries: PlanningTemplateEntry[];
  createdAt: string;
}

export interface CreatePlanningTemplateInput {
  id: string;
  name: string;
  sourceYear: number;
  sourceMonth: number;
  shifts: Shift[];
  createdAt: string;
}

export interface ApplyPlanningTemplateInput {
  template: PlanningTemplate;
  targetYear: number;
  targetMonth: number;
  idFactory?: () => string;
}

export interface CopyDayInput {
  shifts: Shift[];
  sourceDate: string;
  targetDate: string;
  mode: "copy" | "move";
  idFactory?: () => string;
}

export interface CopyDayResult {
  shiftsToAdd: Shift[];
  shiftIdsToRemove: string[];
}

export interface ImportedScheduleResult {
  shifts: Shift[];
  errors: string[];
}

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

const absenceTypes = new Set<ShiftType>([
  "VACATION",
  "SICK",
  "FREE",
]);

function createId(
  idFactory?: () => string,
): string {
  return idFactory
    ? idFactory()
    : crypto.randomUUID();
}

function formatDateKey(date: Date): string {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function createDate(dateKey: string): Date {
  return new Date(`${dateKey}T00:00:00`);
}

function addDays(
  dateKey: string,
  days: number,
): string {
  const date = createDate(dateKey);

  date.setDate(date.getDate() + days);

  return formatDateKey(date);
}

function getDaysInMonth(
  year: number,
  monthIndex: number,
): number {
  return new Date(
    year,
    monthIndex + 1,
    0,
  ).getDate();
}

function createDateKey(
  year: number,
  monthIndex: number,
  day: number,
): string {
  return [
    year,
    String(monthIndex + 1).padStart(2, "0"),
    String(day).padStart(2, "0"),
  ].join("-");
}

function compareShiftOrder(
  first: Shift,
  second: Shift,
): number {
  return `${first.date}${first.startTime}${first.id}`.localeCompare(
    `${second.date}${second.startTime}${second.id}`,
  );
}

function normalizeShiftValues(
  type: ShiftType,
  startTime: string,
  endTime: string,
  breakMinutes: number,
): Pick<
  Shift,
  "startTime" | "endTime" | "breakMinutes"
> {
  if (absenceTypes.has(type)) {
    return {
      startTime: "00:00",
      endTime: "00:00",
      breakMinutes: 0,
    };
  }

  return {
    startTime,
    endTime,
    breakMinutes,
  };
}

function createShiftFromType(
  date: string,
  type: ShiftType,
  shiftTemplates: ShiftTemplates,
  note: string | undefined,
  idFactory?: () => string,
): Shift {
  const template = shiftTemplates[type];
  const normalized = normalizeShiftValues(
    type,
    template.startTime,
    template.endTime,
    template.breakMinutes,
  );

  return {
    id: createId(idFactory),
    date,
    type,
    note,
    ...normalized,
  };
}

function createShiftFromEntry(
  entry: PlanningTemplateEntry,
  date: string,
  idFactory?: () => string,
): Shift {
  const normalized = normalizeShiftValues(
    entry.type,
    entry.startTime,
    entry.endTime,
    entry.breakMinutes,
  );

  return {
    id: createId(idFactory),
    date,
    type: entry.type,
    note: entry.note,
    ...normalized,
  };
}

function toMinutes(time: string): number {
  const [hour, minute] = time
    .split(":")
    .map(Number);

  return hour * 60 + minute;
}

function getShiftRange(shift: Shift): {
  start: number;
  end: number;
} {
  const start = toMinutes(shift.startTime);
  let end = toMinutes(shift.endTime);

  if (end <= start) {
    end += 24 * 60;
  }

  return {
    start,
    end,
  };
}

function shiftsOverlap(
  first: Shift,
  second: Shift,
): boolean {
  if (
    absenceTypes.has(first.type) ||
    absenceTypes.has(second.type)
  ) {
    return false;
  }

  const firstRange = getShiftRange(first);
  const secondRange = getShiftRange(second);

  return (
    firstRange.start < secondRange.end &&
    secondRange.start < firstRange.end
  );
}

function areExactDuplicates(
  first: Shift,
  second: Shift,
): boolean {
  return (
    first.date === second.date &&
    first.startTime === second.startTime &&
    first.endTime === second.endTime &&
    first.breakMinutes === second.breakMinutes &&
    first.type === second.type
  );
}

export function createRecurringPatternShifts({
  startDate,
  days,
  pattern,
  shiftTemplates,
  note,
  idFactory,
}: RecurringPatternInput): Shift[] {
  if (!startDate || days <= 0 || pattern.length === 0) {
    return [];
  }

  return Array.from({
    length: days,
  }).map((_, index) =>
    createShiftFromType(
      addDays(startDate, index),
      pattern[index % pattern.length],
      shiftTemplates,
      note,
      idFactory,
    ),
  );
}

export function createPlanningTemplate({
  id,
  name,
  sourceYear,
  sourceMonth,
  shifts,
  createdAt,
}: CreatePlanningTemplateInput): PlanningTemplate {
  const sourceMonthLabel = `${String(
    sourceMonth + 1,
  ).padStart(2, "0")}.${sourceYear}`;

  return {
    id,
    name: name.trim() || `Vorlage ${sourceMonthLabel}`,
    sourceMonthLabel,
    createdAt,
    entries: [...shifts]
      .sort(compareShiftOrder)
      .map((shift) => ({
        day: Number(shift.date.slice(8, 10)),
        type: shift.type,
        startTime: shift.startTime,
        endTime: shift.endTime,
        breakMinutes: shift.breakMinutes,
        note: shift.note,
      })),
  };
}

export function applyPlanningTemplate({
  template,
  targetYear,
  targetMonth,
  idFactory,
}: ApplyPlanningTemplateInput): Shift[] {
  const daysInMonth = getDaysInMonth(
    targetYear,
    targetMonth,
  );

  return template.entries
    .filter((entry) => entry.day <= daysInMonth)
    .map((entry) =>
      createShiftFromEntry(
        entry,
        createDateKey(
          targetYear,
          targetMonth,
          entry.day,
        ),
        idFactory,
      ),
    );
}

export function copyDayShifts({
  shifts,
  sourceDate,
  targetDate,
  mode,
  idFactory,
}: CopyDayInput): CopyDayResult {
  const sourceShifts = shifts
    .filter((shift) => shift.date === sourceDate)
    .sort(compareShiftOrder);

  return {
    shiftsToAdd: sourceShifts.map((shift) => ({
      ...shift,
      id: createId(idFactory),
      date: targetDate,
      sourceShiftId: undefined,
    })),
    shiftIdsToRemove:
      mode === "move"
        ? sourceShifts.map((shift) => shift.id)
        : [],
  };
}

export function detectPlanningConflicts(
  existingShifts: Shift[],
  candidateShifts: Shift[],
): PlanningConflict[] {
  const conflicts: PlanningConflict[] = [];

  for (const candidate of candidateShifts) {
    const sameDayExisting = existingShifts.filter(
      (shift) => shift.date === candidate.date,
    );
    const sameDayCandidates =
      candidateShifts.filter(
        (shift) =>
          shift.id !== candidate.id &&
          shift.date === candidate.date,
      );

    if (sameDayExisting.length > 0) {
      conflicts.push({
        severity: "info",
        title: "Datum bereits belegt",
        description:
          "Auf diesem Datum existiert bereits mindestens ein Kalendereintrag.",
        date: candidate.date,
      });
    }

    for (const existing of sameDayExisting) {
      if (areExactDuplicates(existing, candidate)) {
        conflicts.push({
          severity: "warning",
          title: "Moegliche Dublette",
          description:
            "Dienstart, Zeit und Pause entsprechen einem vorhandenen Eintrag.",
          date: candidate.date,
          relatedShiftId: existing.id,
        });
      }

      if (shiftsOverlap(existing, candidate)) {
        conflicts.push({
          severity: "critical",
          title: "Zeitliche Ueberschneidung",
          description:
            "Der neue Eintrag ueberschneidet sich mit einem vorhandenen Dienst.",
          date: candidate.date,
          relatedShiftId: existing.id,
        });
      }
    }

    for (const otherCandidate of sameDayCandidates) {
      if (shiftsOverlap(candidate, otherCandidate)) {
        conflicts.push({
          severity: "critical",
          title: "Ueberschneidung in Vorschau",
          description:
            "Mehrere neue Eintraege im selben Lauf ueberschneiden sich.",
          date: candidate.date,
        });
      }
    }
  }

  return conflicts;
}

function parseCsvLine(line: string): string[] {
  return line
    .split(/[;,]/)
    .map((value) => value.trim());
}

function normalizeImportedType(
  value: string,
): ShiftType | null {
  const normalized = value
    .trim()
    .toUpperCase();

  if (shiftTypes.has(normalized as ShiftType)) {
    return normalized as ShiftType;
  }

  return null;
}

export function parseScheduleImport(
  text: string,
  idFactory?: () => string,
): ImportedScheduleResult {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const shifts: Shift[] = [];
  const errors: string[] = [];

  for (const [index, line] of lines.entries()) {
    const lineNumber = index + 1;
    const [
      date,
      typeValue,
      startTime = "00:00",
      endTime = "00:00",
      breakValue = "0",
      note,
    ] = parseCsvLine(line);

    const type = normalizeImportedType(
      typeValue ?? "",
    );
    const breakMinutes = Number(breakValue);

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      errors.push(
        `Zeile ${lineNumber}: Datum muss yyyy-mm-dd sein.`,
      );
      continue;
    }

    if (!type) {
      errors.push(
        `Zeile ${lineNumber}: unbekannte Dienstart.`,
      );
      continue;
    }

    if (
      !Number.isFinite(breakMinutes) ||
      breakMinutes < 0
    ) {
      errors.push(
        `Zeile ${lineNumber}: Pause muss eine positive Zahl sein.`,
      );
      continue;
    }

    const normalized = normalizeShiftValues(
      type,
      startTime,
      endTime,
      breakMinutes,
    );

    shifts.push({
      id: createId(idFactory),
      date,
      type,
      note: note || undefined,
      ...normalized,
    });
  }

  return {
    shifts,
    errors,
  };
}
