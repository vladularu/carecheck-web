import Card from "../ui/Card";
import StatCard from "../ui/StatCard";

interface WorkSummaryProps {
  actualHours: number;
  targetHours: number;
  balanceHours: number;
  remainingHours: number;
  overtimeHours: number;
  progress: number;
}

export default function WorkSummary({
  actualHours,
  targetHours,
  balanceHours,
  remainingHours,
  overtimeHours,
  progress,
}: WorkSummaryProps) {
  return (
    <Card>
      <div className="work-card-header">
        <div>
          <span>Arbeitszeitkonto</span>
          <strong>
            {actualHours} / {targetHours} h
          </strong>
        </div>
        <div className="progress-number">{progress}%</div>
      </div>

      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${progress}%` }} />
      </div>

      <div className="work-grid">
        <StatCard label="Differenz" value={`${balanceHours} h`} />
        <StatCard label="Fehlend" value={`${remainingHours} h`} />
        <StatCard label="Überstunden" value={`${overtimeHours} h`} />
      </div>
    </Card>
  );
}