import type { MonthlyReportExportPreview } from "../../services/export/monthlyReportExportPreview";
import ExportPreviewSummary from "../report/ExportPreviewSummary";
import Button from "../ui/Button";
import Card from "../ui/Card";

interface ExportCardProps {
  preview: MonthlyReportExportPreview;
  onExportCsv: () => void;
  onExportXlsx: () => Promise<void>;
  onOpenReport: () => void;
}

export default function ExportCard({
  preview,
  onExportCsv,
  onExportXlsx,
  onOpenReport,
}: ExportCardProps) {
  return (
    <Card className="export-card">
      <span className="card-label">
        Export
      </span>

      <strong className="status-title">
        Monatsbericht
      </strong>

      <p>
        Exportiert den ausgewählten Monat inklusive
        Urlaubs- und Krankstunden als Excel-Datei,
        CSV-Datei oder druckbare PDF-Ansicht.
      </p>

      <ExportPreviewSummary
        preview={preview}
      />

      <div className="export-actions">
        <Button
          type="button"
          onClick={() => {
            void onExportXlsx();
          }}
        >
          Excel-Datei exportieren
        </Button>

        <Button
          type="button"
          variant="secondary"
          onClick={onExportCsv}
        >
          CSV exportieren
        </Button>

        <Button
          type="button"
          variant="secondary"
          onClick={onOpenReport}
        >
          PDF-/Druckansicht öffnen
        </Button>
      </div>
    </Card>
  );
}
