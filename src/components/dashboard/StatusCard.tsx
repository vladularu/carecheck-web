import Card from "../ui/Card";

interface StatusCardProps {
  criticalCount: number;
  warningCount: number;
  issueCount: number;
  checkedShiftCount: number;
}

export default function StatusCard({
  criticalCount,
  warningCount,
  issueCount,
  checkedShiftCount,
}: StatusCardProps) {
  const statusClass =
    criticalCount > 0
      ? "dashboard-status-critical"
      : warningCount > 0
        ? "dashboard-status-warning"
        : "dashboard-status-ok";

  const statusText =
    criticalCount > 0
      ? "Kritische Hinweise vorhanden"
      : warningCount > 0
        ? "Warnungen vorhanden"
        : "Keine Auffälligkeiten";

  return (
    <Card
      className={`dashboard-status-card ${statusClass}`}
    >
      <span className="card-label">
        Prüfstatus
      </span>

      <strong className="status-title">
        <span
          className={`status-dot ${statusClass}`}
          aria-hidden="true"
        />
        {statusText}
      </strong>

      <div className="dashboard-status-grid">
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
          <strong>{checkedShiftCount}</strong>
        </div>
      </div>

      <p>
        {issueCount === 0
          ? "Für den ausgewählten Monat wurden keine Prüfhinweise erkannt."
          : `Für den ausgewählten Monat wurden ${issueCount} Prüfhinweis(e) erkannt.`}
      </p>
    </Card>
  );
}
