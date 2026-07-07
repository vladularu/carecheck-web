interface CalendarHeaderProps {
  monthLabel: string;
}

export default function CalendarHeader({ monthLabel }: CalendarHeaderProps) {
  return (
    <div className="calendar-header">
      <h2>{monthLabel}</h2>
    </div>
  );
}