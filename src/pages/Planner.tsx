import { useEffect, useState } from "react";
import ShiftForm from "../components/ShiftForm";
import ShiftList from "../components/ShiftList";
import type { Shift } from "../types/index";
import { loadShifts, saveShifts } from "../services/storage/shiftStorage";

export default function Planner() {
  const [shifts, setShifts] = useState<Shift[]>(() => loadShifts());

  useEffect(() => {
    saveShifts(shifts);
  }, [shifts]);

  function addShift(shift: Shift) {
    setShifts((current) =>
      [...current, shift].sort((a, b) =>
        `${a.date}${a.startTime}`.localeCompare(`${b.date}${b.startTime}`),
      ),
    );
  }

  function deleteShift(id: string) {
    setShifts((current) => current.filter((shift) => shift.id !== id));
  }

  return (
    <section className="page">
      <h1>Dienstplan</h1>
      <p>Dienste anlegen, speichern und löschen.</p>

      <ShiftForm onAddShift={addShift} />

      <div className="summary-card">
        <strong>Gespeicherte Dienste</strong>
        <p>{shifts.length} Dienst(e) erfasst.</p>
      </div>

      <ShiftList shifts={shifts} onDeleteShift={deleteShift} />
    </section>
  );
}