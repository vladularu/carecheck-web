import type {
  Shift,
  ShiftTemplates,
  UserProfile,
} from "../../types/index";
import {
  migrateLegacyCareCheckData,
  type DomainMigrationResult,
} from "../domain/domainMigrationService";
import type { PlanningTemplate } from "../planning/planningComfortService";
import {
  isFairnessTeamMemberDraft,
  saveFairnessTeamMembers,
  type FairnessTeamMemberDraft,
} from "../storage/fairnessTeamStorage";
import {
  isPlanningTemplate,
  savePlanningTemplates,
} from "../storage/planningTemplateStorage";
import {
  isUserProfile,
  saveProfile,
} from "../storage/profileStorage";
import {
  isShift,
  saveShifts,
} from "../storage/shiftStorage";
import { saveShiftTemplates } from "../storage/shiftTemplateStorage";

const CURRENT_BACKUP_VERSION = 3 as const;

type SupportedBackupVersion =
  | 1
  | 2
  | typeof CURRENT_BACKUP_VERSION;

interface LegacyCareCheckBackup {
  app: "CareCheck TVöD";
  backupVersion: 1 | 2;
  exportedAt: string;
  profile: UserProfile;
  shifts: Shift[];
  shiftTemplates: ShiftTemplates;
}

interface CareCheckBackupV3 {
  app: "CareCheck TVöD";
  backupVersion: typeof CURRENT_BACKUP_VERSION;
  exportedAt: string;
  profile: UserProfile;
  shifts: Shift[];
  shiftTemplates: ShiftTemplates;
  planningTemplates: PlanningTemplate[];
  fairnessTeamMembers: FairnessTeamMemberDraft[];
  domainSnapshot: DomainMigrationResult;
}

export interface CareCheckBackup
  extends CareCheckBackupV3 {
  sourceBackupVersion?: SupportedBackupVersion;
}

interface CreateBackupInput {
  profile: UserProfile;
  shifts: Shift[];
  shiftTemplates: ShiftTemplates;
  planningTemplates?: PlanningTemplate[];
  fairnessTeamMembers?: FairnessTeamMemberDraft[];
}

function createBackupFileName(): string {
  const date = new Date()
    .toISOString()
    .slice(0, 10);

  return `CareCheck_Backup_${date}.json`;
}

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return Boolean(
    value &&
      typeof value === "object" &&
      !Array.isArray(value),
  );
}

function isSupportedBackupVersion(
  value: unknown,
): value is SupportedBackupVersion {
  return (
    value === 1 ||
    value === 2 ||
    value === CURRENT_BACKUP_VERSION
  );
}

function isBackupStructure(
  value: unknown,
): value is
  | LegacyCareCheckBackup
  | CareCheckBackupV3 {
  if (!isRecord(value)) {
    return false;
  }

  const hasBaseStructure = (
    value.app === "CareCheck TVöD" &&
    isSupportedBackupVersion(
      value.backupVersion,
    ) &&
    typeof value.exportedAt === "string" &&
    isUserProfile(value.profile) &&
    Array.isArray(value.shifts) &&
    value.shifts.every(isShift) &&
    isRecord(value.shiftTemplates)
  );

  if (!hasBaseStructure) {
    return false;
  }

  if (
    value.backupVersion !==
    CURRENT_BACKUP_VERSION
  ) {
    return true;
  }

  return (
    Array.isArray(
      value.planningTemplates,
    ) &&
    value.planningTemplates.every(
      isPlanningTemplate,
    ) &&
    Array.isArray(
      value.fairnessTeamMembers,
    ) &&
    value.fairnessTeamMembers.every(
      isFairnessTeamMemberDraft,
    ) &&
    isRecord(value.domainSnapshot)
  );
}

function createDomainSnapshot({
  profile,
  shifts,
  shiftTemplates,
  planningTemplates,
  fairnessTeamMembers,
  migratedAt,
}: CreateBackupInput & {
  migratedAt: string;
}): DomainMigrationResult {
  return migrateLegacyCareCheckData(
    {
      profile,
      shifts,
      shiftTemplates,
      planningTemplates:
        planningTemplates ?? [],
      fairnessTeamMembers:
        fairnessTeamMembers ?? [],
    },
    {
      migratedAt,
    },
  );
}

/**
 * Prüft und aktualisiert unterstützte Backups auf
 * die aktuelle Backup-Version.
 *
 * Backups der Version 1 enthalten noch keine
 * verpflichtenden Abwesenheits-Gutschriften.
 * Diese Altbestände werden nach dem Import beim
 * Laden durch den AppContext normalisiert.
 */
export function parseCareCheckBackup(
  value: unknown,
): CareCheckBackup {
  if (!isBackupStructure(value)) {
    throw new Error(
      "Die Datei ist kein gültiges CareCheck-Backup.",
    );
  }

  const sourceBackupVersion =
    value.backupVersion;
  const planningTemplates =
    sourceBackupVersion ===
    CURRENT_BACKUP_VERSION
      ? value.planningTemplates
      : [];
  const fairnessTeamMembers =
    sourceBackupVersion ===
    CURRENT_BACKUP_VERSION
      ? value.fairnessTeamMembers
      : [];
  const domainSnapshot =
    createDomainSnapshot({
      profile: value.profile,
      shifts: value.shifts,
      shiftTemplates:
        value.shiftTemplates,
      planningTemplates,
      fairnessTeamMembers,
      migratedAt: value.exportedAt,
    });

  return {
    app: "CareCheck TVöD",
    backupVersion:
      CURRENT_BACKUP_VERSION,
    sourceBackupVersion,
    exportedAt: value.exportedAt,
    profile: value.profile,
    shifts: value.shifts,
    shiftTemplates:
      value.shiftTemplates,
    planningTemplates,
    fairnessTeamMembers,
    domainSnapshot,
  };
}

export function createCareCheckBackup({
  profile,
  shifts,
  shiftTemplates,
  planningTemplates = [],
  fairnessTeamMembers = [],
}: CreateBackupInput): CareCheckBackup {
  const exportedAt =
    new Date().toISOString();
  const domainSnapshot =
    createDomainSnapshot({
      profile,
      shifts,
      shiftTemplates,
      planningTemplates,
      fairnessTeamMembers,
      migratedAt: exportedAt,
    });

  return {
    app: "CareCheck TVöD",
    backupVersion:
      CURRENT_BACKUP_VERSION,
    exportedAt,
    profile,
    shifts,
    shiftTemplates,
    planningTemplates,
    fairnessTeamMembers,
    domainSnapshot,
  };
}

export function downloadCareCheckBackup(
  input: CreateBackupInput,
): void {
  const backup =
    createCareCheckBackup(input);

  const json = JSON.stringify(
    backup,
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
    createBackupFileName();

  document.body.appendChild(link);
  link.click();

  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function readBackupFile(
  file: File,
): Promise<CareCheckBackup> {
  return new Promise(
    (resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => {
        try {
          const parsed = JSON.parse(
            String(reader.result),
          );

          resolve(
            parseCareCheckBackup(
              parsed,
            ),
          );
        } catch (error) {
          reject(
            error instanceof Error
              ? error
              : new Error(
                  "Die Backup-Datei konnte nicht gelesen werden.",
                ),
          );
        }
      };

      reader.onerror = () => {
        reject(
          new Error(
            "Die Backup-Datei konnte nicht gelesen werden.",
          ),
        );
      };

      reader.readAsText(file);
    },
  );
}

export function restoreCareCheckBackup(
  backup: CareCheckBackup,
): void {
  saveProfile(backup.profile);
  saveShifts(backup.shifts);
  saveShiftTemplates(
    backup.shiftTemplates,
  );

  const sourceBackupVersion =
    backup.sourceBackupVersion ??
    backup.backupVersion;

  if (
    sourceBackupVersion ===
    CURRENT_BACKUP_VERSION
  ) {
    savePlanningTemplates(
      backup.planningTemplates,
    );
    saveFairnessTeamMembers(
      backup.fairnessTeamMembers,
    );
  }
}
