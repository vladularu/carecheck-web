import {
  describe,
  expect,
  it,
} from "vitest";
import type { Shift } from "../../types/index";
import {
  getReportBreakLabel,
  getReportHourSourceLabel,
  getReportNetHours,
  getReportTimeLabel,
} from "./monthlyReportEntryFormatter";

function createShift(
  overrides: Partial<Shift> = {},
): Shift {
  return {
    id: "shift-1",
    date: "2026-07-15",
    startTime: "08:00",
    endTime: "16:30",
    breakMinutes: 30,
    type: "EARLY",
    ...overrides,
  };
}

describe(
  "monthlyReportEntryFormatter",
  () => {
    it("zeigt reguläre Dienste mit Zeit und Pause", () => {
      const shift = createShift();

      expect(
        getReportTimeLabel(shift),
      ).not.toBe("—");

      expect(
        getReportBreakLabel(shift),
      ).toBe("30 min");

      expect(
        getReportHourSourceLabel(
          shift,
        ),
      ).toBe(
        "Erfasste Dienstzeit",
      );
    });

    it("zeigt Urlaub ohne künstliche Zeitwerte", () => {
      const vacation = createShift({
        type: "VACATION",
        startTime: "00:00",
        endTime: "00:00",
        breakMinutes: 0,
        creditedHours: 7.7,
        hourCreditSource:
          "DAILY_TARGET",
      });

      expect(
        getReportTimeLabel(vacation),
      ).toBe("—");

      expect(
        getReportBreakLabel(vacation),
      ).toBe("—");

      expect(
        getReportNetHours(
          vacation,
          7.7,
        ),
      ).toBe(7.7);

      expect(
        getReportHourSourceLabel(
          vacation,
        ),
      ).toBe(
        "Tägliche Sollarbeitszeit",
      );
    });

    it("kennzeichnet Krankstunden aus geplanter Schicht", () => {
      const sick = createShift({
        type: "SICK",
        startTime: "00:00",
        endTime: "00:00",
        breakMinutes: 0,
        creditedHours: 9.25,
        hourCreditSource:
          "PLANNED_SHIFT",
        sourceShiftId: "night-1",
      });

      expect(
        getReportNetHours(
          sick,
          7.7,
        ),
      ).toBe(9.25);

      expect(
        getReportHourSourceLabel(
          sick,
        ),
      ).toBe("Geplanter Dienst");
    });

    it("verwendet bei Krank ohne Planung die Sollzeit", () => {
      const sick = createShift({
        type: "SICK",
        startTime: "00:00",
        endTime: "00:00",
        breakMinutes: 0,
        hourCreditSource:
          "DAILY_TARGET",
      });

      expect(
        getReportNetHours(
          sick,
          7.7,
        ),
      ).toBe(7.7);

      expect(
        getReportHourSourceLabel(
          sick,
        ),
      ).toBe(
        "Tägliche Sollarbeitszeit",
      );
    });

    it("weist Frei weiterhin mit null Stunden aus", () => {
      const free = createShift({
        type: "FREE",
        startTime: "00:00",
        endTime: "00:00",
        breakMinutes: 0,
      });

      expect(
        getReportTimeLabel(free),
      ).toBe("—");

      expect(
        getReportBreakLabel(free),
      ).toBe("—");

      expect(
        getReportNetHours(
          free,
          7.7,
        ),
      ).toBe(0);

      expect(
        getReportHourSourceLabel(
          free,
        ),
      ).toBe("Keine Stunden");
    });

    it("verwendet bei ungültiger täglicher Sollzeit sicher null", () => {
      const sick = createShift({
        type: "SICK",
        startTime: "00:00",
        endTime: "00:00",
        breakMinutes: 0,
        hourCreditSource:
          "DAILY_TARGET",
      });

      expect(
        getReportNetHours(
          sick,
          Number.NaN,
        ),
      ).toBe(0);
    });
  },
);
