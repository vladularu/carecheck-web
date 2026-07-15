import { clearCareCheckLocalData } from "../storage/appDataStorage";
import {
  loadFairnessTeamMembers,
  saveFairnessTeamMembers,
} from "../storage/fairnessTeamStorage";
import {
  loadPlanningTemplates,
  savePlanningTemplates,
} from "../storage/planningTemplateStorage";
import {
  loadProfile,
  saveProfile,
} from "../storage/profileStorage";
import {
  loadShifts,
  saveShifts,
} from "../storage/shiftStorage";
import {
  loadShiftTemplates,
  saveShiftTemplates,
} from "../storage/shiftTemplateStorage";
import {
  markSyncEntityChanged,
  markSyncEntityDeleted,
} from "../storage/syncMetadataStorage";
import type {
  AppDataRepository,
  FairnessTeamRepository,
  PlanningTemplateRepository,
  ProfileRepository,
  ShiftRepository,
  ShiftTemplateRepository,
} from "./careCheckRepositories";

export const localProfileRepository: ProfileRepository = {
  load: loadProfile,
  save: saveProfile,
  markChanged: () =>
    markSyncEntityChanged(
      "profile",
      "current",
    ),
};

export const localShiftRepository: ShiftRepository = {
  loadAll: loadShifts,
  saveAll: saveShifts,
  markChanged: (id) =>
    markSyncEntityChanged("shifts", id),
  markDeleted: (id) =>
    markSyncEntityDeleted("shifts", id),
};

export const localShiftTemplateRepository:
  ShiftTemplateRepository = {
    load: loadShiftTemplates,
    save: saveShiftTemplates,
    markChanged: (type) =>
      markSyncEntityChanged(
        "shiftTemplates",
        type,
      ),
  };

export const localPlanningTemplateRepository:
  PlanningTemplateRepository = {
    loadAll: loadPlanningTemplates,
    saveAll: savePlanningTemplates,
    markChanged: (id) =>
      markSyncEntityChanged(
        "planningTemplates",
        id,
      ),
    markDeleted: (id) =>
      markSyncEntityDeleted(
        "planningTemplates",
        id,
      ),
  };

export const localFairnessTeamRepository:
  FairnessTeamRepository = {
    loadAll: loadFairnessTeamMembers,
    saveAll: saveFairnessTeamMembers,
    markChanged: (id) =>
      markSyncEntityChanged(
        "fairnessTeam",
        id,
      ),
    markDeleted: (id) =>
      markSyncEntityDeleted(
        "fairnessTeam",
        id,
      ),
  };

export const localAppDataRepository: AppDataRepository = {
  clearAllLocalData:
    clearCareCheckLocalData,
};
