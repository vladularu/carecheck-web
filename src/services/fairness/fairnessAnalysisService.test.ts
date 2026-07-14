import {
  describe,
  expect,
  it,
} from "vitest";
import type {
  Shift,
  UserProfile,
} from "../../types/index";
import {
  calculateCurrentUserFairnessInput,
  calculateFairnessAnalysis,
  countWeekendsInMonth,
  type FairnessMemberInput,
} from "./fairnessAnalysisService";

const profile: UserProfile = {
  federalState: "HE",
  weeklyHours: 38.5,
  payGroup: "P8",
  payLevel: 4,
};

function createShift(
  id: string,
  date: string,
  startTime: string,
  endTime: string,
  type: Shift["type"] = "DAY",
): Shift {
  return {
    id,
    date,
    startTime,
    endTime,
    breakMinutes: 30,
    type,
  };
}

function createMember(
  partial: Partial<FairnessMemberInput>,
): FairnessMemberInput {
  return {
    id: "member",
    name: "Member",
    weeklyHours: 38.5,
    workHours: 150,
    workShiftCount: 15,
    nightShiftCount: 0,
    weekendShiftCount: 0,
    workedWeekendCount: 0,
    holidayWorkShiftCount: 0,
    maxConsecutiveWorkedWeekends: 0,
    source: "manual",
    ...partial,
  };
}

describe("fairnessAnalysisService", () => {
  it("berechnet aktuelle Fairness-Werte aus bestehenden Schichten", () => {
    const shifts = [
      createShift(
        "holiday",
        "2026-01-01",
        "08:00",
        "16:00",
      ),
      createShift(
        "night-weekend-1",
        "2026-01-03",
        "20:00",
        "06:00",
        "NIGHT",
      ),
      createShift(
        "night-weekend-2",
        "2026-01-10",
        "20:00",
        "06:00",
        "NIGHT",
      ),
    ];

    const result =
      calculateCurrentUserFairnessInput(
        shifts,
        profile,
        2026,
        0,
      );

    expect(result.workShiftCount).toBe(3);
    expect(result.nightShiftCount).toBe(2);
    expect(result.weekendShiftCount).toBe(2);
    expect(result.workedWeekendCount).toBe(2);
    expect(
      result.maxConsecutiveWorkedWeekends,
    ).toBe(2);
    expect(result.holidayWorkShiftCount).toBe(1);
  });

  it("bewertet Belastungen proportional zum Beschaeftigungsumfang", () => {
    const current = createMember({
      id: "current",
      name: "Ich",
      nightShiftCount: 4,
      weekendShiftCount: 4,
      workedWeekendCount: 4,
      holidayWorkShiftCount: 2,
      maxConsecutiveWorkedWeekends: 2,
      source: "current-user",
    });

    const peer = createMember({
      id: "peer",
      name: "Team",
    });

    const result = calculateFairnessAnalysis(
      [current, peer],
      {
        year: 2026,
        monthIndex: 0,
      },
    );

    const currentResult = result.members.find(
      (member) => member.input.id === "current",
    );

    expect(result.hasTeamComparison).toBe(true);
    expect(currentResult?.status).toBe(
      "above-share",
    );
    expect(
      currentResult?.weekendRule.status,
    ).toBe("critical");
    expect(result.alerts.length).toBeGreaterThan(
      0,
    );
  });

  it("meldet fehlende Teamdaten ohne Vergleichsperson", () => {
    const result = calculateFairnessAnalysis(
      [
        createMember({
          id: "current",
          source: "current-user",
        }),
      ],
      {
        year: 2026,
        monthIndex: 0,
      },
    );

    expect(result.hasTeamComparison).toBe(false);
    expect(result.alerts).toEqual([
      "Teamvergleich benötigt mindestens eine weitere Person mit Monatswerten.",
    ]);
    expect(result.members[0]?.status).toBe(
      "no-team-data",
    );
  });

  it("zaehlt Wochenenden im Monatsfenster", () => {
    expect(countWeekendsInMonth(2026, 0)).toBe(5);
    expect(countWeekendsInMonth(2026, 1)).toBe(5);
  });
});
