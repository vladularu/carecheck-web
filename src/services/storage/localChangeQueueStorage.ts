import type { SyncEntityDomain } from "./syncMetadataStorage";
import type { PersistenceAdapter } from "./persistenceAdapter";

export type LocalChangeOperation =
  | "upsert"
  | "delete";

export interface LocalChangeQueueEntry {
  id: string;
  domain: SyncEntityDomain;
  entityId: string;
  operation: LocalChangeOperation;
  queuedAt: string;
  localRevision?: number;
}

interface LocalChangeQueueOptions {
  idFactory?: () => string;
  nowFactory?: () => string;
}

export const LOCAL_CHANGE_QUEUE_KEY =
  "carecheck.localChangeQueue.v1";

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

function isQueuedAt(
  value: unknown,
): value is string {
  return (
    typeof value === "string" &&
    !Number.isNaN(Date.parse(value))
  );
}

function isLocalChangeOperation(
  value: unknown,
): value is LocalChangeOperation {
  return (
    value === "upsert" ||
    value === "delete"
  );
}

export function isLocalChangeQueueEntry(
  value: unknown,
): value is LocalChangeQueueEntry {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.id === "string" &&
    value.id.length > 0 &&
    syncDomains.has(
      value.domain as SyncEntityDomain,
    ) &&
    typeof value.entityId === "string" &&
    value.entityId.length > 0 &&
    isLocalChangeOperation(
      value.operation,
    ) &&
    isQueuedAt(value.queuedAt) &&
    (value.localRevision === undefined ||
      (typeof value.localRevision ===
        "number" &&
        Number.isInteger(
          value.localRevision,
        ) &&
        value.localRevision >= 1))
  );
}

export function createLocalChangeQueueEntry(
  input: Omit<
    LocalChangeQueueEntry,
    "id" | "queuedAt"
  >,
  options: LocalChangeQueueOptions = {},
): LocalChangeQueueEntry {
  const id = options.idFactory
    ? options.idFactory()
    : createDefaultId();
  const queuedAt = options.nowFactory
    ? options.nowFactory()
    : createIsoTimestamp();

  return {
    ...input,
    id,
    queuedAt,
  };
}

export async function loadLocalChangeQueue(
  adapter: PersistenceAdapter,
): Promise<LocalChangeQueueEntry[]> {
  const value =
    await adapter.get<unknown>(
      LOCAL_CHANGE_QUEUE_KEY,
    );

  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(
    isLocalChangeQueueEntry,
  );
}

export async function saveLocalChangeQueue(
  adapter: PersistenceAdapter,
  entries: LocalChangeQueueEntry[],
): Promise<void> {
  await adapter.set(
    LOCAL_CHANGE_QUEUE_KEY,
    entries.filter(
      isLocalChangeQueueEntry,
    ),
  );
}

export async function enqueueLocalChange(
  adapter: PersistenceAdapter,
  entry: LocalChangeQueueEntry,
): Promise<LocalChangeQueueEntry[]> {
  const entries =
    await loadLocalChangeQueue(adapter);
  const nextEntries = [
    ...entries,
    entry,
  ];

  await saveLocalChangeQueue(
    adapter,
    nextEntries,
  );

  return nextEntries;
}

export async function removeLocalChangeEntries(
  adapter: PersistenceAdapter,
  entryIds: string[],
): Promise<LocalChangeQueueEntry[]> {
  const ids = new Set(entryIds);
  const nextEntries = (
    await loadLocalChangeQueue(adapter)
  ).filter((entry) => !ids.has(entry.id));

  await saveLocalChangeQueue(
    adapter,
    nextEntries,
  );

  return nextEntries;
}
