import { useState } from "react";
import CalendarGrid from "../components/calendar/CalendarGrid";
import CalendarHeader from "../components/calendar/CalendarHeader";
import DayDetails from "../components/calendar/DayDetails";
import { useAppContext } from "../context/AppContext";
import { createCalendar } from "../services/calendar/calendarService";
import {
  getHolidayByDate,
  getHolidaysForState,
  type Holiday,
} from "../services/holiday/holidayService";
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

function groupHolidaysByDate(holidays: Holiday[]): Map<string, Holiday> {
  const grouped = new Map<string, Holiday>();

  for (const holiday of holidays) {
    grouped.set(holiday.date, holiday);
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
    profile,
    shifts,
    addShift,
    updateShift,
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

  const holidays = getHolidaysForState(selectedYear, profile.federalState);
  const holidaysByDate = groupHolidaysByDate(holidays);

  const selectedShifts = selectedDateKey
    ? shiftsByDate.get(selectedDateKey) ?? []
    : [];

  const selectedHoliday = selectedDateKey
    ? getHolidayByDate(selectedDateKey, profile.federalState)
    : null;

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
        holidaysByDate={holidaysByDate}
        selectedDateKey={selectedDateKey}
        onSelectDate={setSelectedDateKey}
      />

      {selectedDateKey && (
        <DayDetails
          dateKey={selectedDateKey}
          shifts={selectedShifts}
          holiday={selectedHoliday}
          onAddShift={addShift}
          onUpdateShift={updateShift}
          onDeleteShift={deleteShift}
        />
      )}
    </section>
  );
}