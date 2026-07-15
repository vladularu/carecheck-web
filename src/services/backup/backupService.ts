import type {
  Shift,
  ShiftTemplate,
  ShiftTemplates,
  ShiftType,
  UserProfile,
} from "../../types/index";
import { defaultShiftTemplates } from "../../data/defaultShiftTemplates";
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

export type BackupImportIssueScope =
  | "shifts"
  | "shiftTemplates"
  | "planningTemplates"
  | "fairnessTeamMembers";

export interface BackupImportIssue {
  scope: BackupImportIssueScope;
  severity: "warning";
  index?: number;
  key?: string;
  message: string;
}

interface RawCareCheckBackup {
  app: "CareCheck TVöD";
  backupVersion: SupportedBackupVersion;
  exportedAt: string;
  profile: UserProfile;
  shifts: unknown[];
  shiftTemplates: Record<string, unknown>;
  planningTemplates?: unknown;
  fairnessTeamMembers?: unknown;
  domainSnapshot?: unknown;
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
  importIssues?: BackupImportIssue[];
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
): value is RawCareCheckBackup {
  if (!isRecord(value)) {
    return false;
  }

  return (
    value.app === "CareCheck TVöD" &&
    isSupportedBackupVersion(
      value.backupVersion,
    ) &&
    typeof value.exportedAt === "string" &&
    isUserProfile(value.profile) &&
    Array.isArray(value.shifts) &&
    isRecord(value.shiftTemplates)
  );
}

const shiftTemplateTypes = Object.keys(
  defaultShiftTemplates,
) as ShiftType[];

function isShiftTemplateType(
  value: string,
): value is ShiftType {
  return shiftTemplateTypes.includes(
    value as ShiftType,
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

function createImportIssue(
  input: Omit<
    BackupImportIssue,
    "severity" | "message"
  > & {
    message?: string;
  },
): BackupImportIssue {
  return {
    ...input,
    severity: "warning",
    message:
      input.message ??
      "Beschaedigter Datensatz wurde uebersprungen.",
  };
}

function collectValidBackupItems<T>(
  values: unknown[],
  validator: (value: unknown) => value is T,
  scope: BackupImportIssueScope,
): {
  items: T[];
  issues: BackupImportIssue[];
} {
  const items: T[] = [];
  const issues: BackupImportIssue[] = [];

  values.forEach((value, index) => {
    if (validator(value)) {
      items.push(value);
      return;
    }

    issues.push(
      createImportIssue({
        scope,
        index,
      }),
    );
  });

  return {
    items,
    issues,
  };
}

function readOptionalBackupList(
  value: unknown,
  scope: BackupImportIssueScope,
): {
  values: unknown[];
  issues: BackupImportIssue[];
} {
  if (Array.isArray(value)) {
    return {
      values: value,
      issues: [],
    };
  }

  return {
    values: [],
    issues: [
      createImportIssue({
        scope,
        message:
          "Backup-Bereich fehlt oder ist beschaedigt und wurde leer importiert.",
      }),
    ],
  };
}

function collectOptionalBackupItems<T>(
  value: unknown,
  validator: (value: unknown) => value is T,
  scope: BackupImportIssueScope,
): {
  items: T[];
  issues: BackupImportIssue[];
} {
  const list = readOptionalBackupList(
    value,
    scope,
  );
  const collected =
    collectValidBackupItems(
      list.values,
      validator,
      scope,
    );

  return {
    items: collected.items,
    issues: [
      ...list.issues,
      ...collected.issues,
    ],
  };
}

function sanitizeShiftTemplates(
  value: Record<string, unknown>,
): {
  shiftTemplates: ShiftTemplates;
  issues: BackupImportIssue[];
} {
  const shiftTemplates: ShiftTemplates = {
    ...defaultShiftTemplates,
  };
  const issues: BackupImportIssue[] = [];

  Object.entries(value).forEach(
    ([key, template]) => {
      if (!isShiftTemplateType(key)) {
        issues.push(
          createImportIssue({
            scope: "shiftTemplates",
            key,
          }),
        );
        return;
      }

      if (!isShiftTemplate(template)) {
        issues.push(
          createImportIssue({
            scope: "shiftTemplates",
            key,
          }),
        );
        return;
      }

      shiftTemplates[key] = template;
    },
  );

  return {
    shiftTemplates,
    issues,
  };
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
  const shifts =
    collectValidBackupItems(
      value.shifts,
      isShift,
      "shifts",
    );
  const shiftTemplates =
    sanitizeShiftTemplates(
      value.shiftTemplates,
    );
  const planningTemplates =
    sourceBackupVersion ===
    CURRENT_BACKUP_VERSION
      ? collectOptionalBackupItems(
          value.planningTemplates,
          isPlanningTemplate,
          "planningTemplates",
        )
      : {
          items: [],
          issues: [],
        };
  const fairnessTeamMembers =
    sourceBackupVersion ===
    CURRENT_BACKUP_VERSION
      ? collectOptionalBackupItems(
          value.fairnessTeamMembers,
          isFairnessTeamMemberDraft,
          "fairnessTeamMembers",
        )
      : {
          items: [],
          issues: [],
        };
  const importIssues = [
    ...shifts.issues,
    ...shiftTemplates.issues,
    ...planningTemplates.issues,
    ...fairnessTeamMembers.issues,
  ];
  const domainSnapshot =
    createDomainSnapshot({
      profile: value.profile,
      shifts: shifts.items,
      shiftTemplates:
        shiftTemplates.shiftTemplates,
      planningTemplates:
        planningTemplates.items,
      fairnessTeamMembers:
        fairnessTeamMembers.items,
      migratedAt: value.exportedAt,
    });

  return {
    app: "CareCheck TVöD",
    backupVersion:
      CURRENT_BACKUP_VERSION,
    sourceBackupVersion,
    exportedAt: value.exportedAt,
    profile: value.profile,
    shifts: shifts.items,
    shiftTemplates:
      shiftTemplates.shiftTemplates,
    planningTemplates:
      planningTemplates.items,
    fairnessTeamMembers:
      fairnessTeamMembers.items,
    domainSnapshot,
    importIssues,
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
