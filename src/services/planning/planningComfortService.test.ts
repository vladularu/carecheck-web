import { describe, expect, it } from "vitest";
import { defaultShiftTemplates } from "../../data/defaultShiftTemplates";
import type { Shift } from "../../types/index";
import {
  applyPlanningTemplate,
  copyDayShifts,
  createPlanningTemplate,
  createRecurringPatternShifts,
  detectPlanningConflicts,
  parseScheduleImport,
} from "./planningComfortService";

function createIdFactory(prefix: string): () => string {
  let index = 0;

  return () => {
    index++;

    return `${prefix}-${index}`;
  };
}

function createShift(
  overrides: Partial<Shift> = {},
): Shift {
  return {
    id: "shift-1",
    date: "2026-07-01",
    startTime: "06:00",
    endTime: "14:00",
    breakMinutes: 30,
    type: "EARLY",
    ...overrides,
  };
}

describe("planningComfortService", () => {
  it("erzeugt wiederkehrende Dienstfolgen aus bestehenden Vorlagen", () => {
    const shifts = createRecurringPatternShifts({
      startDate: "2026-07-01",
      days: 4,
      pattern: ["EARLY", "LATE", "FREE"],
      shiftTemplates: defaultShiftTemplates,
      idFactory: createIdFactory("seq"),
    });

    expect(shifts.map((shift) => shift.type)).toEqual([
      "EARLY",
      "LATE",
      "FREE",
      "EARLY",
    ]);
    expect(shifts.map((shift) => shift.date)).toEqual([
      "2026-07-01",
      "2026-07-02",
      "2026-07-03",
      "2026-07-04",
    ]);
    expect(shifts[2]).toMatchObject({
      startTime: "00:00",
      endTime: "00:00",
      breakMinutes: 0,
    });
  });

  it("speichert Monatsvorlagen und wendet sie auf kuerzere Monate defensiv an", () => {
    const template = createPlanningTemplate({
      id: "template-1",
      name: "Nachtfolge",
      sourceYear: 2026,
      sourceMonth: 6,
      createdAt: "2026-07-14T08:00:00.000Z",
      shifts: [
        createShift({
          id: "night-1",
          date: "2026-07-28",
          type: "NIGHT",
          startTime: "21:00",
          endTime: "07:30",
          breakMinutes: 60,
        }),
        createShift({
          id: "late-1",
          date: "2026-07-31",
          type: "LATE",
          startTime: "13:18",
          endTime: "21:30",
        }),
      ],
    });

    const applied = applyPlanningTemplate({
      template,
      targetYear: 2026,
      targetMonth: 1,
      idFactory: createIdFactory("applied"),
    });

    expect(template.sourceMonthLabel).toBe("07.2026");
    expect(applied).toHaveLength(1);
    expect(applied[0]).toMatchObject({
      id: "applied-1",
      date: "2026-02-28",
      type: "NIGHT",
    });
  });

  it("kopiert und verschiebt alle Eintraege eines Tages", () => {
    const source = [
      createShift({
        id: "early-1",
        date: "2026-07-10",
      }),
      createShift({
        id: "training-1",
        date: "2026-07-10",
        type: "TRAINING",
        startTime: "15:00",
        endTime: "16:00",
        breakMinutes: 0,
      }),
    ];

    const copied = copyDayShifts({
      shifts: source,
      sourceDate: "2026-07-10",
      targetDate: "2026-07-12",
      mode: "copy",
      idFactory: createIdFactory("copy"),
    });
    const moved = copyDayShifts({
      shifts: source,
      sourceDate: "2026-07-10",
      targetDate: "2026-07-13",
      mode: "move",
      idFactory: createIdFactory("move"),
    });

    expect(copied.shiftIdsToRemove).toEqual([]);
    expect(copied.shiftsToAdd.map((shift) => shift.date)).toEqual([
      "2026-07-12",
      "2026-07-12",
    ]);
    expect(moved.shiftIdsToRemove).toEqual([
      "early-1",
      "training-1",
    ]);
    expect(moved.shiftsToAdd.map((shift) => shift.id)).toEqual([
      "move-1",
      "move-2",
    ]);
  });

  it("meldet Dubletten und zeitliche Ueberschneidungen vor dem Speichern", () => {
    const existing = [
      createShift({
        id: "existing-1",
        date: "2026-07-15",
        startTime: "06:00",
        endTime: "14:00",
      }),
    ];
    const candidates = [
      createShift({
        id: "candidate-1",
        date: "2026-07-15",
        startTime: "06:00",
        endTime: "14:00",
      }),
      createShift({
        id: "candidate-2",
        date: "2026-07-15",
        startTime: "13:00",
        endTime: "21:00",
        type: "LATE",
      }),
    ];

    const conflicts = detectPlanningConflicts(
      existing,
      candidates,
    );

    expect(
      conflicts.some(
        (conflict) =>
          conflict.severity === "warning" &&
          conflict.title === "Moegliche Dublette",
      ),
    ).toBe(true);
    expect(
      conflicts.some(
        (conflict) =>
          conflict.severity === "critical" &&
          conflict.title === "Zeitliche Ueberschneidung",
      ),
    ).toBe(true);
  });

  it("importiert CSV-Zeilen und meldet ungueltige Eintraege", () => {
    const result = parseScheduleImport(
      [
        "2026-07-01;EARLY;06:00;14:00;30;Station A",
        "2026-07-02;VACATION;08:00;16:00;30;Urlaub",
        "2026-07-03;UNKNOWN;08:00;16:00;0",
      ].join("\n"),
      createIdFactory("import"),
    );

    expect(result.errors).toEqual([
      "Zeile 3: unbekannte Dienstart.",
    ]);
    expect(result.shifts).toHaveLength(2);
    expect(result.shifts[0]).toMatchObject({
      id: "import-1",
      type: "EARLY",
      note: "Station A",
    });
    expect(result.shifts[1]).toMatchObject({
      type: "VACATION",
      startTime: "00:00",
      endTime: "00:00",
      breakMinutes: 0,
    });
  });
});
