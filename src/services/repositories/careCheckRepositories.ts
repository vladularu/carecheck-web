import type {
  Shift,
  ShiftTemplates,
  ShiftType,
  UserProfile,
} from "../../types/index";
import type { PlanningTemplate } from "../planning/planningComfortService";
import type { FairnessTeamMemberDraft } from "../storage/fairnessTeamStorage";

export type { FairnessTeamMemberDraft } from "../storage/fairnessTeamStorage";

export interface ProfileRepository {
  load: () => UserProfile | null;
  save: (profile: UserProfile) => void;
  markChanged: () => void;
}

export interface ShiftRepository {
  loadAll: () => Shift[];
  saveAll: (shifts: Shift[]) => void;
  markChanged: (id: string) => void;
  markDeleted: (id: string) => void;
}

export interface ShiftTemplateRepository {
  load: () => ShiftTemplates;
  save: (templates: ShiftTemplates) => void;
  markChanged: (
    type: ShiftType | "all",
  ) => void;
}

export interface PlanningTemplateRepository {
  loadAll: () => PlanningTemplate[];
  saveAll: (
    templates: PlanningTemplate[],
  ) => void;
  markChanged: (id: string) => void;
  markDeleted: (id: string) => void;
}

export interface FairnessTeamRepository {
  loadAll: () => FairnessTeamMemberDraft[];
  saveAll: (
    members: FairnessTeamMemberDraft[],
  ) => void;
  markChanged: (id: string) => void;
  markDeleted: (id: string) => void;
}

export interface AppDataRepository {
  clearAllLocalData: () => void;
}
