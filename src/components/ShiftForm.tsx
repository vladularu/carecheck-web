import { useState } from "react";
import {
  isValidTime24,
  parseGermanDateToDateKey,
} from "../services/format/dateTimeFormat";
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
  const [error, setError] = useState("");

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const dateKey = parseGermanDateToDateKey(date);

    if (!dateKey) {
      setError("Bitte Datum im Format TT.MM.JJJJ eingeben, z. B. 15.07.2026.");
      return;
    }

    if (!isValidTime24(startTime)) {
      setError("Bitte Beginn im 24-Stunden-Format eingeben, z. B. 06:00.");
      return;
    }

    if (!isValidTime24(endTime)) {
      setError("Bitte Ende im 24-Stunden-Format eingeben, z. B. 14:12.");
      return;
    }

    const newShift: Shift = {
      id: crypto.randomUUID(),
      date: dateKey,
      startTime,
      endTime,
      breakMinutes,
      type,
      note: note.trim() || undefined,
    };

    onAddShift(newShift);

    setError("");
    setDate("");
    setStartTime("06:00");
    setEndTime("14:12");
    setBreakMinutes(30);
    setType("EARLY");
    setNote("");
  }

  return (
    <form className="form-grid" onSubmit={handleSubmit}>
      <label className="field">
        <span>Datum</span>
        <input
          inputMode="numeric"
          placeholder="TT.MM.JJJJ"
          value={date}
          onChange={(event) => setDate(event.target.value)}
        />
      </label>

      <label className="field">
        <span>Beginn</span>
        <input
          inputMode="numeric"
          placeholder="06:00"
          value={startTime}
          onChange={(event) => setStartTime(event.target.value)}
        />
      </label>

      <label className="field">
        <span>Ende</span>
        <input
          inputMode="numeric"
          placeholder="14:12"
          value={endTime}
          onChange={(event) => setEndTime(event.target.value)}
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

      {error && <p className="form-error">{error}</p>}

      <button className="primary-button" type="submit">
        Dienst speichern
      </button>
    </form>
  );
}