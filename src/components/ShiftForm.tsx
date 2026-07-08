import { useState } from "react";
import type { Shift, ShiftType } from "../types/index";

interface ShiftFormProps {
  onAddShift: (shift: Shift) => void;
}

const shiftOptions: { value: ShiftType; label: string }[] = [
  { value: "EARLY", label: "Frühdienst" },
  { value: "LATE", label: "Spätdienst" },
  { value: "NIGHT", label: "Nachtdienst" },
  { value: "DAY", label: "Tagdienst" },
  { value: "TRAINING", label: "Fortbildung" },
  { value: "VACATION", label: "Urlaub" },
  { value: "SICK", label: "Krank" },
  { value: "FREE", label: "Frei" },
  { value: "CUSTOM", label: "Individuell" },
];

export default function ShiftForm({ onAddShift }: ShiftFormProps) {
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("06:00");
  const [endTime, setEndTime] = useState("14:12");
  const [breakMinutes, setBreakMinutes] = useState(30);
  const [type, setType] = useState<ShiftType>("EARLY");
  const [note, setNote] = useState("");

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!date || !startTime || !endTime) {
      return;
    }

    const newShift: Shift = {
      id: crypto.randomUUID(),
      date,
      startTime,
      endTime,
      breakMinutes,
      type,
      note: note.trim() || undefined,
    };

    onAddShift(newShift);

    setDate("");
    setStartTime("06:00");
    setEndTime("14:12");
    setBreakMinutes(30);
    setType("EARLY");
    setNote("");
  }

  return (
    <form className="form-grid" onSubmit={handleSubmit} lang="de-DE">
      <label className="field">
        <span>Datum</span>
        <input
          type="date"
          lang="de-DE"
          value={date}
          onChange={(event) => setDate(event.target.value)}
          required
        />
      </label>

      <label className="field">
        <span>Beginn</span>
        <input
          type="time"
          lang="de-DE"
          step="60"
          value={startTime}
          onChange={(event) => setStartTime(event.target.value)}
          required
        />
      </label>

      <label className="field">
        <span>Ende</span>
        <input
          type="time"
          lang="de-DE"
          step="60"
          value={endTime}
          onChange={(event) => setEndTime(event.target.value)}
          required
        />
      </label>

      <label className="field">
        <span>Pause Minuten</span>
        <input
          type="number"
          min="0"
          value={breakMinutes}
          onChange={(event) => setBreakMinutes(Number(event.target.value))}
        />
      </label>

      <label className="field">
        <span>Dienstart</span>
        <select
          value={type}
          onChange={(event) => setType(event.target.value as ShiftType)}
        >
          {shiftOptions.map((option) => (
            <option value={option.value} key={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <label className="field">
        <span>Notiz</span>
        <input
          placeholder="Optional"
          value={note}
          onChange={(event) => setNote(event.target.value)}
        />
      </label>

      <button className="primary-button" type="submit">
        Dienst speichern
      </button>
    </form>
  );
}