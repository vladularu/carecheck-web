import { describe, expect, it } from "vitest";
import type { Shift } from "../../types/index";
import { calculateShiftPremiumHours } from "./shiftPremiumCalculator";

function createShift(overrides: Partial<Shift>): Shift {
  return {
    id: "shift-1",
    date: "2026-10-03",
    startTime: "13:00",
    endTime: "17:00",
    breakMinutes: 0,
    type: "DAY",
    ...overrides,
  };
}

describe("shiftPremiumCalculator", () => {
  it("zaehlt Feiertag statt Samstag, wenn beide Tageszuschlaege kollidieren", () => {
    const result = calculateShiftPremiumHours(createShift({}), "HE");

    expect(result.holidayHours).toBe(4);
    expect(result.saturdayAfternoonHours).toBe(4);
    expect(result.tvoedPremiumHours.holidayHours).toBe(4);
    expect(result.tvoedPremiumHours.saturdayAfternoonHours).toBe(0);
  });

  it("zaehlt Nacht additiv zum dominanten Tageszuschlag", () => {
    const result = calculateShiftPremiumHours(
      createShift({
        startTime: "20:00",
        endTime: "23:00",
      }),
      "HE",
    );

    expect(result.tvoedPremiumHours.holidayHours).toBe(3);
    expect(result.tvoedPremiumHours.nightHours).toBe(2);
  });

  it("setzt FREE vollstaendig auf null", () => {
    const result = calculateShiftPremiumHours(
      createShift({
        type: "FREE",
        startTime: "00:00",
        endTime: "00:00",
      }),
      "HE",
    );

    expect(result.netHours).toBe(0);
    expect(result.tvoedPremiumHours).toEqual({
      nightHours: 0,
      sundayHours: 0,
      holidayHours: 0,
      saturdayAfternoonHours: 0,
    });
  });
});
