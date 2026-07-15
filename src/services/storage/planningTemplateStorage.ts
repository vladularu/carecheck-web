import type { PlanningTemplate } from "../planning/planningComfortService";
import type { ShiftType } from "../../types/index";

const PLANNING_TEMPLATES_KEY =
  "carecheck.planningTemplates.v1";

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

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return Boolean(
    value &&
      typeof value === "object" &&
      !Array.isArray(value),
  );
}

export function isPlanningTemplate(
  value: unknown,
): value is PlanningTemplate {
  if (!isRecord(value)) {
    return false;
  }

  if (
    typeof value.id !== "string" ||
    typeof value.name !== "string" ||
    typeof value.sourceMonthLabel !== "string" ||
    typeof value.createdAt !== "string" ||
    !Array.isArray(value.entries)
  ) {
    return false;
  }

  return value.entries.every((entry) => {
    if (!isRecord(entry)) {
      return false;
    }

    return (
      typeof entry.day === "number" &&
      entry.day >= 1 &&
      entry.day <= 31 &&
      typeof entry.type === "string" &&
      shiftTypes.has(entry.type as ShiftType) &&
      typeof entry.startTime === "string" &&
      typeof entry.endTime === "string" &&
      typeof entry.breakMinutes === "number" &&
      entry.breakMinutes >= 0 &&
      (entry.note === undefined ||
        typeof entry.note === "string")
    );
  });
}

export function loadPlanningTemplates(): PlanningTemplate[] {
  const raw = localStorage.getItem(
    PLANNING_TEMPLATES_KEY,
  );

  if (!raw) {
    return [];
  }

  try {
    const parsed: unknown = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(isPlanningTemplate);
  } catch {
    return [];
  }
}

export function savePlanningTemplates(
  templates: PlanningTemplate[],
): void {
  localStorage.setItem(
    PLANNING_TEMPLATES_KEY,
    JSON.stringify(
      templates.filter(isPlanningTemplate),
    ),
  );
}
