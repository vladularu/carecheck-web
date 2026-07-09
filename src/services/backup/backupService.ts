import type { Shift, ShiftTemplates, UserProfile } from "../../types/index";
import { saveProfile } from "../storage/profileStorage";
import { saveShifts } from "../storage/shiftStorage";
import { saveShiftTemplates } from "../storage/shiftTemplateStorage";

export interface CareCheckBackup {
  app: "CareCheck TVöD";
  backupVersion: 1;
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
  const date = new Date().toISOString().slice(0, 10);
  return `CareCheck_Backup_${date}.json`;
}

function isCareCheckBackup(value: unknown): value is CareCheckBackup {
  if (!value || typeof value !== "object") {
    return false;
  }

  const backup = value as Partial<CareCheckBackup>;

  return (
    backup.app === "CareCheck TVöD" &&
    backup.backupVersion === 1 &&
    typeof backup.exportedAt === "string" &&
    typeof backup.profile === "object" &&
    Array.isArray(backup.shifts) &&
    typeof backup.shiftTemplates === "object"
  );
}

export function createCareCheckBackup({
  profile,
  shifts,
  shiftTemplates,
}: CreateBackupInput): CareCheckBackup {
  return {
    app: "CareCheck TVöD",
    backupVersion: 1,
    exportedAt: new Date().toISOString(),
    profile,
    shifts,
    shiftTemplates,
  };
}

export function downloadCareCheckBackup(input: CreateBackupInput): void {
  const backup = createCareCheckBackup(input);
  const json = JSON.stringify(backup, null, 2);

  const blob = new Blob([json], {
    type: "application/json;charset=utf-8",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = createBackupFileName();

  document.body.appendChild(link);
  link.click();

  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function readBackupFile(file: File): Promise<CareCheckBackup> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));

        if (!isCareCheckBackup(parsed)) {
          reject(new Error("Die Datei ist kein gültiges CareCheck-Backup."));
          return;
        }

        resolve(parsed);
      } catch {
        reject(new Error("Die Backup-Datei konnte nicht gelesen werden."));
      }
    };

    reader.onerror = () => {
      reject(new Error("Die Backup-Datei konnte nicht gelesen werden."));
    };

    reader.readAsText(file);
  });
}

export function restoreCareCheckBackup(backup: CareCheckBackup): void {
  saveProfile(backup.profile);
  saveShifts(backup.shifts);
  saveShiftTemplates(backup.shiftTemplates);
}