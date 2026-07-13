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

function findIssue(
  shift: Shift,
  title: string,
) {
  return checkCompliance([shift]).find(
    (issue) =>
      issue.title === title,
  );
}

describe(
  "Zeitangaben-Plausibilität",
  () => {
    it("erkennt identische Beginn- und Endzeit", () => {
      const shift = createShift({
        id: "same-time",
        date: "2026-07-01",
        startTime: "08:00",
        endTime: "08:00",
      });

      const issues =
        checkCompliance([shift]);

      expect(
        issues.some(
          (issue) =>
            issue.title ===
            "Dienstbeginn und Dienstende identisch",
        ),
      ).toBe(true);
    });

    it("erzeugt bei identischer Zeit keine zusätzliche 10-Stunden-Meldung", () => {
      const shift = createShift({
        id: "same-time",
        date: "2026-07-01",
        startTime: "08:00",
        endTime: "08:00",
      });

      const issues =
        checkCompliance([shift]);

      expect(
        issues.some(
          (issue) =>
            issue.title ===
            "Tagesarbeitszeit über 10 Stunden",
        ),
      ).toBe(false);
    });

    it("erkennt einen negativen Pausenwert", () => {
      const shift = createShift({
        id: "negative-break",
        date: "2026-07-01",
        breakMinutes: -15,
      });

      const issue = findIssue(
        shift,
        "Negativer Pausenwert",
      );

      expect(issue).toBeDefined();
      expect(
        issue?.relatedShiftId,
      ).toBe("negative-break");
    });

    it("erkennt eine Pause länger als die Brutto-Dienstzeit", () => {
      const shift = createShift({
        id: "break-too-long",
        date: "2026-07-01",
        startTime: "08:00",
        endTime: "12:00",
        breakMinutes: 300,
      });

      const issue = findIssue(
        shift,
        "Pause länger als Dienstzeit",
      );

      expect(issue).toBeDefined();

      expect(
        issue?.description,
      ).toContain(
        "240 Minuten Brutto-Dienstzeit",
      );
    });

    it("akzeptiert eine Pause genau in Höhe der Bruttozeit ohne diese Plausibilitätsmeldung", () => {
      const shift = createShift({
        id: "break-equal",
        date: "2026-07-01",
        startTime: "08:00",
        endTime: "12:00",
        breakMinutes: 240,
      });

      expect(
        findIssue(
          shift,
          "Pause länger als Dienstzeit",
        ),
      ).toBeUndefined();
    });

    it("erkennt einen Brutto-Dienst über 16 Stunden", () => {
      const shift = createShift({
        id: "long-shift",
        date: "2026-07-01",
        startTime: "06:00",
        endTime: "23:00",
        breakMinutes: 60,
      });

      const issue = findIssue(
        shift,
        "Ungewöhnlich lange Dienstzeit",
      );

      expect(issue).toBeDefined();
      expect(issue?.severity).toBe(
        "critical",
      );
    });

    it("meldet bei genau 16 Stunden keine ungewöhnlich lange Dienstzeit", () => {
      const shift = createShift({
        id: "exact-16",
        date: "2026-07-01",
        startTime: "06:00",
        endTime: "22:00",
        breakMinutes: 60,
      });

      expect(
        findIssue(
          shift,
          "Ungewöhnlich lange Dienstzeit",
        ),
      ).toBeUndefined();
    });

    it("prüft Zeitplausibilität nicht bei Frei, Urlaub oder Krank", () => {
      const excludedTypes: ShiftType[] = [
        "FREE",
        "VACATION",
        "SICK",
      ];

      for (
        const type of
        excludedTypes
      ) {
        const shift = createShift({
          id: type.toLowerCase(),
          date: "2026-07-01",
          startTime: "08:00",
          endTime: "08:00",
          breakMinutes: -30,
          type,
        });

        expect(
          checkCompliance([shift]),
        ).toEqual([]);
      }
    });

    it("prüft Fortbildung auf unplausible Zeitangaben", () => {
      const training =
        createShift({
          id: "training",
          date: "2026-07-01",
          startTime: "09:00",
          endTime: "09:00",
          type: "TRAINING",
        });

      expect(
        findIssue(
          training,
          "Dienstbeginn und Dienstende identisch",
        ),
      ).toBeDefined();
    });
  },
);