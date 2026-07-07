interface DashboardHeroProps {
  monthLabel: string;
  profileLabel: string;
}

export default function DashboardHero({
  monthLabel,
  profileLabel,
}: DashboardHeroProps) {
  return (
    <div className="dashboard-hero">
      <div>
        <span className="eyebrow">CareCheck TVöD</span>
        <h1>{monthLabel}</h1>
        <p>{profileLabel}</p>
      </div>
    </div>
  );
}