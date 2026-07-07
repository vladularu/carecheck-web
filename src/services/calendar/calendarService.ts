export interface CalendarDay {
  date: Date;
  dayNumber: number;
  currentMonth: boolean;
  weekend: boolean;
}

export type CalendarWeek = CalendarDay[];

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
      days.push({
        date: new Date(current),
        dayNumber: current.getDate(),
        currentMonth: current.getMonth() === month,
        weekend: current.getDay() === 0 || current.getDay() === 6,
      });

      current.setDate(current.getDate() + 1);
    }

    weeks.push(days);
  }

  return weeks;
}