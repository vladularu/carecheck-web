import Button from "../ui/Button";
import Card from "../ui/Card";

interface ExportCardProps {
  onExportCsv: () => void;
  onOpenReport: () => void;
}

export default function ExportCard({
  onExportCsv,
  onOpenReport,
}: ExportCardProps) {
  return (
    <Card>
      <span className="card-label">Export</span>
      <strong className="status-title">Monatsbericht</strong>

      <p>
        Exportiert den ausgewählten Monat als CSV für Excel oder öffnet eine
        druckbare PDF-Ansicht.
      </p>

      <div className="export-actions">
        <Button type="button" onClick={onExportCsv}>
          CSV für Excel exportieren
        </Button>

        <Button type="button" variant="secondary" onClick={onOpenReport}>
          PDF-/Druckansicht öffnen
        </Button>
      </div>
    </Card>
  );
}