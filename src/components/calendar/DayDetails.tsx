import { useState } from "react";
import ShiftForm from "../ShiftForm";
import Button from "../ui/Button";
import Card from "../ui/Card";
import { calculateNetHours } from "../../services/calculation/workingTimeCalculator";
import {
  formatDateGerman,
  formatTimeRange24,
} from "../../services/format/dateTimeFormat";
import type { Holiday } from "../../services/holiday/holidayService";
import type { Shift, ShiftType } from "../../types/index";

interface DayDetailsProps {
  dateKey: string;
  shifts: Shift[];
  holiday: Holiday | null;
  onAddShift: (shift: Shift) => void;
  onUpdateShift: (shift: Shift) => void;
  onDeleteShift: (id: string) => void;
}

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

export default function DayDetails({
  dateKey,
  shifts,
  holiday,
  onAddShift,
  onUpdateShift,
  onDeleteShift,
}: DayDetailsProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingShiftId, setEditingShiftId] = useState<string | null>(null);

  return (
    <Card className="day-details">
      <div className="day-details-header">
        <span>Tagesdetails</span>
        <strong>{formatDateGerman(dateKey)}</strong>
        {holiday && <p className="day-details-holiday">Feiertag: {holiday.name}</p>}
      </div>

      {shifts.length === 0 ? (
        <p>Für diesen Tag ist noch kein Dienst erfasst.</p>
      ) : (
        <div className="day-details-list">
          {shifts.map((shift) => {
            const isEditing = editingShiftId === shift.id;

            return (
              <article className="day-details-shift" key={shift.id}>
                {isEditing ? (
                  <div className="day-details-edit-form">
                    <ShiftForm
                      initialShift={shift}
                      onUpdateShift={onUpdateShift}
                      onDone={() => setEditingShiftId(null)}
                    />

                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => setEditingShiftId(null)}
                    >
                      Abbrechen
                    </Button>
                  </div>
                ) : (
                  <>
                    <div>
                      <strong>{shiftLabels[shift.type]}</strong>

                      {shift.type !== "FREE" && (
                        <>
                          <span>
                            {formatTimeRange24(
                              shift.startTime,
                              shift.endTime,
                            )}
                          </span>
                          <span>{calculateNetHours(shift)} h netto</span>
                        </>
                      )}

                      {shift.note && <p>{shift.note}</p>}
                    </div>

                    <div className="day-details-shift-actions">
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => {
                          setShowForm(false);
                          setEditingShiftId(shift.id);
                        }}
                      >
                        Bearbeiten
                      </Button>

                      <Button
                        type="button"
                        variant="danger"
                        onClick={() => onDeleteShift(shift.id)}
                      >
                        Löschen
                      </Button>
                    </div>
                  </>
                )}
              </article>
            );
          })}
        </div>
      )}

      <div className="day-details-actions">
        <Button
          type="button"
          variant="secondary"
          onClick={() => {
            setEditingShiftId(null);
            setShowForm((current) => !current);
          }}
        >
          {showForm ? "Formular schließen" : "Dienst für diesen Tag hinzufügen"}
        </Button>
      </div>

      {showForm && (
        <div className="day-details-form">
          <ShiftForm
            onAddShift={onAddShift}
            initialDate={dateKey}
            onDone={() => setShowForm(false)}
          />
        </div>
      )}
    </Card>
  );
}