import { demoProfile } from "../data/demoData";
import { calculateMonthlyHours } from "../services/calculation/monthlyHoursCalculator";
import { loadProfile } from "../services/storage/profileStorage";
import { loadShifts } from "../services/storage/shiftStorage";
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

const shiftLabels: Record<ShiftType, string> = {
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

export default function Dashboard() {
  const profile = loadProfile() ?? demoProfile;
  const shifts = loadShifts();

  const selectedDate =
    shifts.length > 0 ? new Date(`${shifts[0].date}T00:00:00`) : new Date();

  const monthlyHours = calculateMonthlyHours(
    shifts,
    profile,
    selectedDate.getFullYear(),
    selectedDate.getMonth(),
  );

  return (
    <section className="page">
      <h1>Dashboard</h1>
      <p>
        Arbeitszeitkonto für {monthNames[selectedDate.getMonth()]}{" "}
        {selectedDate.getFullYear()}.
      </p>

      <div className="dashboard-grid">
        <article className="dashboard-card">
          <span>Bundesland</span>
          <strong>{profile.federalState}</strong>
        </article>

        <article className="dashboard-card">
          <span>Wochenarbeitszeit</span>
          <strong>{profile.weeklyHours} h</strong>
        </article>

        <article className="dashboard-card">
          <span>TVöD-P</span>
          <strong>
            {profile.payGroup} · Stufe {profile.payLevel}
          </strong>
        </article>

        <article className="dashboard-card">
          <span>Dienste im Monat</span>
          <strong>{monthlyHours.shiftCount}</strong>
        </article>

        <article className="dashboard-card">
          <span>Sollstunden</span>
          <strong>{monthlyHours.targetHours} h</strong>
        </article>

        <article className="dashboard-card">
          <span>Iststunden</span>
          <strong>{monthlyHours.actualHours} h</strong>
        </article>

        <article className="dashboard-card highlight">
          <span>Differenz</span>
          <strong>{monthlyHours.balanceHours} h</strong>
        </article>

        <article className="dashboard-card">
          <span>Überstunden</span>
          <strong>{monthlyHours.overtimeHours} h</strong>
        </article>

        <article className="dashboard-card">
          <span>Unterstunden</span>
          <strong>{monthlyHours.undertimeHours} h</strong>
        </article>
      </div>

      <div className="summary-card">
        <strong>Dienstarten</strong>
        {monthlyHours.shiftTypeCounts.length === 0 ? (
          <p>Noch keine Dienste in diesem Monat.</p>
        ) : (
          <div className="shift-type-list">
            {monthlyHours.shiftTypeCounts.map((item) => (
              <div className="shift-type-row" key={item.type}>
                <span>{shiftLabels[item.type]}</span>
                <strong>{item.count}</strong>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}