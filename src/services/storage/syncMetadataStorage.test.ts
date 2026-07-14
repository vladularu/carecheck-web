import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import {
  applySyncEntityChange,
  applySyncEntityConflict,
  applySyncEntityDeletion,
  createEmptySyncMetadataState,
  createSyncEntityKey,
  loadSyncMetadataState,
  markSyncEntityChanged,
} from "./syncMetadataStorage";

function createMemoryStorage(): Storage {
  const values = new Map<string, string>();

  return {
    get length() {
      return values.size;
    },

    clear() {
      values.clear();
    },

    getItem(key: string) {
      return values.get(key) ?? null;
    },

    key(index: number) {
      return Array.from(values.keys())[
        index
      ] ?? null;
    },

    removeItem(key: string) {
      values.delete(key);
    },

    setItem(key: string, value: string) {
      values.set(key, value);
    },
  };
}

const firstTimestamp =
  "2026-07-15T08:00:00.000Z";
const secondTimestamp =
  "2026-07-15T09:00:00.000Z";

describe("syncMetadataStorage", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "localStorage",
      createMemoryStorage(),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("erstellt einen leeren lokalen Sync-Status mit Device-ID", () => {
    const state =
      createEmptySyncMetadataState({
        idFactory: () => "device-1",
        nowFactory: () => firstTimestamp,
      });

    expect(state).toEqual({
      schemaVersion: 1,
      deviceId:
        "carecheck-device-device-1",
      createdAt: firstTimestamp,
      updatedAt: firstTimestamp,
      entities: {},
    });
  });

  it("markiert lokale Aenderungen mit stabiler Entity-ID und Revision", () => {
    const initialState =
      createEmptySyncMetadataState({
        idFactory: () => "device-1",
        nowFactory: () => firstTimestamp,
      });

    const changedState =
      applySyncEntityChange(
        initialState,
        "shifts",
        "shift-1",
        {
          nowFactory: () =>
            firstTimestamp,
        },
      );

    const key = createSyncEntityKey(
      "shifts",
      "shift-1",
    );

    expect(
      changedState.entities[key],
    ).toMatchObject({
      localId: key,
      domain: "shifts",
      entityId: "shift-1",
      localRevision: 1,
      createdAt: firstTimestamp,
      updatedAt: firstTimestamp,
    });
  });

  it("erhoeht lokale Revisionen bei wiederholten Aenderungen", () => {
    const initialState =
      createEmptySyncMetadataState({
        idFactory: () => "device-1",
        nowFactory: () => firstTimestamp,
      });

    const firstChange =
      applySyncEntityChange(
        initialState,
        "profile",
        "current",
        {
          nowFactory: () =>
            firstTimestamp,
        },
      );

    const secondChange =
      applySyncEntityChange(
        firstChange,
        "profile",
        "current",
        {
          nowFactory: () =>
            secondTimestamp,
        },
      );

    const key = createSyncEntityKey(
      "profile",
      "current",
    );

    expect(
      secondChange.entities[key]
        .localRevision,
    ).toBe(2);
    expect(
      secondChange.entities[key]
        .createdAt,
    ).toBe(firstTimestamp);
    expect(
      secondChange.entities[key]
        .updatedAt,
    ).toBe(secondTimestamp);
  });

  it("bereitet Soft-Delete-Metadaten fuer spaetere Konfliktloesung vor", () => {
    const state =
      createEmptySyncMetadataState({
        idFactory: () => "device-1",
        nowFactory: () => firstTimestamp,
      });

    const deletedState =
      applySyncEntityDeletion(
        state,
        "shifts",
        "shift-1",
        {
          nowFactory: () =>
            secondTimestamp,
        },
      );

    const key = createSyncEntityKey(
      "shifts",
      "shift-1",
    );

    expect(
      deletedState.entities[key]
        .deletedAt,
    ).toBe(secondTimestamp);
  });

  it("speichert Konfliktfelder ohne Remote-Synchronisierung auszufuehren", () => {
    const state =
      createEmptySyncMetadataState({
        idFactory: () => "device-1",
        nowFactory: () => firstTimestamp,
      });

    const conflictState =
      applySyncEntityConflict(
        state,
        "profile",
        "current",
        "remote-newer",
        {
          nowFactory: () =>
            secondTimestamp,
          remoteRevision: "remote-7",
        },
      );

    const key = createSyncEntityKey(
      "profile",
      "current",
    );

    expect(
      conflictState.entities[key]
        .conflict,
    ).toEqual({
      reason: "remote-newer",
      detectedAt: secondTimestamp,
      remoteRevision: "remote-7",
    });
  });

  it("laedt ungueltige Metadaten defensiv als leeren Status", () => {
    localStorage.setItem(
      "carecheck.syncMetadata.v1",
      JSON.stringify({
        schemaVersion: 99,
      }),
    );

    const state = loadSyncMetadataState({
      idFactory: () => "device-1",
      nowFactory: () => firstTimestamp,
    });

    expect(state.entities).toEqual({});
    expect(state.deviceId).toBe(
      "carecheck-device-device-1",
    );
  });

  it("persistiert Metadaten separat neben bestehenden App-Daten", () => {
    markSyncEntityChanged(
      "shifts",
      "shift-1",
      {
        idFactory: () => "device-1",
        nowFactory: () => firstTimestamp,
      },
    );

    const parsed = JSON.parse(
      localStorage.getItem(
        "carecheck.syncMetadata.v1",
      ) ?? "",
    ) as {
      entities: Record<
        string,
        { localRevision: number }
      >;
    };

    expect(
      parsed.entities[
        "shifts:shift-1"
      ].localRevision,
    ).toBe(1);
    expect(
      localStorage.getItem(
        "carecheck.shifts",
      ),
    ).toBeNull();
  });

  it("revisioniert Planungsvorlagen und Fairness-Teamdaten als eigene Domaenen", () => {
    let state =
      createEmptySyncMetadataState({
        idFactory: () => "device-1",
        nowFactory: () => firstTimestamp,
      });

    state = applySyncEntityChange(
      state,
      "planningTemplates",
      "template-1",
      {
        nowFactory: () => firstTimestamp,
      },
    );

    state = applySyncEntityDeletion(
      state,
      "fairnessTeam",
      "member-1",
      {
        nowFactory: () => secondTimestamp,
      },
    );

    expect(
      state.entities[
        "planningTemplates:template-1"
      ].localRevision,
    ).toBe(1);

    expect(
      state.entities[
        "fairnessTeam:member-1"
      ].deletedAt,
    ).toBe(secondTimestamp);
  });
});
