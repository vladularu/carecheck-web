import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import PageHeader from "../components/ui/PageHeader";
import { useAppContext } from "../context/AppContext";
import {
  calculateMonthlyHours,
  filterShiftsByMonth,
} from "../services/calculation/monthlyHoursCalculator";
import { calculateMonthlyPremiums } from "../services/calculation/monthlyPremiumCalculator";
import { calculateNetHours } from "../services/calculation/workingTimeCalculator";
import { checkCompliance } from "../services/compliance/complianceService";
import {
  formatDateGerman,
  formatTimeRange24,
} from "../services/format/dateTimeFormat";
import { getTvoedPPremiumHourlyRate } from "../services/tariff/tvoedPTariffService";
import type { ComplianceIssue, ShiftType } from "../types/index";

const monthNames = [
  "Januar",
  "Februar",
  "März",
  "April",
  "Mai",
  "Juni",
  "Juli",
  "August",
  "September",
  "Oktober",
  "November",
  "Dezember",
];

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

function formatEuro(value: number | null): string {
  if (value === null) {
    return "—";
  }

  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
  }).format(value);
}

function formatHours(value: number): string {
  return `${value} h`;
}

export default function MonthlyReport() {
  const { profile, shifts, selectedYear, selectedMonth } = useAppContext();

  const monthLabel = `${monthNames[selectedMonth]} ${selectedYear}`;
  const premiumHourlyRate = getTvoedPPremiumHourlyRate(profile.payGroup);

  const shiftsInSelectedMonth = filterShiftsByMonth(
    shifts,
    selectedYear,
    selectedMonth,
  );

  const monthlyHours = calculateMonthlyHours(
    shifts,
    profile,
    selectedYear,
    selectedMonth,
  );

  const monthlyPremiums = calculateMonthlyPremiums(
    shifts,
    selectedYear,
    selectedMonth,
    {
      federalState: profile.federalState,
      baseHourlyRate: premiumHourlyRate,
      holidayMode: "WITH_TIME_OFF",
    },
  );

  const complianceIssues = checkCompliance(shiftsInSelectedMonth);

  function handlePrint() {
    window.print();
  }

  return (
    <section className="page monthly-report-page">
      <div className="no-print">
        <PageHeader
          eyebrow="Bericht"
          title={`Monatsbericht · ${monthLabel}`}
          description="Druckansicht für PDF-Export über den Browser."
        />

        <Card>
          <div className="report-actions">
            <Button type="button" onClick={handlePrint}>
              Drucken / als PDF speichern
            </Button>
          </div>
        </Card>
      </div>

      <article className="print-report">
        <header className="print-report-header">
          <div>
            <span>CareCheck TVöD</span>
            <h1>Monatsbericht</h1>
            <p>{monthLabel}</p>
          </div>

          <div>
            <strong>{profile.payGroup} Stufe {profile.payLevel}</strong>
            <p>{profile.federalState} · {profile.weeklyHours} h/Woche</p>
          </div>
        </header>

        <section className="print-report-section">
          <h2>Arbeitszeit</h2>

          <div className="print-report-grid">
            <div>
              <span>Sollstunden</span>
              <strong>{formatHours(monthlyHours.targetHours)}</strong>
            </div>

            <div>
              <span>Iststunden</span>
              <strong>{formatHours(monthlyHours.actualHours)}</strong>
            </div>

            <div>
              <span>Saldo</span>
              <strong>{formatHours(monthlyHours.balanceHours)}</strong>
            </div>

            <div>
              <span>Arbeitstage</span>
              <strong>{monthlyHours.workingDayCount}</strong>
            </div>

            <div>
              <span>Feiertage</span>
              <strong>{monthlyHours.publicHolidayCount}</strong>
            </div>

            <div>
              <span>Feiertagsabzug</span>
              <strong>{formatHours(monthlyHours.holidayReductionHours)}</strong>
            </div>
          </div>
        </section>

        <section className="print-report-section">
          <h2>Zuschläge</h2>

          {monthlyPremiums.lines.length === 0 ? (
            <p>Keine zuschlagspflichtigen Zeiten erkannt.</p>
          ) : (
            <table className="print-report-table">
              <thead>
                <tr>
                  <th>Art</th>
                  <th>Stunden</th>
                  <th>Prozent</th>
                  <th>Betrag</th>
                </tr>
              </thead>
              <tbody>
                {monthlyPremiums.lines.map((line) => (
                  <tr key={line.key}>
                    <td>{line.label}</td>
                    <td>{formatHours(line.hours)}</td>
                    <td>{line.percentage} %</td>
                    <td>{formatEuro(line.amount)}</td>
                  </tr>
                ))}

                <tr>
                  <td colSpan={3}>
                    <strong>Summe Zuschläge</strong>
                  </td>
                  <td>
                    <strong>{formatEuro(monthlyPremiums.totalAmount)}</strong>
                  </td>
                </tr>
              </tbody>
            </table>
          )}
        </section>

        <section className="print-report-section">
          <h2>Prüfhinweise</h2>

          {complianceIssues.length === 0 ? (
            <p>Keine Auffälligkeiten gefunden.</p>
          ) : (
            <table className="print-report-table">
              <thead>
                <tr>
                  <th>Schweregrad</th>
                  <th>Titel</th>
                  <th>Beschreibung</th>
                </tr>
              </thead>
              <tbody>
                {complianceIssues.map((issue) => (
                  <tr key={issue.id}>
                    <td>{severityLabels[issue.severity]}</td>
                    <td>{issue.title}</td>
                    <td>{issue.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <section className="print-report-section">
          <h2>Dienste</h2>

          {shiftsInSelectedMonth.length === 0 ? (
            <p>Keine Dienste erfasst.</p>
          ) : (
            <table className="print-report-table">
              <thead>
                <tr>
                  <th>Datum</th>
                  <th>Dienstart</th>
                  <th>Zeit</th>
                  <th>Pause</th>
                  <th>Netto</th>
                  <th>Notiz</th>
                </tr>
              </thead>
              <tbody>
                {shiftsInSelectedMonth.map((shift) => (
                  <tr key={shift.id}>
                    <td>{formatDateGerman(shift.date)}</td>
                    <td>{shiftLabels[shift.type]}</td>
                    <td>{formatTimeRange24(shift.startTime, shift.endTime)}</td>
                    <td>{shift.breakMinutes} min</td>
                    <td>{formatHours(calculateNetHours(shift))}</td>
                    <td>{shift.note ?? ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </article>
    </section>
  );
}