import type { CalendarDay as CalendarDayModel } from "../../services/calendar/calendarService";
import { calculateNetHours } from "../../services/calculation/workingTimeCalculator";
import { formatTimeRange24 } from "../../services/format/dateTimeFormat";
import type { Holiday } from "../../services/holiday/holidayService";
import type { Shift, ShiftType } from "../../types/index";

interface CalendarDayProps {
  day: CalendarDayModel;
  shifts: Shift[];
  holiday: Holiday | null;
  selected: boolean;
  onSelect: (dateKey: string) => void;
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

const shiftIcons: Record<ShiftType, string> = {
  EARLY: "🌅",
  LATE: "🌇",
  NIGHT: "🌙",
  DAY: "☀️",
  TRAINING: "📘",
  VACATION: "🏖️",
  SICK: "Krank",
  FREE: "Frei",
  CUSTOM: "•",
};

export default function CalendarDay({
  day,
  shifts,
  holiday,
  selected,
  onSelect,
}: CalendarDayProps) {
  const classNames = [
    "calendar-day",
    day.currentMonth ? "current-month" : "outside-month",
    day.weekend ? "weekend" : "",
    holiday ? "holiday" : "",
    shifts.length > 0 ? "has-shift" : "",
    selected ? "selected" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      className={classNames}
      type="button"
      onClick={() => onSelect(day.dateKey)}
    >
      <div className="calendar-day-top">
        <div className="calendar-day-number">{day.dayNumber}</div>
        {holiday && <span className="calendar-holiday-badge">FT</span>}
      </div>

      {holiday && <div className="calendar-holiday-name">{holiday.name}</div>}

      <div className="calendar-shifts">
        {shifts.slice(0, 2).map((shift) => (
          <div className="calendar-shift" key={shift.id}>
            <strong>
              {shiftIcons[shift.type]} {shiftLabels[shift.type]}
            </strong>

            {shift.type !== "FREE" && (
              <>
                <span>{formatTimeRange24(shift.startTime, shift.endTime)}</span>
                <span>{calculateNetHours(shift)} h</span>
              </>
            )}
          </div>
        ))}

        {shifts.length > 2 && (
          <span className="calendar-more">+{shifts.length - 2} weitere</span>
        )}
      </div>
    </button>
  );
}