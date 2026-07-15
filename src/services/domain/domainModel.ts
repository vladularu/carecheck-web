import type {
  Shift,
  ShiftTemplate,
  ShiftTemplates,
  ShiftType,
  UserProfile,
} from "../../types/index";
import type { ComplianceRuleSetting } from "../compliance/complianceRuleCatalog";
import type { FairnessMemberInput } from "../fairness/fairnessAnalysisService";
import type { PlanningTemplate } from "../planning/planningComfortService";
import type { TvoedPTariffVersion } from "../tariff/tvoedPTariffService";

export const DOMAIN_SCHEMA_VERSION =
  1 as const;

export const DOMAIN_ENTITY_TYPES = [
  "profile",
  "shifts",
  "shiftTemplates",
  "planningTemplates",
  "fairnessTeam",
  "tariffConfiguration",
  "checkProfile",
  "appSettings",
] as const;

export type DomainEntityType =
  (typeof DOMAIN_ENTITY_TYPES)[number];

export type DomainEntityOrigin =
  | "local"
  | "backup-import"
  | "migration"
  | "sync"
  | "system";

export type DomainConflictStatus =
  | "none"
  | "detected"
  | "resolved";

export interface DomainConflictState {
  status: DomainConflictStatus;
  reason?: string;
  detectedAt?: string;
  resolvedAt?: string;
  remoteRevision?: string;
}

export interface DomainMetadata {
  id: string;
  schemaVersion: typeof DOMAIN_SCHEMA_VERSION;
  createdAt: string;
  updatedAt: string;
  revision: number;
  origin: DomainEntityOrigin;
  deletedAt?: string;
  futureUserId?: string;
  futureDeviceId?: string;
  conflict: DomainConflictState;
}

export interface ShiftTemplateDomainPayload {
  type: ShiftType;
  template: ShiftTemplate;
}

export type FairnessTeamDomainPayload = Omit<
  FairnessMemberInput,
  "source"
>;

export interface AppSettingsDomainPayload {
  selectedMonth?: {
    year: number;
    month: number;
  };
  preferredStartPage?: string;
}

export interface DomainPayloadMap {
  profile: UserProfile;
  shifts: Shift;
  shiftTemplates: ShiftTemplateDomainPayload;
  planningTemplates: PlanningTemplate;
  fairnessTeam: FairnessTeamDomainPayload;
  tariffConfiguration: TvoedPTariffVersion;
  checkProfile: ComplianceRuleSetting[];
  appSettings: AppSettingsDomainPayload;
}

export interface DomainEntity<
  TType extends DomainEntityType,
> {
  type: TType;
  metadata: DomainMetadata;
  data: DomainPayloadMap[TType];
}

interface CreateDomainMetadataInput {
  id: string;
  now?: string;
  origin?: DomainEntityOrigin;
  futureUserId?: string;
  futureDeviceId?: string;
}

interface DomainChangeOptions {
  now?: string;
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

function isIsoTimestamp(
  value: unknown,
): value is string {
  return (
    typeof value === "string" &&
    !Number.isNaN(Date.parse(value))
  );
}

export function isDomainEntityType(
  value: unknown,
): value is DomainEntityType {
  return (
    typeof value === "string" &&
    DOMAIN_ENTITY_TYPES.includes(
      value as DomainEntityType,
    )
  );
}

export function createDomainMetadata({
  id,
  now = createIsoTimestamp(),
  origin = "local",
  futureUserId,
  futureDeviceId,
}: CreateDomainMetadataInput): DomainMetadata {
  return {
    id,
    schemaVersion: DOMAIN_SCHEMA_VERSION,
    createdAt: now,
    updatedAt: now,
    revision: 1,
    origin,
    futureUserId,
    futureDeviceId,
    conflict: {
      status: "none",
    },
  };
}

export function createDomainEntity<
  TType extends DomainEntityType,
>(
  type: TType,
  data: DomainPayloadMap[TType],
  metadataInput: CreateDomainMetadataInput,
): DomainEntity<TType> {
  return {
    type,
    metadata:
      createDomainMetadata(
        metadataInput,
      ),
    data,
  };
}

export function touchDomainEntity<
  TType extends DomainEntityType,
>(
  entity: DomainEntity<TType>,
  options: DomainChangeOptions = {},
): DomainEntity<TType> {
  const now =
    options.now ?? createIsoTimestamp();

  return {
    ...entity,
    metadata: {
      ...entity.metadata,
      updatedAt: now,
      revision:
        entity.metadata.revision + 1,
      deletedAt: undefined,
    },
  };
}

export function markDomainEntityDeleted<
  TType extends DomainEntityType,
>(
  entity: DomainEntity<TType>,
  options: DomainChangeOptions = {},
): DomainEntity<TType> {
  const now =
    options.now ?? createIsoTimestamp();
  const changed = touchDomainEntity(
    entity,
    {
      now,
    },
  );

  return {
    ...changed,
    metadata: {
      ...changed.metadata,
      deletedAt: now,
    },
  };
}

export function markDomainEntityConflict<
  TType extends DomainEntityType,
>(
  entity: DomainEntity<TType>,
  reason: string,
  options: DomainChangeOptions & {
    remoteRevision?: string;
  } = {},
): DomainEntity<TType> {
  const now =
    options.now ?? createIsoTimestamp();

  return {
    ...entity,
    metadata: {
      ...entity.metadata,
      updatedAt: now,
      conflict: {
        status: "detected",
        reason,
        detectedAt: now,
        remoteRevision:
          options.remoteRevision,
      },
    },
  };
}

export function isDomainMetadata(
  value: unknown,
): value is DomainMetadata {
  if (!isRecord(value)) {
    return false;
  }

  const conflict = value.conflict;

  return (
    typeof value.id === "string" &&
    value.id.length > 0 &&
    value.schemaVersion ===
      DOMAIN_SCHEMA_VERSION &&
    isIsoTimestamp(value.createdAt) &&
    isIsoTimestamp(value.updatedAt) &&
    typeof value.revision === "number" &&
    Number.isInteger(value.revision) &&
    value.revision >= 1 &&
    [
      "local",
      "backup-import",
      "migration",
      "sync",
      "system",
    ].includes(String(value.origin)) &&
    (value.deletedAt === undefined ||
      isIsoTimestamp(value.deletedAt)) &&
    (value.futureUserId === undefined ||
      typeof value.futureUserId ===
        "string") &&
    (value.futureDeviceId === undefined ||
      typeof value.futureDeviceId ===
        "string") &&
    isRecord(conflict) &&
    ["none", "detected", "resolved"].includes(
      String(conflict.status),
    ) &&
    (conflict.reason === undefined ||
      typeof conflict.reason ===
        "string") &&
    (conflict.detectedAt === undefined ||
      isIsoTimestamp(conflict.detectedAt)) &&
    (conflict.resolvedAt === undefined ||
      isIsoTimestamp(conflict.resolvedAt)) &&
    (conflict.remoteRevision === undefined ||
      typeof conflict.remoteRevision ===
        "string")
  );
}

export type DomainShiftTemplatesSnapshot =
  Record<ShiftType, DomainEntity<"shiftTemplates">>;

export function createShiftTemplateDomainSnapshot(
  templates: ShiftTemplates,
  options: Omit<CreateDomainMetadataInput, "id">,
): DomainShiftTemplatesSnapshot {
  return Object.fromEntries(
    Object.entries(templates).map(
      ([type, template]) => [
        type,
        createDomainEntity(
          "shiftTemplates",
          {
            type: type as ShiftType,
            template,
          },
          {
            ...options,
            id: type,
          },
        ),
      ],
    ),
  ) as DomainShiftTemplatesSnapshot;
}
