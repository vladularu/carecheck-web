import { useMemo, useState } from "react";
import PlanningComfortPanel from "../components/planner/PlanningComfortPanel";
import ShiftForm from "../components/ShiftForm";
import ShiftList from "../components/ShiftList";
import Card from "../components/ui/Card";
import PageHeader from "../components/ui/PageHeader";
import { useAppContext } from "../context/useAppContext";
import {
  calculateMonthlyHours,
  filterShiftsByMonth,
} from "../services/calculation/monthlyHoursCalculator";
import type { ShiftType } from "../types/index";

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

const shiftFilterLabels: Record<ShiftType, string> = {
  EARLY: "Frühdienst",
  LATE: "Spätdienst",
  NIGHT: "Nachtdienst",
  DAY: "Tagdienst",
  TRAINING: "Fortbildung",
  VACATION: "Urlaub",
  SICK: "Krank",
  FREE: "Frei",
  CUSTOM: "Individuell",
};

const shiftFilterOptions: ShiftType[] = [
  "EARLY",
  "LATE",
  "NIGHT",
  "DAY",
  "TRAINING",
  "VACATION",
  "SICK",
  "FREE",
  "CUSTOM",
];

function formatHours(value: number): string {
  return `${value.toLocaleString("de-DE", {
    minimumFractionDigits: value % 1 === 0 ? 0 : 1,
    maximumFractionDigits: 2,
  })} h`;
}

export default function Planner() {
  const [searchText, setSearchText] = useState("");
  const [typeFilter, setTypeFilter] =
    useState<ShiftType | "ALL">("ALL");

  const {
    profile,
    shifts,
    shiftTemplates,
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

  const filteredShifts = useMemo(() => {
    const normalizedSearch = searchText
      .trim()
      .toLowerCase();

    return shiftsInSelectedMonth.filter((shift) => {
      if (
        typeFilter !== "ALL" &&
        shift.type !== typeFilter
      ) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      const searchTarget = [
        shift.date,
        shift.startTime,
        shift.endTime,
        shift.note ?? "",
        shift.type,
        shiftFilterLabels[shift.type],
      ]
        .join(" ")
        .toLowerCase();

      return searchTarget.includes(normalizedSearch);
    });
  }, [searchText, shiftsInSelectedMonth, typeFilter]);

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

      <PlanningComfortPanel
        shifts={shifts}
        shiftsInSelectedMonth={shiftsInSelectedMonth}
        selectedYear={selectedYear}
        selectedMonth={selectedMonth}
        shiftTemplates={shiftTemplates}
        onAddShift={addShift}
        onDeleteShift={deleteShift}
      />

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
            {monthLabel}. Suche und Filter verändern nur die
            Ansicht.
          </p>
        </div>

        <Card className="planner-filter-card">
          <label className="field">
            <span>Suche</span>
            <input
              value={searchText}
              onChange={(event) =>
                setSearchText(event.target.value)
              }
              placeholder="Datum, Dienstart oder Notiz"
            />
          </label>

          <label className="field">
            <span>Dienstart</span>
            <select
              value={typeFilter}
              onChange={(event) =>
                setTypeFilter(
                  event.target.value as ShiftType | "ALL",
                )
              }
            >
              <option value="ALL">Alle Einträge</option>
              {shiftFilterOptions.map((type) => (
                <option value={type} key={type}>
                  {shiftFilterLabels[type]}
                </option>
              ))}
            </select>
          </label>
        </Card>

        <ShiftList
          shifts={filteredShifts}
          onDelete={deleteShift}
        />
      </section>
    </section>
  );
}
