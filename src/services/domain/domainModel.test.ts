import {
  describe,
  expect,
  it,
} from "vitest";
import { defaultShiftTemplates } from "../../data/defaultShiftTemplates";
import type {
  Shift,
  UserProfile,
} from "../../types/index";
import {
  createDomainEntity,
  createShiftTemplateDomainSnapshot,
  DOMAIN_ENTITY_TYPES,
  DOMAIN_SCHEMA_VERSION,
  isDomainMetadata,
  markDomainEntityConflict,
  markDomainEntityDeleted,
  touchDomainEntity,
} from "./domainModel";

const profile: UserProfile = {
  federalState: "HE",
  weeklyHours: 38.5,
  payGroup: "P8",
  payLevel: 4,
};

const shift: Shift = {
  id: "shift-1",
  date: "2026-07-15",
  startTime: "06:00",
  endTime: "14:00",
  breakMinutes: 30,
  type: "EARLY",
};

describe("domainModel", () => {
  it("definiert alle fuer Sync und Migration relevanten Entitaetstypen", () => {
    expect(DOMAIN_ENTITY_TYPES).toEqual([
      "profile",
      "shifts",
      "shiftTemplates",
      "planningTemplates",
      "fairnessTeam",
      "tariffConfiguration",
      "checkProfile",
      "appSettings",
    ]);
  });

  it("erstellt ein technisches Grundmodell fuer Fachdaten", () => {
    const entity = createDomainEntity(
      "profile",
      profile,
      {
        id: "profile-current",
        now: "2026-07-15T10:00:00.000Z",
        origin: "migration",
        futureDeviceId: "device-1",
        futureUserId: "user-1",
      },
    );

    expect(entity).toEqual({
      type: "profile",
      data: profile,
      metadata: {
        id: "profile-current",
        schemaVersion:
          DOMAIN_SCHEMA_VERSION,
        createdAt:
          "2026-07-15T10:00:00.000Z",
        updatedAt:
          "2026-07-15T10:00:00.000Z",
        revision: 1,
        origin: "migration",
        futureDeviceId: "device-1",
        futureUserId: "user-1",
        conflict: {
          status: "none",
        },
      },
    });

    expect(
      isDomainMetadata(entity.metadata),
    ).toBe(true);
  });

  it("revisioniert Aenderungen ohne Nutzdaten zu veraendern", () => {
    const entity = createDomainEntity(
      "shifts",
      shift,
      {
        id: shift.id,
        now: "2026-07-15T10:00:00.000Z",
      },
    );

    const changed = touchDomainEntity(
      entity,
      {
        now: "2026-07-15T11:00:00.000Z",
      },
    );

    expect(changed.data).toEqual(shift);
    expect(
      changed.metadata.createdAt,
    ).toBe(
      "2026-07-15T10:00:00.000Z",
    );
    expect(
      changed.metadata.updatedAt,
    ).toBe(
      "2026-07-15T11:00:00.000Z",
    );
    expect(
      changed.metadata.revision,
    ).toBe(2);
  });

  it("setzt Loeschzeitpunkt als technischen Tombstone", () => {
    const entity = createDomainEntity(
      "shifts",
      shift,
      {
        id: shift.id,
        now: "2026-07-15T10:00:00.000Z",
      },
    );

    const deleted =
      markDomainEntityDeleted(entity, {
        now: "2026-07-15T11:00:00.000Z",
      });

    expect(
      deleted.metadata.deletedAt,
    ).toBe(
      "2026-07-15T11:00:00.000Z",
    );
    expect(
      deleted.metadata.revision,
    ).toBe(2);
  });

  it("merkt Konflikte nachvollziehbar ohne Fachwerte umzuschreiben", () => {
    const entity = createDomainEntity(
      "shifts",
      shift,
      {
        id: shift.id,
        now: "2026-07-15T10:00:00.000Z",
      },
    );

    const conflicted =
      markDomainEntityConflict(
        entity,
        "Dienst wurde auf zwei Geraeten geaendert.",
        {
          now: "2026-07-15T11:00:00.000Z",
          remoteRevision: "remote-7",
        },
      );

    expect(conflicted.data).toEqual(shift);
    expect(
      conflicted.metadata.conflict,
    ).toEqual({
      status: "detected",
      reason:
        "Dienst wurde auf zwei Geraeten geaendert.",
      detectedAt:
        "2026-07-15T11:00:00.000Z",
      remoteRevision: "remote-7",
    });
  });

  it("weist ungueltige Domain-Metadaten zurueck", () => {
    expect(
      isDomainMetadata({
        id: "profile-current",
        schemaVersion: 999,
        createdAt:
          "2026-07-15T10:00:00.000Z",
        updatedAt:
          "2026-07-15T10:00:00.000Z",
        revision: 0,
        origin: "local",
        conflict: {
          status: "none",
        },
      }),
    ).toBe(false);
  });

  it("kann Dienstvorlagen als einzelne Domain-Entitaeten abbilden", () => {
    const snapshot =
      createShiftTemplateDomainSnapshot(
        defaultShiftTemplates,
        {
          now: "2026-07-15T10:00:00.000Z",
          origin: "system",
        },
      );

    expect(snapshot.EARLY.type).toBe(
      "shiftTemplates",
    );
    expect(
      snapshot.EARLY.metadata.id,
    ).toBe("EARLY");
    expect(
      snapshot.EARLY.data.template,
    ).toEqual(defaultShiftTemplates.EARLY);
  });
});
