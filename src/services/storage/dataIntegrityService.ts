import { defaultShiftTemplates } from "../../data/defaultShiftTemplates";
import type {
  ShiftTemplate,
  ShiftType,
} from "../../types/index";
import {
  isFairnessTeamMemberDraft,
} from "./fairnessTeamStorage";
import {
  isLocalChangeQueueEntry,
  LOCAL_CHANGE_QUEUE_KEY,
} from "./localChangeQueueStorage";
import type { PersistenceAdapter } from "./persistenceAdapter";
import { isPlanningTemplate } from "./planningTemplateStorage";
import { isUserProfile } from "./profileStorage";
import { isShift } from "./shiftStorage";

export type CareCheckIntegritySeverity =
  | "warning"
  | "error";

export interface CareCheckIntegrityIssue {
  key: string;
  severity: CareCheckIntegritySeverity;
  message: string;
}

export interface CareCheckIntegrityReport {
  checkedAt: string;
  status: "ok" | "warning" | "error";
  issues: CareCheckIntegrityIssue[];
}

export interface PreMigrationBackupEntry {
  key: string;
  value: unknown;
}

export interface PreMigrationBackup {
  id: string;
  createdAt: string;
  reason: string;
  entries: PreMigrationBackupEntry[];
  integrity: CareCheckIntegrityReport;
}

export interface IntegrityProtectedMigrationResult<T> {
  backup: PreMigrationBackup;
  result: T;
  integrityAfterMigration: CareCheckIntegrityReport;
}

interface IntegrityOptions {
  idFactory?: () => string;
  nowFactory?: () => string;
}

export const PRE_MIGRATION_BACKUPS_KEY =
  "carecheck.preMigrationBackups.v1";

const primaryDataKeys = [
  "carecheck.profile",
  "carecheck.shifts",
  "carecheck.shiftTemplates",
  "carecheck.planningTemplates.v1",
  "carecheck.fairnessTeam.v1",
  "carecheck.syncMetadata.v1",
  LOCAL_CHANGE_QUEUE_KEY,
] as const;

const shiftTemplateTypes = Object.keys(
  defaultShiftTemplates,
) as ShiftType[];

function createIsoTimestamp(): string {
  return new Date().toISOString();
}

function createDefaultId(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`;
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

function isShiftTemplates(value: unknown): boolean {
  if (!isRecord(value)) {
    return false;
  }

  return Object.entries(value).every(
    ([key, template]) =>
      shiftTemplateTypes.includes(
        key as ShiftType,
      ) && isShiftTemplate(template),
  );
}

function isSyncMetadata(value: unknown): boolean {
  return (
    isRecord(value) &&
    value.schemaVersion === 1 &&
    typeof value.deviceId === "string" &&
    value.deviceId.length > 0 &&
    typeof value.createdAt === "string" &&
    typeof value.updatedAt === "string" &&
    isRecord(value.entities)
  );
}

function validateValue(
  key: string,
  value: unknown,
): boolean {
  switch (key) {
    case "carecheck.profile":
      return isUserProfile(value);
    case "carecheck.shifts":
      return (
        Array.isArray(value) &&
        value.every(isShift)
      );
    case "carecheck.shiftTemplates":
      return isShiftTemplates(value);
    case "carecheck.planningTemplates.v1":
      return (
        Array.isArray(value) &&
        value.every(isPlanningTemplate)
      );
    case "carecheck.fairnessTeam.v1":
      return (
        Array.isArray(value) &&
        value.every(
          isFairnessTeamMemberDraft,
        )
      );
    case "carecheck.syncMetadata.v1":
      return isSyncMetadata(value);
    case LOCAL_CHANGE_QUEUE_KEY:
      return (
        Array.isArray(value) &&
        value.every(
          isLocalChangeQueueEntry,
        )
      );
    default:
      return true;
  }
}

function getStatus(
  issues: CareCheckIntegrityIssue[],
): CareCheckIntegrityReport["status"] {
  if (
    issues.some(
      (issue) =>
        issue.severity === "error",
    )
  ) {
    return "error";
  }

  return issues.length > 0
    ? "warning"
    : "ok";
}

function isIntegrityIssue(
  value: unknown,
): value is CareCheckIntegrityIssue {
  return (
    isRecord(value) &&
    typeof value.key === "string" &&
    (value.severity === "warning" ||
      value.severity === "error") &&
    typeof value.message === "string"
  );
}

function isIntegrityReport(
  value: unknown,
): value is CareCheckIntegrityReport {
  return (
    isRecord(value) &&
    typeof value.checkedAt === "string" &&
    (value.status === "ok" ||
      value.status === "warning" ||
      value.status === "error") &&
    Array.isArray(value.issues) &&
    value.issues.every(isIntegrityIssue)
  );
}

function isPreMigrationBackupEntry(
  value: unknown,
): value is PreMigrationBackupEntry {
  return (
    isRecord(value) &&
    typeof value.key === "string" &&
    "value" in value
  );
}

function isPreMigrationBackup(
  value: unknown,
): value is PreMigrationBackup {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    value.id.length > 0 &&
    typeof value.createdAt === "string" &&
    typeof value.reason === "string" &&
    Array.isArray(value.entries) &&
    value.entries.every(
      isPreMigrationBackupEntry,
    ) &&
    isIntegrityReport(value.integrity)
  );
}

export async function inspectCareCheckPersistenceIntegrity(
  adapter: PersistenceAdapter,
  options: IntegrityOptions = {},
): Promise<CareCheckIntegrityReport> {
  const checkedAt = options.nowFactory
    ? options.nowFactory()
    : createIsoTimestamp();
  const issues: CareCheckIntegrityIssue[] = [];

  for (const key of primaryDataKeys) {
    try {
      const value =
        await adapter.get<unknown>(key);

      if (value === null) {
        continue;
      }

      if (!validateValue(key, value)) {
        issues.push({
          key,
          severity: "error",
          message:
            "Gespeicherter CareCheck-Datenbereich ist ungueltig.",
        });
      }
    } catch {
      issues.push({
        key,
        severity: "error",
        message:
          "Gespeicherter CareCheck-Datenbereich konnte nicht gelesen werden.",
      });
    }
  }

  return {
    checkedAt,
    status: getStatus(issues),
    issues,
  };
}

export async function createPreMigrationBackup(
  adapter: PersistenceAdapter,
  reason: string,
  options: IntegrityOptions = {},
): Promise<PreMigrationBackup> {
  const createdAt = options.nowFactory
    ? options.nowFactory()
    : createIsoTimestamp();
  const id = options.idFactory
    ? options.idFactory()
    : createDefaultId();
  const entries: PreMigrationBackupEntry[] =
    [];

  for (const key of primaryDataKeys) {
    entries.push({
      key,
      value:
        await adapter.get<unknown>(key),
    });
  }

  const backup: PreMigrationBackup = {
    id,
    createdAt,
    reason,
    entries,
    integrity:
      await inspectCareCheckPersistenceIntegrity(
        adapter,
        {
          nowFactory: () => createdAt,
        },
      ),
  };
  const existing =
    (await adapter.get<unknown>(
      PRE_MIGRATION_BACKUPS_KEY,
    )) ?? [];
  const backups = Array.isArray(existing)
    ? existing.filter(isPreMigrationBackup)
    : [];

  await adapter.set(
    PRE_MIGRATION_BACKUPS_KEY,
    [...backups, backup].slice(-5),
  );

  return backup;
}

export async function runWithPreMigrationBackup<T>(
  adapter: PersistenceAdapter,
  reason: string,
  migrate: () => Promise<T>,
  options: IntegrityOptions = {},
): Promise<IntegrityProtectedMigrationResult<T>> {
  const backup =
    await createPreMigrationBackup(
      adapter,
      reason,
      options,
    );
  const result = await migrate();
  const integrityAfterMigration =
    await inspectCareCheckPersistenceIntegrity(
      adapter,
    );

  return {
    backup,
    result,
    integrityAfterMigration,
  };
}
