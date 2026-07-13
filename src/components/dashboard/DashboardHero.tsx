interface DashboardHeroProps {
  monthLabel: string;
  profileLabel: string;
  absenceLabel?: string;
}

export default function DashboardHero({
  monthLabel,
  profileLabel,
  absenceLabel,
}: DashboardHeroProps) {
  return (
    <div className="dashboard-hero">
      <div>
        <span className="eyebrow">
          CareCheck TVöD
        </span>

        <h1>{monthLabel}</h1>

        <p>{profileLabel}</p>

        {absenceLabel && (
          <p>{absenceLabel}</p>
        )}
      </div>
    </div>
  );
}
