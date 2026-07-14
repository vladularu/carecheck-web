import Card from "../components/ui/Card";
import PageHeader from "../components/ui/PageHeader";
import { useAppContext } from "../context/useAppContext";
import { calculateMonthlyCompliance } from "../services/compliance/monthlyComplianceService";
import type { ComplianceIssue } from "../types/index";

const severityLabels: Record<ComplianceIssue["severity"], string> = {
  info: "Info",
  warning: "Warnung",
  critical: "Kritisch",
};

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

function getIssueClassName(
  severity: ComplianceIssue["severity"],
): string {
  return `compliance-issue compliance-issue-${severity}`;
}

export default function Compliance() {
  const {
    shifts,
    selectedYear,
    selectedMonth,
  } = useAppContext();

  const selectedMonthLabel =
    `${monthNames[selectedMonth]} ${selectedYear}`;

  const monthlyCompliance =
    calculateMonthlyCompliance(
      shifts,
      selectedYear,
      selectedMonth,
    );

  const {
    issues,
    complianceRelevantShiftsInSelectedMonth,
  } = monthlyCompliance;

  const criticalCount = issues.filter(
    (issue) => issue.severity === "critical",
  ).length;

  const warningCount = issues.filter(
    (issue) => issue.severity === "warning",
  ).length;

  return (
    <section className="page compliance-page">
      <PageHeader
        eyebrow="Prüfung"
        title={`Arbeitszeitgesetz · ${selectedMonthLabel}`}
        description="Prüfung für Ruhezeit, Pausen, tägliche Arbeitszeit, Überschneidungen und Wochenendfolge im ausgewählten Monat."
      />

      <Card className="compliance-overview-card">
        <div className="compliance-section-header">
          <span className="card-label">Audit-Überblick</span>
          <strong>{selectedMonthLabel}</strong>
          <p>
            Zusammenfassung der erkannten Hinweise im
            ausgewählten Monat.
          </p>
        </div>

        <div className="compliance-summary">
          <div className="compliance-summary-critical">
            <span>Kritisch</span>
            <strong>{criticalCount}</strong>
          </div>

          <div className="compliance-summary-warning">
            <span>Warnungen</span>
            <strong>{warningCount}</strong>
          </div>

          <div>
            <span>Hinweise gesamt</span>
            <strong>{issues.length}</strong>
          </div>

          <div>
            <span>Einträge geprüft</span>
            <strong>
              {
                complianceRelevantShiftsInSelectedMonth
                  .length
              }
            </strong>
          </div>
        </div>

        <p className="compliance-note">
          Es werden nur compliance-relevante Einträge
          aus dem aktuell ausgewählten Monat geprüft:{" "}
          <strong>{selectedMonthLabel}</strong>.
          Ruhezeiten und Wochenendfolgen werden dabei
          auch über die vorherige Monatsgrenze hinweg
          berücksichtigt. Urlaub, Krank und Frei werden
          nicht als Arbeitsdienste geprüft.
          Fortbildungen bleiben compliance-relevant.
        </p>
      </Card>

      {issues.length === 0 ? (
        <Card className="compliance-empty-card">
          <div className="compliance-section-header">
            <span className="card-label">Ergebnis</span>
            <strong>
              Keine Auffälligkeiten gefunden
            </strong>

            <p>
              Für {selectedMonthLabel} wurden keine
              Verstöße gegen die hinterlegten
              Prüfregeln erkannt.
            </p>
          </div>
        </Card>
      ) : (
        <section
          className="compliance-list-section"
          aria-labelledby="compliance-issues-title"
        >
          <div className="compliance-section-header">
            <span className="card-label">Hinweise</span>
            <strong id="compliance-issues-title">
              Prüfhinweise im Detail
            </strong>
            <p>
              Jeder Hinweis beschreibt die Auffälligkeit
              und ihre Relevanz für den Dienstplan.
            </p>
          </div>

          <div className="compliance-list">
            {issues.map((issue) => (
              <article
                className={getIssueClassName(
                  issue.severity,
                )}
                key={issue.id}
              >
                <span>
                  {severityLabels[issue.severity]}
                </span>

                <strong>{issue.title}</strong>
                <p>{issue.description}</p>
              </article>
            ))}
          </div>
        </section>
      )}
    </section>
  );
}
