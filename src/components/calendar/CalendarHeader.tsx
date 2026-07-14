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
      <Button
        aria-label="Vorheriger Monat"
        className="calendar-nav-button"
        variant="secondary"
        onClick={onPrevious}
      >
        {"<"}
      </Button>

      <h2>{monthLabel}</h2>

      <Button
        aria-label="Nächster Monat"
        className="calendar-nav-button"
        variant="secondary"
        onClick={onNext}
      >
        {">"}
      </Button>
    </div>
  );
}
