import type {
  LocalChangeQueueEntry,
  LocalChangeOperation,
} from "../storage/localChangeQueueStorage";
import type { SyncEntityDomain } from "../storage/syncMetadataStorage";

export const SYNC_PROTOCOL_VERSION = 1 as const;

export const SYNC_ENTITY_DOMAINS = [
  "profile",
  "shifts",
  "shiftTemplates",
  "planningTemplates",
  "fairnessTeam",
] as const satisfies SyncEntityDomain[];

export interface SyncCursor {
  revision: number;
}

export interface SyncPushChange {
  changeId: string;
  deviceId: string;
  domain: SyncEntityDomain;
  entityId: string;
  operation: LocalChangeOperation;
  queuedAt: string;
  localRevision?: number;
  baseRemoteRevision?: string;
  payload?: unknown;
}

export interface SyncRemoteChange {
  remoteRevision: string;
  sequence: number;
  domain: SyncEntityDomain;
  entityId: string;
  operation: LocalChangeOperation;
  changedAt: string;
  sourceDeviceId: string;
  payload?: unknown;
  deletedAt?: string;
}

export interface SyncPushRequest {
  protocolVersion: typeof SYNC_PROTOCOL_VERSION;
  deviceId: string;
  cursor: SyncCursor;
  changes: SyncPushChange[];
}

export type SyncRejectedChangeReason =
  | "invalid-change"
  | "remote-newer";

export interface SyncRejectedChange {
  changeId: string;
  domain?: SyncEntityDomain;
  entityId?: string;
  reason: SyncRejectedChangeReason;
  remoteRevision?: string;
}

export interface SyncPushResponse {
  protocolVersion: typeof SYNC_PROTOCOL_VERSION;
  cursor: SyncCursor;
  acceptedChangeIds: string[];
  duplicateChangeIds: string[];
  rejectedChanges: SyncRejectedChange[];
  changes: SyncRemoteChange[];
}

export interface SyncPullRequest {
  protocolVersion: typeof SYNC_PROTOCOL_VERSION;
  deviceId: string;
  cursor: SyncCursor;
}

export interface SyncPullResponse {
  protocolVersion: typeof SYNC_PROTOCOL_VERSION;
  cursor: SyncCursor;
  changes: SyncRemoteChange[];
}

interface QueueChangeOptions {
  deviceId: string;
  baseRemoteRevision?: string;
  payload?: unknown;
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

function isIsoTimestamp(
  value: unknown,
): value is string {
  return (
    typeof value === "string" &&
    !Number.isNaN(Date.parse(value))
  );
}

export function isSyncEntityDomain(
  value: unknown,
): value is SyncEntityDomain {
  return (
    typeof value === "string" &&
    SYNC_ENTITY_DOMAINS.includes(
      value as SyncEntityDomain,
    )
  );
}

export function createEmptySyncCursor(): SyncCursor {
  return {
    revision: 0,
  };
}

export function createSyncChangeId(
  deviceId: string,
  queueEntryId: string,
): string {
  return `${deviceId}:${queueEntryId}`;
}

export function createSyncPushChangeFromQueueEntry(
  entry: LocalChangeQueueEntry,
  options: QueueChangeOptions,
): SyncPushChange {
  return {
    changeId: createSyncChangeId(
      options.deviceId,
      entry.id,
    ),
    deviceId: options.deviceId,
    domain: entry.domain,
    entityId: entry.entityId,
    operation: entry.operation,
    queuedAt: entry.queuedAt,
    localRevision: entry.localRevision,
    baseRemoteRevision:
      options.baseRemoteRevision,
    payload: options.payload,
  };
}

export function isSyncCursor(
  value: unknown,
): value is SyncCursor {
  return (
    isRecord(value) &&
    typeof value.revision === "number" &&
    Number.isInteger(value.revision) &&
    value.revision >= 0
  );
}

export function isSyncPushChange(
  value: unknown,
): value is SyncPushChange {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.changeId === "string" &&
    value.changeId.length > 0 &&
    typeof value.deviceId === "string" &&
    value.deviceId.length > 0 &&
    isSyncEntityDomain(value.domain) &&
    typeof value.entityId === "string" &&
    value.entityId.length > 0 &&
    (value.operation === "upsert" ||
      value.operation === "delete") &&
    isIsoTimestamp(value.queuedAt) &&
    (value.localRevision === undefined ||
      (typeof value.localRevision ===
        "number" &&
        Number.isInteger(
          value.localRevision,
        ) &&
        value.localRevision >= 1)) &&
    (value.baseRemoteRevision ===
      undefined ||
      typeof value.baseRemoteRevision ===
        "string")
  );
}

export function isSyncRemoteChange(
  value: unknown,
): value is SyncRemoteChange {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.remoteRevision ===
      "string" &&
    value.remoteRevision.length > 0 &&
    typeof value.sequence === "number" &&
    Number.isInteger(value.sequence) &&
    value.sequence >= 1 &&
    isSyncEntityDomain(value.domain) &&
    typeof value.entityId === "string" &&
    value.entityId.length > 0 &&
    (value.operation === "upsert" ||
      value.operation === "delete") &&
    isIsoTimestamp(value.changedAt) &&
    typeof value.sourceDeviceId ===
      "string" &&
    value.sourceDeviceId.length > 0 &&
    (value.deletedAt === undefined ||
      isIsoTimestamp(value.deletedAt))
  );
}

export function createSyncPushRequest(
  input: Omit<
    SyncPushRequest,
    "protocolVersion"
  >,
): SyncPushRequest {
  return {
    protocolVersion:
      SYNC_PROTOCOL_VERSION,
    ...input,
  };
}

export function createSyncPullRequest(
  input: Omit<
    SyncPullRequest,
    "protocolVersion"
  >,
): SyncPullRequest {
  return {
    protocolVersion:
      SYNC_PROTOCOL_VERSION,
    ...input,
  };
}
