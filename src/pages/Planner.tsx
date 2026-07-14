import ShiftForm from "../components/ShiftForm";
import ShiftList from "../components/ShiftList";
import Card from "../components/ui/Card";
import PageHeader from "../components/ui/PageHeader";
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
    <section className="page planner-page">
      <PageHeader
        eyebrow="Plan"
        title={`Dienstplan · ${monthLabel}`}
        description="Dienste, Abwesenheiten und Fortbildungen für den ausgewählten Monat erfassen."
      />

      <Card className="planner-entry-card">
        <div className="planner-section-header">
          <span className="card-label">Dienst erfassen</span>
          <strong>Neuer Kalendereintrag</strong>
          <p>
            Dienstart wählen, Datum und Zeiten prüfen,
            anschließend lokal speichern.
          </p>
        </div>

        <ShiftForm onAddShift={addShift} />
      </Card>

      <Card className="planner-summary-card">
        <div className="planner-section-header">
          <span className="card-label">Monatsplanung</span>
          <strong>{monthLabel}</strong>
          <p>
            Kompakte Kontrolle der planungsrelevanten
            Einträge.
          </p>
        </div>

        <div className="planner-summary-grid">
          <div>
            <span>Arbeitsdienste</span>
            <strong>
              {monthlyHours.workShiftCount}
            </strong>
          </div>

          <div>
            <span>Planungseinträge</span>
            <strong>
              {monthlyHours.planningEntryCount}
            </strong>
          </div>

          <div>
            <span>Planungstage</span>
            <strong>
              {monthlyHours.plannedDayCount}
            </strong>
          </div>

          <div>
            <span>Kalendereinträge</span>
            <strong>
              {monthlyHours.calendarEntryCount}
            </strong>
          </div>

          <div>
            <span>Nettoarbeitszeit</span>
            <strong>
              {formatHours(monthlyHours.actualHours)}
            </strong>
          </div>

          <div>
            <span>Abwesenheiten</span>
            <strong>
              U {monthlyHours.vacationDayCount} · K{" "}
              {monthlyHours.sickDayCount} · FoBi{" "}
              {monthlyHours.trainingDayCount} · Frei{" "}
              {monthlyHours.freeDayCount}
            </strong>
          </div>
        </div>
      </Card>

      <section
        className="planner-list-section"
        aria-labelledby="planner-shift-list-title"
      >
        <div className="planner-section-header">
          <span className="card-label">Dienstliste</span>
          <strong id="planner-shift-list-title">
            Erfasste Einträge
          </strong>
          <p>
            Die Liste zeigt nur Kalendereinträge aus{" "}
            {monthLabel}.
          </p>
        </div>

        <ShiftList
          shifts={shiftsInSelectedMonth}
          onDelete={deleteShift}
        />
      </section>
    </section>
  );
}
