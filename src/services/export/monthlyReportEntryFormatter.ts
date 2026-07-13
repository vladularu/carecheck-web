import type { Shift } from "../../types/index";
import { calculateNetHours } from "../calculation/workingTimeCalculator";
import { formatTimeRange24 } from "../format/dateTimeFormat";

export function isCreditedAbsence(shift: Shift): boolean {
  return shift.type === "VACATION" || shift.type === "SICK";
}

export function getReportTimeLabel(shift: Shift): string {
  if (shift.type === "FREE" || isCreditedAbsence(shift)) {
    return "—";
  }

  return formatTimeRange24(
    shift.startTime,
    shift.endTime,
  );
}

export function getReportBreakLabel(shift: Shift): string {
  if (shift.type === "FREE" || isCreditedAbsence(shift)) {
    return "—";
  }

  return `${shift.breakMinutes} min`;
}

export function getReportNetHours(
  shift: Shift,
  dailyTargetHours: number,
): number {
  return calculateNetHours(
    shift,
    dailyTargetHours,
  );
}

export function getReportHourSourceLabel(
  shift: Shift,
): string {
  if (shift.type === "VACATION") {
    return "Tägliche Sollarbeitszeit";
  }

  if (shift.type === "SICK") {
    return shift.hourCreditSource === "PLANNED_SHIFT"
      ? "Geplanter Dienst"
      : "Tägliche Sollarbeitszeit";
  }

  if (shift.type === "FREE") {
    return "Keine Stunden";
  }

  return "Erfasste Dienstzeit";
}
