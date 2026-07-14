export type SyncEntityDomain =
  | "profile"
  | "shifts"
  | "shiftTemplates"
  | "planningTemplates"
  | "fairnessTeam";

export interface SyncConflictMetadata {
  reason: string;
  detectedAt: string;
  remoteRevision?: string;
}

export interface SyncEntityMetadata {
  localId: string;
  domain: SyncEntityDomain;
  entityId: string;
  localRevision: number;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  lastSyncedAt?: string;
  remoteRevision?: string;
  conflict?: SyncConflictMetadata;
}

export interface SyncMetadataState {
  schemaVersion: 1;
  deviceId: string;
  createdAt: string;
  updatedAt: string;
  entities: Record<string, SyncEntityMetadata>;
}

interface SyncMetadataOptions {
  idFactory?: () => string;
  nowFactory?: () => string;
}

const SYNC_METADATA_KEY =
  "carecheck.syncMetadata.v1";

const syncDomains =
  new Set<SyncEntityDomain>([
    "profile",
    "shifts",
    "shiftTemplates",
    "planningTemplates",
    "fairnessTeam",
  ]);

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

function createIsoTimestamp(): string {
  return new Date().toISOString();
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

function isSyncEntityDomain(
  value: unknown,
): value is SyncEntityDomain {
  return (
    typeof value === "string" &&
    syncDomains.has(
      value as SyncEntityDomain,
    )
  );
}

function getNow(
  options: SyncMetadataOptions = {},
): string {
  return options.nowFactory
    ? options.nowFactory()
    : createIsoTimestamp();
}

function createDeviceId(
  options: SyncMetadataOptions = {},
): string {
  const id = options.idFactory
    ? options.idFactory()
    : createDefaultId();

  return `carecheck-device-${id}`;
}

export function createSyncEntityKey(
  domain: SyncEntityDomain,
  entityId: string,
): string {
  return `${domain}:${entityId}`;
}

export function createEmptySyncMetadataState(
  options: SyncMetadataOptions = {},
): SyncMetadataState {
  const now = getNow(options);

  return {
    schemaVersion: 1,
    deviceId: createDeviceId(options),
    createdAt: now,
    updatedAt: now,
    entities: {},
  };
}

function isSyncConflictMetadata(
  value: unknown,
): value is SyncConflictMetadata {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.reason === "string" &&
    value.reason.trim().length > 0 &&
    isIsoTimestamp(value.detectedAt) &&
    (value.remoteRevision === undefined ||
      typeof value.remoteRevision ===
        "string")
  );
}

function isSyncEntityMetadata(
  value: unknown,
): value is SyncEntityMetadata {
  if (!isRecord(value)) {
    return false;
  }

  const localRevision =
    value.localRevision;

  return (
    typeof value.localId === "string" &&
    value.localId.length > 0 &&
    isSyncEntityDomain(value.domain) &&
    typeof value.entityId === "string" &&
    value.entityId.length > 0 &&
    typeof localRevision === "number" &&
    Number.isInteger(localRevision) &&
    localRevision >= 1 &&
    isIsoTimestamp(value.createdAt) &&
    isIsoTimestamp(value.updatedAt) &&
    (value.deletedAt === undefined ||
      isIsoTimestamp(value.deletedAt)) &&
    (value.lastSyncedAt === undefined ||
      isIsoTimestamp(value.lastSyncedAt)) &&
    (value.remoteRevision === undefined ||
      typeof value.remoteRevision ===
        "string") &&
    (value.conflict === undefined ||
      isSyncConflictMetadata(value.conflict))
  );
}

function parseSyncMetadataState(
  value: unknown,
  options: SyncMetadataOptions = {},
): SyncMetadataState {
  if (
    !isRecord(value) ||
    value.schemaVersion !== 1 ||
    typeof value.deviceId !== "string" ||
    value.deviceId.length === 0 ||
    !isIsoTimestamp(value.createdAt) ||
    !isIsoTimestamp(value.updatedAt) ||
    !isRecord(value.entities)
  ) {
    return createEmptySyncMetadataState(options);
  }

  const entities = Object.fromEntries(
    Object.entries(value.entities).filter(
      ([key, entity]) =>
        isSyncEntityMetadata(entity) &&
        key ===
          createSyncEntityKey(
            entity.domain,
            entity.entityId,
          ),
    ),
  ) as Record<string, SyncEntityMetadata>;

  return {
    schemaVersion: 1,
    deviceId: value.deviceId,
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
    entities,
  };
}

export function loadSyncMetadataState(
  options: SyncMetadataOptions = {},
): SyncMetadataState {
  const raw = localStorage.getItem(
    SYNC_METADATA_KEY,
  );

  if (!raw) {
    return createEmptySyncMetadataState(
      options,
    );
  }

  try {
    return parseSyncMetadataState(
      JSON.parse(raw),
      options,
    );
  } catch {
    return createEmptySyncMetadataState(
      options,
    );
  }
}

export function saveSyncMetadataState(
  state: SyncMetadataState,
): void {
  localStorage.setItem(
    SYNC_METADATA_KEY,
    JSON.stringify(state),
  );
}

export function applySyncEntityChange(
  state: SyncMetadataState,
  domain: SyncEntityDomain,
  entityId: string,
  options: SyncMetadataOptions = {},
): SyncMetadataState {
  const now = getNow(options);
  const key = createSyncEntityKey(
    domain,
    entityId,
  );
  const existing = state.entities[key];

  const entity: SyncEntityMetadata = existing
    ? {
        ...existing,
        localRevision:
          existing.localRevision + 1,
        updatedAt: now,
        deletedAt: undefined,
      }
    : {
        localId: key,
        domain,
        entityId,
        localRevision: 1,
        createdAt: now,
        updatedAt: now,
      };

  return {
    ...state,
    updatedAt: now,
    entities: {
      ...state.entities,
      [key]: entity,
    },
  };
}

export function applySyncEntityDeletion(
  state: SyncMetadataState,
  domain: SyncEntityDomain,
  entityId: string,
  options: SyncMetadataOptions = {},
): SyncMetadataState {
  const changedState = applySyncEntityChange(
    state,
    domain,
    entityId,
    options,
  );
  const now = getNow(options);
  const key = createSyncEntityKey(
    domain,
    entityId,
  );

  return {
    ...changedState,
    updatedAt: now,
    entities: {
      ...changedState.entities,
      [key]: {
        ...changedState.entities[key],
        deletedAt: now,
      },
    },
  };
}

export function applySyncEntityConflict(
  state: SyncMetadataState,
  domain: SyncEntityDomain,
  entityId: string,
  reason: string,
  options: SyncMetadataOptions & {
    remoteRevision?: string;
  } = {},
): SyncMetadataState {
  const changedState = applySyncEntityChange(
    state,
    domain,
    entityId,
    options,
  );
  const now = getNow(options);
  const key = createSyncEntityKey(
    domain,
    entityId,
  );

  return {
    ...changedState,
    updatedAt: now,
    entities: {
      ...changedState.entities,
      [key]: {
        ...changedState.entities[key],
        conflict: {
          reason,
          detectedAt: now,
          remoteRevision:
            options.remoteRevision,
        },
      },
    },
  };
}

export function markSyncEntityChanged(
  domain: SyncEntityDomain,
  entityId: string,
  options: SyncMetadataOptions = {},
): void {
  saveSyncMetadataState(
    applySyncEntityChange(
      loadSyncMetadataState(options),
      domain,
      entityId,
      options,
    ),
  );
}

export function markSyncEntityDeleted(
  domain: SyncEntityDomain,
  entityId: string,
  options: SyncMetadataOptions = {},
): void {
  saveSyncMetadataState(
    applySyncEntityDeletion(
      loadSyncMetadataState(options),
      domain,
      entityId,
      options,
    ),
  );
}
