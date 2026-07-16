import {
  describe,
  expect,
  it,
} from "vitest";
import {
  createEmptySyncCursor,
  createSyncChangeId,
  createSyncPullRequest,
  createSyncPushChangeFromQueueEntry,
  createSyncPushRequest,
  isSyncPushChange,
  isSyncRemoteChange,
  SYNC_PROTOCOL_VERSION,
} from "./syncProtocol";
import { createLocalChangeQueueEntry } from "../storage/localChangeQueueStorage";

describe("syncProtocol", () => {
  it("erstellt stabile Change-IDs aus Device und Outbox-Eintrag", () => {
    expect(
      createSyncChangeId(
        "device-a",
        "queue-1",
      ),
    ).toBe("device-a:queue-1");
  });

  it("uebersetzt Outbox-Eintraege in Push-Changes", () => {
    const entry =
      createLocalChangeQueueEntry(
        {
          domain: "shifts",
          entityId: "shift-1",
          operation: "upsert",
          localRevision: 3,
        },
        {
          idFactory: () => "queue-1",
          nowFactory: () =>
            "2026-07-16T08:00:00.000Z",
        },
      );

    const change =
      createSyncPushChangeFromQueueEntry(
        entry,
        {
          deviceId: "device-a",
          baseRemoteRevision: "mock-4",
          payload: {
            id: "shift-1",
          },
        },
      );

    expect(change).toMatchObject({
      changeId: "device-a:queue-1",
      deviceId: "device-a",
      domain: "shifts",
      entityId: "shift-1",
      operation: "upsert",
      queuedAt:
        "2026-07-16T08:00:00.000Z",
      localRevision: 3,
      baseRemoteRevision: "mock-4",
      payload: {
        id: "shift-1",
      },
    });
    expect(
      isSyncPushChange(change),
    ).toBe(true);
  });

  it("definiert versionierte Push- und Pull-Requests", () => {
    const cursor =
      createEmptySyncCursor();

    expect(
      createSyncPushRequest({
        deviceId: "device-a",
        cursor,
        changes: [],
      }),
    ).toEqual({
      protocolVersion:
        SYNC_PROTOCOL_VERSION,
      deviceId: "device-a",
      cursor: {
        revision: 0,
      },
      changes: [],
    });

    expect(
      createSyncPullRequest({
        deviceId: "device-b",
        cursor,
      }),
    ).toEqual({
      protocolVersion:
        SYNC_PROTOCOL_VERSION,
      deviceId: "device-b",
      cursor: {
        revision: 0,
      },
    });
  });

  it("validiert Remote-Changes mit Tombstone", () => {
    expect(
      isSyncRemoteChange({
        remoteRevision: "mock-1",
        sequence: 1,
        domain: "shifts",
        entityId: "shift-1",
        operation: "delete",
        changedAt:
          "2026-07-16T08:00:00.000Z",
        deletedAt:
          "2026-07-16T08:00:00.000Z",
        sourceDeviceId: "device-a",
      }),
    ).toBe(true);
  });
});
