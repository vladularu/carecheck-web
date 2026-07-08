import { defaultShiftTemplates } from "../../data/defaultShiftTemplates";
import type { ShiftTemplates } from "../../types/index";

const SHIFT_TEMPLATE_KEY = "carecheck.shiftTemplates";

export function loadShiftTemplates(): ShiftTemplates {
  const raw = localStorage.getItem(SHIFT_TEMPLATE_KEY);

  if (!raw) {
    return defaultShiftTemplates;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<ShiftTemplates>;

    return {
      ...defaultShiftTemplates,
      ...parsed,
    };
  } catch {
    return defaultShiftTemplates;
  }
}

export function saveShiftTemplates(templates: ShiftTemplates) {
  localStorage.setItem(SHIFT_TEMPLATE_KEY, JSON.stringify(templates));
}