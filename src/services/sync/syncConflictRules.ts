import type { SyncEntityDomain } from "../storage/syncMetadataStorage";

export type SyncConflictPolicy =
  | "singleton-last-write-wins"
  | "template-last-write-wins"
  | "tombstone-aware-last-write-wins";

export type SyncConflictWinner =
  | "local"
  | "remote";

export type SyncConflictAction =
  | "keep-local"
  | "apply-remote"
  | "keep-local-delete"
  | "apply-remote-delete";

export interface SyncComparableRecord {
  revision: number;
  updatedAt: string;
  deviceId: string;
  deletedAt?: string;
  remoteRevision?: string;
}

export interface SyncConflictInput {
  domain: SyncEntityDomain;
  entityId: string;
  local?: SyncComparableRecord;
  remote?: SyncComparableRecord;
}

export interface SyncConflictResolution {
  domain: SyncEntityDomain;
  entityId: string;
  policy: SyncConflictPolicy;
  winner: SyncConflictWinner;
  action: SyncConflictAction;
  reason: string;
  remoteRevision?: string;
}

export const SYNC_CONFLICT_POLICIES: Record<
  SyncEntityDomain,
  SyncConflictPolicy
> = {
  profile: "singleton-last-write-wins",
  shifts: "tombstone-aware-last-write-wins",
  shiftTemplates: "template-last-write-wins",
  planningTemplates:
    "tombstone-aware-last-write-wins",
  fairnessTeam:
    "tombstone-aware-last-write-wins",
};

function compareIsoTimestamp(
  left: string,
  right: string,
): number {
  return (
    new Date(left).getTime() -
    new Date(right).getTime()
  );
}

function compareRecords(
  local: SyncComparableRecord,
  remote: SyncComparableRecord,
): SyncConflictWinner {
  if (local.revision !== remote.revision) {
    return local.revision > remote.revision
      ? "local"
      : "remote";
  }

  const updatedAtDifference =
    compareIsoTimestamp(
      local.updatedAt,
      remote.updatedAt,
    );

  if (updatedAtDifference !== 0) {
    return updatedAtDifference > 0
      ? "local"
      : "remote";
  }

  return local.deviceId >= remote.deviceId
    ? "local"
    : "remote";
}

function createAction(
  winner: SyncConflictWinner,
  record: SyncComparableRecord,
): SyncConflictAction {
  if (winner === "local") {
    return record.deletedAt
      ? "keep-local-delete"
      : "keep-local";
  }

  return record.deletedAt
    ? "apply-remote-delete"
    : "apply-remote";
}

function isTombstoneWinner(
  deletedRecord: SyncComparableRecord,
  otherRecord: SyncComparableRecord,
): boolean {
  if (!deletedRecord.deletedAt) {
    return false;
  }

  if (deletedRecord.revision > otherRecord.revision) {
    return true;
  }

  if (deletedRecord.revision < otherRecord.revision) {
    return false;
  }

  return (
    compareIsoTimestamp(
      deletedRecord.deletedAt,
      otherRecord.updatedAt,
    ) >= 0
  );
}

export function resolveSyncConflict({
  domain,
  entityId,
  local,
  remote,
}: SyncConflictInput): SyncConflictResolution {
  const policy =
    SYNC_CONFLICT_POLICIES[domain];

  if (!remote) {
    return {
      domain,
      entityId,
      policy,
      winner: "local",
      action: "keep-local",
      reason: "remote-missing",
    };
  }

  if (!local) {
    return {
      domain,
      entityId,
      policy,
      winner: "remote",
      action: createAction(
        "remote",
        remote,
      ),
      reason: "local-missing",
      remoteRevision:
        remote.remoteRevision,
    };
  }

  if (
    policy ===
      "tombstone-aware-last-write-wins" &&
    isTombstoneWinner(local, remote)
  ) {
    return {
      domain,
      entityId,
      policy,
      winner: "local",
      action: "keep-local-delete",
      reason: "local-tombstone-wins",
      remoteRevision:
        remote.remoteRevision,
    };
  }

  if (
    policy ===
      "tombstone-aware-last-write-wins" &&
    isTombstoneWinner(remote, local)
  ) {
    return {
      domain,
      entityId,
      policy,
      winner: "remote",
      action: "apply-remote-delete",
      reason: "remote-tombstone-wins",
      remoteRevision:
        remote.remoteRevision,
    };
  }

  const winner = compareRecords(
    local,
    remote,
  );
  const winningRecord =
    winner === "local" ? local : remote;

  return {
    domain,
    entityId,
    policy,
    winner,
    action: createAction(
      winner,
      winningRecord,
    ),
    reason:
      winner === "local"
        ? "local-newer"
        : "remote-newer",
    remoteRevision:
      remote.remoteRevision,
  };
}
