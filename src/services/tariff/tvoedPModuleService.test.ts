import { describe, expect, it } from "vitest";
import type { Shift, UserProfile } from "../../types/index";
import { calculateTvoedPModule } from "./tvoedPModuleService";

const profile: UserProfile = {
  federalState: "HE",
  weeklyHours: 38.5,
  payGroup: "P8",
  payLevel: 4,
};

function createShift(overrides: Partial<Shift> & Pick<Shift, "id" | "date">): Shift {
  return {
    startTime: "06:00",
    endTime: "14:00",
    breakMinutes: 30,
    type: "EARLY",
    ...overrides,
  };
}

describe("tvoedPModuleService", () => {
  it("erkennt Schicht- und Wechselschichtindizien getrennt von Compliance", () => {
    const shifts: Shift[] = [
      createShift({
        id: "early-1",
        date: "2026-07-01",
        startTime: "06:00",
        endTime: "14:00",
        type: "EARLY",
      }),
      createShift({
        id: "late-1",
        date: "2026-07-02",
        startTime: "15:00",
        endTime: "23:00",
        type: "LATE",
      }),
      createShift({
        id: "night-1",
        date: "2026-07-03",
        startTime: "21:00",
        endTime: "06:00",
        type: "NIGHT",
      }),
      createShift({
        id: "sunday-1",
        date: "2026-07-05",
        startTime: "08:00",
        endTime: "12:00",
        breakMinutes: 0,
        type: "DAY",
      }),
      createShift({
        id: "vacation-1",
        date: "2026-07-06",
        startTime: "00:00",
        endTime: "00:00",
        breakMinutes: 0,
        type: "VACATION",
      }),
    ];

    const result = calculateTvoedPModule(shifts, profile, 2026, 6);

    expect(result.shiftWork.status).toBe("detected");
    expect(result.alternatingShiftWork.status).toBe("detected");
    expect(result.workingTime.actualWorkHours).toBe(27.5);
    expect(result.workingTime.absenceHours).toBe(7.7);
    expect(result.weekendAssessment.workWeekends).toBe(1);
    expect(result.weekendAssessment.expectationMet).toBe(true);
    expect(result.notes[0]).toContain("getrennt");
  });

  it("bewertet Monate ohne Arbeitsdienste defensiv", () => {
    const result = calculateTvoedPModule([], profile, 2026, 6);

    expect(result.shiftWork.status).toBe("not_detected");
    expect(result.alternatingShiftWork.status).toBe("not_detected");
    expect(result.premiumSummary.lines).toEqual([]);
  });
});
