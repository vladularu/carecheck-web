import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import PageHeader from "../components/ui/PageHeader";
import StatCard from "../components/ui/StatCard";
import { useAppContext } from "../context/useAppContext";
import { downloadYearlyReportCsv } from "../services/export/yearlyReportCsvService";
import {
  calculateYearlyAnalysis,
  type YearlyTrendMonth,
} from "../services/yearly/yearlyAnalysisService";

function formatHours(value: number): string {
  return `${value.toLocaleString("de-DE", {
    minimumFractionDigits: value % 1 === 0 ? 0 : 1,
    maximumFractionDigits: 2,
  })} h`;
}

function formatEuro(value: number | null): string {
  if (value === null) {
    return "kein Betrag";
  }

  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
  }).format(value);
}

function formatTrend(trend: YearlyTrendMonth | null, unit: "hours" | "plain"): string {
  if (!trend) {
    return "keine Daten";
  }

  return unit === "hours"
    ? `${trend.monthLabel}: ${formatHours(trend.value)}`
    : `${trend.monthLabel}: ${trend.value}`;
}

export default function YearlyReport() {
  const {
    profile,
    shifts,
    selectedYear,
    selectedMonth,
    setSelectedMonth,
  } = useAppContext();

  const analysis = calculateYearlyAnalysis(
    shifts,
    profile,
    selectedYear,
  );

  function previousYear() {
    setSelectedMonth(selectedYear - 1, selectedMonth);
  }

  function nextYear() {
    setSelectedMonth(selectedYear + 1, selectedMonth);
  }

  function exportCsv() {
    downloadYearlyReportCsv({
      profile,
      analysis,
    });
  }

  return (
    <section className="page yearly-page">
      <div className="yearly-header-row">
        <PageHeader
          eyebrow="Jahr"
          title={`Jahresauswertung ${selectedYear}`}
          description="Zwoelf Monate Soll, Ist, Saldo, Abwesenheiten, Zuschlaege, Nacht-, Wochenend- und Feiertagsarbeit."
        />

        <div className="yearly-actions">
          <Button type="button" variant="secondary" onClick={previousYear}>
            Vorjahr
          </Button>
          <Button type="button" variant="secondary" onClick={nextYear}>
            Folgejahr
          </Button>
          <Button type="button" onClick={exportCsv}>
            CSV
          </Button>
        </div>
      </div>

      <section className="yearly-kpi-grid" aria-label="Jahreskennzahlen">
        <StatCard
          label="Iststunden"
          value={formatHours(analysis.summary.actualHours)}
          helper={`Soll ${formatHours(analysis.summary.targetHours)}`}
          highlight
        />
        <StatCard
          label="Jahressaldo"
          value={formatHours(analysis.summary.balanceHours)}
          helper={`Durchschnitt Monat ${formatHours(analysis.summary.averageMonthlyBalance)}`}
        />
        <StatCard
          label="Abwesenheiten"
          value={formatHours(analysis.summary.absenceHours)}
          helper={`Urlaub ${formatHours(analysis.summary.vacationHours)} - Krank ${formatHours(analysis.summary.sickHours)}`}
        />
        <StatCard
          label="Zuschlaege"
          value={formatEuro(analysis.summary.premiumTotalAmount)}
          helper={`${analysis.summary.premiumShiftCount} Dienst(e) mit Zuschlag`}
        />
      </section>

      <div className="yearly-content-grid">
        <Card className="yearly-card">
          <div className="yearly-card-header">
            <span className="card-label">Verteilung</span>
            <strong>Nacht, Wochenende, Feiertag</strong>
            <p>
              Die Verteilung nutzt erfasste Arbeitsdienste und bestehende
              Feiertagslogik nach Bundesland.
            </p>
          </div>

          <div className="yearly-metric-grid">
            <div>
              <span>Nachtdienststunden</span>
              <strong>
                {formatHours(analysis.summary.distribution.nightHours)}
              </strong>
            </div>
            <div>
              <span>Nachtdienste</span>
              <strong>{analysis.summary.distribution.nightShiftCount}</strong>
            </div>
            <div>
              <span>Wochenenddienste</span>
              <strong>{analysis.summary.distribution.weekendShiftCount}</strong>
            </div>
            <div>
              <span>Feiertagsarbeit</span>
              <strong>
                {formatHours(analysis.summary.distribution.holidayWorkHours)}
              </strong>
            </div>
          </div>
        </Card>

        <Card className="yearly-card">
          <div className="yearly-card-header">
            <span className="card-label">Trends</span>
            <strong>Monatsvergleiche</strong>
            <p>
              Trends werden nur aus Monaten mit Kalendereintraegen abgeleitet.
            </p>
          </div>

          <div className="yearly-trend-list">
            <div>
              <span>Bester Saldo</span>
              <strong>
                {formatTrend(analysis.trends.bestBalanceMonth, "hours")}
              </strong>
            </div>
            <div>
              <span>Schwaechster Saldo</span>
              <strong>
                {formatTrend(analysis.trends.weakestBalanceMonth, "hours")}
              </strong>
            </div>
            <div>
              <span>Staerkster Monat</span>
              <strong>
                {formatTrend(analysis.trends.busiestMonth, "hours")}
              </strong>
            </div>
            <div>
              <span>Meiste Nachtstunden</span>
              <strong>
                {formatTrend(analysis.trends.strongestNightMonth, "hours")}
              </strong>
            </div>
          </div>
        </Card>
      </div>

      <Card className="yearly-card yearly-wide-card">
        <div className="yearly-card-header">
          <span className="card-label">Monatsvergleich</span>
          <strong>Alle zwoelf Monate</strong>
          <p>
            Monatswerte werden aus der bestehenden Monatslogik uebernommen;
            Compliance wird je Monat gezaehlt.
          </p>
        </div>

        <div className="yearly-table-wrap">
          <table className="yearly-table">
            <thead>
              <tr>
                <th>Monat</th>
                <th>Ist</th>
                <th>Soll</th>
                <th>Saldo</th>
                <th>Dienste</th>
                <th>Nacht</th>
                <th>WE</th>
                <th>Feiertag</th>
                <th>Hinweise</th>
              </tr>
            </thead>

            <tbody>
              {analysis.months.map((month) => (
                <tr key={month.monthIndex}>
                  <th scope="row">{month.monthLabel}</th>
                  <td>{formatHours(month.monthlyHours.actualHours)}</td>
                  <td>{formatHours(month.monthlyHours.targetHours)}</td>
                  <td>{formatHours(month.monthlyHours.balanceHours)}</td>
                  <td>{month.monthlyHours.workShiftCount}</td>
                  <td>{formatHours(month.distribution.nightHours)}</td>
                  <td>{month.distribution.weekendShiftCount}</td>
                  <td>{formatHours(month.distribution.holidayWorkHours)}</td>
                  <td>{month.compliance.issueCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="yearly-card yearly-wide-card">
        <div className="yearly-card-header">
          <span className="card-label">Transparenz</span>
          <strong>Berechnungsgrundlage</strong>
        </div>

        <ul className="yearly-note-list">
          <li>
            Soll-, Ist- und Abwesenheitsstunden stammen aus der bestehenden
            Monatsberechnung.
          </li>
          <li>
            Compliance-Hinweise werden je Monat mit der bestehenden
            Monatspruefung gezaehlt; die Regeln selbst bleiben unveraendert.
          </li>
          <li>
            FREE zaehlt keine Stunden und keinen Planungstag. Urlaub und
            Krankheit bleiben stundenrelevant, aber nicht zuschlagspflichtig.
          </li>
        </ul>
      </Card>
    </section>
  );
}
