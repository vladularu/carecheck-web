import {
  describe,
  expect,
  it,
} from "vitest";
import type {
  Shift,
  ShiftType,
} from "../../types/index";
import { checkCompliance } from "./complianceService";

interface CreateShiftInput {
  id: string;
  date: string;
  type?: ShiftType;
  startTime?: string;
  endTime?: string;
  breakMinutes?: number;
}

function createShift({
  id,
  date,
  type = "EARLY",
  startTime = "08:00",
  endTime = "16:30",
  breakMinutes = 30,
}: CreateShiftInput): Shift {
  return {
    id,
    date,
    type,
    startTime,
    endTime,
    breakMinutes,
  };
}

function createWorkingDays(
  dateKeys: string[],
): Shift[] {
  return dateKeys.map(
    (date, index) =>
      createShift({
        id: `shift-${index + 1}`,
        date,
      }),
  );
}

describe(
  "aufeinanderfolgende Arbeitstage",
  () => {
    it("meldet bei sechs Arbeitstagen keine Warnung", () => {
      const shifts = createWorkingDays([
        "2026-07-01",
        "2026-07-02",
        "2026-07-03",
        "2026-07-04",
        "2026-07-05",
        "2026-07-06",
      ]);

      const issues =
        checkCompliance(shifts);

      expect(
        issues.some(
          (issue) =>
            issue.title ===
            "Sieben oder mehr Arbeitstage in Folge",
        ),
      ).toBe(false);
    });

    it("warnt bei sieben Arbeitstagen in Folge", () => {
      const shifts = createWorkingDays([
        "2026-07-01",
        "2026-07-02",
        "2026-07-03",
        "2026-07-04",
        "2026-07-05",
        "2026-07-06",
        "2026-07-07",
      ]);

      const issue =
        checkCompliance(shifts).find(
          (currentIssue) =>
            currentIssue.title ===
            "Sieben oder mehr Arbeitstage in Folge",
        );

      expect(issue).toBeDefined();
      expect(issue?.severity).toBe(
        "warning",
      );
      expect(
        issue?.relatedShiftId,
      ).toBe("shift-7");
    });

    it("zählt mehrere Dienste am selben Datum nur als einen Arbeitstag", () => {
      const shifts = [
        ...createWorkingDays([
          "2026-07-01",
          "2026-07-02",
          "2026-07-03",
          "2026-07-04",
          "2026-07-05",
          "2026-07-06",
        ]),
        createShift({
          id: "second-shift-same-day",
          date: "2026-07-06",
          type: "LATE",
          startTime: "17:00",
          endTime: "20:00",
          breakMinutes: 0,
        }),
      ];

      const issues =
        checkCompliance(shifts);

      expect(
        issues.some(
          (issue) =>
            issue.title ===
            "Sieben oder mehr Arbeitstage in Folge",
        ),
      ).toBe(false);
    });

    it("unterbricht die Folge durch einen freien Tag", () => {
      const shifts = createWorkingDays([
        "2026-07-01",
        "2026-07-02",
        "2026-07-03",
        "2026-07-05",
        "2026-07-06",
        "2026-07-07",
        "2026-07-08",
      ]);

      const issues =
        checkCompliance(shifts);

      expect(
        issues.some(
          (issue) =>
            issue.title ===
            "Sieben oder mehr Arbeitstage in Folge",
        ),
      ).toBe(false);
    });

    it("zählt Fortbildung als Arbeitstag der Prüfsequenz", () => {
      const shifts = [
        ...createWorkingDays([
          "2026-07-01",
          "2026-07-02",
          "2026-07-03",
          "2026-07-04",
          "2026-07-05",
          "2026-07-06",
        ]),
        createShift({
          id: "training-day",
          date: "2026-07-07",
          type: "TRAINING",
        }),
      ];

      const issue =
        checkCompliance(shifts).find(
          (currentIssue) =>
            currentIssue.title ===
            "Sieben oder mehr Arbeitstage in Folge",
        );

      expect(issue).toBeDefined();

      expect(
        issue?.relatedShiftId,
      ).toBe("training-day");
    });
  },
);