import { describe, expect, it } from "vitest";
import type { Shift } from "../../types/index";
import { calculateMonthlyPremiums } from "./monthlyPremiumCalculator";

function createShift(overrides: Partial<Shift> & Pick<Shift, "id" | "date" | "type">): Shift {
  return {
    startTime: "00:00",
    endTime: "00:00",
    breakMinutes: 0,
    ...overrides,
  };
}

describe("monthlyPremiumCalculator", () => {
  it("zaehlt Urlaub und Krankheit nicht als zuschlagspflichtige Arbeitsdienste", () => {
    const shifts: Shift[] = [
      createShift({
        id: "vacation-1",
        date: "2026-05-01",
        type: "VACATION",
        creditedHours: 7.7,
        hourCreditSource: "DAILY_TARGET",
      }),
      createShift({
        id: "sick-1",
        date: "2026-05-02",
        type: "SICK",
        creditedHours: 7.7,
        hourCreditSource: "DAILY_TARGET",
      }),
    ];

    const result = calculateMonthlyPremiums(shifts, 2026, 4, {
      federalState: "HE",
      baseHourlyRate: 20,
      holidayMode: "WITH_TIME_OFF",
    });

    expect(result.lines).toEqual([]);
    expect(result.shiftCountWithPremiums).toBe(0);
    expect(result.totalAmount).toBeNull();
  });
});
