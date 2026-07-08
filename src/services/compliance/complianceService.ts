import type { ComplianceIssue, Shift } from "../../types/index";
import { calculateNetHours } from "../calculation/workingTimeCalculator";

function createDateTime(dateKey: string, time: string): Date {
  const [year, month, day] = dateKey.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);

  return new Date(year, month - 1, day, hour, minute, 0, 0);
}

function getShiftStart(shift: Shift): Date {
  return createDateTime(shift.date, shift.startTime);
}

function getShiftEnd(shift: Shift): Date {
  const start = getShiftStart(shift);
  const end = createDateTime(shift.date, shift.endTime);

  if (end <= start) {
    end.setDate(end.getDate() + 1);
  }

  return end;
}

function roundToTwoDecimals(value: number): number {
  return Math.round(value * 100) / 100;
}

function hoursBetween(start: Date, end: Date): number {
  const diff = end.getTime() - start.getTime();
  return roundToTwoDecimals(diff / 1000 / 60 / 60);
}

function formatDateGerman(dateKey: string): string {
  const [year, month, day] = dateKey.split("-");

  return `${day}.${month}.${year}`;
}

function formatShiftLabel(shift: Shift): string {
  return `${formatDateGerman(shift.date)} ${shift.startTime}–${shift.endTime}`;
}

function sortShifts(shifts: Shift[]): Shift[] {
  return [...shifts].sort((a, b) =>
    `${a.date}${a.startTime}`.localeCompare(`${b.date}${b.startTime}`),
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

function checkDailyWorkingTime(shift: Shift): ComplianceIssue[] {
  if (shift.type === "FREE") {
    return [];
  }

  const issues: ComplianceIssue[] = [];
  const netHours = calculateNetHours(shift);

  if (netHours > 10) {
    issues.push(
      createIssue(
        "critical",
        "Tagesarbeitszeit über 10 Stunden",
        `${formatShiftLabel(shift)} hat ${netHours} h Nettoarbeitszeit. Das überschreitet die übliche 10-Stunden-Grenze.`,
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
        `${formatShiftLabel(shift)} hat ${netHours} h Nettoarbeitszeit. Ausgleichszeitraum prüfen.`,
        shift.id,
      ),
    );
  }

  return issues;
}

function checkBreakRequirement(shift: Shift): ComplianceIssue[] {
  if (shift.type === "FREE") {
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

  if (requiredBreakMinutes > 0 && shift.breakMinutes < requiredBreakMinutes) {
    issues.push(
      createIssue(
        "critical",
        "Pause zu kurz",
        `${formatShiftLabel(shift)} hat ${netHours} h Nettoarbeitszeit und ${shift.breakMinutes} Minuten Pause. Erforderlich wären mindestens ${requiredBreakMinutes} Minuten.`,
        shift.id,
      ),
    );
  }

  return issues;
}

function checkRestTimes(shifts: Shift[]): ComplianceIssue[] {
  const sorted = sortShifts(shifts).filter((shift) => shift.type !== "FREE");
  const issues: ComplianceIssue[] = [];

  for (let index = 0; index < sorted.length - 1; index++) {
    const currentShift = sorted[index];
    const nextShift = sorted[index + 1];

    const currentEnd = getShiftEnd(currentShift);
    const nextStart = getShiftStart(nextShift);
    const restHours = hoursBetween(currentEnd, nextStart);

    if (restHours < 10) {
      issues.push(
        createIssue(
          "critical",
          "Ruhezeit unter 10 Stunden",
          `Zwischen ${formatShiftLabel(currentShift)} und ${formatShiftLabel(nextShift)} liegen nur ${restHours} h Ruhezeit. Auch im Krankenhaus-/Pflegebereich ist das kritisch.`,
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
          `Zwischen ${formatShiftLabel(currentShift)} und ${formatShiftLabel(nextShift)} liegen ${restHours} h Ruhezeit. Im Krankenhaus-/Pflegebereich kann eine Verkürzung auf mindestens 10 h möglich sein, wenn innerhalb eines Monats oder innerhalb von 4 Wochen ein Ausgleich durch eine Ruhezeit von mindestens 12 h erfolgt.`,
          nextShift.id,
        ),
      );
    }
  }

  return issues;
}

export function checkCompliance(shifts: Shift[]): ComplianceIssue[] {
  const issues: ComplianceIssue[] = [];

  for (const shift of shifts) {
    issues.push(...checkDailyWorkingTime(shift));
    issues.push(...checkBreakRequirement(shift));
  }

  issues.push(...checkRestTimes(shifts));

  return issues;
}