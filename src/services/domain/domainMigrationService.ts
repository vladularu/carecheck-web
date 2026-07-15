import type {
  Shift,
  ShiftTemplates,
} from "../../types/index";
import type { ComplianceRuleSetting } from "../compliance/complianceRuleCatalog";
import type { PlanningTemplate } from "../planning/planningComfortService";
import type { FairnessTeamMemberDraft } from "../repositories/careCheckRepositories";
import type { TvoedPTariffVersion } from "../tariff/tvoedPTariffService";
import {
  createDomainEntity,
  createShiftTemplateDomainSnapshot,
  type AppSettingsDomainPayload,
  type DomainEntity,
  type DomainEntityType,
  type DomainShiftTemplatesSnapshot,
} from "./domainModel";

type MigratableShift = Omit<
  Shift,
  "id"
> & {
  id?: string;
};

type MigratablePlanningTemplate = Omit<
  PlanningTemplate,
  "id"
> & {
  id?: string;
};

type MigratableFairnessTeamMember =
  Omit<
    FairnessTeamMemberDraft,
    "id"
  > & {
    id?: string;
  };

export type DomainMigrationIssueCode =
  | "missing-id"
  | "duplicate-id";

export interface DomainMigrationIssue {
  code: DomainMigrationIssueCode;
  severity: "warning";
  entityType: DomainEntityType;
  sourceIndex: number;
  entityId: string;
  message: string;
}

export interface LegacyCareCheckDataSnapshot {
  profile: DomainEntity<"profile">["data"] | null;
  shifts: MigratableShift[];
  shiftTemplates: ShiftTemplates;
  planningTemplates: MigratablePlanningTemplate[];
  fairnessTeamMembers: MigratableFairnessTeamMember[];
  tariffConfigurations?: TvoedPTariffVersion[];
  checkProfile?: ComplianceRuleSetting[];
  appSettings?: AppSettingsDomainPayload;
}

export interface DomainMigrationResult {
  migratedAt: string;
  entities: {
    profile: DomainEntity<"profile"> | null;
    shifts: DomainEntity<"shifts">[];
    shiftTemplates: DomainShiftTemplatesSnapshot;
    planningTemplates: DomainEntity<"planningTemplates">[];
    fairnessTeam: DomainEntity<"fairnessTeam">[];
    tariffConfigurations: DomainEntity<"tariffConfiguration">[];
    checkProfile: DomainEntity<"checkProfile"> | null;
    appSettings: DomainEntity<"appSettings"> | null;
  };
  issues: DomainMigrationIssue[];
}

interface MigrationOptions {
  migratedAt?: string;
}

interface ResolveIdInput {
  entityType: DomainEntityType;
  preferredId: string | undefined;
  sourceIndex: number;
  payloadSeed: string;
  seenIds: Set<string>;
  issues: DomainMigrationIssue[];
}

function createIsoTimestamp(): string {
  return new Date().toISOString();
}

function hashString(
  value: string,
  salt: number,
): string {
  let hash = 0x811c9dc5 ^ salt;

  for (let index = 0; index < value.length; index++) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }

  return (hash >>> 0)
    .toString(16)
    .padStart(8, "0");
}

export function createDeterministicMigrationId(
  seed: string,
): string {
  const hex = [
    hashString(seed, 1),
    hashString(seed, 2),
    hashString(seed, 3),
    hashString(seed, 4),
  ].join("");

  const variant = (
    (Number.parseInt(hex[16], 16) & 0x3) |
    0x8
  ).toString(16);

  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    `5${hex.slice(13, 16)}`,
    `${variant}${hex.slice(17, 20)}`,
    hex.slice(20, 32),
  ].join("-");
}

function createPayloadSeed(value: unknown): string {
  return JSON.stringify(value);
}

function resolveMigrationId({
  entityType,
  preferredId,
  sourceIndex,
  payloadSeed,
  seenIds,
  issues,
}: ResolveIdInput): string {
  const trimmedId =
    typeof preferredId === "string"
      ? preferredId.trim()
      : "";

  if (
    trimmedId.length > 0 &&
    !seenIds.has(trimmedId)
  ) {
    seenIds.add(trimmedId);
    return trimmedId;
  }

  const code: DomainMigrationIssueCode =
    trimmedId.length === 0
      ? "missing-id"
      : "duplicate-id";
  let generatedId =
    createDeterministicMigrationId(
      `${entityType}:${sourceIndex}:${trimmedId}:${payloadSeed}`,
    );
  let collisionIndex = 1;

  while (seenIds.has(generatedId)) {
    generatedId =
      createDeterministicMigrationId(
        `${entityType}:${sourceIndex}:${trimmedId}:${payloadSeed}:${collisionIndex}`,
      );
    collisionIndex++;
  }

  seenIds.add(generatedId);
  issues.push({
    code,
    severity: "warning",
    entityType,
    sourceIndex,
    entityId: generatedId,
    message:
      code === "missing-id"
        ? "Fehlende ID wurde deterministisch erzeugt."
        : "Doppelte ID wurde fuer diesen Datensatz deterministisch ersetzt.",
  });

  return generatedId;
}

function createMigrationMetadataInput(
  id: string,
  migratedAt: string,
) {
  return {
    id,
    now: migratedAt,
    origin: "migration" as const,
  };
}

export function migrateLegacyCareCheckData(
  snapshot: LegacyCareCheckDataSnapshot,
  options: MigrationOptions = {},
): DomainMigrationResult {
  const migratedAt =
    options.migratedAt ?? createIsoTimestamp();
  const issues: DomainMigrationIssue[] = [];

  const shiftIds = new Set<string>();
  const planningTemplateIds = new Set<string>();
  const fairnessTeamIds = new Set<string>();
  const tariffConfigurationIds =
    new Set<string>();

  return {
    migratedAt,
    entities: {
      profile: snapshot.profile
        ? createDomainEntity(
            "profile",
            snapshot.profile,
            createMigrationMetadataInput(
              "profile-current",
              migratedAt,
            ),
          )
        : null,
      shifts: snapshot.shifts.map(
        (shift, sourceIndex) => {
          const id = resolveMigrationId({
            entityType: "shifts",
            preferredId: shift.id,
            sourceIndex,
            payloadSeed:
              createPayloadSeed(shift),
            seenIds: shiftIds,
            issues,
          });

          return createDomainEntity(
            "shifts",
            {
              ...shift,
              id,
            },
            createMigrationMetadataInput(
              id,
              migratedAt,
            ),
          );
        },
      ),
      shiftTemplates:
        createShiftTemplateDomainSnapshot(
          snapshot.shiftTemplates,
          {
            now: migratedAt,
            origin: "migration",
          },
        ),
      planningTemplates:
        snapshot.planningTemplates.map(
          (template, sourceIndex) => {
            const id = resolveMigrationId({
              entityType:
                "planningTemplates",
              preferredId: template.id,
              sourceIndex,
              payloadSeed:
                createPayloadSeed(template),
              seenIds: planningTemplateIds,
              issues,
            });

            return createDomainEntity(
              "planningTemplates",
              {
                ...template,
                id,
              },
              createMigrationMetadataInput(
                id,
                migratedAt,
              ),
            );
          },
        ),
      fairnessTeam:
        snapshot.fairnessTeamMembers.map(
          (member, sourceIndex) => {
            const id = resolveMigrationId({
              entityType: "fairnessTeam",
              preferredId: member.id,
              sourceIndex,
              payloadSeed:
                createPayloadSeed(member),
              seenIds: fairnessTeamIds,
              issues,
            });

            return createDomainEntity(
              "fairnessTeam",
              {
                ...member,
                id,
              },
              createMigrationMetadataInput(
                id,
                migratedAt,
              ),
            );
          },
        ),
      tariffConfigurations: (
        snapshot.tariffConfigurations ?? []
      ).map((tariff, sourceIndex) => {
        const id = resolveMigrationId({
          entityType:
            "tariffConfiguration",
          preferredId: tariff.id,
          sourceIndex,
          payloadSeed:
            createPayloadSeed(tariff),
          seenIds: tariffConfigurationIds,
          issues,
        });

        return createDomainEntity(
          "tariffConfiguration",
          {
            ...tariff,
            id,
          },
          createMigrationMetadataInput(
            id,
            migratedAt,
          ),
        );
      }),
      checkProfile: snapshot.checkProfile
        ? createDomainEntity(
            "checkProfile",
            snapshot.checkProfile,
            createMigrationMetadataInput(
              "check-profile-current",
              migratedAt,
            ),
          )
        : null,
      appSettings: snapshot.appSettings
        ? createDomainEntity(
            "appSettings",
            snapshot.appSettings,
            createMigrationMetadataInput(
              "app-settings-current",
              migratedAt,
            ),
          )
        : null,
    },
    issues,
  };
}
