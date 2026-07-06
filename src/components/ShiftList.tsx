import type { Shift, ShiftType } from "../types/index";

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

interface ShiftListProps {
  shifts: Shift[];
  onDeleteShift: (id: string) => void;
}

export default function ShiftList({ shifts, onDeleteShift }: ShiftListProps) {
  if (shifts.length === 0) {
    return <p className="empty-state">Noch keine Dienste angelegt.</p>;
  }

  return (
    <div className="shift-list">
      {shifts.map((shift) => (
        <article className="shift-card" key={shift.id}>
          <div>
            <strong>{shiftLabels[shift.type]}</strong>
            <p>
              {shift.date} · {shift.startTime}–{shift.endTime} · Pause{" "}
              {shift.breakMinutes} Min.
            </p>
            {shift.note && <small>{shift.note}</small>}
          </div>

          <button className="danger-button" onClick={() => onDeleteShift(shift.id)}>
            Löschen
          </button>
        </article>
      ))}
    </div>
  );
}