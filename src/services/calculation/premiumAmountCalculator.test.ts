import { describe, expect, it } from "vitest";
import type { ShiftPremiumHours } from "./shiftPremiumCalculator";
import { calculatePremiumLines } from "./premiumAmountCalculator";

const premium: ShiftPremiumHours = {
  shiftId: "shift-1",
  grossHours: 4,
  netHours: 4,
  nightHours: 2,
  sundayHours: 4,
  holidayHours: 4,
  saturdayHours: 4,
  saturdayAfternoonHours: 4,
  tvoedPremiumHours: {
    nightHours: 2,
    sundayHours: 0,
    holidayHours: 4,
    saturdayAfternoonHours: 0,
  },
  holidayNames: ["Tag der Deutschen Einheit"],
};

describe("premiumAmountCalculator", () => {
  it("nutzt nicht ueberlappende TVoeD-P-Zuschlagsstunden", () => {
    const result = calculatePremiumLines(premium, {
      baseHourlyRate: 20,
      holidayMode: "WITH_TIME_OFF",
    });

    expect(result.lines.map((line) => line.key)).toEqual([
      "night",
      "holiday",
    ]);
    expect(result.totalAmount).toBe(36);
  });

  it("wendet Feiertag ohne Freizeitausgleich mit 135 Prozent an", () => {
    const result = calculatePremiumLines(premium, {
      baseHourlyRate: 20,
      holidayMode: "WITHOUT_TIME_OFF",
    });

    expect(result.lines.find((line) => line.key === "holiday")).toMatchObject({
      percentage: 135,
      amount: 108,
    });
  });
});
