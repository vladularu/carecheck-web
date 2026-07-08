import CalendarGrid from "../components/calendar/CalendarGrid";
import CalendarHeader from "../components/calendar/CalendarHeader";
import { useAppContext } from "../context/AppContext";
import { createCalendar } from "../services/calendar/calendarService";
import type { Shift } from "../types/index";

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

function groupShiftsByDate(shifts: Shift[]): Map<string, Shift[]> {
  const grouped = new Map<string, Shift[]>();

  for (const shift of shifts) {
    const current = grouped.get(shift.date) ?? [];
    grouped.set(shift.date, [...current, shift]);
  }

  return grouped;
}

export default function Calendar() {
  const { shifts, selectedYear, selectedMonth, previousMonth, nextMonth } =
    useAppContext();

  const weeks = createCalendar(selectedYear, selectedMonth);
  const shiftsByDate = groupShiftsByDate(shifts);

  return (
    <section className="page">
      <CalendarHeader
        monthLabel={`${monthNames[selectedMonth]} ${selectedYear}`}
        onPrevious={previousMonth}
        onNext={nextMonth}
      />

      <CalendarGrid weeks={weeks} shiftsByDate={shiftsByDate} />
    </section>
  );
}