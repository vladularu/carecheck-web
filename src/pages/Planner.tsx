import ShiftForm from "../components/ShiftForm";
import ShiftList from "../components/ShiftList";
import { useAppContext } from "../context/useAppContext";
import {
  calculateMonthlyHours,
  filterShiftsByMonth,
} from "../services/calculation/monthlyHoursCalculator";

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

function formatHours(value: number): string {
  return `${value.toLocaleString("de-DE", {
    minimumFractionDigits: value % 1 === 0 ? 0 : 1,
    maximumFractionDigits: 2,
  })} h`;
}

export default function Planner() {
  const {
    profile,
    shifts,
    addShift,
    deleteShift,
    selectedYear,
    selectedMonth,
  } = useAppContext();

  const monthLabel =
    `${monthNames[selectedMonth]} ${selectedYear}`;

  const shiftsInSelectedMonth = filterShiftsByMonth(
    shifts,
    selectedYear,
    selectedMonth,
  );

  const monthlyHours = calculateMonthlyHours(
    shifts,
    profile,
    selectedYear,
    selectedMonth,
  );

  return (
    <section className="page">
      <h1>Dienstplan</h1>

      <p>
        Kalendereinträge für {monthLabel} anlegen,
        speichern und löschen.
      </p>

      <ShiftForm onAddShift={addShift} />

      <div className="summary-card">
        <strong>Monatsplanung · {monthLabel}</strong>

        <p>
          {monthlyHours.workShiftCount} Arbeitsdienst(e)
          erfasst.
        </p>

        <p>
          {monthlyHours.planningEntryCount}{" "}
          planungsrelevante Einträge an{" "}
          {monthlyHours.plannedDayCount} Tag(en).
        </p>

        <p>
          {monthlyHours.calendarEntryCount}{" "}
          Kalendereinträge insgesamt.
        </p>

        <p>
          Nettoarbeitszeit im Monat:{" "}
          {formatHours(monthlyHours.actualHours)}
        </p>

        <p>
          Urlaub: {monthlyHours.vacationDayCount} ·
          Krank: {monthlyHours.sickDayCount} ·
          Fortbildung:{" "}
          {monthlyHours.trainingDayCount} · Frei:{" "}
          {monthlyHours.freeDayCount}
        </p>
      </div>

      <ShiftList
        shifts={shiftsInSelectedMonth}
        onDelete={deleteShift}
      />
    </section>
  );
}