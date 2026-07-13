import Button from "../ui/Button";
import Card from "../ui/Card";

interface ExportCardProps {
  onExportCsv: () => void;
  onExportXlsx: () => Promise<void>;
  onOpenReport: () => void;
}

export default function ExportCard({
  onExportCsv,
  onExportXlsx,
  onOpenReport,
}: ExportCardProps) {
  return (
    <Card>
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
