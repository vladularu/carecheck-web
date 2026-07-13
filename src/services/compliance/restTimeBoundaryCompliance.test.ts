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
  startTime?: string;
  endTime?: string;
  breakMinutes?: number;
  type?: ShiftType;
}

function createShift({
  id,
  date,
  startTime = "08:00",
  endTime = "16:00",
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

function getRestIssues(
  shifts: Shift[],
) {
  return checkCompliance(
    shifts,
  ).filter((issue) =>
    issue.title.startsWith(
      "Ruhezeit unter",
    ),
  );
}

describe(
  "Ruhezeit mit mehreren Tageseinträgen",
  () => {
    it("prüft mehrere Einträge desselben Tages nicht gegeneinander", () => {
      const shifts: Shift[] = [
        createShift({
          id: "morning",
          date: "2026-07-01",
          startTime: "08:00",
          endTime: "12:00",
          breakMinutes: 0,
          type: "EARLY",
        }),
        createShift({
          id: "afternoon",
          date: "2026-07-01",
          startTime: "14:00",
          endTime: "18:00",
          breakMinutes: 0,
          type: "LATE",
        }),
      ];

      expect(
        getRestIssues(shifts),
      ).toHaveLength(0);
    });

    it("verwendet das späteste Dienstende des Vortages", () => {
      const shifts: Shift[] = [
        createShift({
          id: "early-day-one",
          date: "2026-07-01",
          startTime: "08:00",
          endTime: "12:00",
          breakMinutes: 0,
        }),
        createShift({
          id: "late-day-one",
          date: "2026-07-01",
          startTime: "14:00",
          endTime: "22:00",
          breakMinutes: 30,
          type: "LATE",
        }),
        createShift({
          id: "early-day-two",
          date: "2026-07-02",
          startTime: "08:00",
          endTime: "16:00",
          breakMinutes: 30,
        }),
      ];

      const issue =
        getRestIssues(shifts).find(
          (currentIssue) =>
            currentIssue.title ===
            "Ruhezeit unter 11 Stunden",
        );

      expect(issue).toBeDefined();

      expect(
        issue?.relatedShiftId,
      ).toBe("early-day-two");

      expect(
        issue?.description,
      ).toContain("10 h Ruhezeit");
    });

    it("verwendet den frühesten Beginn des Folgetages", () => {
      const shifts: Shift[] = [
        createShift({
          id: "late",
          date: "2026-07-01",
          startTime: "14:00",
          endTime: "22:00",
          type: "LATE",
        }),
        createShift({
          id: "later-start",
          date: "2026-07-02",
          startTime: "10:00",
          endTime: "14:00",
          breakMinutes: 0,
          type: "DAY",
        }),
        createShift({
          id: "first-start",
          date: "2026-07-02",
          startTime: "07:00",
          endTime: "09:00",
          breakMinutes: 0,
          type: "EARLY",
        }),
      ];

      const issue =
        getRestIssues(shifts).find(
          (currentIssue) =>
            currentIssue.title ===
            "Ruhezeit unter 10 Stunden",
        );

      expect(issue).toBeDefined();

      expect(
        issue?.relatedShiftId,
      ).toBe("first-start");
    });

    it("berücksichtigt das Ende eines Nachtdienstes als spätestes Tagesende", () => {
      const shifts: Shift[] = [
        createShift({
          id: "day-shift",
          date: "2026-07-01",
          startTime: "08:00",
          endTime: "16:00",
          type: "DAY",
        }),
        createShift({
          id: "night-shift",
          date: "2026-07-01",
          startTime: "21:00",
          endTime: "06:00",
          type: "NIGHT",
        }),
        createShift({
          id: "next-shift",
          date: "2026-07-02",
          startTime: "16:00",
          endTime: "20:00",
          breakMinutes: 0,
          type: "LATE",
        }),
      ];

      const issue =
        getRestIssues(shifts).find(
          (currentIssue) =>
            currentIssue.title ===
            "Ruhezeit unter 11 Stunden",
        );

      expect(issue).toBeDefined();

      expect(
        issue?.relatedShiftId,
      ).toBe("next-shift");

      expect(
        issue?.description,
      ).toContain("10 h Ruhezeit");
    });

    it("lässt Urlaub, Krank und Frei die Tagesgrenzen nicht verändern", () => {
      const shifts: Shift[] = [
        createShift({
          id: "late",
          date: "2026-07-01",
          startTime: "14:00",
          endTime: "22:00",
          type: "LATE",
        }),
        createShift({
          id: "vacation",
          date: "2026-07-01",
          startTime: "00:00",
          endTime: "23:59",
          breakMinutes: 0,
          type: "VACATION",
        }),
        createShift({
          id: "sick",
          date: "2026-07-02",
          startTime: "00:00",
          endTime: "23:59",
          breakMinutes: 0,
          type: "SICK",
        }),
        createShift({
          id: "free",
          date: "2026-07-02",
          startTime: "00:00",
          endTime: "23:59",
          breakMinutes: 0,
          type: "FREE",
        }),
        createShift({
          id: "early",
          date: "2026-07-02",
          startTime: "07:00",
          endTime: "15:00",
          type: "EARLY",
        }),
      ];

      const issue =
        getRestIssues(shifts).find(
          (currentIssue) =>
            currentIssue.title ===
            "Ruhezeit unter 10 Stunden",
        );

      expect(issue).toBeDefined();

      expect(
        issue?.relatedShiftId,
      ).toBe("early");
    });

    it("ignoriert identische Beginn- und Endzeit bei der Ruhezeitberechnung", () => {
      const shifts: Shift[] = [
        createShift({
          id: "late",
          date: "2026-07-01",
          startTime: "14:00",
          endTime: "22:00",
          type: "LATE",
        }),
        createShift({
          id: "invalid",
          date: "2026-07-01",
          startTime: "23:00",
          endTime: "23:00",
          type: "CUSTOM",
        }),
        createShift({
          id: "early",
          date: "2026-07-02",
          startTime: "09:00",
          endTime: "17:00",
          type: "EARLY",
        }),
      ];

      expect(
        getRestIssues(shifts),
      ).toHaveLength(0);

      expect(
        checkCompliance(shifts).some(
          (issue) =>
            issue.title ===
            "Dienstbeginn und Dienstende identisch",
        ),
      ).toBe(true);
    });
  },
);
