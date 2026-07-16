import {
  describe,
  expect,
  it,
} from "vitest";
import {
  resolveSyncConflict,
  SYNC_CONFLICT_POLICIES,
} from "./syncConflictRules";

describe("syncConflictRules", () => {
  it("legt fuer jede syncbare Domaene eine deterministische Regel fest", () => {
    expect(SYNC_CONFLICT_POLICIES).toEqual({
      profile:
        "singleton-last-write-wins",
      shifts:
        "tombstone-aware-last-write-wins",
      shiftTemplates:
        "template-last-write-wins",
      planningTemplates:
        "tombstone-aware-last-write-wins",
      fairnessTeam:
        "tombstone-aware-last-write-wins",
    });
  });

  it("wendet fuer Profile last-write-wins mit Revision und Zeitstempel an", () => {
    const resolution =
      resolveSyncConflict({
        domain: "profile",
        entityId: "current",
        local: {
          revision: 2,
          updatedAt:
            "2026-07-16T08:00:00.000Z",
          deviceId: "device-a",
        },
        remote: {
          revision: 3,
          updatedAt:
            "2026-07-16T07:59:00.000Z",
          deviceId: "device-b",
          remoteRevision: "mock-3",
        },
      });

    expect(resolution).toMatchObject({
      winner: "remote",
      action: "apply-remote",
      reason: "remote-newer",
      remoteRevision: "mock-3",
    });
  });

  it("behandelt geloeschte Dienste als Tombstone, wenn die Loeschung neuer ist", () => {
    const resolution =
      resolveSyncConflict({
        domain: "shifts",
        entityId: "shift-1",
        local: {
          revision: 4,
          updatedAt:
            "2026-07-16T08:00:00.000Z",
          deletedAt:
            "2026-07-16T08:00:00.000Z",
          deviceId: "device-a",
        },
        remote: {
          revision: 4,
          updatedAt:
            "2026-07-16T07:00:00.000Z",
          deviceId: "device-b",
          remoteRevision: "mock-4",
        },
      });

    expect(resolution).toMatchObject({
      policy:
        "tombstone-aware-last-write-wins",
      winner: "local",
      action: "keep-local-delete",
      reason: "local-tombstone-wins",
    });
  });

  it("nutzt die Device-ID als stabile Tie-Break-Regel", () => {
    const resolution =
      resolveSyncConflict({
        domain: "shiftTemplates",
        entityId: "EARLY",
        local: {
          revision: 1,
          updatedAt:
            "2026-07-16T08:00:00.000Z",
          deviceId: "device-b",
        },
        remote: {
          revision: 1,
          updatedAt:
            "2026-07-16T08:00:00.000Z",
          deviceId: "device-a",
          remoteRevision: "mock-1",
        },
      });

    expect(resolution).toMatchObject({
      winner: "local",
      action: "keep-local",
      reason: "local-newer",
    });
  });
});
