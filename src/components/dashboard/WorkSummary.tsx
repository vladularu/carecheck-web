import Card from "../ui/Card";
import StatCard from "../ui/StatCard";

interface WorkSummaryProps {
  actualHours: number;
  targetHours: number;
  balanceHours: number;
  remainingHours: number;
  overtimeHours: number;
  progress: number;

  workingDayCount: number;
  publicHolidayCount: number;
  holidayReductionHours: number;
  averageDailyHours: number;
}

export default function WorkSummary({
  actualHours,
  targetHours,
  balanceHours,
  remainingHours,
  overtimeHours,
  progress,
  workingDayCount,
  publicHolidayCount,
  holidayReductionHours,
  averageDailyHours,
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

      <div className="work-grid">
        <StatCard label="Arbeitstage" value={workingDayCount} />
        <StatCard label="Feiertage" value={publicHolidayCount} />
        <StatCard
          label="Feiertagsabzug"
          value={`${holidayReductionHours} h`}
          helper={`${averageDailyHours} h je Arbeitstag`}
        />
      </div>
    </Card>
  );
}