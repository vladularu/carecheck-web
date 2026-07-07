import Button from "../ui/Button";

interface CalendarHeaderProps {
  monthLabel: string;
  onPrevious: () => void;
  onNext: () => void;
}

export default function CalendarHeader({
  monthLabel,
  onPrevious,
  onNext,
}: CalendarHeaderProps) {
  return (
    <div className="calendar-header">
      <Button variant="secondary" onClick={onPrevious}>
        ◀
      </Button>

      <h2>{monthLabel}</h2>

      <Button variant="secondary" onClick={onNext}>
        ▶
      </Button>
    </div>
  );
}