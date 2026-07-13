import { useState } from "react";
import ShiftForm from "../ShiftForm";
import Button from "../ui/Button";
import Card from "../ui/Card";
import { calculateNetHours } from "../../services/calculation/workingTimeCalculator";
import { calculateShiftPremiumHours } from "../../services/calculation/shiftPremiumCalculator";
import {
  formatDateGerman,
  formatTimeRange24,
} from "../../services/format/dateTimeFormat";
import type { Holiday } from "../../services/holiday/holidayService";
import type {
  ComplianceIssue,
  FederalState,
  Shift,
  ShiftType,
} from "../../types/index";
import ShiftPremiumSummary from "./ShiftPremiumSummary";

interface DayDetailsProps {
  dateKey: string;
  shifts: Shift[];
  holiday: Holiday | null;
  complianceIssues: ComplianceIssue[];
  federalState: FederalState;
  baseHourlyRate?: number;
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

const severityLabels: Record<ComplianceIssue["severity"], string> = {
  info: "Info",
  warning: "Warnung",
  critical: "Kritisch",
};

function getComplianceClassName(severity: ComplianceIssue["severity"]): string {
  return `day-details-compliance-item day-details-compliance-${severity}`;
}

function isCreditedAbsence(shift: Shift): boolean {
  return shift.type === "VACATION" || shift.type === "SICK";
}

function showsTimedDetails(shift: Shift): boolean {
  return shift.type !== "FREE" && !isCreditedAbsence(shift);
}

function formatHours(hours: number): string {
  return hours.toLocaleString("de-DE", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

function getCreditDescription(shift: Shift): string {
  if (shift.type === "VACATION") {
    return "tägliche Sollarbeitszeit";
  }

  if (shift.hourCreditSource === "PLANNED_SHIFT") {
    return "aus geplantem Dienst übernommen";
  }

  return "tägliche Sollarbeitszeit verwendet";
}

export default function DayDetails({
  dateKey,
  shifts,
  holiday,
  complianceIssues,
  federalState,
  baseHourlyRate,
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

        {holiday && (
          <p className="day-details-holiday">Feiertag: {holiday.name}</p>
        )}
      </div>

      {complianceIssues.length > 0 && (
        <div className="day-details-compliance">
          <strong>Prüfhinweise</strong>

          {complianceIssues.map((issue) => (
            <article
              className={getComplianceClassName(issue.severity)}
              key={issue.id}
            >
              <span>{severityLabels[issue.severity]}</span>

              <strong>{issue.title}</strong>

              <p>{issue.description}</p>
            </article>
          ))}
        </div>
      )}

      {shifts.length === 0 ? (
        <p>Für diesen Tag ist noch kein Dienst erfasst.</p>
      ) : (
        <div className="day-details-list">
          {shifts.map((shift) => {
            const isEditing = editingShiftId === shift.id;

            const showTimedDetails = showsTimedDetails(shift);

            const premium = showTimedDetails
              ? calculateShiftPremiumHours(shift, federalState)
              : null;

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
                    <div className="day-details-shift-main">
                      <strong>{shiftLabels[shift.type]}</strong>

                      {showTimedDetails && premium && (
                        <>
                          <div className="day-details-shift-meta">
                            <span>
                              {formatTimeRange24(
                                shift.startTime,
                                shift.endTime,
                              )}
                            </span>

                            <span>
                              {formatHours(calculateNetHours(shift))} h netto
                            </span>
                          </div>

                          <ShiftPremiumSummary
                            premium={premium}
                            baseHourlyRate={baseHourlyRate}
                          />
                        </>
                      )}

                      {isCreditedAbsence(shift) && (
                        <div className="day-details-shift-meta">
                          <span>
                            {formatHours(calculateNetHours(shift))} h
                            Zeitgutschrift
                          </span>

                          <span>{getCreditDescription(shift)}</span>
                        </div>
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