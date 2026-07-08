export interface CalendarDay {
  date: Date;
  dateKey: string;
  dayNumber: number;
  currentMonth: boolean;
  weekend: boolean;
}

export type CalendarWeek = CalendarDay[];

function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function startOfCalendar(year: number, month: number): Date {
  const firstDay = new Date(year, month, 1);
  const weekday = (firstDay.getDay() + 6) % 7;

  firstDay.setDate(firstDay.getDate() - weekday);

  return firstDay;
}

export function createCalendar(year: number, month: number): CalendarWeek[] {
  const start = startOfCalendar(year, month);
  const weeks: CalendarWeek[] = [];
  const current = new Date(start);

  for (let week = 0; week < 6; week++) {
    const days: CalendarDay[] = [];

    for (let day = 0; day < 7; day++) {
      const date = new Date(current);

      days.push({
        date,
        dateKey: formatDateKey(date),
        dayNumber: date.getDate(),
        currentMonth: date.getMonth() === month,
        weekend: date.getDay() === 0 || date.getDay() === 6,
      });

      current.setDate(current.getDate() + 1);
    }

    weeks.push(days);
  }

  return weeks;
}