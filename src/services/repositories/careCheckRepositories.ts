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

export interface AsyncProfileRepository {
  load: () => Promise<UserProfile | null>;
  save: (profile: UserProfile) => Promise<void>;
  markChanged: () => Promise<void>;
}

export interface AsyncShiftRepository {
  loadAll: () => Promise<Shift[]>;
  saveAll: (
    shifts: Shift[],
  ) => Promise<void>;
  markChanged: (
    id: string,
  ) => Promise<void>;
  markDeleted: (
    id: string,
  ) => Promise<void>;
}

export interface AsyncShiftTemplateRepository {
  load: () => Promise<ShiftTemplates>;
  save: (
    templates: ShiftTemplates,
  ) => Promise<void>;
  markChanged: (
    type: ShiftType | "all",
  ) => Promise<void>;
}

export interface AsyncPlanningTemplateRepository {
  loadAll: () => Promise<
    PlanningTemplate[]
  >;
  saveAll: (
    templates: PlanningTemplate[],
  ) => Promise<void>;
  markChanged: (
    id: string,
  ) => Promise<void>;
  markDeleted: (
    id: string,
  ) => Promise<void>;
}

export interface AsyncFairnessTeamRepository {
  loadAll: () => Promise<
    FairnessTeamMemberDraft[]
  >;
  saveAll: (
    members: FairnessTeamMemberDraft[],
  ) => Promise<void>;
  markChanged: (
    id: string,
  ) => Promise<void>;
  markDeleted: (
    id: string,
  ) => Promise<void>;
}

export interface AsyncAppDataRepository {
  clearAllLocalData: () => Promise<void>;
}

export interface AsyncCareCheckRepositories {
  profile: AsyncProfileRepository;
  shifts: AsyncShiftRepository;
  shiftTemplates: AsyncShiftTemplateRepository;
  planningTemplates: AsyncPlanningTemplateRepository;
  fairnessTeam: AsyncFairnessTeamRepository;
  appData: AsyncAppDataRepository;
}
