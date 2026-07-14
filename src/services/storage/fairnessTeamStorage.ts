import type { FairnessMemberInput } from "../fairness/fairnessAnalysisService";

export type FairnessTeamMemberDraft = Omit<
  FairnessMemberInput,
  "source"
>;

const FAIRNESS_TEAM_KEY =
  "carecheck.fairnessTeam.v1";

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return Boolean(
    value &&
      typeof value === "object" &&
      !Array.isArray(value),
  );
}

function isNonNegativeNumber(
  value: unknown,
): value is number {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    value >= 0
  );
}

function isFairnessTeamMemberDraft(
  value: unknown,
): value is FairnessTeamMemberDraft {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.id === "string" &&
    value.id.length > 0 &&
    typeof value.name === "string" &&
    value.name.trim().length > 0 &&
    isNonNegativeNumber(value.weeklyHours) &&
    value.weeklyHours > 0 &&
    isNonNegativeNumber(value.workHours) &&
    isNonNegativeNumber(value.workShiftCount) &&
    isNonNegativeNumber(value.nightShiftCount) &&
    isNonNegativeNumber(value.weekendShiftCount) &&
    isNonNegativeNumber(value.workedWeekendCount) &&
    isNonNegativeNumber(value.holidayWorkShiftCount) &&
    isNonNegativeNumber(
      value.maxConsecutiveWorkedWeekends,
    )
  );
}

export function loadFairnessTeamMembers(): FairnessTeamMemberDraft[] {
  const raw = localStorage.getItem(
    FAIRNESS_TEAM_KEY,
  );

  if (!raw) {
    return [];
  }

  try {
    const parsed: unknown = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(
      isFairnessTeamMemberDraft,
    );
  } catch {
    return [];
  }
}

export function saveFairnessTeamMembers(
  members: FairnessTeamMemberDraft[],
): void {
  localStorage.setItem(
    FAIRNESS_TEAM_KEY,
    JSON.stringify(
      members.filter(
        isFairnessTeamMemberDraft,
      ),
    ),
  );
}
