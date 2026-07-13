import type {
  FederalState,
  PayGroup,
  PayLevel,
  UserProfile,
} from "../../types/index";

const PROFILE_KEY = "carecheck.profile";

const federalStates = new Set<FederalState>([
  "BW",
  "BY",
  "BE",
  "BB",
  "HB",
  "HH",
  "HE",
  "MV",
  "NI",
  "NW",
  "RP",
  "SL",
  "SN",
  "ST",
  "SH",
  "TH",
]);

const payGroups = new Set<PayGroup>([
  "P7",
  "P8",
  "P9",
  "P10",
  "P11",
  "P12",
  "P13",
  "P14",
  "P15",
  "P16",
]);

const payLevels = new Set<PayLevel>([
  1,
  2,
  3,
  4,
  5,
  6,
]);

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return Boolean(
    value &&
      typeof value === "object" &&
      !Array.isArray(value),
  );
}

export function isUserProfile(
  value: unknown,
): value is UserProfile {
  if (!isRecord(value)) {
    return false;
  }

  const premiumHourlyRate =
    value.premiumHourlyRate;

  const hasValidPremiumHourlyRate =
    premiumHourlyRate === undefined ||
    (typeof premiumHourlyRate === "number" &&
      Number.isFinite(premiumHourlyRate) &&
      premiumHourlyRate >= 0);

  return (
    federalStates.has(
      value.federalState as FederalState,
    ) &&
    typeof value.weeklyHours === "number" &&
    Number.isFinite(value.weeklyHours) &&
    value.weeklyHours > 0 &&
    payGroups.has(
      value.payGroup as PayGroup,
    ) &&
    payLevels.has(
      value.payLevel as PayLevel,
    ) &&
    hasValidPremiumHourlyRate
  );
}

export function loadProfile(): UserProfile | null {
  const raw = localStorage.getItem(PROFILE_KEY);

  if (!raw) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(raw);

    return isUserProfile(parsed)
      ? parsed
      : null;
  } catch {
    return null;
  }
}

export function saveProfile(
  profile: UserProfile,
): void {
  localStorage.setItem(
    PROFILE_KEY,
    JSON.stringify(profile),
  );
}
