import { useState } from "react";
import CalendarGrid from "../components/calendar/CalendarGrid";
import CalendarHeader from "../components/calendar/CalendarHeader";
import DayDetails from "../components/calendar/DayDetails";
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

function createDateKey(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(
    2,
    "0",
  )}`;
}

export default function Calendar() {
  const {
    shifts,
    addShift,
    deleteShift,
    selectedYear,
    selectedMonth,
    previousMonth,
    nextMonth,
  } = useAppContext();

  const [selectedDateKey, setSelectedDateKey] = useState(() =>
    createDateKey(selectedYear, selectedMonth, 1),
  );

  const weeks = createCalendar(selectedYear, selectedMonth);
  const shiftsByDate = groupShiftsByDate(shifts);
  const selectedShifts = selectedDateKey
    ? shiftsByDate.get(selectedDateKey) ?? []
    : [];

  return (
    <section className="page">
      <CalendarHeader
        monthLabel={`${monthNames[selectedMonth]} ${selectedYear}`}
        onPrevious={previousMonth}
        onNext={nextMonth}
      />

      <CalendarGrid
        weeks={weeks}
        shiftsByDate={shiftsByDate}
        selectedDateKey={selectedDateKey}
        onSelectDate={setSelectedDateKey}
      />

      {selectedDateKey && (
        <DayDetails
          dateKey={selectedDateKey}
          shifts={selectedShifts}
          onAddShift={addShift}
          onDeleteShift={deleteShift}
        />
      )}
    </section>
  );
}