import { describe, expect, it } from "vitest";
import type { Shift, UserProfile } from "../../types/index";
import {
  calculateMonthlyHours,
  countPlannedDays,
  countShiftTypes,
  filterCountedShifts,
} from "./monthlyHoursCalculator";
import { filterComplianceRelevantShifts } from "./shiftTypeRules";

const profile: UserProfile = {
  federalState: "HE",
  weeklyHours: 38.5,
  payGroup: "P8",
  payLevel: 4,
};

function createShift(
  overrides: Partial<Shift> & Pick<Shift, "id" | "date" | "type">,
): Shift {
  return {
    startTime: "06:00",
    endTime: "14:12",
    breakMinutes: 30,
    ...overrides,
  };
}

describe("monthlyHoursCalculator", () => {
  it("schließt FREE aus Dienstzahl, Stunden und Planungstagen aus", () => {
    const shifts: Shift[] = [
      createShift({
        id: "early-1",
        date: "2026-07-01",
        type: "EARLY",
      }),
      createShift({
        id: "free-1",
        date: "2026-07-02",
        type: "FREE",
        startTime: "00:00",
        endTime: "00:00",
        breakMinutes: 0,
      }),
    ];

    const result = calculateMonthlyHours(shifts, profile, 2026, 6);

    expect(result.shiftCount).toBe(1);
    expect(result.planningEntryCount).toBe(1);
    expect(result.plannedDayCount).toBe(1);
    expect(result.actualHours).toBe(7.7);

    expect(result.shiftTypeCounts).toEqual([
      {
        type: "EARLY",
        count: 1,
      },
    ]);
  });

  it("zählt Urlaub, Krank und Fortbildung als planungsrelevante Einträge", () => {
    const shifts: Shift[] = [
      createShift({
        id: "vacation-1",
        date: "2026-07-01",
        type: "VACATION",
      }),
      createShift({
        id: "sick-1",
        date: "2026-07-02",
        type: "SICK",
      }),
      createShift({
        id: "training-1",
        date: "2026-07-03",
        type: "TRAINING",
      }),
      createShift({
        id: "free-1",
        date: "2026-07-04",
        type: "FREE",
        startTime: "00:00",
        endTime: "00:00",
        breakMinutes: 0,
      }),
    ];

    expect(filterCountedShifts(shifts)).toHaveLength(3);

    expect(countPlannedDays(shifts)).toBe(3);

    expect(countShiftTypes(shifts)).toEqual([
      {
        type: "VACATION",
        count: 1,
      },
      {
        type: "SICK",
        count: 1,
      },
      {
        type: "TRAINING",
        count: 1,
      },
    ]);
  });

  it("zählt mehrere Einträge am selben Datum als mehrere Dienste, aber nur einen Planungstag", () => {
    const shifts: Shift[] = [
      createShift({
        id: "early-1",
        date: "2026-07-01",
        type: "EARLY",
      }),
      createShift({
        id: "training-1",
        date: "2026-07-01",
        type: "TRAINING",
        startTime: "15:00",
        endTime: "17:00",
        breakMinutes: 0,
      }),
    ];

    const result = calculateMonthlyHours(shifts, profile, 2026, 6);

    expect(result.shiftCount).toBe(2);

    expect(result.planningEntryCount).toBe(2);

    expect(result.plannedDayCount).toBe(1);
  });

  it("schließt FREE, Urlaub und Krank aus der Compliance-Prüfmenge aus", () => {
    const shifts: Shift[] = [
      createShift({
        id: "early-1",
        date: "2026-07-01",
        type: "EARLY",
      }),
      createShift({
        id: "training-1",
        date: "2026-07-02",
        type: "TRAINING",
      }),
      createShift({
        id: "vacation-1",
        date: "2026-07-03",
        type: "VACATION",
      }),
      createShift({
        id: "sick-1",
        date: "2026-07-04",
        type: "SICK",
      }),
      createShift({
        id: "free-1",
        date: "2026-07-05",
        type: "FREE",
        startTime: "00:00",
        endTime: "00:00",
        breakMinutes: 0,
      }),
    ];

    const relevantShifts = filterComplianceRelevantShifts(shifts);

    expect(relevantShifts.map((shift) => shift.type)).toEqual([
      "EARLY",
      "TRAINING",
    ]);
  });

  it("ignoriert Einträge aus anderen Monaten", () => {
    const shifts: Shift[] = [
      createShift({
        id: "july-1",
        date: "2026-07-01",
        type: "EARLY",
      }),
      createShift({
        id: "august-1",
        date: "2026-08-01",
        type: "LATE",
      }),
    ];

    const result = calculateMonthlyHours(shifts, profile, 2026, 6);

    expect(result.calendarEntryCount).toBe(1);

    expect(result.shiftCount).toBe(1);

    expect(result.workShiftCount).toBe(1);

    expect(result.shiftTypeCounts).toEqual([
      {
        type: "EARLY",
        count: 1,
      },
    ]);
  });

  it("trennt Kalendereinträge, Planung, Arbeitsdienste und Abwesenheiten", () => {
    const shifts: Shift[] = [
      createShift({
        id: "early-1",
        date: "2026-07-01",
        type: "EARLY",
      }),
      createShift({
        id: "night-1",
        date: "2026-07-02",
        type: "NIGHT",
        startTime: "21:00",
        endTime: "06:00",
      }),
      createShift({
        id: "training-1",
        date: "2026-07-03",
        type: "TRAINING",
      }),
      createShift({
        id: "vacation-1",
        date: "2026-07-04",
        type: "VACATION",
      }),
      createShift({
        id: "sick-1",
        date: "2026-07-05",
        type: "SICK",
      }),
      createShift({
        id: "free-1",
        date: "2026-07-06",
        type: "FREE",
        startTime: "00:00",
        endTime: "00:00",
        breakMinutes: 0,
      }),
    ];

    const result = calculateMonthlyHours(shifts, profile, 2026, 6);

    expect(result.calendarEntryCount).toBe(6);

    expect(result.planningEntryCount).toBe(5);

    expect(result.shiftCount).toBe(5);

    expect(result.workShiftCount).toBe(2);

    expect(result.complianceRelevantShiftCount).toBe(3);

    expect(result.trainingDayCount).toBe(1);

    expect(result.vacationDayCount).toBe(1);

    expect(result.sickDayCount).toBe(1);

    expect(result.freeDayCount).toBe(1);

    expect(result.plannedDayCount).toBe(5);
  });

  it("zählt mehrere gleiche Abwesenheitseinträge am selben Tag nur einmal als Tag", () => {
    const shifts: Shift[] = [
      createShift({
        id: "vacation-1",
        date: "2026-07-01",
        type: "VACATION",
      }),
      createShift({
        id: "vacation-2",
        date: "2026-07-01",
        type: "VACATION",
      }),
      createShift({
        id: "sick-1",
        date: "2026-07-02",
        type: "SICK",
      }),
      createShift({
        id: "sick-2",
        date: "2026-07-02",
        type: "SICK",
      }),
    ];

    const result = calculateMonthlyHours(shifts, profile, 2026, 6);

    expect(result.calendarEntryCount).toBe(4);

    expect(result.planningEntryCount).toBe(4);

    expect(result.vacationDayCount).toBe(1);

    expect(result.sickDayCount).toBe(1);

    expect(result.plannedDayCount).toBe(2);
  });

  it("bewertet Urlaub immer mit der täglichen Sollarbeitszeit", () => {
    const vacation = createShift({
      id: "vacation-1",
      date: "2026-07-01",
      type: "VACATION",
      startTime: "00:00",
      endTime: "23:59",
      breakMinutes: 0,
    });

    const result = calculateMonthlyHours([vacation], profile, 2026, 6);

    expect(result.averageDailyHours).toBe(7.7);

    expect(result.actualHours).toBe(7.7);
  });

  it("übernimmt bei Krank die gespeicherten Stunden der geplanten Schicht", () => {
    const sick = createShift({
      id: "sick-1",
      date: "2026-07-02",
      type: "SICK",
      startTime: "00:00",
      endTime: "00:00",
      breakMinutes: 0,
      creditedHours: 9.25,
      hourCreditSource: "PLANNED_SHIFT",
      sourceShiftId: "night-1",
    });

    const result = calculateMonthlyHours([sick], profile, 2026, 6);

    expect(result.actualHours).toBe(9.25);
  });

  it("verwendet bei Krank ohne geplante Schicht die tägliche Sollarbeitszeit", () => {
    const sick = createShift({
      id: "sick-1",
      date: "2026-07-02",
      type: "SICK",
      startTime: "00:00",
      endTime: "00:00",
      breakMinutes: 0,
    });

    const result = calculateMonthlyHours([sick], profile, 2026, 6);

    expect(result.actualHours).toBe(7.7);
  });

  it("passt die Urlaubsgutschrift an die Wochenarbeitszeit des Profils an", () => {
    const partTimeProfile: UserProfile = {
      ...profile,
      weeklyHours: 30,
    };

    const vacation = createShift({
      id: "vacation-1",
      date: "2026-07-01",
      type: "VACATION",
      startTime: "00:00",
      endTime: "00:00",
      breakMinutes: 0,
      creditedHours: 7.7,
      hourCreditSource: "DAILY_TARGET",
    });

    const result = calculateMonthlyHours([vacation], partTimeProfile, 2026, 6);

    expect(result.averageDailyHours).toBe(6);

    /*
     * Monatsberechnung verwendet bei VACATION
     * grundsätzlich die aktuelle tägliche
     * Sollarbeitszeit. Der AppContext aktualisiert
     * zusätzlich den gespeicherten Wert.
     */
    expect(result.actualHours).toBe(6);
  });
});