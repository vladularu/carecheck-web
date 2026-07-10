import ShiftForm from "../components/ShiftForm";
import ShiftList from "../components/ShiftList";
import { calculateTotalNetHours } from "../services/calculation/workingTimeCalculator";
import { useAppContext } from "../context/useAppContext";

export default function Planner() {
  const { shifts, addShift, deleteShift } = useAppContext();

  const totalNetHours = calculateTotalNetHours(shifts);

  return (
    <section className="page">
      <h1>Dienstplan</h1>
      <p>Dienste anlegen, speichern und lÃ¶schen.</p>

      <ShiftForm onAddShift={addShift} />

      <div className="summary-card">
        <strong>Gespeicherte Dienste</strong>
        <p>{shifts.length} Dienst(e) erfasst.</p>
        <p>Nettoarbeitszeit gesamt: {totalNetHours} h</p>
      </div>

      <ShiftList shifts={shifts} onDelete={deleteShift} />
    </section>
  );
}
