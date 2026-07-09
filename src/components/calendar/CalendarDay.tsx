import type { CalendarDay as CalendarDayModel } from "../../services/calendar/calendarService";
import type { Holiday } from "../../services/holiday/holidayService";
import type { ComplianceIssue, Shift, ShiftType } from "../../types/index";

interface CalendarDayProps {
  day: CalendarDayModel;
  shifts: Shift[];
  holiday: Holiday | null;
  complianceIssues: ComplianceIssue[];
  selected: boolean;
  onSelect: (dateKey: string) => void;
}

const shiftShortLabels: Record<ShiftType, string> = {
  EARLY: "Früh",
  LATE: "Spät",
  NIGHT: "Nacht",
  DAY: "Tag",
  TRAINING: "Fortb.",
  VACATION: "Urlaub",
  SICK: "Krank",
  FREE: "Frei",
  CUSTOM: "Dienst",
};

const shiftDotLabels: Record<ShiftType, string> = {
  EARLY: "F",
  LATE: "S",
  NIGHT: "N",
  DAY: "T",
  TRAINING: "B",
  VACATION: "U",
  SICK: "K",
  FREE: "frei",
  CUSTOM: "•",
};

function getHighestSeverity(issues: ComplianceIssue[]) {
  if (issues.some((issue) => issue.severity === "critical")) {
    return "critical";
  }

  if (issues.some((issue) => issue.severity === "warning")) {
    return "warning";
  }

  if (issues.some((issue) => issue.severity === "info")) {
    return "info";
  }

  return null;
}

function getShiftTypeClassName(type: ShiftType): string {
  return `calendar-shift-type-${type.toLowerCase()}`;
}

function getDayAriaLabel(
  day: CalendarDayModel,
  shifts: Shift[],
  holiday: Holiday | null,
  issueCount: number,
): string {
  const parts = [`Tag ${day.dayNumber}`];

  if (holiday) {
    parts.push(`Feiertag ${holiday.name}`);
  }

  if (shifts.length === 1) {
    parts.push("1 Dienst");
  }

  if (shifts.length > 1) {
    parts.push(`${shifts.length} Dienste`);
  }

  if (issueCount === 1) {
    parts.push("1 Prüfhinweis");
  }

  if (issueCount > 1) {
    parts.push(`${issueCount} Prüfhinweise`);
  }

  return parts.join(", ");
}

export default function CalendarDay({
  day,
  shifts,
  holiday,
  complianceIssues,
  selected,
  onSelect,
}: CalendarDayProps) {
  const highestSeverity = getHighestSeverity(complianceIssues);
  const primaryShift = shifts[0];
  const secondaryShifts = shifts.slice(1, 4);
  const hiddenShiftCount = Math.max(0, shifts.length - 4);

  const classNames = [
    "calendar-day",
    "calendar-day-compact",
    day.currentMonth ? "current-month" : "outside-month",
    day.weekend ? "weekend" : "",
    holiday ? "holiday" : "",
    shifts.length > 0 ? "has-shift" : "",
    highestSeverity ? `has-compliance-${highestSeverity}` : "",
    selected ? "selected" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      aria-label={getDayAriaLabel(
        day,
        shifts,
        holiday,
        complianceIssues.length,
      )}
      className={classNames}
      type="button"
      onClick={() => onSelect(day.dateKey)}
    >
      <div className="calendar-day-top">
        <div className="calendar-day-number">{day.dayNumber}</div>

        <div className="calendar-day-badges">
          {holiday && <span className="calendar-holiday-badge">FT</span>}

          {highestSeverity === "critical" && (
            <span className="calendar-compliance-badge critical">!</span>
          )}

          {highestSeverity === "warning" && (
            <span className="calendar-compliance-badge warning">!</span>
          )}
        </div>
      </div>

      <div className="calendar-day-body">
        {primaryShift ? (
          <div
            className={[
              "calendar-shift-chip",
              getShiftTypeClassName(primaryShift.type),
            ].join(" ")}
          >
            <span className="calendar-shift-chip-dot" />
            <strong>{shiftShortLabels[primaryShift.type]}</strong>
          </div>
        ) : (
          <span className="calendar-empty-marker" />
        )}

        {(secondaryShifts.length > 0 || hiddenShiftCount > 0) && (
          <div className="calendar-shift-dot-row">
            {secondaryShifts.map((shift) => (
              <span
                className={[
                  "calendar-shift-mini-dot",
                  getShiftTypeClassName(shift.type),
                ].join(" ")}
                key={shift.id}
                title={shiftShortLabels[shift.type]}
              >
                {shiftDotLabels[shift.type]}
              </span>
            ))}

            {hiddenShiftCount > 0 && (
              <span className="calendar-shift-more-compact">
                +{hiddenShiftCount}
              </span>
            )}
          </div>
        )}
      </div>
    </button>
  );
}