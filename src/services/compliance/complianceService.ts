import type {
  ComplianceIssue,
  Shift,
} from "../../types/index";
import { isComplianceRelevant } from "../calculation/shiftTypeRules";
import { calculateNetHours } from "../calculation/workingTimeCalculator";

function createDateTime(
  dateKey: string,
  time: string,
): Date {
  const [year, month, day] = dateKey
    .split("-")
    .map(Number);

  const [hour, minute] = time
    .split(":")
    .map(Number);

  return new Date(
    year,
    month - 1,
    day,
    hour,
    minute,
    0,
    0,
  );
}

function getShiftStart(shift: Shift): Date {
  return createDateTime(
    shift.date,
    shift.startTime,
  );
}

function getShiftEnd(shift: Shift): Date {
  const start = getShiftStart(shift);

  const end = createDateTime(
    shift.date,
    shift.endTime,
  );

  if (end <= start) {
    end.setDate(end.getDate() + 1);
  }

  return end;
}

function roundToTwoDecimals(
  value: number,
): number {
  return Math.round(value * 100) / 100;
}

function hoursBetween(
  start: Date,
  end: Date,
): number {
  const difference =
    end.getTime() - start.getTime();

  return roundToTwoDecimals(
    difference / 1000 / 60 / 60,
  );
}

function formatDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(
    date.getMonth() + 1,
  ).padStart(2, "0")}-${String(
    date.getDate(),
  ).padStart(2, "0")}`;
}

function formatDateGerman(
  dateKey: string,
): string {
  const [year, month, day] =
    dateKey.split("-");

  return `${day}.${month}.${year}`;
}

function formatShiftLabel(
  shift: Shift,
): string {
  return `${formatDateGerman(
    shift.date,
  )} ${shift.startTime}–${shift.endTime}`;
}

function sortShifts(
  shifts: Shift[],
): Shift[] {
  return [...shifts].sort((a, b) =>
    `${a.date}${a.startTime}`.localeCompare(
      `${b.date}${b.startTime}`,
    ),
  );
}

function createIssue(
  severity: ComplianceIssue["severity"],
  title: string,
  description: string,
  relatedShiftId?: string,
): ComplianceIssue {
  return {
    id: crypto.randomUUID(),
    severity,
    title,
    description,
    relatedShiftId,
  };
}

function checkDailyWorkingTime(
  shift: Shift,
): ComplianceIssue[] {
  if (!isComplianceRelevant(shift)) {
    return [];
  }

  const issues: ComplianceIssue[] = [];
  const netHours = calculateNetHours(shift);

  if (netHours > 10) {
    issues.push(
      createIssue(
        "critical",
        "Tagesarbeitszeit über 10 Stunden",
        `${formatShiftLabel(
          shift,
        )} hat ${netHours} h Nettoarbeitszeit. Das überschreitet die übliche 10-Stunden-Grenze.`,
        shift.id,
      ),
    );

    return issues;
  }

  if (netHours > 8) {
    issues.push(
      createIssue(
        "warning",
        "Tagesarbeitszeit über 8 Stunden",
        `${formatShiftLabel(
          shift,
        )} hat ${netHours} h Nettoarbeitszeit. Ausgleichszeitraum prüfen.`,
        shift.id,
      ),
    );
  }

  return issues;
}

function checkBreakRequirement(
  shift: Shift,
): ComplianceIssue[] {
  if (!isComplianceRelevant(shift)) {
    return [];
  }

  const issues: ComplianceIssue[] = [];
  const netHours = calculateNetHours(shift);

  let requiredBreakMinutes = 0;

  if (netHours > 9) {
    requiredBreakMinutes = 45;
  } else if (netHours > 6) {
    requiredBreakMinutes = 30;
  }

  if (
    requiredBreakMinutes > 0 &&
    shift.breakMinutes <
      requiredBreakMinutes
  ) {
    issues.push(
      createIssue(
        "critical",
        "Pause zu kurz",
        `${formatShiftLabel(
          shift,
        )} hat ${netHours} h Nettoarbeitszeit und ${shift.breakMinutes} Minuten Pause. Erforderlich wären mindestens ${requiredBreakMinutes} Minuten.`,
        shift.id,
      ),
    );
  }

  return issues;
}

function checkRestTimes(
  shifts: Shift[],
): ComplianceIssue[] {
  const sorted = sortShifts(shifts).filter(
    isComplianceRelevant,
  );

  const issues: ComplianceIssue[] = [];

  for (
    let index = 0;
    index < sorted.length - 1;
    index++
  ) {
    const currentShift = sorted[index];
    const nextShift = sorted[index + 1];

    const currentEnd =
      getShiftEnd(currentShift);

    const nextStart =
      getShiftStart(nextShift);

    const restHours = hoursBetween(
      currentEnd,
      nextStart,
    );

    if (restHours < 10) {
      issues.push(
        createIssue(
          "critical",
          "Ruhezeit unter 10 Stunden",
          `Zwischen ${formatShiftLabel(
            currentShift,
          )} und ${formatShiftLabel(
            nextShift,
          )} liegen nur ${restHours} h Ruhezeit. Auch im Krankenhaus- und Pflegebereich ist das kritisch.`,
          nextShift.id,
        ),
      );

      continue;
    }

    if (restHours < 11) {
      issues.push(
        createIssue(
          "warning",
          "Ruhezeit unter 11 Stunden",
          `Zwischen ${formatShiftLabel(
            currentShift,
          )} und ${formatShiftLabel(
            nextShift,
          )} liegen ${restHours} h Ruhezeit. Im Krankenhaus- und Pflegebereich kann eine Verkürzung auf mindestens 10 Stunden möglich sein, wenn innerhalb eines Monats oder innerhalb von vier Wochen ein Ausgleich durch eine Ruhezeit von mindestens 12 Stunden erfolgt.`,
          nextShift.id,
        ),
      );
    }
  }

  return issues;
}

function startOfDay(date: Date): Date {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  );
}

function addDays(
  date: Date,
  days: number,
): Date {
  const result = new Date(date);

  result.setDate(
    result.getDate() + days,
  );

  return result;
}

function getWeekendStartDate(
  date: Date,
): Date | null {
  const day = date.getDay();

  if (day === 6) {
    return startOfDay(date);
  }

  if (day === 0) {
    return addDays(
      startOfDay(date),
      -1,
    );
  }

  return null;
}

function getWeekendKeysForShift(
  shift: Shift,
): string[] {
  const start = getShiftStart(shift);
  const end = getShiftEnd(shift);

  const weekendKeys =
    new Set<string>();

  let cursor = startOfDay(start);

  while (cursor < end) {
    const nextDay = addDays(
      cursor,
      1,
    );

    const overlapsDay =
      start < nextDay &&
      end > cursor;

    if (overlapsDay) {
      const weekendStart =
        getWeekendStartDate(cursor);

      if (weekendStart) {
        weekendKeys.add(
          formatDateKey(weekendStart),
        );
      }
    }

    cursor = nextDay;
  }

  return Array.from(weekendKeys);
}

function daysBetween(
  firstDate: Date,
  secondDate: Date,
): number {
  return Math.round(
    (secondDate.getTime() -
      firstDate.getTime()) /
      1000 /
      60 /
      60 /
      24,
  );
}

function dateFromDateKey(
  dateKey: string,
): Date {
  const [year, month, day] =
    dateKey
      .split("-")
      .map(Number);

  return new Date(
    year,
    month - 1,
    day,
  );
}

function checkConsecutiveWeekends(
  shifts: Shift[],
): ComplianceIssue[] {
  const workedShifts =
    sortShifts(shifts).filter(
      isComplianceRelevant,
    );

  const weekendShifts =
    new Map<string, Shift[]>();

  const issues: ComplianceIssue[] = [];

  for (const shift of workedShifts) {
    const weekendKeys =
      getWeekendKeysForShift(shift);

    for (
      const weekendKey of weekendKeys
    ) {
      const current =
        weekendShifts.get(
          weekendKey,
        ) ?? [];

      weekendShifts.set(
        weekendKey,
        [...current, shift],
      );
    }
  }

  const weekendKeys = Array.from(
    weekendShifts.keys(),
  ).sort();

  for (
    let index = 0;
    index < weekendKeys.length - 1;
    index++
  ) {
    const currentWeekendKey =
      weekendKeys[index];

    const nextWeekendKey =
      weekendKeys[index + 1];

    const currentDate =
      dateFromDateKey(
        currentWeekendKey,
      );

    const nextDate =
      dateFromDateKey(
        nextWeekendKey,
      );

    if (
      daysBetween(
        currentDate,
        nextDate,
      ) !== 7
    ) {
      continue;
    }

    const relatedShift =
      weekendShifts.get(
        nextWeekendKey,
      )?.[0];

    issues.push(
      createIssue(
        "warning",
        "Zwei Wochenenden in Folge gearbeitet",
        `Es wurden zwei aufeinanderfolgende Wochenenden gearbeitet: Wochenende ab ${formatDateGerman(
          currentWeekendKey,
        )} und Wochenende ab ${formatDateGerman(
          nextWeekendKey,
        )}. Prüfen, ob nach der Dienstplanregel jedes zweite Wochenende frei sein sollte.`,
        relatedShift?.id,
      ),
    );
  }

  return issues;
}

export function checkCompliance(
  shifts: Shift[],
): ComplianceIssue[] {
  const complianceRelevantShifts =
    shifts.filter(
      isComplianceRelevant,
    );

  const issues: ComplianceIssue[] = [];

  for (
    const shift of
    complianceRelevantShifts
  ) {
    issues.push(
      ...checkDailyWorkingTime(
        shift,
      ),
    );

    issues.push(
      ...checkBreakRequirement(
        shift,
      ),
    );
  }

  issues.push(
    ...checkRestTimes(
      complianceRelevantShifts,
    ),
  );

  issues.push(
    ...checkConsecutiveWeekends(
      complianceRelevantShifts,
    ),
  );

  return issues;
}