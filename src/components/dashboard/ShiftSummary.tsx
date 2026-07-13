import type { ShiftTypeCount } from "../../services/calculation/monthlyHoursCalculator";
import type { ShiftType } from "../../types/index";
import Card from "../ui/Card";

const shiftLabels: Record<ShiftType, string> = {
  EARLY: "Frühdienst",
  LATE: "Spätdienst",
  NIGHT: "Nachtdienst",
  DAY: "Tagdienst",
  TRAINING: "Fortbildung",
  VACATION: "Urlaub",
  SICK: "Krank",
  FREE: "Frei",
  CUSTOM: "Individuell",
};

interface ShiftSummaryProps {
  workShiftCount: number;
  planningEntryCount: number;
  plannedDayCount: number;
  calendarEntryCount: number;
  vacationDayCount: number;
  sickDayCount: number;
  trainingDayCount: number;
  freeDayCount: number;
  shiftTypeCounts: ShiftTypeCount[];
}

export default function ShiftSummary({
  workShiftCount,
  planningEntryCount,
  plannedDayCount,
  calendarEntryCount,
  vacationDayCount,
  sickDayCount,
  trainingDayCount,
  freeDayCount,
  shiftTypeCounts,
}: ShiftSummaryProps) {
  return (
    <Card>
      <strong>Monatsplanung</strong>

      <p>
        {workShiftCount} Arbeitsdienst(e) an{" "}
        {plannedDayCount} planungsrelevanten Tag(en).
      </p>

      <div className="shift-type-list">
        <div className="shift-type-row">
          <span>Arbeitsdienste</span>
          <strong>{workShiftCount}</strong>
        </div>

        <div className="shift-type-row">
          <span>Planungseinträge</span>
          <strong>{planningEntryCount}</strong>
        </div>

        <div className="shift-type-row">
          <span>Planungstage</span>
          <strong>{plannedDayCount}</strong>
        </div>

        <div className="shift-type-row">
          <span>Kalendereinträge gesamt</span>
          <strong>{calendarEntryCount}</strong>
        </div>

        <div className="shift-type-row">
          <span>Urlaubstage</span>
          <strong>{vacationDayCount}</strong>
        </div>

        <div className="shift-type-row">
          <span>Krankheitstage</span>
          <strong>{sickDayCount}</strong>
        </div>

        <div className="shift-type-row">
          <span>Fortbildungstage</span>
          <strong>{trainingDayCount}</strong>
        </div>

        <div className="shift-type-row">
          <span>Frei-Tage</span>
          <strong>{freeDayCount}</strong>
        </div>
      </div>

      <strong>Dienstarten und Planungseinträge</strong>

      {shiftTypeCounts.length === 0 ? (
        <p>
          Noch keine planungsrelevanten Einträge in
          diesem Monat.
        </p>
      ) : (
        <div className="shift-type-list">
          {shiftTypeCounts.map((item) => (
            <div
              className="shift-type-row"
              key={item.type}
            >
              <span>{shiftLabels[item.type]}</span>
              <strong>{item.count}</strong>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}