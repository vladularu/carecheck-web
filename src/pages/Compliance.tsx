import Card from "../components/ui/Card";
import PageHeader from "../components/ui/PageHeader";
import { useAppContext } from "../context/useAppContext";
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
  "MÃ¤rz",
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
        eyebrow="PrÃ¼fung"
        title={`Arbeitszeitgesetz Â· ${selectedMonthLabel}`}
        description="BasisprÃ¼fung fÃ¼r Ruhezeit, Pausen und tÃ¤gliche Arbeitszeit im ausgewÃ¤hlten Monat."
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
            <span>Dienste geprÃ¼ft</span>
            <strong>{shiftsInSelectedMonth.length}</strong>
          </div>
        </div>

<p className="compliance-note">
  Es werden nur Dienste aus dem aktuell ausgewÃ¤hlten Monat geprÃ¼ft:{" "}
  <strong>{selectedMonthLabel}</strong>. GeprÃ¼ft werden Ruhezeit, Pausen,
  Tagesarbeitszeit und Wochenendfolge. Den Monat Ã¤nderst du Ã¼ber die Kalender-
  oder Dashboard-Navigation.
</p>
      </Card>

      {issues.length === 0 ? (
        <Card>
          <strong>Keine AuffÃ¤lligkeiten gefunden</strong>
          <p>
            FÃ¼r {selectedMonthLabel} wurden keine BasisverstÃ¶ÃŸe gegen die
            hinterlegten PrÃ¼fregeln erkannt.
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
