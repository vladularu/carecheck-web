import {
  describe,
  expect,
  it,
} from "vitest";
import { createLocalChangeQueueEntry } from "../storage/localChangeQueueStorage";
import { createMockSyncServer } from "./mockSyncAdapter";
import {
  createEmptySyncCursor,
  createSyncPullRequest,
  createSyncPushChangeFromQueueEntry,
  createSyncPushRequest,
} from "./syncProtocol";

const firstTimestamp =
  "2026-07-16T08:00:00.000Z";
const secondTimestamp =
  "2026-07-16T09:00:00.000Z";

describe("mockSyncAdapter", () => {
  it("synchronisiert Push und Pull ueber mehrere simulierte Geraete", () => {
    const server =
      createMockSyncServer({
        nowFactory: () => firstTimestamp,
      });
    const queueEntry =
      createLocalChangeQueueEntry(
        {
          domain: "shifts",
          entityId: "shift-1",
          operation: "upsert",
          localRevision: 1,
        },
        {
          idFactory: () => "queue-1",
          nowFactory: () =>
            firstTimestamp,
        },
      );
    const pushChange =
      createSyncPushChangeFromQueueEntry(
        queueEntry,
        {
          deviceId: "device-a",
          payload: {
            id: "shift-1",
            date: "2026-07-16",
          },
        },
      );

    const pushResponse = server.push(
      createSyncPushRequest({
        deviceId: "device-a",
        cursor: createEmptySyncCursor(),
        changes: [pushChange],
      }),
    );

    expect(
      pushResponse.acceptedChangeIds,
    ).toEqual(["device-a:queue-1"]);
    expect(
      pushResponse.cursor.revision,
    ).toBe(1);

    const pullResponse = server.pull(
      createSyncPullRequest({
        deviceId: "device-b",
        cursor: createEmptySyncCursor(),
      }),
    );

    expect(pullResponse.changes).toEqual([
      expect.objectContaining({
        remoteRevision: "mock-1",
        domain: "shifts",
        entityId: "shift-1",
        operation: "upsert",
        sourceDeviceId: "device-a",
      }),
    ]);
  });

  it("dedupliziert wiederholte Push-Changes ueber die Change-ID", () => {
    const server =
      createMockSyncServer();
    const change =
      createSyncPushChangeFromQueueEntry(
        createLocalChangeQueueEntry(
          {
            domain: "profile",
            entityId: "current",
            operation: "upsert",
          },
          {
            idFactory: () => "queue-1",
            nowFactory: () =>
              firstTimestamp,
          },
        ),
        {
          deviceId: "device-a",
          payload: {
            federalState: "HE",
          },
        },
      );

    server.push(
      createSyncPushRequest({
        deviceId: "device-a",
        cursor: createEmptySyncCursor(),
        changes: [change],
      }),
    );
    const secondPush = server.push(
      createSyncPushRequest({
        deviceId: "device-a",
        cursor: createEmptySyncCursor(),
        changes: [change],
      }),
    );

    expect(
      secondPush.duplicateChangeIds,
    ).toEqual(["device-a:queue-1"]);
    expect(
      server.inspect().history,
    ).toHaveLength(1);
  });

  it("transportiert Delete-Changes als Tombstones", () => {
    const server =
      createMockSyncServer();
    const deleteChange =
      createSyncPushChangeFromQueueEntry(
        createLocalChangeQueueEntry(
          {
            domain: "planningTemplates",
            entityId: "template-1",
            operation: "delete",
            localRevision: 2,
          },
          {
            idFactory: () => "queue-delete",
            nowFactory: () =>
              secondTimestamp,
          },
        ),
        {
          deviceId: "device-a",
        },
      );

    const response = server.push(
      createSyncPushRequest({
        deviceId: "device-a",
        cursor: createEmptySyncCursor(),
        changes: [deleteChange],
      }),
    );

    expect(response.changes[0]).toEqual(
      expect.objectContaining({
        operation: "delete",
        deletedAt: secondTimestamp,
        payload: undefined,
      }),
    );
  });

  it("weist stale Changes mit Remote-Revision als Konflikt zurueck", () => {
    const server =
      createMockSyncServer();
    const firstChange =
      createSyncPushChangeFromQueueEntry(
        createLocalChangeQueueEntry(
          {
            domain: "shifts",
            entityId: "shift-1",
            operation: "upsert",
          },
          {
            idFactory: () => "queue-a",
            nowFactory: () =>
              firstTimestamp,
          },
        ),
        {
          deviceId: "device-a",
          payload: {
            id: "shift-1",
          },
        },
      );

    server.push(
      createSyncPushRequest({
        deviceId: "device-a",
        cursor: createEmptySyncCursor(),
        changes: [firstChange],
      }),
    );

    const staleChange =
      createSyncPushChangeFromQueueEntry(
        createLocalChangeQueueEntry(
          {
            domain: "shifts",
            entityId: "shift-1",
            operation: "upsert",
            localRevision: 1,
          },
          {
            idFactory: () => "queue-b",
            nowFactory: () =>
              secondTimestamp,
          },
        ),
        {
          deviceId: "device-b",
          baseRemoteRevision: "mock-0",
          payload: {
            id: "shift-1",
          },
        },
      );

    const response = server.push(
      createSyncPushRequest({
        deviceId: "device-b",
        cursor: createEmptySyncCursor(),
        changes: [staleChange],
      }),
    );

    expect(response.rejectedChanges).toEqual([
      expect.objectContaining({
        changeId: "device-b:queue-b",
        reason: "remote-newer",
        remoteRevision: "mock-1",
      }),
    ]);
  });
});
