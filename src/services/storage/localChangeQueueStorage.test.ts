import {
  describe,
  expect,
  it,
} from "vitest";
import { createMemoryPersistenceAdapter } from "./persistenceAdapter";
import {
  createLocalChangeQueueEntry,
  enqueueLocalChange,
  loadLocalChangeQueue,
  LOCAL_CHANGE_QUEUE_KEY,
  removeLocalChangeEntries,
} from "./localChangeQueueStorage";

describe("localChangeQueueStorage", () => {
  it("erstellt und speichert lokale Aenderungen stabil", async () => {
    const adapter =
      createMemoryPersistenceAdapter();
    const entry =
      createLocalChangeQueueEntry(
        {
          domain: "shifts",
          entityId: "shift-1",
          operation: "upsert",
          localRevision: 2,
        },
        {
          idFactory: () => "queue-1",
          nowFactory: () =>
            "2026-07-15T10:00:00.000Z",
        },
      );

    await enqueueLocalChange(
      adapter,
      entry,
    );

    await expect(
      loadLocalChangeQueue(adapter),
    ).resolves.toEqual([entry]);
  });

  it("filtert ungueltige Queue-Eintraege beim Laden", async () => {
    const adapter =
      createMemoryPersistenceAdapter({
        [LOCAL_CHANGE_QUEUE_KEY]: [
          {
            id: "queue-1",
            domain: "profile",
            entityId: "current",
            operation: "upsert",
            queuedAt:
              "2026-07-15T10:00:00.000Z",
          },
          {
            id: "",
            domain: "unknown",
          },
        ],
      });

    const queue =
      await loadLocalChangeQueue(adapter);

    expect(queue).toHaveLength(1);
    expect(queue[0].id).toBe("queue-1");
  });

  it("entfernt quittierte Queue-Eintraege", async () => {
    const adapter =
      createMemoryPersistenceAdapter();
    const first =
      createLocalChangeQueueEntry(
        {
          domain: "profile",
          entityId: "current",
          operation: "upsert",
        },
        {
          idFactory: () => "queue-1",
          nowFactory: () =>
            "2026-07-15T10:00:00.000Z",
        },
      );
    const second =
      createLocalChangeQueueEntry(
        {
          domain: "shifts",
          entityId: "shift-1",
          operation: "delete",
        },
        {
          idFactory: () => "queue-2",
          nowFactory: () =>
            "2026-07-15T10:01:00.000Z",
        },
      );

    await enqueueLocalChange(
      adapter,
      first,
    );
    await enqueueLocalChange(
      adapter,
      second,
    );

    await expect(
      removeLocalChangeEntries(
        adapter,
        ["queue-1"],
      ),
    ).resolves.toEqual([second]);
  });
});
