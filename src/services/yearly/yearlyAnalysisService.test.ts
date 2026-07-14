import { describe, expect, it } from "vitest";
import type { Shift, UserProfile } from "../../types/index";
import { calculateYearlyAnalysis } from "./yearlyAnalysisService";

const profile: UserProfile = {
  federalState: "HE",
  weeklyHours: 38.5,
  payGroup: "P8",
  payLevel: 4,
};

function createShift(
  overrides: Partial<Shift> & Pick<Shift, "id" | "date" | "type">,
): Shift {
  return {
    startTime: "08:00",
    endTime: "16:00",
    breakMinutes: 0,
    ...overrides,
  };
}

describe("yearlyAnalysisService", () => {
  it("erstellt eine stabile Auswertung fuer alle zwoelf Monate", () => {
    const result = calculateYearlyAnalysis([], profile, 2026);

    expect(result.months).toHaveLength(12);
    expect(result.year).toBe(2026);
    expect(result.summary.monthsWithEntries).toBe(0);
    expect(result.trends.bestBalanceMonth).toBeNull();
  });

  it("summiert Jahreswerte aus bestehenden Monatsberechnungen", () => {
    const shifts: Shift[] = [
      createShift({
        id: "weekend-1",
        date: "2026-01-03",
        type: "DAY",
      }),
      createShift({
        id: "night-1",
        date: "2026-02-04",
        type: "NIGHT",
        startTime: "21:00",
        endTime: "06:00",
      }),
      createShift({
        id: "vacation-1",
        date: "2026-03-02",
        type: "VACATION",
        startTime: "00:00",
        endTime: "00:00",
        creditedHours: 7.7,
        hourCreditSource: "DAILY_TARGET",
      }),
      createShift({
        id: "holiday-1",
        date: "2026-05-01",
        type: "DAY",
        startTime: "08:00",
        endTime: "12:00",
      }),
    ];

    const result = calculateYearlyAnalysis(shifts, profile, 2026);

    expect(result.summary.calendarEntryCount).toBe(4);
    expect(result.summary.workShiftCount).toBe(3);
    expect(result.summary.actualHours).toBe(28.7);
    expect(result.summary.vacationDays).toBe(1);
    expect(result.summary.vacationHours).toBe(7.7);
    expect(result.summary.distribution.nightHours).toBe(9);
    expect(result.summary.distribution.nightShiftCount).toBe(1);
    expect(result.summary.distribution.weekendShiftCount).toBe(1);
    expect(result.summary.distribution.holidayWorkHours).toBe(4);
    expect(result.summary.distribution.holidayWorkShiftCount).toBe(1);
    expect(result.trends.busiestMonth?.monthLabel).toBe("Februar 2026");
    expect(result.trends.strongestNightMonth?.value).toBe(9);
  });

  it("fasst Zuschlaege jahresweit zusammen und ignoriert Abwesenheiten", () => {
    const shifts: Shift[] = [
      createShift({
        id: "holiday-1",
        date: "2026-05-01",
        type: "DAY",
        startTime: "08:00",
        endTime: "12:00",
      }),
      createShift({
        id: "vacation-1",
        date: "2026-05-02",
        type: "VACATION",
        startTime: "00:00",
        endTime: "00:00",
        creditedHours: 7.7,
        hourCreditSource: "DAILY_TARGET",
      }),
    ];

    const result = calculateYearlyAnalysis(shifts, profile, 2026);

    expect(result.summary.premiumShiftCount).toBe(1);
    expect(result.summary.premiumLines).toEqual([
      expect.objectContaining({
        key: "holiday",
        hours: 4,
      }),
    ]);
    expect(result.summary.premiumTotalAmount).toBe(31.89);
  });
});
