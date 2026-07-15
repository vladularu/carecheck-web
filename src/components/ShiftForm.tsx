import { useState, type FormEvent } from "react";
import { useAppContext } from "../context/useAppContext";
import {
  calculateDailyTargetHours,
  calculateNetHours,
} from "../services/calculation/workingTimeCalculator";
import type { HourCreditSource, Shift, ShiftType } from "../types/index";

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
    label: "Frühdienst",
    shortLabel: "Früh",
    description: "Früher Dienst",
  },
  {
    value: "LATE",
    label: "Spätdienst",
    shortLabel: "Spät",
    description: "Später Dienst",
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

const plannedShiftTypes = new Set<ShiftType>([
  "EARLY",
  "LATE",
  "NIGHT",
  "DAY",
  "TRAINING",
  "CUSTOM",
]);

function isAbsenceType(shiftType: ShiftType): boolean {
  return (
    shiftType === "VACATION" || shiftType === "SICK" || shiftType === "FREE"
  );
}

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

function formatHours(hours: number): string {
  return hours.toLocaleString("de-DE", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

function formatDateLabel(dateKey: string): string {
  if (!dateKey) {
    return "Kein Datum gewählt";
  }

  const [year, month, day] = dateKey.split("-");

  if (!year || !month || !day) {
    return dateKey;
  }

  return `${day}.${month}.${year}`;
}

export default function ShiftForm({
  onAddShift,
  onUpdateShift,
  initialDate,
  initialShift,
  onDone,
}: ShiftFormProps) {
  const { shiftTemplates, profile, shifts } = useAppContext();

  const isEditing = Boolean(initialShift);

  const initialType = initialShift?.type ?? "EARLY";

  const initialTemplate = shiftTemplates[initialType];

  const [date, setDate] = useState(initialShift?.date ?? initialDate ?? "");

  const usesCalendarDate = Boolean(initialDate) && !initialShift;

  const [isDateInputVisible, setIsDateInputVisible] =
    useState(!usesCalendarDate);

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

  const dailyTargetHours = calculateDailyTargetHours(profile);

  const sameDayPlannedShifts = shifts.filter(
    (shift) =>
      shift.id !== initialShift?.id &&
      shift.date === date &&
      plannedShiftTypes.has(shift.type),
  );

  const plannedSickSourceShifts =
    initialShift && plannedShiftTypes.has(initialShift.type)
      ? [initialShift, ...sameDayPlannedShifts]
      : sameDayPlannedShifts;

  const plannedSickHours =
    plannedSickSourceShifts.length > 0
      ? plannedSickSourceShifts.reduce(
          (total, shift) => total + calculateNetHours(shift),
          0,
        )
      : undefined;

  function applyTemplate(nextType: ShiftType) {
    const template = shiftTemplates[nextType];

    setStartTime(template.startTime);

    setEndTime(template.endTime);

    setBreakMinutes(template.breakMinutes);
  }

  function applyAbsenceTimes() {
    setStartTime("00:00");
    setEndTime("00:00");
    setBreakMinutes(0);
  }

  function handleTypeChange(nextType: ShiftType) {
    setType(nextType);

    if (isAbsenceType(nextType)) {
      applyAbsenceTimes();
      return;
    }

    applyTemplate(nextType);
  }

  function resetAddForm() {
    const template = shiftTemplates.EARLY;

    setDate(initialDate ?? "");

    setIsDateInputVisible(!usesCalendarDate);

    setStartTime(template.startTime);

    setEndTime(template.endTime);

    setBreakMinutes(template.breakMinutes);

    setType("EARLY");
    setNote("");
  }

  function getHourCredit(): {
    creditedHours?: number;
    hourCreditSource?: HourCreditSource;
    sourceShiftId?: string;
  } {
    if (type === "VACATION") {
      return {
        creditedHours: dailyTargetHours,
        hourCreditSource: "DAILY_TARGET",
      };
    }

    if (type !== "SICK") {
      return {
        creditedHours: undefined,
        hourCreditSource: undefined,
        sourceShiftId: undefined,
      };
    }

    if (plannedSickHours !== undefined && plannedSickSourceShifts.length > 0) {
      return {
        creditedHours: plannedSickHours,
        hourCreditSource: "PLANNED_SHIFT",
        sourceShiftId: plannedSickSourceShifts[0]?.id,
      };
    }

    if (
      initialShift?.type === "SICK" &&
      typeof initialShift.creditedHours === "number"
    ) {
      return {
        creditedHours:
          initialShift.hourCreditSource === "DAILY_TARGET"
            ? dailyTargetHours
            : initialShift.creditedHours,
        hourCreditSource: initialShift.hourCreditSource ?? "DAILY_TARGET",
        sourceShiftId: initialShift.sourceShiftId,
      };
    }

    return {
      creditedHours: dailyTargetHours,
      hourCreditSource: "DAILY_TARGET",
    };
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!date) {
      return;
    }

    if (!isAbsenceType(type) && (!startTime || !endTime)) {
      return;
    }

    const absenceType = isAbsenceType(type);

    const hourCredit = getHourCredit();

    const shiftValues = {
      date,
      startTime: absenceType ? "00:00" : startTime,
      endTime: absenceType ? "00:00" : endTime,
      breakMinutes: absenceType ? 0 : breakMinutes,
      type,
      note: note.trim() || undefined,
      ...hourCredit,
    };

    if (initialShift && onUpdateShift) {
      onUpdateShift({
        ...initialShift,
        ...shiftValues,
      });

      onDone?.();
      return;
    }

    if (!onAddShift) {
      return;
    }

    onAddShift({
      id: crypto.randomUUID(),
      ...shiftValues,
    });

    resetAddForm();
    onDone?.();
  }

  const selectedShiftOption = shiftOptions.find(
    (option) => option.value === type,
  );

  const existingSickCredit =
    initialShift?.type === "SICK" &&
    typeof initialShift.creditedHours === "number"
      ? initialShift.hourCreditSource === "DAILY_TARGET"
        ? dailyTargetHours
        : initialShift.creditedHours
      : undefined;

  const displayedCreditHours =
    plannedSickHours ?? existingSickCredit ?? dailyTargetHours;

  const usesPlannedSickCredit =
    plannedSickHours !== undefined ||
    (initialShift?.type === "SICK" &&
      initialShift.hourCreditSource === "PLANNED_SHIFT");

  return (
    <form
      className="form-grid shift-form-premium"
      onSubmit={handleSubmit}
      lang="de-DE"
    >
      <div className="shift-form-header">
        <span>{isEditing ? "Dienst bearbeiten" : "Dienst hinzufügen"}</span>

        <strong>{selectedShiftOption?.label ?? "Dienst"}</strong>

        <p className="shift-form-compact-note">
          Dienstart waehlen. Zeiten kommen aus den Vorlagen und koennen
          angepasst werden.
        </p>

        <p>
          Wähle zuerst die Dienstart. Reguläre Dienstzeiten werden aus deinen
          Vorlagen übernommen. Abwesenheitsstunden werden automatisch berechnet.
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
        <div className="shift-form-field-full shift-form-date-block">
          {usesCalendarDate && (
            <div className="shift-form-date-summary">
              <span>Datum</span>

              <strong>{formatDateLabel(date)}</strong>

              {!isDateInputVisible && (
                <button
                  type="button"
                  onClick={() => setIsDateInputVisible(true)}
                >
                  Datum ändern
                </button>
              )}
            </div>
          )}

          {isDateInputVisible && (
            <label className="field">
              <span>
                {usesCalendarDate ? "Neues Datum" : "Datum"}
              </span>

              <input
                type="date"
                lang="de-DE"
                value={date}
                onChange={(event) => setDate(event.target.value)}
                required
              />
            </label>
          )}
        </div>

        {isAbsenceType(type) ? (
          <div className="shift-form-field-full">
            {type === "VACATION" && (
              <div className="shift-form-absence-info">
                <strong>Urlaub: {formatHours(dailyTargetHours)} Std.</strong>

                <p>
                  Die tägliche Sollarbeitszeit wird automatisch aus
                  {` ${profile.weeklyHours} `}
                  Wochenstunden und einer 5-Tage-Woche berechnet. Zeiten und
                  Pause sind nicht manuell veränderbar.
                </p>
              </div>
            )}

            {type === "SICK" && (
              <div className="shift-form-absence-info">
                <strong>Krank: {formatHours(displayedCreditHours)} Std.</strong>

                <p>
                  {usesPlannedSickCredit
                    ? "Die Netto-Stunden der geplanten Einträge werden übernommen. Diese geplanten Einträge werden durch den Krank-Eintrag ersetzt."
                    : "Ohne zuvor geplanten Dienst wird die tägliche Sollarbeitszeit verwendet."}
                </p>
              </div>
            )}

            {type === "FREE" && (
              <div className="shift-form-absence-info">
                <strong>Frei: 0 Std.</strong>

                <p>
                  Frei bleibt ein Null-Stunden-Eintrag und zählt nicht als
                  Arbeitstag.
                </p>
              </div>
            )}
          </div>
        ) : (
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
        )}

        <label className="field shift-form-field-full">
          <span>Notiz</span>

          <input
            placeholder="Optional, z. B. Station, Besonderheit oder Tausch"
            value={note}
            onChange={(event) => setNote(event.target.value)}
          />
        </label>
      </div>

      <button className="primary-button shift-form-submit" type="submit">
        {isEditing ? "Änderung speichern" : "Dienst speichern"}
      </button>
    </form>
  );
}
