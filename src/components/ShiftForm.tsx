import { useEffect, useState } from "react";
import type { Shift, ShiftType } from "../types/index";

interface ShiftFormProps {
  onAddShift?: (shift: Shift) => void;
  onUpdateShift?: (shift: Shift) => void;
  initialDate?: string;
  initialShift?: Shift;
  onDone?: () => void;
}

interface ShiftTemplate {
  startTime: string;
  endTime: string;
  breakMinutes: number;
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

const shiftTemplates: Record<ShiftType, ShiftTemplate> = {
  EARLY: {
    startTime: "06:00",
    endTime: "14:12",
    breakMinutes: 30,
  },
  LATE: {
    startTime: "13:18",
    endTime: "21:30",
    breakMinutes: 30,
  },
  NIGHT: {
    startTime: "21:00",
    endTime: "07:30",
    breakMinutes: 60,
  },
  DAY: {
    startTime: "08:00",
    endTime: "16:12",
    breakMinutes: 30,
  },
  TRAINING: {
    startTime: "08:00",
    endTime: "16:12",
    breakMinutes: 30,
  },
  VACATION: {
    startTime: "08:00",
    endTime: "16:12",
    breakMinutes: 30,
  },
  SICK: {
    startTime: "08:00",
    endTime: "16:12",
    breakMinutes: 30,
  },
  FREE: {
    startTime: "00:00",
    endTime: "00:00",
    breakMinutes: 0,
  },
  CUSTOM: {
    startTime: "08:00",
    endTime: "16:12",
    breakMinutes: 30,
  },
};

export default function ShiftForm({
  onAddShift,
  onUpdateShift,
  initialDate,
  initialShift,
  onDone,
}: ShiftFormProps) {
  const isEditing = Boolean(initialShift);

  const initialTemplate = shiftTemplates[initialShift?.type ?? "EARLY"];

  const [date, setDate] = useState(initialShift?.date ?? initialDate ?? "");
  const [startTime, setStartTime] = useState(
    initialShift?.startTime ?? initialTemplate.startTime,
  );
  const [endTime, setEndTime] = useState(
    initialShift?.endTime ?? initialTemplate.endTime,
  );
  const [breakMinutes, setBreakMinutes] = useState(
    initialShift?.breakMinutes ?? initialTemplate.breakMinutes,
  );
  const [type, setType] = useState<ShiftType>(initialShift?.type ?? "EARLY");
  const [note, setNote] = useState(initialShift?.note ?? "");

  useEffect(() => {
    if (initialShift) {
      setDate(initialShift.date);
      setStartTime(initialShift.startTime);
      setEndTime(initialShift.endTime);
      setBreakMinutes(initialShift.breakMinutes);
      setType(initialShift.type);
      setNote(initialShift.note ?? "");
      return;
    }

    if (initialDate) {
      setDate(initialDate);
    }
  }, [initialDate, initialShift]);

  function applyTemplate(nextType: ShiftType) {
    const template = shiftTemplates[nextType];

    setStartTime(template.startTime);
    setEndTime(template.endTime);
    setBreakMinutes(template.breakMinutes);
  }

  function handleTypeChange(nextType: ShiftType) {
    setType(nextType);
    applyTemplate(nextType);
  }

  function resetAddForm() {
    const template = shiftTemplates.EARLY;

    setDate(initialDate ?? "");
    setStartTime(template.startTime);
    setEndTime(template.endTime);
    setBreakMinutes(template.breakMinutes);
    setType("EARLY");
    setNote("");
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!date || !startTime || !endTime) {
      return;
    }

    if (initialShift && onUpdateShift) {
      onUpdateShift({
        ...initialShift,
        date,
        startTime,
        endTime,
        breakMinutes,
        type,
        note: note.trim() || undefined,
      });

      onDone?.();
      return;
    }

    if (onAddShift) {
      onAddShift({
        id: crypto.randomUUID(),
        date,
        startTime,
        endTime,
        breakMinutes,
        type,
        note: note.trim() || undefined,
      });

      resetAddForm();
      onDone?.();
    }
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
        <span>Dienstart</span>
        <select
          value={type}
          onChange={(event) => handleTypeChange(event.target.value as ShiftType)}
        >
          {shiftOptions.map((option) => (
            <option value={option.value} key={option.value}>
              {option.label}
            </option>
          ))}
        </select>
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
        <span>Notiz</span>
        <input
          placeholder="Optional"
          value={note}
          onChange={(event) => setNote(event.target.value)}
        />
      </label>

      <button className="primary-button" type="submit">
        {isEditing ? "Änderung speichern" : "Dienst speichern"}
      </button>
    </form>
  );
}