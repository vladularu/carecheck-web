import { calculatePremiumLines } from "../../services/calculation/premiumAmountCalculator";
import type { ShiftPremiumHours } from "../../services/calculation/shiftPremiumCalculator";

interface ShiftPremiumSummaryProps {
  premium: ShiftPremiumHours;
}

function formatHours(value: number): string {
  return `${value} h`;
}

export default function ShiftPremiumSummary({
  premium,
}: ShiftPremiumSummaryProps) {
  const result = calculatePremiumLines(premium, {
    holidayMode: "WITH_TIME_OFF",
  });

  if (result.lines.length === 0) {
    return null;
  }

  return (
    <div className="shift-premium-summary">
      <strong className="shift-premium-summary-title">
        Zuschlagsgrundlage
      </strong>

      <div className="shift-premium-summary-grid">
        {result.lines.map((line) => (
          <div className="shift-premium-row" key={line.key}>
            <span>{line.label}</span>
            <strong>
              {formatHours(line.hours)} × {line.percentage} %
            </strong>
          </div>
        ))}
      </div>

      {premium.holidayNames.length > 0 && (
        <p>Feiertag: {premium.holidayNames.join(", ")}</p>
      )}

      <p className="shift-premium-note">
        Euro-Beträge folgen, sobald der TVöD-Stundenwert hinterlegt ist.
      </p>
    </div>
  );
}