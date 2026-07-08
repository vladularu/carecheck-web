import type { CalendarWeek } from "../../services/calendar/calendarService";
import type { Shift } from "../../types/index";
import CalendarDay from "./CalendarDay";

interface CalendarGridProps {
  weeks: CalendarWeek[];
  shiftsByDate: Map<string, Shift[]>;
}

const weekDays = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];

export default function CalendarGrid({ weeks, shiftsByDate }: CalendarGridProps) {
  return (
    <div className="calendar">
      <div className="calendar-weekdays">
        {weekDays.map((day) => (
          <span key={day}>{day}</span>
        ))}
      </div>

      <div className="calendar-grid">
        {weeks.flat().map((day) => (
          <CalendarDay
            key={day.dateKey}
            day={day}
            shifts={shiftsByDate.get(day.dateKey) ?? []}
          />
        ))}
      </div>
    </div>
  );
}