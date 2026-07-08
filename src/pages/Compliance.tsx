import Card from "../components/ui/Card";
import PageHeader from "../components/ui/PageHeader";
import { useAppContext } from "../context/AppContext";
import { filterShiftsByMonth } from "../services/calculation/monthlyHoursCalculator";
import { checkCompliance } from "../services/compliance/complianceService";
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

function getIssueClassName(severity: ComplianceIssue["severity"]): string {
  return `compliance-issue compliance-issue-${severity}`;
}

export default function Compliance() {
  const { shifts, selectedYear, selectedMonth } = useAppContext();

  const selectedMonthLabel = `${monthNames[selectedMonth]} ${selectedYear}`;

  const shiftsInSelectedMonth = filterShiftsByMonth(
    shifts,
    selectedYear,
    selectedMonth,
  );

  const issues = checkCompliance(shiftsInSelectedMonth);

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
        description="Basisprüfung für Ruhezeit, Pausen und tägliche Arbeitszeit im ausgewählten Monat."
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
            <span>Dienste geprüft</span>
            <strong>{shiftsInSelectedMonth.length}</strong>
          </div>
        </div>

<p className="compliance-note">
  Es werden nur Dienste aus dem aktuell ausgewählten Monat geprüft:{" "}
  <strong>{selectedMonthLabel}</strong>. Geprüft werden Ruhezeit, Pausen,
  Tagesarbeitszeit und Wochenendfolge. Den Monat änderst du über die Kalender-
  oder Dashboard-Navigation.
</p>
      </Card>

      {issues.length === 0 ? (
        <Card>
          <strong>Keine Auffälligkeiten gefunden</strong>
          <p>
            Für {selectedMonthLabel} wurden keine Basisverstöße gegen die
            hinterlegten Prüfregeln erkannt.
          </p>
        </Card>
      ) : (
        <div className="compliance-list">
          {issues.map((issue) => (
            <article className={getIssueClassName(issue.severity)} key={issue.id}>
              <span>{severityLabels[issue.severity]}</span>
              <strong>{issue.title}</strong>
              <p>{issue.description}</p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}