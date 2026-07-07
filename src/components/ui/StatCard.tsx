interface StatCardProps {
  label: string;
  value: string | number;
  helper?: string;
  highlight?: boolean;
}

export default function StatCard({
  label,
  value,
  helper,
  highlight = false,
}: StatCardProps) {
  return (
    <article className={highlight ? "ui-stat-card highlight" : "ui-stat-card"}>
      <span>{label}</span>
      <strong>{value}</strong>
      {helper && <p>{helper}</p>}
    </article>
  );
}