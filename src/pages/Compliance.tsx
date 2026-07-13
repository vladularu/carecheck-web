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
    <section className="page">
      <PageHeader
        eyebrow="Prüfung"
        title={`Arbeitszeitgesetz · ${selectedMonthLabel}`}
        description="Prüfung für Ruhezeit, Pausen, tägliche Arbeitszeit, Überschneidungen und Wochenendfolge im ausgewählten Monat."
      />

      <Card>
        <div className="compliance-summary">
          <div>
            <span>Kritisch</span>
            <strong>{criticalCount}</strong>
          </div>

          <div>
            <span>Warnungen</span>
            <strong>{warningCount}</strong>
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
        <Card>
          <strong>
            Keine Auffälligkeiten gefunden
          </strong>

          <p>
            Für {selectedMonthLabel} wurden keine
            Verstöße gegen die hinterlegten
            Prüfregeln erkannt.
          </p>
        </Card>
      ) : (
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
      )}
    </section>
  );
}