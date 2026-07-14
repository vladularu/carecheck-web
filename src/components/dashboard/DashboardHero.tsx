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
      <div className="dashboard-hero-brand-row">
        <span
          className="dashboard-brand-mark"
          aria-hidden="true"
        >
          <span />
          <span />
        </span>

        <span className="eyebrow">
          Monatscockpit
        </span>
      </div>

      <div>

        <h1>{monthLabel}</h1>

        <p>{profileLabel}</p>

        {absenceLabel && (
          <p>{absenceLabel}</p>
        )}
      </div>
    </div>
  );
}
