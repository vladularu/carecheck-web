import Card from "../ui/Card";
import { calculateNetHours } from "../../services/calculation/workingTimeCalculator";
import {
  formatDateGerman,
  formatTimeRange24,
} from "../../services/format/dateTimeFormat";
import type { Shift, ShiftType } from "../../types/index";

interface DayDetailsProps {
  dateKey: string;
  shifts: Shift[];
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

export default function DayDetails({ dateKey, shifts }: DayDetailsProps) {
  return (
    <Card className="day-details">
      <div className="day-details-header">
        <span>Tagesdetails</span>
        <strong>{formatDateGerman(dateKey)}</strong>
      </div>

      {shifts.length === 0 ? (
        <p>Für diesen Tag ist noch kein Dienst erfasst.</p>
      ) : (
        <div className="day-details-list">
          {shifts.map((shift) => (
            <article className="day-details-shift" key={shift.id}>
              <strong>{shiftLabels[shift.type]}</strong>

              {shift.type !== "FREE" && (
                <>
                  <span>{formatTimeRange24(shift.startTime, shift.endTime)}</span>
                  <span>{calculateNetHours(shift)} h netto</span>
                </>
              )}

              {shift.note && <p>{shift.note}</p>}
            </article>
          ))}
        </div>
      )}
    </Card>
  );
}