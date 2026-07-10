import { useState, type FormEvent } from "react";
import { useAppContext } from "../context/useAppContext";
import type { Shift, ShiftType } from "../types/index";

interface ShiftFormProps {
  onAddShift?: (shift: Shift) => void;
  onUpdateShift?: (shift: Shift) => void;
  initialDate?: string;
  initialShift?: Shift;
  onDone?: () => void;
}

const shiftOptions: {
  value: ShiftType;
  label: string;
  shortLabel: string;
  description: string;
}[] = [
  {
    value: "EARLY",
    label: "FrÃ¼hdienst",
    shortLabel: "FrÃ¼h",
    description: "FrÃ¼her Dienst",
  },
  {
    value: "LATE",
    label: "SpÃ¤tdienst",
    shortLabel: "SpÃ¤t",
    description: "SpÃ¤ter Dienst",
  },
  {
    value: "NIGHT",
    label: "Nachtdienst",
    shortLabel: "Nacht",
    description: "Nachtdienst",
  },
  {
    value: "DAY",
    label: "Tagdienst",
    shortLabel: "Tag",
    description: "Normaler Tagdienst",
  },
  {
    value: "TRAINING",
    label: "Fortbildung",
    shortLabel: "Fortb.",
    description: "Schulung / Fortbildung",
  },
  {
    value: "VACATION",
    label: "Urlaub",
    shortLabel: "Urlaub",
    description: "Urlaubstag",
  },
  {
    value: "SICK",
    label: "Krank",
    shortLabel: "Krank",
    description: "Krankmeldung",
  },
  {
    value: "FREE",
    label: "Frei",
    shortLabel: "Frei",
    description: "Freier Tag",
  },
  {
    value: "CUSTOM",
    label: "Individuell",
    shortLabel: "Eigen",
    description: "Eigener Dienst",
  },
];

function getShiftTileClassName(
  optionType: ShiftType,
  selectedType: ShiftType,
): string {
  const classNames = [
    "shift-type-tile",
    `shift-type-tile-${optionType.toLowerCase()}`,
    optionType === selectedType ? "selected" : "",
  ];

  return classNames.filter(Boolean).join(" ");
}

export default function ShiftForm({
  onAddShift,
  onUpdateShift,
  initialDate,
  initialShift,
  onDone,
}: ShiftFormProps) {
  const { shiftTemplates } = useAppContext();
  const isEditing = Boolean(initialShift);

  const initialType = initialShift?.type ?? "EARLY";
  const initialTemplate = shiftTemplates[initialType];

  const [date, setDate] = useState(
    initialShift?.date ?? initialDate ?? "",
  );

  const [startTime, setStartTime] = useState(
    initialShift?.startTime ?? initialTemplate.startTime,
  );

  const [endTime, setEndTime] = useState(
    initialShift?.endTime ?? initialTemplate.endTime,
  );

  const [breakMinutes, setBreakMinutes] = useState(
    initialShift?.breakMinutes ?? initialTemplate.breakMinutes,
  );

  const [type, setType] = useState<ShiftType>(initialType);
  const [note, setNote] = useState(initialShift?.note ?? "");

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

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
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

    if (!onAddShift) {
      return;
    }

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

  const selectedShiftOption = shiftOptions.find(
    (option) => option.value === type,
  );

  return (
    <form
      className="form-grid shift-form-premium"
      onSubmit={handleSubmit}
      lang="de-DE"
    >
      <div className="shift-form-header">
        <span>
          {isEditing ? "Dienst bearbeiten" : "Dienst hinzufÃ¼gen"}
        </span>

        <strong>{selectedShiftOption?.label ?? "Dienst"}</strong>

        <p>
          WÃ¤hle zuerst die Dienstart. Beginn, Ende und Pause werden aus deinen
          Dienstvorlagen Ã¼bernommen und kÃ¶nnen angepasst werden.
        </p>
      </div>

      <fieldset className="shift-type-picker">
        <legend>Dienstart</legend>

        <div className="shift-type-grid">
          {shiftOptions.map((option) => (
            <button
              aria-pressed={option.value === type}
              className={getShiftTileClassName(option.value, type)}
              key={option.value}
              type="button"
              onClick={() => handleTypeChange(option.value)}
            >
              <span>{option.shortLabel}</span>
              <strong>{option.label}</strong>
              <small>{option.description}</small>
            </button>
          ))}
        </div>
      </fieldset>

      <div className="shift-form-section">
        <label className="field shift-form-field-full">
          <span>Datum</span>

          <input
            type="date"
            lang="de-DE"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            required
          />
        </label>

        <div className="shift-time-grid">
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
            <span>Pause</span>

            <input
              type="number"
              min="0"
              value={breakMinutes}
              onChange={(event) =>
                setBreakMinutes(Number(event.target.value))
              }
            />
          </label>
        </div>

        <label className="field shift-form-field-full">
          <span>Notiz</span>

          <input
            placeholder="Optional, z. B. Station, Besonderheit oder Tausch"
            value={note}
            onChange={(event) => setNote(event.target.value)}
          />
        </label>
      </div>

      <button
        className="primary-button shift-form-submit"
        type="submit"
      >
        {isEditing ? "Ã„nderung speichern" : "Dienst speichern"}
      </button>
    </form>
  );
}
