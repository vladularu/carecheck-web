import { createCalendar } from "../services/calendar/calendarService";

export default function Calendar() {
  const weeks = createCalendar(2026, 6);

  console.log("Calendar weeks:", weeks);

  return (
    <section className="page">
      <h1>Kalender</h1>
      <p>Kalender-Engine läuft. Öffne die Browser-Konsole mit F12.</p>
    </section>
  );
}