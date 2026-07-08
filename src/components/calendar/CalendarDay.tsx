import type { CalendarDay as CalendarDayModel } from "../../services/calendar/calendarService";
import { calculateNetHours } from "../../services/calculation/workingTimeCalculator";
import { formatTimeRange24 } from "../../services/format/dateTimeFormat";
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

const shiftIcons: Record<ShiftType, string> = {
  EARLY: "🌅",
  LATE: "🌇",
  NIGHT: "🌙",
  DAY: "☀️",
  TRAINING: "📘",
  VACATION: "Krank",
  SICK: "Krank",
  FREE: "Frei",
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

export default function CalendarDay({
  day,
  shifts,
  holiday,
  complianceIssues,
  selected,
  onSelect,
}: CalendarDayProps) {
  const highestSeverity = getHighestSeverity(complianceIssues);

  const classNames = [
    "calendar-day",
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
            <span className="calendar-compliance-badge warning">⚠</span>
          )}
        </div>
      </div>

      {holiday && <div className="calendar-holiday-name">{holiday.name}</div>}

      <div className="calendar-shifts">
        {shifts.slice(0, 2).map((shift) => (
          <div className="calendar-shift" key={shift.id}>
            <strong>
              {shiftIcons[shift.type]} {shiftLabels[shift.type]}
            </strong>

            {shift.type !== "FREE" && (
              <>
                <span>{formatTimeRange24(shift.startTime, shift.endTime)}</span>
                <span>{calculateNetHours(shift)} h</span>
              </>
            )}
          </div>
        ))}

        {shifts.length > 2 && (
          <span className="calendar-more">+{shifts.length - 2} weitere</span>
        )}
      </div>
    </button>
  );
}