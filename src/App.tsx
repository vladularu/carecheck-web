import { demoProfile, demoShifts } from "./data/demoData";
import type { Shift } from "./types/index";
import "./App.css";

function calculateNetHours(shift: Shift): number {
  const start = new Date(`${shift.date}T${shift.startTime}:00`);
  let end = new Date(`${shift.date}T${shift.endTime}:00`);

  if (end <= start) {
    end.setDate(end.getDate() + 1);
  }

  const grossHours = (end.getTime() - start.getTime()) / 1000 / 60 / 60;
  const breakHours = shift.breakMinutes / 60;

  return Math.max(0, grossHours - breakHours);
}

function formatShiftType(type: Shift["type"]): string {
  const labels: Record<Shift["type"], string> = {
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

  return labels[type];
}

export default function App() {
  const totalHours = demoShifts.reduce((sum, shift) => {
    return sum + calculateNetHours(shift);
  }, 0);

  return (
    <main className="app-shell">
      <section className="hero-card">
        <div>
          <p className="eyebrow">CareCheck TVöD</p>
          <h1>Dienstplanprüfung</h1>
          <p className="subtitle">
            Erste React-Testversion mit echtem Datenmodell und Beispiel-Diensten.
          </p>
        </div>
      </section>

      <section className="grid">
        <article className="stat-card">
          <span>Bundesland</span>
          <strong>{demoProfile.federalState}</strong>
        </article>

        <article className="stat-card">
          <span>Wochenarbeitszeit</span>
          <strong>{demoProfile.weeklyHours} h</strong>
        </article>

        <article className="stat-card">
          <span>TVöD-P</span>
          <strong>
            {demoProfile.payGroup} / Stufe {demoProfile.payLevel}
          </strong>
        </article>

        <article className="stat-card">
          <span>Ist-Stunden Demo</span>
          <strong>{totalHours.toFixed(2)} h</strong>
        </article>
      </section>

      <section className="panel">
        <div className="panel-header">
          <h2>Dienste</h2>
          <span>{demoShifts.length} Einträge</span>
        </div>

        <div className="shift-list">
          {demoShifts.map((shift) => (
            <article className="shift-card" key={shift.id}>
              <div>
                <strong>{formatShiftType(shift.type)}</strong>
                <p>
                  {shift.date} · {shift.startTime}–{shift.endTime} · Pause{" "}
                  {shift.breakMinutes} Min.
                </p>
                {shift.note && <small>{shift.note}</small>}
              </div>

              <div className="hours-pill">
                {calculateNetHours(shift).toFixed(2)} h
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}