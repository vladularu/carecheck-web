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

  const progress =
    monthlyHours.targetHours > 0
      ? Math.min(100, Math.round((monthlyHours.actualHours / monthlyHours.targetHours) * 100))
      : 0;

  const remainingHours = Math.max(
    0,
    Math.round((monthlyHours.targetHours - monthlyHours.actualHours) * 100) / 100,
  );

  return (
    <section className="dashboard-page">
      <div className="dashboard-hero">
        <div>
          <span className="eyebrow">CareCheck TVöD</span>
          <h1>{monthNames[selectedDate.getMonth()]} {selectedDate.getFullYear()}</h1>
          <p>
            {profile.federalState} · {profile.weeklyHours} h/Woche ·{" "}
            {profile.payGroup} Stufe {profile.payLevel}
          </p>
        </div>
      </div>

      <div className="work-card">
        <div className="work-card-header">
          <div>
            <span>Arbeitszeitkonto</span>
            <strong>{monthlyHours.actualHours} / {monthlyHours.targetHours} h</strong>
          </div>
          <div className="progress-number">{progress}%</div>
        </div>

        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>

        <div className="work-grid">
          <div>
            <span>Differenz</span>
            <strong>{monthlyHours.balanceHours} h</strong>
          </div>
          <div>
            <span>Fehlend</span>
            <strong>{remainingHours} h</strong>
          </div>
          <div>
            <span>Überstunden</span>
            <strong>{monthlyHours.overtimeHours} h</strong>
          </div>
        </div>
      </div>

      <div className="status-card">
        <span>Prüfstatus</span>
        <strong>🟢 Keine Prüfung aktiv</strong>
        <p>Arbeitszeitgesetz und TVöD-Regeln werden in späteren Releases ergänzt.</p>
      </div>

      <div className="summary-card">
        <strong>Dienste im Monat</strong>
        <p>{monthlyHours.shiftCount} Dienst(e) erfasst.</p>

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