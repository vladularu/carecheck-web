import Button from "../ui/Button";
import Card from "../ui/Card";

interface ExportCardProps {
  onExportCsv: () => void;
}

export default function ExportCard({ onExportCsv }: ExportCardProps) {
  return (
    <Card>
      <span className="card-label">Export</span>
      <strong className="status-title">Monatsbericht</strong>

      <p>
        Exportiert den ausgewählten Monat als Excel-kompatible CSV-Datei mit
        Arbeitszeit, Zuschlägen, Prüfhinweisen und Diensten.
      </p>

      <div className="export-actions">
        <Button type="button" onClick={onExportCsv}>
          CSV für Excel exportieren
        </Button>
      </div>
    </Card>
  );
}