import Card from "../ui/Card";
import type { MonthlyPremiumResult } from "../../services/calculation/monthlyPremiumCalculator";

interface MonthlyPremiumSummaryProps {
  monthlyPremiums: MonthlyPremiumResult;
  hasHourlyRate: boolean;
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

export default function MonthlyPremiumSummary({
  monthlyPremiums,
  hasHourlyRate,
}: MonthlyPremiumSummaryProps) {
  return (
    <Card>
      <div className="monthly-premium-header">
        <div>
          <span className="card-label">Zuschläge im Monat</span>
          <strong>
            {monthlyPremiums.totalAmount !== null
              ? formatEuro(monthlyPremiums.totalAmount)
              : "Noch kein Betrag"}
          </strong>
        </div>

        <div className="monthly-premium-count">
          {monthlyPremiums.shiftCountWithPremiums} Dienst(e)
        </div>
      </div>

      {monthlyPremiums.lines.length === 0 ? (
        <p>Für diesen Monat wurden keine zuschlagspflichtigen Zeiten erkannt.</p>
      ) : (
        <div className="monthly-premium-list">
          {monthlyPremiums.lines.map((line) => (
            <div className="monthly-premium-row" key={line.key}>
              <div>
                <strong>{line.label}</strong>
                <span>
                  {formatHours(line.hours)} × {line.percentage} %
                </span>
              </div>

              <strong>
                {line.amount !== null ? formatEuro(line.amount) : "€ offen"}
              </strong>
            </div>
          ))}
        </div>
      )}

      {!hasHourlyRate && monthlyPremiums.lines.length > 0 && (
        <p className="monthly-premium-note">
          Trage im Profil einen Zuschlags-Stundenwert ein, damit Euro-Beträge
          berechnet werden.
        </p>
      )}
    </Card>
  );
}