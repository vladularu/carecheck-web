import type {
  SyncCursor,
  SyncPullRequest,
  SyncPullResponse,
  SyncPushChange,
  SyncPushRequest,
  SyncPushResponse,
  SyncRemoteChange,
} from "./syncProtocol";
import {
  createEmptySyncCursor,
  isSyncPushChange,
  SYNC_PROTOCOL_VERSION,
} from "./syncProtocol";
import { resolveSyncConflict } from "./syncConflictRules";

interface MockSyncServerOptions {
  nowFactory?: () => string;
}

export interface MockSyncSnapshot {
  cursor: SyncCursor;
  records: SyncRemoteChange[];
  history: SyncRemoteChange[];
  acceptedChangeIds: string[];
}

export interface MockSyncServer {
  push: (
    request: SyncPushRequest,
  ) => SyncPushResponse;
  pull: (
    request: SyncPullRequest,
  ) => SyncPullResponse;
  inspect: () => MockSyncSnapshot;
}

function createIsoTimestamp(): string {
  return new Date().toISOString();
}

function createRecordKey(
  change: Pick<
    SyncRemoteChange,
    "domain" | "entityId"
  >,
): string {
  return `${change.domain}:${change.entityId}`;
}

function createRemoteRevision(
  sequence: number,
): string {
  return `mock-${sequence}`;
}

function createRemoteChange(
  change: SyncPushChange,
  sequence: number,
  now: string,
): SyncRemoteChange {
  const changedAt = change.queuedAt || now;

  return {
    remoteRevision:
      createRemoteRevision(sequence),
    sequence,
    domain: change.domain,
    entityId: change.entityId,
    operation: change.operation,
    changedAt,
    sourceDeviceId: change.deviceId,
    payload:
      change.operation === "delete"
        ? undefined
        : change.payload,
    deletedAt:
      change.operation === "delete"
        ? changedAt
        : undefined,
  };
}

function getChangesAfter(
  history: SyncRemoteChange[],
  cursor: SyncCursor,
): SyncRemoteChange[] {
  return history.filter(
    (change) =>
      change.sequence > cursor.revision,
  );
}

export function createMockSyncServer(
  options: MockSyncServerOptions = {},
): MockSyncServer {
  const records = new Map<
    string,
    SyncRemoteChange
  >();
  const acceptedChangeIds =
    new Set<string>();
  const history: SyncRemoteChange[] = [];
  let sequence = 0;

  function getNow(): string {
    return options.nowFactory
      ? options.nowFactory()
      : createIsoTimestamp();
  }

  function getCursor(): SyncCursor {
    return {
      revision: sequence,
    };
  }

  return {
    push(request) {
      const accepted: string[] = [];
      const duplicates: string[] = [];
      const rejected: SyncPushResponse["rejectedChanges"] =
        [];

      request.changes.forEach((rawChange: unknown) => {
        if (!isSyncPushChange(rawChange)) {
          const partialChange =
            rawChange &&
            typeof rawChange === "object"
              ? (rawChange as {
                  changeId?: unknown;
                })
              : {};

          rejected.push({
            changeId:
              typeof partialChange.changeId ===
              "string"
                ? partialChange.changeId
                : "invalid",
            reason: "invalid-change",
          });
          return;
        }

        const change = rawChange;

        if (
          acceptedChangeIds.has(
            change.changeId,
          )
        ) {
          duplicates.push(change.changeId);
          return;
        }

        const key = createRecordKey(change);
        const current = records.get(key);

        if (
          current &&
          current.sourceDeviceId !==
            request.deviceId &&
          change.baseRemoteRevision !==
            current.remoteRevision
        ) {
          const resolution =
            resolveSyncConflict({
              domain: change.domain,
              entityId: change.entityId,
              local: {
                revision:
                  change.localRevision ?? 1,
                updatedAt: change.queuedAt,
                deviceId: request.deviceId,
                deletedAt:
                  change.operation ===
                  "delete"
                    ? change.queuedAt
                    : undefined,
                remoteRevision:
                  change.baseRemoteRevision,
              },
              remote: {
                revision: current.sequence,
                updatedAt: current.changedAt,
                deviceId:
                  current.sourceDeviceId,
                deletedAt: current.deletedAt,
                remoteRevision:
                  current.remoteRevision,
              },
            });

          rejected.push({
            changeId: change.changeId,
            domain: change.domain,
            entityId: change.entityId,
            reason: "remote-newer",
            remoteRevision:
              resolution.remoteRevision ??
              current.remoteRevision,
          });
          return;
        }

        sequence += 1;
        const remoteChange =
          createRemoteChange(
            change,
            sequence,
            getNow(),
          );

        records.set(key, remoteChange);
        history.push(remoteChange);
        acceptedChangeIds.add(
          change.changeId,
        );
        accepted.push(change.changeId);
      });

      return {
        protocolVersion:
          SYNC_PROTOCOL_VERSION,
        cursor: getCursor(),
        acceptedChangeIds: accepted,
        duplicateChangeIds: duplicates,
        rejectedChanges: rejected,
        changes: getChangesAfter(
          history,
          request.cursor,
        ),
      };
    },

    pull(request) {
      return {
        protocolVersion:
          SYNC_PROTOCOL_VERSION,
        cursor: getCursor(),
        changes: getChangesAfter(
          history,
          request.cursor ??
            createEmptySyncCursor(),
        ),
      };
    },

    inspect() {
      return {
        cursor: getCursor(),
        records: Array.from(
          records.values(),
        ),
        history: [...history],
        acceptedChangeIds: Array.from(
          acceptedChangeIds,
        ),
      };
    },
  };
}
