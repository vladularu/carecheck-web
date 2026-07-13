import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import PageHeader from "../components/ui/PageHeader";
import { useAppContext } from "../context/useAppContext";
import {
  calculateMonthlyHours,
  filterShiftsByMonth,
} from "../services/calculation/monthlyHoursCalculator";
import { calculateMonthlyPremiums } from "../services/calculation/monthlyPremiumCalculator";
import { calculateMonthlyCompliance } from "../services/compliance/monthlyComplianceService";
import { calculateNetHours } from "../services/calculation/workingTimeCalculator";
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
  return `${new Intl.NumberFormat("de-DE", {
    minimumFractionDigits: value % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(value)} h`;
}

function formatReportDate(): string {
  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date());
}

export default function MonthlyReport() {
  const {
    profile,
    shifts,
    selectedYear,
    selectedMonth,
  } = useAppContext();

  const monthLabel =
    `${monthNames[selectedMonth]} ${selectedYear}`;

  const premiumHourlyRate =
    getTvoedPPremiumHourlyRate(profile.payGroup);

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

const monthlyCompliance =
  calculateMonthlyCompliance(
    shifts,
    selectedYear,
    selectedMonth,
  );

const {
  issues: complianceIssues,
  complianceRelevantShiftsInSelectedMonth,
} = monthlyCompliance;

  const criticalCount = complianceIssues.filter(
    (issue) => issue.severity === "critical",
  ).length;

  const warningCount = complianceIssues.filter(
    (issue) => issue.severity === "warning",
  ).length;

  const reportStatus =
    criticalCount > 0
      ? "Kritische Hinweise vorhanden"
      : warningCount > 0
        ? "Warnungen vorhanden"
        : "Keine Auffälligkeiten";

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
            <Button
              type="button"
              onClick={handlePrint}
            >
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

          <div className="print-report-meta">
            <strong>
              {profile.payGroup} Stufe {profile.payLevel}
            </strong>

            <p>
              {profile.federalState} ·{" "}
              {profile.weeklyHours} h/Woche
            </p>

            <p>Erstellt am {formatReportDate()}</p>
          </div>
        </header>

        <section className="print-report-status">
          <div>
            <span>Monatsstatus</span>
            <strong>{reportStatus}</strong>
          </div>

          <div>
            <span>Saldo</span>
            <strong>
              {formatHours(monthlyHours.balanceHours)}
            </strong>
          </div>

          <div>
            <span>Zuschläge</span>
            <strong>
              {formatEuro(monthlyPremiums.totalAmount)}
            </strong>
          </div>

          <div>
            <span>Prüfhinweise</span>
            <strong>{complianceIssues.length}</strong>
          </div>
        </section>

        <section className="print-report-section">
          <div className="print-report-section-title">
            <span>01</span>
            <h2>Arbeitszeit</h2>
          </div>

          <div className="print-report-grid">
            <div>
              <span>Sollstunden</span>
              <strong>
                {formatHours(monthlyHours.targetHours)}
              </strong>
            </div>

            <div>
              <span>Iststunden</span>
              <strong>
                {formatHours(monthlyHours.actualHours)}
              </strong>
            </div>

            <div>
              <span>Saldo</span>
              <strong>
                {formatHours(monthlyHours.balanceHours)}
              </strong>
            </div>

            <div>
              <span>Überstunden</span>
              <strong>
                {formatHours(monthlyHours.overtimeHours)}
              </strong>
            </div>

            <div>
              <span>Unterstunden</span>
              <strong>
                {formatHours(monthlyHours.undertimeHours)}
              </strong>
            </div>

            <div>
              <span>Soll-Arbeitstage</span>
              <strong>
                {monthlyHours.workingDayCount}
              </strong>
            </div>

            <div>
              <span>Feiertage</span>
              <strong>
                {monthlyHours.publicHolidayCount}
              </strong>
            </div>

            <div>
              <span>Feiertagsabzug</span>
              <strong>
                {formatHours(
                  monthlyHours.holidayReductionHours,
                )}
              </strong>
            </div>

            <div>
              <span>Ø tägliche Sollzeit</span>
              <strong>
                {formatHours(
                  monthlyHours.averageDailyHours,
                )}
              </strong>
            </div>
          </div>
        </section>

        <section className="print-report-section">
          <div className="print-report-section-title">
            <span>02</span>
            <h2>Monatsplanung</h2>
          </div>

          <div className="print-report-grid">
            <div>
              <span>Arbeitsdienste</span>
              <strong>
                {monthlyHours.workShiftCount}
              </strong>
            </div>

            <div>
              <span>Planungseinträge</span>
              <strong>
                {monthlyHours.planningEntryCount}
              </strong>
            </div>

            <div>
              <span>Planungstage</span>
              <strong>
                {monthlyHours.plannedDayCount}
              </strong>
            </div>

            <div>
              <span>Kalendereinträge</span>
              <strong>
                {monthlyHours.calendarEntryCount}
              </strong>
            </div>

            <div>
              <span>Urlaubstage</span>
              <strong>
                {monthlyHours.vacationDayCount}
              </strong>
            </div>

            <div>
              <span>Krankheitstage</span>
              <strong>
                {monthlyHours.sickDayCount}
              </strong>
            </div>

            <div>
              <span>Fortbildungstage</span>
              <strong>
                {monthlyHours.trainingDayCount}
              </strong>
            </div>

            <div>
              <span>Frei-Tage</span>
              <strong>
                {monthlyHours.freeDayCount}
              </strong>
            </div>

            <div>
<span>Compliance-relevant</span>
<strong>
  {complianceRelevantShiftsInSelectedMonth.length}
</strong>
            </div>
          </div>
        </section>

        <section className="print-report-section">
          <div className="print-report-section-title">
            <span>03</span>
            <h2>Zuschläge</h2>
          </div>

          {monthlyPremiums.lines.length === 0 ? (
            <p className="print-report-empty">
              Keine zuschlagspflichtigen Zeiten erkannt.
            </p>
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
                    <td>
                      {formatHours(line.hours)}
                    </td>
                    <td>{line.percentage} %</td>
                    <td>{formatEuro(line.amount)}</td>
                  </tr>
                ))}

                <tr className="print-report-total-row">
                  <td colSpan={3}>
                    Summe Zuschläge
                  </td>
                  <td>
                    {formatEuro(
                      monthlyPremiums.totalAmount,
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          )}
        </section>

        <section className="print-report-section">
          <div className="print-report-section-title">
            <span>04</span>
            <h2>Prüfhinweise</h2>
          </div>

          {complianceIssues.length === 0 ? (
            <p className="print-report-empty">
              Keine Auffälligkeiten gefunden.
            </p>
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
                    <td>
                      {
                        severityLabels[
                          issue.severity
                        ]
                      }
                    </td>
                    <td>{issue.title}</td>
                    <td>{issue.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <section className="print-report-section">
          <div className="print-report-section-title">
            <span>05</span>
            <h2>Kalendereinträge</h2>
          </div>

          {shiftsInSelectedMonth.length === 0 ? (
            <p className="print-report-empty">
              Keine Kalendereinträge erfasst.
            </p>
          ) : (
            <table className="print-report-table print-report-shift-table">
              <thead>
                <tr>
                  <th>Datum</th>
                  <th>Eintragsart</th>
                  <th>Zeit</th>
                  <th>Pause</th>
                  <th>Netto</th>
                  <th>Notiz</th>
                </tr>
              </thead>

              <tbody>
                {shiftsInSelectedMonth.map((shift) => (
                  <tr key={shift.id}>
                    <td>
                      {formatDateGerman(shift.date)}
                    </td>
                    <td>
                      {shiftLabels[shift.type]}
                    </td>
                    <td>
                      {formatTimeRange24(
                        shift.startTime,
                        shift.endTime,
                      )}
                    </td>
                    <td>
                      {shift.breakMinutes} min
                    </td>
                    <td>
                      {formatHours(
                        calculateNetHours(shift),
                      )}
                    </td>
                    <td>{shift.note ?? ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <footer className="print-report-footer">
          <p>
            Dieser Bericht wurde lokal mit CareCheck
            TVöD erstellt. Die Werte dienen der
            persönlichen Dienstplan- und
            Arbeitszeitkontrolle.
          </p>
        </footer>
      </article>
    </section>
  );
}