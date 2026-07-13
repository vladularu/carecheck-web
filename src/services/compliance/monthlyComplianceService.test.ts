import {
  describe,
  expect,
  it,
} from "vitest";
import type {
  Shift,
  ShiftType,
} from "../../types/index";
import { calculateMonthlyCompliance } from "./monthlyComplianceService";

interface CreateShiftInput {
  id: string;
  date: string;
  startTime?: string;
  endTime?: string;
  breakMinutes?: number;
  type?: ShiftType;
}

function createShift({
  id,
  date,
  startTime = "08:00",
  endTime = "16:30",
  breakMinutes = 30,
  type = "EARLY",
}: CreateShiftInput): Shift {
  return {
    id,
    date,
    startTime,
    endTime,
    breakMinutes,
    type,
  };
}

describe("monthlyComplianceService", () => {
  it("erkennt eine zu kurze Ruhezeit vom Vormonat zum ausgewählten Monat", () => {
    const lateShift = createShift({
      id: "late-june",
      date: "2026-06-30",
      startTime: "12:00",
      endTime: "20:00",
      type: "LATE",
    });

    const earlyShift = createShift({
      id: "early-july",
      date: "2026-07-01",
      startTime: "05:30",
      endTime: "13:30",
      type: "EARLY",
    });

    const result =
      calculateMonthlyCompliance(
        [
          lateShift,
          earlyShift,
        ],
        2026,
        6,
      );

    expect(
      result.issues.some(
        (issue) =>
          issue.title ===
            "Ruhezeit unter 10 Stunden" &&
          issue.relatedShiftId ===
            "early-july",
      ),
    ).toBe(true);
  });

  it("übernimmt keine Prüfmeldung, die nur zum Vormonat gehört", () => {
    const longShift = createShift({
      id: "long-june",
      date: "2026-06-29",
      startTime: "08:00",
      endTime: "19:00",
      breakMinutes: 30,
    });

    const normalJulyShift =
      createShift({
        id: "normal-july",
        date: "2026-07-05",
      });

    const result =
      calculateMonthlyCompliance(
        [
          longShift,
          normalJulyShift,
        ],
        2026,
        6,
      );

    expect(
      result.issues.some(
        (issue) =>
          issue.relatedShiftId ===
          "long-june",
      ),
    ).toBe(false);
  });

  it("erkennt zwei aufeinanderfolgende Wochenenden über die Monatsgrenze", () => {
    const previousWeekend =
      createShift({
        id: "june-weekend",
        date: "2026-06-27",
        type: "EARLY",
      });

    const selectedMonthWeekend =
      createShift({
        id: "july-weekend",
        date: "2026-07-04",
        type: "EARLY",
      });

    const result =
      calculateMonthlyCompliance(
        [
          previousWeekend,
          selectedMonthWeekend,
        ],
        2026,
        6,
      );

    expect(
      result.issues.some(
        (issue) =>
          issue.title ===
            "Zwei Wochenenden in Folge gearbeitet" &&
          issue.relatedShiftId ===
            "july-weekend",
      ),
    ).toBe(true);
  });

  it("zählt nur compliance-relevante Einträge des ausgewählten Monats", () => {
    const shifts: Shift[] = [
      createShift({
        id: "early",
        date: "2026-07-01",
        type: "EARLY",
      }),
      createShift({
        id: "training",
        date: "2026-07-02",
        type: "TRAINING",
      }),
      createShift({
        id: "vacation",
        date: "2026-07-03",
        type: "VACATION",
      }),
      createShift({
        id: "sick",
        date: "2026-07-04",
        type: "SICK",
      }),
      createShift({
        id: "free",
        date: "2026-07-05",
        type: "FREE",
      }),
    ];

    const result =
      calculateMonthlyCompliance(
        shifts,
        2026,
        6,
      );

    expect(
      result.shiftsInSelectedMonth,
    ).toHaveLength(5);

    expect(
      result
        .complianceRelevantShiftsInSelectedMonth,
    ).toHaveLength(2);
  });

  it("ignoriert Einträge nach dem ausgewählten Monat", () => {
    const lastJulyShift =
      createShift({
        id: "july-last",
        date: "2026-07-31",
        startTime: "12:00",
        endTime: "20:00",
        type: "LATE",
      });

    const firstAugustShift =
      createShift({
        id: "august-first",
        date: "2026-08-01",
        startTime: "05:30",
        endTime: "13:30",
        type: "EARLY",
      });

    const julyResult =
      calculateMonthlyCompliance(
        [
          lastJulyShift,
          firstAugustShift,
        ],
        2026,
        6,
      );

    expect(
      julyResult.issues.some(
        (issue) =>
          issue.relatedShiftId ===
          "august-first",
      ),
    ).toBe(false);

    const augustResult =
      calculateMonthlyCompliance(
        [
          lastJulyShift,
          firstAugustShift,
        ],
        2026,
        7,
      );

    expect(
      augustResult.issues.some(
        (issue) =>
          issue.title ===
            "Ruhezeit unter 10 Stunden" &&
          issue.relatedShiftId ===
            "august-first",
      ),
    ).toBe(true);
  });
});