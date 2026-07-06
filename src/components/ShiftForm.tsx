import { useState } from "react";
import type { Shift, ShiftType } from "../types/index";

const shiftTypes: ShiftType[] = [
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

interface ShiftFormProps {
  onAddShift: (shift: Shift) => void;
}

export default function ShiftForm({ onAddShift }: ShiftFormProps) {
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("06:00");
  const [endTime, setEndTime] = useState("14:12");
  const [breakMinutes, setBreakMinutes] = useState(30);
  const [type, setType] = useState<ShiftType>("EARLY");
  const [note, setNote] = useState("");

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (!date) {
      alert("Bitte Datum auswählen.");
      return;
    }

    onAddShift({
      id: crypto.randomUUID(),
      date,
      startTime,
      endTime,
      breakMinutes,
      type,
      note,
    });

    setNote("");
  }

  return (
    <form className="form-grid" onSubmit={handleSubmit}>
      <label className="field">
        <span>Datum</span>
        <input value={date} onChange={(e) => setDate(e.target.value)} type="date" />
      </label>

      <label className="field">
        <span>Beginn</span>
        <input value={startTime} onChange={(e) => setStartTime(e.target.value)} type="time" />
      </label>

      <label className="field">
        <span>Ende</span>
        <input value={endTime} onChange={(e) => setEndTime(e.target.value)} type="time" />
      </label>

      <label className="field">
        <span>Pause Minuten</span>
        <input
          value={breakMinutes}
          onChange={(e) => setBreakMinutes(Number(e.target.value))}
          type="number"
          min="0"
        />
      </label>

      <label className="field">
        <span>Dienstart</span>
        <select value={type} onChange={(e) => setType(e.target.value as ShiftType)}>
          {shiftTypes.map((shiftType) => (
            <option key={shiftType} value={shiftType}>
              {shiftLabels[shiftType]}
            </option>
          ))}
        </select>
      </label>

      <label className="field">
        <span>Notiz</span>
        <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="optional" />
      </label>

      <button className="primary-button" type="submit">
        Dienst speichern
      </button>
    </form>
  );
}