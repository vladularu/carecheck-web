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

function hasIssue(
  shifts: Shift[],
  title: string,
): boolean {
  return checkCompliance(shifts).some(
    (issue) => issue.title === title,
  );
}

describe("complianceService", () => {
  it("meldet bei genau 8 Stunden keine Überschreitung", () => {
    const shift = createShift({
      id: "shift-1",
      date: "2026-07-01",
      startTime: "08:00",
      endTime: "16:30",
      breakMinutes: 30,
    });

    const issues =
      checkCompliance([shift]);

    expect(
      issues.some((issue) =>
        issue.title.includes(
          "Tagesarbeitszeit",
        ),
      ),
    ).toBe(false);
  });

  it("warnt bei mehr als 8 Stunden Nettoarbeitszeit", () => {
    const shift = createShift({
      id: "shift-1",
      date: "2026-07-01",
      startTime: "08:00",
      endTime: "17:00",
      breakMinutes: 30,
    });

    const issues =
      checkCompliance([shift]);

    expect(
      issues.some(
        (issue) =>
          issue.title ===
            "Tagesarbeitszeit über 8 Stunden" &&
          issue.severity === "warning",
      ),
    ).toBe(true);
  });

  it("meldet mehr als 10 Stunden als kritisch", () => {
    const shift = createShift({
      id: "shift-1",
      date: "2026-07-01",
      startTime: "08:00",
      endTime: "19:00",
      breakMinutes: 30,
    });

    const issues =
      checkCompliance([shift]);

    expect(
      issues.some(
        (issue) =>
          issue.title ===
            "Tagesarbeitszeit über 10 Stunden" &&
          issue.severity === "critical",
      ),
    ).toBe(true);
  });

  it("fordert bei mehr als 6 Stunden mindestens 30 Minuten Pause", () => {
    const shift = createShift({
      id: "shift-1",
      date: "2026-07-01",
      startTime: "08:00",
      endTime: "15:00",
      breakMinutes: 20,
    });

    expect(
      hasIssue(
        [shift],
        "Pause zu kurz",
      ),
    ).toBe(true);
  });

  it("fordert bei mehr als 9 Stunden mindestens 45 Minuten Pause", () => {
    const shift = createShift({
      id: "shift-1",
      date: "2026-07-01",
      startTime: "08:00",
      endTime: "18:00",
      breakMinutes: 30,
    });

    const pauseIssue =
      checkCompliance([shift]).find(
        (issue) =>
          issue.title ===
          "Pause zu kurz",
      );

    expect(pauseIssue).toBeDefined();

    expect(
      pauseIssue?.description,
    ).toContain("45 Minuten");
  });

  it("meldet eine Ruhezeit unter 10 Stunden als kritisch", () => {
    const firstShift = createShift({
      id: "shift-1",
      date: "2026-07-01",
      startTime: "12:00",
      endTime: "20:00",
      breakMinutes: 30,
      type: "LATE",
    });

    const secondShift = createShift({
      id: "shift-2",
      date: "2026-07-02",
      startTime: "05:30",
      endTime: "13:30",
      breakMinutes: 30,
      type: "EARLY",
    });

    const issues =
      checkCompliance([
        firstShift,
        secondShift,
      ]);

    expect(
      issues.some(
        (issue) =>
          issue.title ===
            "Ruhezeit unter 10 Stunden" &&
          issue.severity === "critical",
      ),
    ).toBe(true);
  });

  it("warnt bei einer Ruhezeit zwischen 10 und 11 Stunden", () => {
    const firstShift = createShift({
      id: "shift-1",
      date: "2026-07-01",
      startTime: "12:00",
      endTime: "20:00",
      breakMinutes: 30,
      type: "LATE",
    });

    const secondShift = createShift({
      id: "shift-2",
      date: "2026-07-02",
      startTime: "06:30",
      endTime: "14:30",
      breakMinutes: 30,
      type: "EARLY",
    });

    const issues =
      checkCompliance([
        firstShift,
        secondShift,
      ]);

    expect(
      issues.some(
        (issue) =>
          issue.title ===
            "Ruhezeit unter 11 Stunden" &&
          issue.severity === "warning",
      ),
    ).toBe(true);
  });

  it("meldet bei mindestens 11 Stunden Ruhezeit keinen Ruhezeitverstoß", () => {
    const firstShift = createShift({
      id: "shift-1",
      date: "2026-07-01",
      startTime: "12:00",
      endTime: "20:00",
      breakMinutes: 30,
      type: "LATE",
    });

    const secondShift = createShift({
      id: "shift-2",
      date: "2026-07-02",
      startTime: "07:00",
      endTime: "15:00",
      breakMinutes: 30,
      type: "EARLY",
    });

    const issues =
      checkCompliance([
        firstShift,
        secondShift,
      ]);

    expect(
      issues.some((issue) =>
        issue.title.includes(
          "Ruhezeit unter",
        ),
      ),
    ).toBe(false);
  });

  it("erkennt zwei aufeinanderfolgende gearbeitete Wochenenden", () => {
    const firstWeekendShift =
      createShift({
        id: "shift-1",
        date: "2026-07-04",
        type: "EARLY",
      });

    const secondWeekendShift =
      createShift({
        id: "shift-2",
        date: "2026-07-11",
        type: "EARLY",
      });

    expect(
      hasIssue(
        [
          firstWeekendShift,
          secondWeekendShift,
        ],
        "Zwei Wochenenden in Folge gearbeitet",
      ),
    ).toBe(true);
  });

  it("meldet bei einem freien Wochenende dazwischen keine Wochenendfolge", () => {
    const firstWeekendShift =
      createShift({
        id: "shift-1",
        date: "2026-07-04",
        type: "EARLY",
      });

    const laterWeekendShift =
      createShift({
        id: "shift-2",
        date: "2026-07-18",
        type: "EARLY",
      });

    expect(
      hasIssue(
        [
          firstWeekendShift,
          laterWeekendShift,
        ],
        "Zwei Wochenenden in Folge gearbeitet",
      ),
    ).toBe(false);
  });

  it("schließt Frei, Urlaub und Krank vollständig aus", () => {
    const excludedShifts: Shift[] = [
      createShift({
        id: "free",
        date: "2026-07-01",
        startTime: "00:00",
        endTime: "23:59",
        breakMinutes: 0,
        type: "FREE",
      }),
      createShift({
        id: "vacation",
        date: "2026-07-02",
        startTime: "00:00",
        endTime: "23:59",
        breakMinutes: 0,
        type: "VACATION",
      }),
      createShift({
        id: "sick",
        date: "2026-07-03",
        startTime: "00:00",
        endTime: "23:59",
        breakMinutes: 0,
        type: "SICK",
      }),
    ];

    expect(
      checkCompliance(
        excludedShifts,
      ),
    ).toEqual([]);
  });

  it("prüft Fortbildungen als compliance-relevante Einträge", () => {
    const training = createShift({
      id: "training",
      date: "2026-07-01",
      startTime: "08:00",
      endTime: "19:00",
      breakMinutes: 30,
      type: "TRAINING",
    });

    const issues =
      checkCompliance([training]);

    expect(
      issues.some(
        (issue) =>
          issue.title ===
          "Tagesarbeitszeit über 10 Stunden",
      ),
    ).toBe(true);
  });

  it("ordnet einen Ruhezeitverstoß dem nachfolgenden Dienst zu", () => {
    const firstShift = createShift({
      id: "shift-1",
      date: "2026-07-01",
      startTime: "12:00",
      endTime: "20:00",
      type: "LATE",
    });

    const secondShift = createShift({
      id: "shift-2",
      date: "2026-07-02",
      startTime: "05:00",
      endTime: "13:00",
      type: "EARLY",
    });

    const issue =
      checkCompliance([
        firstShift,
        secondShift,
      ]).find(
        (currentIssue) =>
          currentIssue.title ===
          "Ruhezeit unter 10 Stunden",
      );

    expect(
      issue?.relatedShiftId,
    ).toBe("shift-2");
  });
});
  it("erkennt einen exakt doppelten Kalendereintrag", () => {
    const firstShift = createShift({
      id: "shift-1",
      date: "2026-07-06",
      startTime: "08:00",
      endTime: "16:30",
      breakMinutes: 30,
      type: "EARLY",
    });

    const duplicateShift = createShift({
      id: "shift-2",
      date: "2026-07-06",
      startTime: "08:00",
      endTime: "16:30",
      breakMinutes: 30,
      type: "EARLY",
    });

    const issues = checkCompliance([
      firstShift,
      duplicateShift,
    ]);

    expect(
      issues.some(
        (issue) =>
          issue.title ===
          "Doppelter Kalendereintrag",
      ),
    ).toBe(true);
  });

  it("ordnet einen doppelten Eintrag dem später gefundenen Eintrag zu", () => {
    const firstShift = createShift({
      id: "shift-1",
      date: "2026-07-06",
      startTime: "08:00",
      endTime: "16:30",
      breakMinutes: 30,
      type: "EARLY",
    });

    const duplicateShift = createShift({
      id: "shift-2",
      date: "2026-07-06",
      startTime: "08:00",
      endTime: "16:30",
      breakMinutes: 30,
      type: "EARLY",
    });

    const duplicateIssue =
      checkCompliance([
        firstShift,
        duplicateShift,
      ]).find(
        (issue) =>
          issue.title ===
          "Doppelter Kalendereintrag",
      );

    expect(
      duplicateIssue?.relatedShiftId,
    ).toBe("shift-2");
  });

  it("erkennt zwei zeitlich überlappende Dienste", () => {
    const firstShift = createShift({
      id: "shift-1",
      date: "2026-07-06",
      startTime: "08:00",
      endTime: "16:00",
      breakMinutes: 30,
      type: "EARLY",
    });

    const secondShift = createShift({
      id: "shift-2",
      date: "2026-07-06",
      startTime: "15:00",
      endTime: "22:00",
      breakMinutes: 30,
      type: "LATE",
    });

    const issues = checkCompliance([
      firstShift,
      secondShift,
    ]);

    expect(
      issues.some(
        (issue) =>
          issue.title ===
          "Dienste überschneiden sich",
      ),
    ).toBe(true);
  });

  it("erkennt Überschneidungen bei einem Dienst über Mitternacht", () => {
    const nightShift = createShift({
      id: "night",
      date: "2026-07-06",
      startTime: "21:00",
      endTime: "06:00",
      breakMinutes: 30,
      type: "NIGHT",
    });

    const earlyShift = createShift({
      id: "early",
      date: "2026-07-07",
      startTime: "05:30",
      endTime: "13:30",
      breakMinutes: 30,
      type: "EARLY",
    });

    const issues = checkCompliance([
      nightShift,
      earlyShift,
    ]);

    expect(
      issues.some(
        (issue) =>
          issue.title ===
          "Dienste überschneiden sich",
      ),
    ).toBe(true);
  });

  it("meldet direkt aneinandergrenzende Dienste nicht als Überschneidung", () => {
    const firstShift = createShift({
      id: "shift-1",
      date: "2026-07-06",
      startTime: "08:00",
      endTime: "12:00",
      breakMinutes: 0,
      type: "EARLY",
    });

    const secondShift = createShift({
      id: "shift-2",
      date: "2026-07-06",
      startTime: "12:00",
      endTime: "16:00",
      breakMinutes: 0,
      type: "LATE",
    });

    const issues = checkCompliance([
      firstShift,
      secondShift,
    ]);

    expect(
      issues.some(
        (issue) =>
          issue.title ===
          "Dienste überschneiden sich",
      ),
    ).toBe(false);
  });