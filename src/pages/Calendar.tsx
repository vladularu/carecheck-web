import { useState } from "react";
import CalendarGrid from "../components/calendar/CalendarGrid";
import CalendarHeader from "../components/calendar/CalendarHeader";
import DayDetails from "../components/calendar/DayDetails";
import { useAppContext } from "../context/useAppContext";
import { filterShiftsByMonth } from "../services/calculation/monthlyHoursCalculator";
import { createCalendar } from "../services/calendar/calendarService";
import { filterComplianceRelevantShifts } from "../services/calculation/shiftTypeRules";
import { checkCompliance } from "../services/compliance/complianceService";
import {
  getHolidayByDate,
  getHolidaysForState,
  type Holiday,
} from "../services/holiday/holidayService";
import { getTvoedPPremiumHourlyRate } from "../services/tariff/tvoedPTariffService";
import type { ComplianceIssue, Shift } from "../types/index";

const monthNames = [
  "Januar",
  "Februar",
  "MÃ¤rz",
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

function groupComplianceIssuesByDate(
  issues: ComplianceIssue[],
  shifts: Shift[],
): Map<string, ComplianceIssue[]> {
  const grouped = new Map<string, ComplianceIssue[]>();
  const shiftDateById = new Map(shifts.map((shift) => [shift.id, shift.date]));

  for (const issue of issues) {
    if (!issue.relatedShiftId) {
      continue;
    }

    const dateKey = shiftDateById.get(issue.relatedShiftId);

    if (!dateKey) {
      continue;
    }

    const current = grouped.get(dateKey) ?? [];
    grouped.set(dateKey, [...current, issue]);
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

  const shiftsInSelectedMonth = filterShiftsByMonth(
    shifts,
    selectedYear,
    selectedMonth,
  );

  const shiftsByDate = groupShiftsByDate(shifts);
  const holidays = getHolidaysForState(selectedYear, profile.federalState);
  const holidaysByDate = groupHolidaysByDate(holidays);

  const complianceRelevantShifts =
  filterComplianceRelevantShifts(shiftsInSelectedMonth);

const complianceIssues = checkCompliance(
  complianceRelevantShifts,
);
const complianceIssuesByDate = groupComplianceIssuesByDate(
  complianceIssues,
  complianceRelevantShifts,
);

  const selectedShifts = selectedDateKey
    ? shiftsByDate.get(selectedDateKey) ?? []
    : [];

  const selectedHoliday = selectedDateKey
    ? getHolidayByDate(selectedDateKey, profile.federalState)
    : null;

  const selectedComplianceIssues = selectedDateKey
    ? complianceIssuesByDate.get(selectedDateKey) ?? []
    : [];

  const premiumHourlyRate = getTvoedPPremiumHourlyRate(profile.payGroup);

  return (
    <section className="page calendar-page">
      <CalendarHeader
        monthLabel={`${monthNames[selectedMonth]} ${selectedYear}`}
        onPrevious={previousMonth}
        onNext={nextMonth}
      />

      <CalendarGrid
        weeks={weeks}
        shiftsByDate={shiftsByDate}
        holidaysByDate={holidaysByDate}
        complianceIssuesByDate={complianceIssuesByDate}
        selectedDateKey={selectedDateKey}
        onSelectDate={setSelectedDateKey}
      />

      <div className="calendar-legend" aria-label="Kalender-Legende">
        <span>
          <i className="calendar-legend-dot calendar-shift-type-early" />
          FrÃ¼h
        </span>

        <span>
          <i className="calendar-legend-dot calendar-shift-type-late" />
          SpÃ¤t
        </span>

        <span>
          <i className="calendar-legend-dot calendar-shift-type-night" />
          Nacht
        </span>

        <span>
          <i className="calendar-legend-dot calendar-shift-type-day" />
          Tag
        </span>

        <span>
          <i className="calendar-legend-dot calendar-shift-type-vacation" />
          Urlaub
        </span>

        <span>
          <i className="calendar-legend-dot calendar-shift-type-sick" />
          Krank
        </span>

        <span>
          <i className="calendar-legend-dot calendar-shift-type-training" />
          Fortbildung
        </span>
      </div>

      {selectedDateKey && (
        <DayDetails
          dateKey={selectedDateKey}
          shifts={selectedShifts}
          holiday={selectedHoliday}
          complianceIssues={selectedComplianceIssues}
          federalState={profile.federalState}
          baseHourlyRate={premiumHourlyRate}
          onAddShift={addShift}
          onUpdateShift={updateShift}
          onDeleteShift={deleteShift}
        />
      )}
    </section>
  );
}
