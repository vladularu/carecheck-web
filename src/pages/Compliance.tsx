import Card from "../components/ui/Card";
import PageHeader from "../components/ui/PageHeader";
import { useAppContext } from "../context/useAppContext";
import { calculateMonthlyCompliance } from "../services/compliance/monthlyComplianceService";
import {
  complianceRuleProfile,
  complianceTransparencyLimits,
  createComplianceIssueExplanation,
} from "../services/compliance/complianceRuleCatalog";
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

function getReferenceClassName(
  type: "law" | "internal",
): string {
  return `compliance-reference compliance-reference-${type}`;
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

  const issueExplanations = issues.map(
    (issue) => ({
      issue,
      explanation:
        createComplianceIssueExplanation(
          issue,
          shifts,
        ),
    }),
  );

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

      <Card className="compliance-rule-profile-card">
        <div className="compliance-section-header">
          <span className="card-label">Regelprofil</span>
          <strong>Transparente Prüfwerte</strong>
          <p>
            Die aktive Prüfung verwendet diese zentral
            dokumentierten Schwellenwerte und Grenzen.
          </p>
        </div>

        <div className="compliance-rule-profile-grid">
          {complianceRuleProfile.map((setting) => (
            <div
              className="compliance-rule-profile-item"
              key={setting.label}
            >
              <span>{setting.label}</span>
              <strong>{setting.value}</strong>
              <p>{setting.description}</p>
            </div>
          ))}
        </div>

        <div className="compliance-limit-panel">
          <span>Grenzen der Prüfung</span>
          <ul>
            {complianceTransparencyLimits.map(
              (limit) => (
                <li key={limit}>{limit}</li>
              ),
            )}
          </ul>
        </div>
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
            {issueExplanations.map(
              ({ issue, explanation }) => (
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

                <details className="compliance-transparency">
                  <summary>
                    Regel, Daten und Berechnung
                  </summary>

                  <div className="compliance-transparency-body">
                    <div className="compliance-rule-summary">
                      <span>
                        {explanation.rule.category}
                      </span>
                      <strong>
                        {explanation.rule.title}
                      </strong>
                      <p>
                        {
                          explanation.rule
                            .summary
                        }
                      </p>
                    </div>

                    <div className="compliance-explanation-grid">
                      <section>
                        <span>Schweregrad</span>
                        <p>
                          {
                            explanation
                              .severityExplanation
                          }
                        </p>
                      </section>

                      <section>
                        <span>Geltungsbereich</span>
                        <p>
                          {explanation.rule.scope}
                        </p>
                      </section>
                    </div>

                    <section className="compliance-source-section">
                      <span>Verwendete Eingangsdaten</span>
                      <dl className="compliance-source-data">
                        {explanation.sourceData.map(
                          (datum) => (
                            <div key={datum.label}>
                              <dt>{datum.label}</dt>
                              <dd>{datum.value}</dd>
                            </div>
                          ),
                        )}
                      </dl>
                    </section>

                    <section className="compliance-calculation-section">
                      <span>Berechnungsschritte</span>
                      <ol>
                        {explanation.rule.calculationSteps.map(
                          (step) => (
                            <li key={step}>{step}</li>
                          ),
                        )}
                      </ol>
                    </section>

                    {explanation.rule.settings
                      .length > 0 && (
                      <section className="compliance-settings-section">
                        <span>Prüfwerte</span>
                        <dl className="compliance-source-data">
                          {explanation.rule.settings.map(
                            (setting) => (
                              <div key={setting.label}>
                                <dt>
                                  {setting.label}
                                </dt>
                                <dd>
                                  <strong>
                                    {
                                      setting.value
                                    }
                                  </strong>
                                  {
                                    setting.description
                                  }
                                </dd>
                              </div>
                            ),
                          )}
                        </dl>
                      </section>
                    )}

                    <section className="compliance-reference-section">
                      <span>Regelgrundlage</span>
                      <div className="compliance-reference-list">
                        {explanation.rule.references.map(
                          (reference) =>
                            reference.url ? (
                              <a
                                className={getReferenceClassName(
                                  reference.type,
                                )}
                                href={reference.url}
                                key={reference.label}
                                rel="noreferrer"
                                target="_blank"
                              >
                                {reference.label}
                              </a>
                            ) : (
                              <span
                                className={getReferenceClassName(
                                  reference.type,
                                )}
                                key={reference.label}
                              >
                                {reference.label}
                              </span>
                            ),
                        )}
                      </div>
                    </section>

                    <section className="compliance-limits-section">
                      <span>Dokumentierte Grenzen</span>
                      <ul>
                        {explanation.rule.limitations.map(
                          (limit) => (
                            <li key={limit}>{limit}</li>
                          ),
                        )}
                      </ul>
                    </section>
                  </div>
                </details>
              </article>
              ),
            )}
          </div>
        </section>
      )}
    </section>
  );
}
