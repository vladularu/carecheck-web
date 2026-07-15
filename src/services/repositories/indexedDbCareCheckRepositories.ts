import { defaultShiftTemplates } from "../../data/defaultShiftTemplates";
import type {
  ShiftTemplate,
  ShiftTemplates,
  ShiftType,
} from "../../types/index";
import { CARECHECK_LOCAL_STORAGE_KEYS } from "../storage/appDataStorage";
import {
  isFairnessTeamMemberDraft,
} from "../storage/fairnessTeamStorage";
import {
  createLocalChangeQueueEntry,
  enqueueLocalChange,
} from "../storage/localChangeQueueStorage";
import {
  createFallbackPersistenceAdapter,
  createIndexedDbPersistenceAdapter,
  createLocalStoragePersistenceAdapter,
  type PersistenceAdapter,
} from "../storage/persistenceAdapter";
import { isPlanningTemplate } from "../storage/planningTemplateStorage";
import { isUserProfile } from "../storage/profileStorage";
import { isShift } from "../storage/shiftStorage";
import type {
  AsyncCareCheckRepositories,
} from "./careCheckRepositories";

const PROFILE_KEY = "carecheck.profile";
const SHIFTS_KEY = "carecheck.shifts";
const SHIFT_TEMPLATES_KEY =
  "carecheck.shiftTemplates";
const PLANNING_TEMPLATES_KEY =
  "carecheck.planningTemplates.v1";
const FAIRNESS_TEAM_KEY =
  "carecheck.fairnessTeam.v1";

const shiftTemplateTypes = Object.keys(
  defaultShiftTemplates,
) as ShiftType[];

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return Boolean(
    value &&
      typeof value === "object" &&
      !Array.isArray(value),
  );
}

function isTime(value: unknown): value is string {
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

function isShiftTemplate(
  value: unknown,
): value is ShiftTemplate {
  return (
    isRecord(value) &&
    isTime(value.startTime) &&
    isTime(value.endTime) &&
    typeof value.breakMinutes ===
      "number" &&
    Number.isFinite(
      value.breakMinutes,
    ) &&
    value.breakMinutes >= 0
  );
}

function sanitizeShiftTemplates(
  value: unknown,
): ShiftTemplates {
  if (!isRecord(value)) {
    return defaultShiftTemplates;
  }

  const templates: ShiftTemplates = {
    ...defaultShiftTemplates,
  };

  Object.entries(value).forEach(
    ([key, template]) => {
      if (
        !shiftTemplateTypes.includes(
          key as ShiftType,
        ) ||
        !isShiftTemplate(template)
      ) {
        return;
      }

      templates[key as ShiftType] =
        template;
    },
  );

  return templates;
}

export function createDefaultCareCheckPersistenceAdapter(): PersistenceAdapter {
  return createFallbackPersistenceAdapter(
    createIndexedDbPersistenceAdapter(),
    createLocalStoragePersistenceAdapter(),
  );
}

export function createIndexedDbCareCheckRepositories(
  adapter: PersistenceAdapter =
    createDefaultCareCheckPersistenceAdapter(),
): AsyncCareCheckRepositories {
  return {
    profile: {
      load: async () => {
        const value =
          await adapter.get<unknown>(
            PROFILE_KEY,
          );

        return isUserProfile(value)
          ? value
          : null;
      },
      save: async (profile) => {
        await adapter.set(
          PROFILE_KEY,
          profile,
        );
      },
      markChanged: async () => {
        await enqueueLocalChange(
          adapter,
          createLocalChangeQueueEntry({
            domain: "profile",
            entityId: "current",
            operation: "upsert",
          }),
        );
      },
    },
    shifts: {
      loadAll: async () => {
        const value =
          await adapter.get<unknown>(
            SHIFTS_KEY,
          );

        return Array.isArray(value)
          ? value.filter(isShift)
          : [];
      },
      saveAll: async (shifts) => {
        await adapter.set(
          SHIFTS_KEY,
          shifts.filter(isShift),
        );
      },
      markChanged: async (id) => {
        await enqueueLocalChange(
          adapter,
          createLocalChangeQueueEntry({
            domain: "shifts",
            entityId: id,
            operation: "upsert",
          }),
        );
      },
      markDeleted: async (id) => {
        await enqueueLocalChange(
          adapter,
          createLocalChangeQueueEntry({
            domain: "shifts",
            entityId: id,
            operation: "delete",
          }),
        );
      },
    },
    shiftTemplates: {
      load: async () =>
        sanitizeShiftTemplates(
          await adapter.get<unknown>(
            SHIFT_TEMPLATES_KEY,
          ),
        ),
      save: async (templates) => {
        await adapter.set(
          SHIFT_TEMPLATES_KEY,
          sanitizeShiftTemplates(
            templates,
          ),
        );
      },
      markChanged: async (type) => {
        await enqueueLocalChange(
          adapter,
          createLocalChangeQueueEntry({
            domain: "shiftTemplates",
            entityId: type,
            operation: "upsert",
          }),
        );
      },
    },
    planningTemplates: {
      loadAll: async () => {
        const value =
          await adapter.get<unknown>(
            PLANNING_TEMPLATES_KEY,
          );

        return Array.isArray(value)
          ? value.filter(
              isPlanningTemplate,
            )
          : [];
      },
      saveAll: async (templates) => {
        await adapter.set(
          PLANNING_TEMPLATES_KEY,
          templates.filter(
            isPlanningTemplate,
          ),
        );
      },
      markChanged: async (id) => {
        await enqueueLocalChange(
          adapter,
          createLocalChangeQueueEntry({
            domain: "planningTemplates",
            entityId: id,
            operation: "upsert",
          }),
        );
      },
      markDeleted: async (id) => {
        await enqueueLocalChange(
          adapter,
          createLocalChangeQueueEntry({
            domain: "planningTemplates",
            entityId: id,
            operation: "delete",
          }),
        );
      },
    },
    fairnessTeam: {
      loadAll: async () => {
        const value =
          await adapter.get<unknown>(
            FAIRNESS_TEAM_KEY,
          );

        return Array.isArray(value)
          ? value.filter(
              isFairnessTeamMemberDraft,
            )
          : [];
      },
      saveAll: async (members) => {
        await adapter.set(
          FAIRNESS_TEAM_KEY,
          members.filter(
            isFairnessTeamMemberDraft,
          ),
        );
      },
      markChanged: async (id) => {
        await enqueueLocalChange(
          adapter,
          createLocalChangeQueueEntry({
            domain: "fairnessTeam",
            entityId: id,
            operation: "upsert",
          }),
        );
      },
      markDeleted: async (id) => {
        await enqueueLocalChange(
          adapter,
          createLocalChangeQueueEntry({
            domain: "fairnessTeam",
            entityId: id,
            operation: "delete",
          }),
        );
      },
    },
    appData: {
      clearAllLocalData: async () => {
        await adapter.clear([
          ...CARECHECK_LOCAL_STORAGE_KEYS,
        ]);
      },
    },
  };
}
