import {
  calculatePremiumLines,
  type PremiumLine,
} from "../../services/calculation/premiumAmountCalculator";
import type { ShiftPremiumHours } from "../../services/calculation/shiftPremiumCalculator";

interface ShiftPremiumSummaryProps {
  premium: ShiftPremiumHours;
  baseHourlyRate?: number;
}

function formatHours(value: number): string {
  return `${value} h`;
}

function formatEuro(value: number): string {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
  }).format(value);
}

function formatLineAmount(line: PremiumLine): string {
  if (line.amount === null) {
    return "€ offen";
  }

  return formatEuro(line.amount);
}

export default function ShiftPremiumSummary({
  premium,
  baseHourlyRate,
}: ShiftPremiumSummaryProps) {
  const result = calculatePremiumLines(premium, {
    holidayMode: "WITH_TIME_OFF",
    baseHourlyRate,
  });

  if (result.lines.length === 0) {
    return null;
  }

  return (
    <div className="shift-premium-summary">
      <strong className="shift-premium-summary-title">
        Zuschlagsberechnung
      </strong>

      <div className="shift-premium-summary-grid">
        {result.lines.map((line) => (
          <div className="shift-premium-row" key={line.key}>
            <span>
              {line.label}
              <small>
                {formatHours(line.hours)} × {line.percentage} %
              </small>
            </span>

            <strong>{formatLineAmount(line)}</strong>
          </div>
        ))}
      </div>

      {result.totalAmount !== null && (
        <div className="shift-premium-total">
          <span>Summe Zuschläge</span>
          <strong>{formatEuro(result.totalAmount)}</strong>
        </div>
      )}

      {premium.holidayNames.length > 0 && (
        <p>Feiertag: {premium.holidayNames.join(", ")}</p>
      )}

      {!baseHourlyRate && (
        <p className="shift-premium-note">
          Euro-Beträge erscheinen, sobald im Profil ein Zuschlags-Stundenwert
          eingetragen ist.
        </p>
      )}
    </div>
  );
}