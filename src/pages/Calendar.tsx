import CalendarGrid from "../components/calendar/CalendarGrid";
import CalendarHeader from "../components/calendar/CalendarHeader";
import { useAppContext } from "../context/AppContext";
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
  const { selectedYear, selectedMonth, previousMonth, nextMonth } =
    useAppContext();

  const weeks = createCalendar(selectedYear, selectedMonth);

  return (
    <section className="page">
      <CalendarHeader
        monthLabel={`${monthNames[selectedMonth]} ${selectedYear}`}
        onPrevious={previousMonth}
        onNext={nextMonth}
      />

      <CalendarGrid weeks={weeks} />
    </section>
  );
}