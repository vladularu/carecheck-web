import type { CalendarWeek } from "../../services/calendar/calendarService";
import CalendarDay from "./CalendarDay";

interface CalendarGridProps {
  weeks: CalendarWeek[];
}

const weekDays = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];

export default function CalendarGrid({ weeks }: CalendarGridProps) {
  return (
    <div className="calendar">
      <div className="calendar-weekdays">
        {weekDays.map((day) => (
          <span key={day}>{day}</span>
        ))}
      </div>

      <div className="calendar-grid">
        {weeks.flat().map((day) => (
          <CalendarDay key={day.date.toISOString()} day={day} />
        ))}
      </div>
    </div>
  );
}