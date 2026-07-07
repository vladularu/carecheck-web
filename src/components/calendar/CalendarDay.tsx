import type { CalendarDay as CalendarDayModel } from "../../services/calendar/calendarService";

interface CalendarDayProps {
  day: CalendarDayModel;
}

export default function CalendarDay({ day }: CalendarDayProps) {
  const classNames = [
    "calendar-day",
    day.currentMonth ? "current-month" : "outside-month",
    day.weekend ? "weekend" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={classNames}>
      <span>{day.dayNumber}</span>
    </div>
  );
}