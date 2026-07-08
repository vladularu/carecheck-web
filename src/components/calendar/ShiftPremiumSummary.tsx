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
  const rows = [
    {
      label: "Nacht",
      value: premium.nightHours,
    },
    {
      label: "Sonntag",
      value: premium.sundayHours,
    },
    {
      label: "Feiertag",
      value: premium.holidayHours,
    },
    {
      label: "Samstag 13–21",
      value: premium.saturdayAfternoonHours,
    },
  ].filter((row) => row.value > 0);

  if (rows.length === 0) {
    return null;
  }

  return (
    <div className="shift-premium-summary">
      <strong className="shift-premium-summary-title">
        Zuschlagsgrundlage
      </strong>

      <div className="shift-premium-summary-grid">
        {rows.map((row) => (
          <div className="shift-premium-row" key={row.label}>
            <span>{row.label}</span>
            <strong>{formatHours(row.value)}</strong>
          </div>
        ))}
      </div>

      {premium.holidayNames.length > 0 && (
        <p>Feiertag: {premium.holidayNames.join(", ")}</p>
      )}
    </div>
  );
}