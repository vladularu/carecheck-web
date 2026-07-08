import { calculateNetHours } from "../services/calculation/workingTimeCalculator";
import {
  formatDateGerman,
  formatTimeRange24,
} from "../services/format/dateTimeFormat";
import type { Shift, ShiftType } from "../types/index";

interface ShiftListProps {
  shifts: Shift[];
  onDelete: (id: string) => void;
}

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

export default function ShiftList({ shifts, onDelete }: ShiftListProps) {
  if (shifts.length === 0) {
    return <p>Noch keine Dienste erfasst.</p>;
  }

  return (
    <div className="shift-list">
      {shifts.map((shift) => (
        <article className="shift-card" key={shift.id}>
          <div>
            <strong>{shiftLabels[shift.type]}</strong>
            <p>
              {formatDateGerman(shift.date)} ·{" "}
              {formatTimeRange24(shift.startTime, shift.endTime)}
            </p>
            <p>{calculateNetHours(shift)} h netto</p>
            {shift.note && <p>{shift.note}</p>}
          </div>

          <button
            className="danger-button"
            type="button"
            onClick={() => onDelete(shift.id)}
          >
            Löschen
          </button>
        </article>
      ))}
    </div>
  );
}