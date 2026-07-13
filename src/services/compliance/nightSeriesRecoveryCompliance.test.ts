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
  type = "NIGHT",
  startTime = "21:00",
  endTime = "06:00",
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

function findRecoveryIssue(
  shifts: Shift[],
) {
  return checkCompliance(shifts).find(
    (issue) =>
      issue.title ===
      "Kurze Erholung nach Nachtserie",
  );
}

describe(
  "Erholung nach Nachtserien",
  () => {
    it("warnt nach zwei Nachtdiensten bei anschließendem Frühdienst unter 24 Stunden Erholung", () => {
      const shifts: Shift[] = [
        createShift({
          id: "night-1",
          date: "2026-07-01",
        }),
        createShift({
          id: "night-2",
          date: "2026-07-02",
        }),
        createShift({
          id: "early",
          date: "2026-07-03",
          type: "EARLY",
          startTime: "18:00",
          endTime: "23:00",
          breakMinutes: 0,
        }),
      ];

      const issue =
        findRecoveryIssue(shifts);

      expect(issue).toBeDefined();
      expect(issue?.severity).toBe(
        "warning",
      );
      expect(
        issue?.relatedShiftId,
      ).toBe("early");
    });

    it("warnt nach einer Nachtserie auch bei anschließendem Tagdienst", () => {
      const shifts: Shift[] = [
        createShift({
          id: "night-1",
          date: "2026-07-01",
        }),
        createShift({
          id: "night-2",
          date: "2026-07-02",
        }),
        createShift({
          id: "day",
          date: "2026-07-03",
          type: "DAY",
          startTime: "17:00",
          endTime: "22:00",
          breakMinutes: 0,
        }),
      ];

      expect(
        findRecoveryIssue(shifts),
      ).toBeDefined();
    });

    it("meldet nach nur einem Nachtdienst keine Nachtserien-Warnung", () => {
      const shifts: Shift[] = [
        createShift({
          id: "night",
          date: "2026-07-01",
        }),
        createShift({
          id: "early",
          date: "2026-07-02",
          type: "EARLY",
          startTime: "18:00",
          endTime: "23:00",
          breakMinutes: 0,
        }),
      ];

      expect(
        findRecoveryIssue(shifts),
      ).toBeUndefined();
    });

    it("meldet bei mindestens 24 Stunden Erholung keine Warnung", () => {
      const shifts: Shift[] = [
        createShift({
          id: "night-1",
          date: "2026-07-01",
        }),
        createShift({
          id: "night-2",
          date: "2026-07-02",
        }),
        createShift({
          id: "early",
          date: "2026-07-04",
          type: "EARLY",
          startTime: "08:00",
          endTime: "16:30",
        }),
      ];

      expect(
        findRecoveryIssue(shifts),
      ).toBeUndefined();
    });

    it("erzeugt bei unter 11 Stunden Ruhezeit keine zusätzliche Nachtserien-Warnung", () => {
      const shifts: Shift[] = [
        createShift({
          id: "night-1",
          date: "2026-07-01",
        }),
        createShift({
          id: "night-2",
          date: "2026-07-02",
        }),
        createShift({
          id: "early",
          date: "2026-07-03",
          type: "EARLY",
          startTime: "15:00",
          endTime: "20:00",
          breakMinutes: 0,
        }),
      ];

      const issues =
        checkCompliance(shifts);

      expect(
        issues.some((issue) =>
          issue.title.startsWith(
            "Ruhezeit unter",
          ),
        ),
      ).toBe(true);

      expect(
        findRecoveryIssue(shifts),
      ).toBeUndefined();
    });

    it("unterbricht die Nachtserie bei einem freien Kalendertag", () => {
      const shifts: Shift[] = [
        createShift({
          id: "night-1",
          date: "2026-07-01",
        }),
        createShift({
          id: "night-2",
          date: "2026-07-03",
        }),
        createShift({
          id: "early",
          date: "2026-07-04",
          type: "EARLY",
          startTime: "18:00",
          endTime: "23:00",
          breakMinutes: 0,
        }),
      ];

      expect(
        findRecoveryIssue(shifts),
      ).toBeUndefined();
    });

    it("prüft die Nachtserie über eine Monatsgrenze", () => {
      const shifts: Shift[] = [
        createShift({
          id: "night-june",
          date: "2026-06-30",
        }),
        createShift({
          id: "night-july",
          date: "2026-07-01",
        }),
        createShift({
          id: "early-july",
          date: "2026-07-02",
          type: "EARLY",
          startTime: "18:00",
          endTime: "23:00",
          breakMinutes: 0,
        }),
      ];

      const issue =
        findRecoveryIssue(shifts);

      expect(issue).toBeDefined();

      expect(
        issue?.relatedShiftId,
      ).toBe("early-july");
    });
  },
);