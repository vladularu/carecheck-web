import type {
  Shift,
  ShiftTemplates,
  UserProfile,
} from "../../types/index";
import type { PlanningTemplate } from "../planning/planningComfortService";
import type { FairnessTeamMemberDraft } from "../storage/fairnessTeamStorage";

const CURRENT_PORTABILITY_EXPORT_VERSION =
  1 as const;

interface LocalDataCategory {
  key: string;
  name: string;
}

interface ExcludedLocalDataCategory extends LocalDataCategory {
  reason: string;
}

export interface CareCheckPortabilityExport {
  app: "CareCheck TVoeD";
  exportType: "carecheck-data-portability";
  exportVersion: typeof CURRENT_PORTABILITY_EXPORT_VERSION;
  exportedAt: string;
  format: "application/json";
  data: {
    profile: UserProfile;
    shifts: Shift[];
    shiftTemplates: ShiftTemplates;
    planningTemplates: PlanningTemplate[];
    fairnessTeamMembers: FairnessTeamMemberDraft[];
  };
  metadata: {
    includedLocalData: LocalDataCategory[];
    excludedLocalData: ExcludedLocalDataCategory[];
  };
}

interface CreatePortabilityExportInput {
  profile: UserProfile;
  shifts: Shift[];
  shiftTemplates: ShiftTemplates;
  planningTemplates: PlanningTemplate[];
  fairnessTeamMembers: FairnessTeamMemberDraft[];
}

const includedLocalData: LocalDataCategory[] = [
  {
    key: "carecheck.profile",
    name: "Profil",
  },
  {
    key: "carecheck.shifts",
    name: "Dienste",
  },
  {
    key: "carecheck.shiftTemplates",
    name: "Dienstvorlagen",
  },
  {
    key: "carecheck.planningTemplates.v1",
    name: "Planungsvorlagen",
  },
  {
    key: "carecheck.fairnessTeam.v1",
    name: "Fairness-Teamdaten",
  },
];

const excludedLocalData: ExcludedLocalDataCategory[] = [
  {
    key: "carecheck.syncMetadata.v1",
    name: "Sync-Metadaten",
    reason:
      "Geraetespezifische technische Revisionen; kein fachlicher Portabilitaetsinhalt.",
  },
];

function createExportFileName(): string {
  const date = new Date()
    .toISOString()
    .slice(0, 10);

  return `CareCheck_Datenexport_${date}.json`;
}

export function createCareCheckPortabilityExport({
  profile,
  shifts,
  shiftTemplates,
  planningTemplates,
  fairnessTeamMembers,
}: CreatePortabilityExportInput): CareCheckPortabilityExport {
  return {
    app: "CareCheck TVoeD",
    exportType: "carecheck-data-portability",
    exportVersion:
      CURRENT_PORTABILITY_EXPORT_VERSION,
    exportedAt:
      new Date().toISOString(),
    format: "application/json",
    data: {
      profile,
      shifts,
      shiftTemplates,
      planningTemplates,
      fairnessTeamMembers,
    },
    metadata: {
      includedLocalData: [
        ...includedLocalData,
      ],
      excludedLocalData: [
        ...excludedLocalData,
      ],
    },
  };
}

export function downloadCareCheckPortabilityExport(
  input: CreatePortabilityExportInput,
): void {
  const dataExport =
    createCareCheckPortabilityExport(input);

  const json = JSON.stringify(
    dataExport,
    null,
    2,
  );

  const blob = new Blob([json], {
    type: "application/json;charset=utf-8",
  });

  const url =
    URL.createObjectURL(blob);

  const link =
    document.createElement("a");

  link.href = url;
  link.download =
    createExportFileName();

  document.body.appendChild(link);
  link.click();

  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
