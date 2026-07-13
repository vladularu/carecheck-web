import type {
  Shift,
  ShiftTemplates,
  UserProfile,
} from "../../types/index";
import { saveProfile } from "../storage/profileStorage";
import { saveShifts } from "../storage/shiftStorage";
import { saveShiftTemplates } from "../storage/shiftTemplateStorage";

const CURRENT_BACKUP_VERSION = 2 as const;

interface LegacyCareCheckBackup {
  app: "CareCheck TVöD";
  backupVersion: 1;
  exportedAt: string;
  profile: UserProfile;
  shifts: Shift[];
  shiftTemplates: ShiftTemplates;
}

export interface CareCheckBackup {
  app: "CareCheck TVöD";
  backupVersion: typeof CURRENT_BACKUP_VERSION;
  exportedAt: string;
  profile: UserProfile;
  shifts: Shift[];
  shiftTemplates: ShiftTemplates;
}

interface CreateBackupInput {
  profile: UserProfile;
  shifts: Shift[];
  shiftTemplates: ShiftTemplates;
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
): value is 1 | 2 {
  return value === 1 || value === 2;
}

function isBackupStructure(
  value: unknown,
): value is
  | LegacyCareCheckBackup
  | CareCheckBackup {
  if (!isRecord(value)) {
    return false;
  }

  return (
    value.app === "CareCheck TVöD" &&
    isSupportedBackupVersion(
      value.backupVersion,
    ) &&
    typeof value.exportedAt === "string" &&
    isRecord(value.profile) &&
    Array.isArray(value.shifts) &&
    isRecord(value.shiftTemplates)
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

  return {
    app: "CareCheck TVöD",
    backupVersion:
      CURRENT_BACKUP_VERSION,
    exportedAt: value.exportedAt,
    profile: value.profile,
    shifts: value.shifts,
    shiftTemplates:
      value.shiftTemplates,
  };
}

export function createCareCheckBackup({
  profile,
  shifts,
  shiftTemplates,
}: CreateBackupInput): CareCheckBackup {
  return {
    app: "CareCheck TVöD",
    backupVersion:
      CURRENT_BACKUP_VERSION,
    exportedAt:
      new Date().toISOString(),
    profile,
    shifts,
    shiftTemplates,
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
}
