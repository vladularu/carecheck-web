import CalendarGrid from "../components/calendar/CalendarGrid";
import CalendarHeader from "../components/calendar/CalendarHeader";
import { createCalendar } from "../services/calendar/calendarService";

const monthNames = [
  "Januar",
  "Februar",
  "März",
  "April",
  "Mai",
  "Juni",
  "Juli",
  "August",
  "September",
  "Oktober",
  "November",
  "Dezember",
];

export default function Calendar() {
  const year = 2026;
  const month = 6;

  const weeks = createCalendar(year, month);

  return (
    <section className="page">
      <CalendarHeader monthLabel={`${monthNames[month]} ${year}`} />
      <CalendarGrid weeks={weeks} />
    </section>
  );
}