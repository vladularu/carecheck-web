import Card from "../ui/Card";
import type { ShiftType } from "../../types/index";
import type { ShiftTypeCount } from "../../services/calculation/monthlyHoursCalculator";

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

interface ShiftSummaryProps {
  shiftCount: number;
  shiftTypeCounts: ShiftTypeCount[];
}

export default function ShiftSummary({
  shiftCount,
  shiftTypeCounts,
}: ShiftSummaryProps) {
  return (
    <Card>
      <strong>Dienste im Monat</strong>
      <p>{shiftCount} Dienst(e) erfasst.</p>

      {shiftTypeCounts.length === 0 ? (
        <p>Noch keine Dienste in diesem Monat.</p>
      ) : (
        <div className="shift-type-list">
          {shiftTypeCounts.map((item) => (
            <div className="shift-type-row" key={item.type}>
              <span>{shiftLabels[item.type]}</span>
              <strong>{item.count}</strong>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}