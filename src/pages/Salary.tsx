import Card from "../components/ui/Card";
import PageHeader from "../components/ui/PageHeader";
import { useAppContext } from "../context/useAppContext";
import {
  getTvoedPHourlyRate,
  getTvoedPMonthlySalary,
  getTvoedPPremiumHourlyRate,
  getTvoedPTariffLabel,
} from "../services/tariff/tvoedPTariffService";

function formatEuro(value: number | null): string {
  if (value === null) {
    return "nicht verfügbar";
  }

  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
  }).format(value);
}

export default function Salary() {
  const { profile } = useAppContext();

  const monthlySalary =
    getTvoedPMonthlySalary(
      profile.payGroup,
      profile.payLevel,
    );

  const hourlyRate = getTvoedPHourlyRate(
    profile.payGroup,
    profile.payLevel,
  );

  const premiumHourlyRate =
    getTvoedPPremiumHourlyRate(
      profile.payGroup,
    );

  return (
    <section className="page salary-page">
      <PageHeader
        eyebrow="Gehalt"
        title="TVöD-P Werte"
        description="Tarifliche Orientierung für Monatsentgelt, Stundenwert und Zuschlagsbasis."
      />

      <Card className="salary-overview-card">
        <div className="salary-section-header">
          <span className="card-label">Aktuelles Profil</span>
          <strong>
            {profile.payGroup} · Stufe{" "}
            {profile.payLevel}
          </strong>
          <p>{getTvoedPTariffLabel()}</p>
        </div>

        <div className="salary-value-grid">
          <div>
            <span>Monatsentgelt</span>
            <strong>
              {formatEuro(monthlySalary)}
            </strong>
          </div>

          <div>
            <span>Stundenwert</span>
            <strong>
              {formatEuro(hourlyRate)}
            </strong>
          </div>

          <div className="highlight">
            <span>Zuschlagsbasis</span>
            <strong>
              {formatEuro(premiumHourlyRate)}
            </strong>
          </div>
        </div>

        <p className="salary-helper">
          Die Zuschlagsbasis folgt der TVöD-P
          Zeitzuschlagslogik mit Stufe 3 der
          gewählten Entgeltgruppe.
        </p>
      </Card>
    </section>
  );
}
