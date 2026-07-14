import type { MonthlyReportExportPreview } from "../../services/export/monthlyReportExportPreview";

interface ExportPreviewSummaryProps {
  preview: MonthlyReportExportPreview;
  className?: string;
}

function formatHours(value: number): string {
  const formatted = new Intl.NumberFormat(
    "de-DE",
    {
      minimumFractionDigits:
        value % 1 === 0 ? 0 : 2,
      maximumFractionDigits: 2,
    },
  ).format(value);

  return value > 0
    ? `+${formatted} h`
    : `${formatted} h`;
}

function formatEuro(value: number | null): string {
  if (value === null) {
    return "Nicht berechnet";
  }

  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
  }).format(value);
}

function formatIssueSummary(
  preview: MonthlyReportExportPreview,
): string {
  if (preview.complianceIssueCount === 0) {
    return "0 Hinweise";
  }

  if (preview.criticalIssueCount > 0) {
    return `${preview.complianceIssueCount} Hinweise, ${preview.criticalIssueCount} kritisch`;
  }

  if (preview.warningIssueCount > 0) {
    return `${preview.complianceIssueCount} Hinweise, ${preview.warningIssueCount} Warnungen`;
  }

  return `${preview.complianceIssueCount} Hinweise`;
}

export default function ExportPreviewSummary({
  preview,
  className = "",
}: ExportPreviewSummaryProps) {
  const wrapperClassName = [
    "export-preview",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={wrapperClassName}
      aria-label="Exportvorschau"
    >
      <div className="export-preview-item">
        <span>Monat</span>
        <strong>
          {preview.displayMonthLabel}
        </strong>
      </div>

      <div className="export-preview-item">
        <span>Status</span>
        <strong
          className={`export-preview-status export-preview-status-${preview.status}`}
        >
          {preview.statusLabel}
        </strong>
      </div>

      <div className="export-preview-item">
        <span>Kalendereinträge</span>
        <strong>
          {preview.calendarEntryCount}
        </strong>
      </div>

      <div className="export-preview-item">
        <span>Arbeitsdienste</span>
        <strong>{preview.workShiftCount}</strong>
      </div>

      <div className="export-preview-item">
        <span>Prüfhinweise</span>
        <strong>
          {formatIssueSummary(preview)}
        </strong>
      </div>

      <div className="export-preview-item">
        <span>Saldo</span>
        <strong>
          {formatHours(preview.balanceHours)}
        </strong>
      </div>

      <div className="export-preview-item">
        <span>Zuschläge</span>
        <strong>
          {formatEuro(
            preview.totalPremiumAmount,
          )}
        </strong>
      </div>

      <div className="export-preview-item export-preview-file">
        <span>Dateibasis</span>
        <strong>{preview.fileBaseName}</strong>
      </div>
    </div>
  );
}
