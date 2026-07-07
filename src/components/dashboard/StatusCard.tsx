import Card from "../ui/Card";

export default function StatusCard() {
  return (
    <Card>
      <span className="card-label">Prüfstatus</span>
      <strong className="status-title">🟢 Keine Prüfung aktiv</strong>
      <p>
        Arbeitszeitgesetz und TVöD-Regeln werden in späteren Releases ergänzt.
      </p>
    </Card>
  );
}