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

function hasIssue(
  shifts: Shift[],
  title: string,
): boolean {
  return checkCompliance(shifts).some(
    (issue) =>
      issue.title === title,
  );
}

describe(
  "Dienstfolgen-Prüfung",
  () => {
    it("warnt bei Spät zu Früh am Folgetag mit ausreichender Ruhezeit", () => {
      const lateShift = createShift({
        id: "late",
        date: "2026-07-01",
        type: "LATE",
        startTime: "12:00",
        endTime: "20:00",
      });

      const earlyShift = createShift({
        id: "early",
        date: "2026-07-02",
        type: "EARLY",
        startTime: "07:00",
        endTime: "15:00",
      });

      const issue =
        checkCompliance([
          lateShift,
          earlyShift,
        ]).find(
          (currentIssue) =>
            currentIssue.title ===
            "Ungünstige Dienstfolge Spät zu Früh",
        );

      expect(issue).toBeDefined();

      expect(
        issue?.relatedShiftId,
      ).toBe("early");
    });

    it("erzeugt bei Spät zu Früh unter 11 Stunden keine zusätzliche Dienstfolgen-Warnung", () => {
      const lateShift = createShift({
        id: "late",
        date: "2026-07-01",
        type: "LATE",
        startTime: "12:00",
        endTime: "20:00",
      });

      const earlyShift = createShift({
        id: "early",
        date: "2026-07-02",
        type: "EARLY",
        startTime: "06:00",
        endTime: "14:00",
      });

      const issues =
        checkCompliance([
          lateShift,
          earlyShift,
        ]);

      expect(
        issues.some(
          (issue) =>
            issue.title ===
            "Ruhezeit unter 11 Stunden",
        ),
      ).toBe(true);

      expect(
        issues.some(
          (issue) =>
            issue.title ===
            "Ungünstige Dienstfolge Spät zu Früh",
        ),
      ).toBe(false);
    });

    it("meldet bei drei Nachtdiensten keine Nachtfolge-Warnung", () => {
      const shifts: Shift[] = [
        createShift({
          id: "night-1",
          date: "2026-07-01",
          type: "NIGHT",
          startTime: "21:00",
          endTime: "06:00",
        }),
        createShift({
          id: "night-2",
          date: "2026-07-02",
          type: "NIGHT",
          startTime: "21:00",
          endTime: "06:00",
        }),
        createShift({
          id: "night-3",
          date: "2026-07-03",
          type: "NIGHT",
          startTime: "21:00",
          endTime: "06:00",
        }),
      ];

      expect(
        hasIssue(
          shifts,
          "Vier oder mehr Nachtdienste in Folge",
        ),
      ).toBe(false);
    });

    it("warnt bei vier Nachtdiensten in Folge", () => {
      const shifts: Shift[] = [
        createShift({
          id: "night-1",
          date: "2026-07-01",
          type: "NIGHT",
          startTime: "21:00",
          endTime: "06:00",
        }),
        createShift({
          id: "night-2",
          date: "2026-07-02",
          type: "NIGHT",
          startTime: "21:00",
          endTime: "06:00",
        }),
        createShift({
          id: "night-3",
          date: "2026-07-03",
          type: "NIGHT",
          startTime: "21:00",
          endTime: "06:00",
        }),
        createShift({
          id: "night-4",
          date: "2026-07-04",
          type: "NIGHT",
          startTime: "21:00",
          endTime: "06:00",
        }),
      ];

      const issue =
        checkCompliance(shifts).find(
          (currentIssue) =>
            currentIssue.title ===
            "Vier oder mehr Nachtdienste in Folge",
        );

      expect(issue).toBeDefined();

      expect(
        issue?.relatedShiftId,
      ).toBe("night-4");
    });

    it("unterbricht die Nachtfolge durch einen Tag ohne Nachtdienst", () => {
      const shifts: Shift[] = [
        createShift({
          id: "night-1",
          date: "2026-07-01",
          type: "NIGHT",
          startTime: "21:00",
          endTime: "06:00",
        }),
        createShift({
          id: "night-2",
          date: "2026-07-02",
          type: "NIGHT",
          startTime: "21:00",
          endTime: "06:00",
        }),
        createShift({
          id: "night-3",
          date: "2026-07-04",
          type: "NIGHT",
          startTime: "21:00",
          endTime: "06:00",
        }),
        createShift({
          id: "night-4",
          date: "2026-07-05",
          type: "NIGHT",
          startTime: "21:00",
          endTime: "06:00",
        }),
      ];

      expect(
        hasIssue(
          shifts,
          "Vier oder mehr Nachtdienste in Folge",
        ),
      ).toBe(false);
    });

    it("zählt mehrere Nachtdienste am selben Datum nur einmal", () => {
      const shifts: Shift[] = [
        createShift({
          id: "night-1",
          date: "2026-07-01",
          type: "NIGHT",
          startTime: "20:00",
          endTime: "02:00",
        }),
        createShift({
          id: "night-1b",
          date: "2026-07-01",
          type: "NIGHT",
          startTime: "22:00",
          endTime: "06:00",
        }),
        createShift({
          id: "night-2",
          date: "2026-07-02",
          type: "NIGHT",
          startTime: "21:00",
          endTime: "06:00",
        }),
        createShift({
          id: "night-3",
          date: "2026-07-03",
          type: "NIGHT",
          startTime: "21:00",
          endTime: "06:00",
        }),
      ];

      expect(
        hasIssue(
          shifts,
          "Vier oder mehr Nachtdienste in Folge",
        ),
      ).toBe(false);
    });
  },
);