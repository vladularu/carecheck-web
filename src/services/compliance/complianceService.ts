import type {
  ComplianceIssue,
  Shift,
} from "../../types/index";
import { isComplianceRelevant } from "../calculation/shiftTypeRules";
import {
  calculateGrossHours,
  calculateNetHours,
} from "../calculation/workingTimeCalculator";

function createDateTime(
  dateKey: string,
  time: string,
): Date {
  const [year, month, day] = dateKey
    .split("-")
    .map(Number);

  const [hour, minute] = time
    .split(":")
    .map(Number);

  return new Date(
    year,
    month - 1,
    day,
    hour,
    minute,
    0,
    0,
  );
}

function getShiftStart(shift: Shift): Date {
  return createDateTime(
    shift.date,
    shift.startTime,
  );
}

function getShiftEnd(shift: Shift): Date {
  const start = getShiftStart(shift);

  const end = createDateTime(
    shift.date,
    shift.endTime,
  );

  if (end <= start) {
    end.setDate(end.getDate() + 1);
  }

  return end;
}

function roundToTwoDecimals(
  value: number,
): number {
  return Math.round(value * 100) / 100;
}

function hoursBetween(
  start: Date,
  end: Date,
): number {
  const difference =
    end.getTime() - start.getTime();

  return roundToTwoDecimals(
    difference / 1000 / 60 / 60,
  );
}

function formatDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(
    date.getMonth() + 1,
  ).padStart(2, "0")}-${String(
    date.getDate(),
  ).padStart(2, "0")}`;
}

function formatDateGerman(
  dateKey: string,
): string {
  const [year, month, day] =
    dateKey.split("-");

  return `${day}.${month}.${year}`;
}

function formatShiftLabel(
  shift: Shift,
): string {
  return `${formatDateGerman(
    shift.date,
  )} ${shift.startTime}–${shift.endTime}`;
}

function sortShifts(
  shifts: Shift[],
): Shift[] {
  return [...shifts].sort((a, b) =>
    `${a.date}${a.startTime}`.localeCompare(
      `${b.date}${b.startTime}`,
    ),
  );
}

function createIssue(
  severity: ComplianceIssue["severity"],
  title: string,
  description: string,
  relatedShiftId?: string,
): ComplianceIssue {
  return {
    id: crypto.randomUUID(),
    severity,
    title,
    description,
    relatedShiftId,
  };
}

function checkTimePlausibility(
  shift: Shift,
): ComplianceIssue[] {
  if (!isComplianceRelevant(shift)) {
    return [];
  }

  const issues: ComplianceIssue[] = [];

  if (shift.startTime === shift.endTime) {
    issues.push(
      createIssue(
        "critical",
        "Dienstbeginn und Dienstende identisch",
        `${formatShiftLabel(
          shift,
        )} hat dieselbe Beginn- und Endzeit. Der Dienst würde technisch als 24-Stunden-Dienst interpretiert. Zeitangaben prüfen.`,
        shift.id,
      ),
    );

    return issues;
  }

  if (shift.breakMinutes < 0) {
    issues.push(
      createIssue(
        "critical",
        "Negativer Pausenwert",
        `${formatShiftLabel(
          shift,
        )} enthält einen negativen Pausenwert von ${shift.breakMinutes} Minuten. Die Pause muss mindestens 0 Minuten betragen.`,
        shift.id,
      ),
    );
  }

  const grossHours =
    calculateGrossHours(shift);

  const grossMinutes =
    Math.round(grossHours * 60);

  if (
    shift.breakMinutes > grossMinutes
  ) {
    issues.push(
      createIssue(
        "critical",
        "Pause länger als Dienstzeit",
        `${formatShiftLabel(
          shift,
        )} hat ${grossMinutes} Minuten Brutto-Dienstzeit, aber ${shift.breakMinutes} Minuten Pause. Die Pausenzeit darf nicht länger als die gesamte Dienstzeit sein.`,
        shift.id,
      ),
    );
  }

  if (grossHours > 16) {
    issues.push(
      createIssue(
        "critical",
        "Ungewöhnlich lange Dienstzeit",
        `${formatShiftLabel(
          shift,
        )} umfasst ${grossHours} Stunden Bruttozeit. Dienste über 16 Stunden sind unplausibel und sollten auf fehlerhafte Zeitangaben geprüft werden.`,
        shift.id,
      ),
    );
  }

  return issues;
}

interface DailyWorkingTimeGroup {
  dateKey: string;
  shifts: Shift[];
  totalNetHours: number;
  recordedBreakMinutes: number;
  qualifyingGapMinutes: number;
}

function minutesBetween(
  start: Date,
  end: Date,
): number {
  const difference =
    end.getTime() - start.getTime();

  return Math.max(
    0,
    Math.round(
      difference / 1000 / 60,
    ),
  );
}

function calculateQualifyingGapMinutes(
  shifts: Shift[],
): number {
  if (shifts.length < 2) {
    return 0;
  }

  const sortedShifts =
    [...shifts].sort(
      (firstShift, secondShift) =>
        getShiftStart(
          firstShift,
        ).getTime() -
        getShiftStart(
          secondShift,
        ).getTime(),
    );

  let qualifyingGapMinutes = 0;

  for (
    let index = 1;
    index < sortedShifts.length;
    index++
  ) {
    const previousShift =
      sortedShifts[index - 1];

    const currentShift =
      sortedShifts[index];

    const gapMinutes =
      minutesBetween(
        getShiftEnd(previousShift),
        getShiftStart(currentShift),
      );

    /*
     * Nach § 4 ArbZG können Pausen grundsätzlich
     * nur in Abschnitten von mindestens
     * 15 Minuten berücksichtigt werden.
     */
    if (gapMinutes >= 15) {
      qualifyingGapMinutes +=
        gapMinutes;
    }
  }

  return qualifyingGapMinutes;
}

function createDailyWorkingTimeGroups(
  shifts: Shift[],
): DailyWorkingTimeGroup[] {
  const shiftsByDate =
    new Map<string, Shift[]>();

  for (
    const shift of
    shifts.filter(isComplianceRelevant)
  ) {
    /*
     * Identische Beginn- und Endzeit wird bereits
     * als unplausible Eingabe gemeldet.
     *
     * Der Dienst darf deshalb nicht technisch als
     * 24-Stunden-Dienst in die Tagessummen
     * einfließen.
     */
    if (
      shift.startTime ===
      shift.endTime
    ) {
      continue;
    }

    const currentShifts =
      shiftsByDate.get(shift.date) ?? [];

    shiftsByDate.set(
      shift.date,
      [...currentShifts, shift],
    );
  }

  return Array.from(
    shiftsByDate.entries(),
  )
    .sort(
      ([firstDate], [secondDate]) =>
        firstDate.localeCompare(
          secondDate,
        ),
    )
    .map(([dateKey, dayShifts]) => {
      const sortedDayShifts =
        [...dayShifts].sort(
          (firstShift, secondShift) =>
            getShiftStart(
              firstShift,
            ).getTime() -
            getShiftStart(
              secondShift,
            ).getTime(),
        );

      const totalNetHours =
        roundToTwoDecimals(
          sortedDayShifts.reduce(
            (total, shift) =>
              total +
              calculateNetHours(shift),
            0,
          ),
        );

      const recordedBreakMinutes =
        sortedDayShifts.reduce(
          (total, shift) =>
            total +
            Math.max(
              0,
              shift.breakMinutes,
            ),
          0,
        );

      const qualifyingGapMinutes =
        calculateQualifyingGapMinutes(
          sortedDayShifts,
        );

      return {
        dateKey,
        shifts: sortedDayShifts,
        totalNetHours,
        recordedBreakMinutes,
        qualifyingGapMinutes,
      };
    });
}

function checkDailyWorkingTime(
  shifts: Shift[],
): ComplianceIssue[] {
  const workingTimeGroups =
    createDailyWorkingTimeGroups(
      shifts,
    );

  const issues: ComplianceIssue[] = [];

  for (
    const group of
    workingTimeGroups
  ) {
    const relatedShift =
      group.shifts[
        group.shifts.length - 1
      ];

    const entryLabel =
      group.shifts.length === 1
        ? "Eintrag"
        : "Einträge";

    if (group.totalNetHours > 10) {
      issues.push(
        createIssue(
          "critical",
          "Tagesarbeitszeit über 10 Stunden",
          `Am ${formatDateGerman(
            group.dateKey,
          )} ergeben ${
            group.shifts.length
          } compliance-relevante ${entryLabel} insgesamt ${
            group.totalNetHours
          } h Nettoarbeitszeit. Das überschreitet die übliche 10-Stunden-Grenze.`,
          relatedShift.id,
        ),
      );

      continue;
    }

    if (group.totalNetHours > 8) {
      issues.push(
        createIssue(
          "warning",
          "Tagesarbeitszeit über 8 Stunden",
          `Am ${formatDateGerman(
            group.dateKey,
          )} ergeben ${
            group.shifts.length
          } compliance-relevante ${entryLabel} insgesamt ${
            group.totalNetHours
          } h Nettoarbeitszeit. Ausgleichszeitraum prüfen.`,
          relatedShift.id,
        ),
      );
    }
  }

  return issues;
}

function checkDailyBreakRequirements(
  shifts: Shift[],
): ComplianceIssue[] {
  const workingTimeGroups =
    createDailyWorkingTimeGroups(
      shifts,
    );

  const issues: ComplianceIssue[] = [];

  for (
    const group of
    workingTimeGroups
  ) {
    let requiredBreakMinutes = 0;

    if (group.totalNetHours > 9) {
      requiredBreakMinutes = 45;
    } else if (
      group.totalNetHours > 6
    ) {
      requiredBreakMinutes = 30;
    }

    if (requiredBreakMinutes === 0) {
      continue;
    }

    const missingRecordedBreakMinutes =
      Math.max(
        0,
        requiredBreakMinutes -
          group.recordedBreakMinutes,
      );

    if (
      missingRecordedBreakMinutes === 0
    ) {
      continue;
    }

    /*
     * Eine zeitliche Lücke zwischen zwei Einträgen
     * kann technisch erkannt werden. CareCheck kann
     * aber nicht feststellen, ob diese Unterbrechung
     * im Voraus feststand, vollständig arbeitsfrei war
     * und frei genutzt werden konnte.
     *
     * Deshalb wird eine solche Lücke höchstens bis
     * zur noch fehlenden gesetzlichen Mindestpause
     * angerechnet und zusätzlich als fachlich zu
     * bestätigender Pausenstatus gemeldet.
     */
    const creditedGapMinutes = Math.min(
      group.qualifyingGapMinutes,
      missingRecordedBreakMinutes,
    );

    const creditedBreakMinutes =
      group.recordedBreakMinutes +
      creditedGapMinutes;

    const relatedShift =
      group.shifts[
        group.shifts.length - 1
      ];

    const entryDescription =
      group.shifts.length === 1
        ? "ein compliance-relevanter Eintrag"
        : `${group.shifts.length} compliance-relevante Einträge`;

    if (
      creditedBreakMinutes <
      requiredBreakMinutes
    ) {
      issues.push(
        createIssue(
          "critical",
          "Pause zu kurz",
          `Am ${formatDateGerman(
            group.dateKey,
          )} ergeben ${entryDescription} insgesamt ${
            group.totalNetHours
          } h Nettoarbeitszeit. Hinterlegt sind ${
            group.recordedBreakMinutes
          } Minuten Pause. Zusätzlich wurden ${
            group.qualifyingGapMinutes
          } Minuten zeitliche Unterbrechung von mindestens 15 Minuten zwischen Einträgen erkannt. Davon können für diese Mindestprüfung höchstens ${
            creditedGapMinutes
          } Minuten berücksichtigt werden. Erforderlich sind mindestens ${requiredBreakMinutes} Minuten.`,
          relatedShift.id,
        ),
      );

      continue;
    }

    issues.push(
      createIssue(
        "warning",
        "Unterbrechung als Pause prüfen",
        `Am ${formatDateGerman(
          group.dateKey,
        )} reichen die hinterlegten ${
          group.recordedBreakMinutes
        } Minuten Pause allein nicht aus. Zwischen den Einträgen wurden ${
          group.qualifyingGapMinutes
        } Minuten Unterbrechung von mindestens 15 Minuten erkannt; für die Mindestprüfung werden davon ${
          creditedGapMinutes
        } Minuten berücksichtigt. Bitte bestätigen, dass diese Unterbrechung im Voraus feststand, arbeitsfrei war und frei genutzt werden konnte.`,
        relatedShift.id,
      ),
    );
  }

  return issues;
}


interface ContinuousWorkBlock {
  start: Date;
  end: Date;
  firstShift: Shift;
  lastShift: Shift;
}

function checkContinuousWorkWithoutDocumentedBreak(
  shifts: Shift[],
): ComplianceIssue[] {
  const sortedShifts = sortShifts(
    shifts.filter(isComplianceRelevant),
  ).filter(
    (shift) =>
      shift.startTime !== shift.endTime,
  );

  const issues: ComplianceIssue[] = [];

  let currentBlock:
    | ContinuousWorkBlock
    | null = null;

  function evaluateCurrentBlock(): void {
    if (!currentBlock) {
      return;
    }

    const durationMinutes =
      minutesBetween(
        currentBlock.start,
        currentBlock.end,
      );

    if (durationMinutes <= 360) {
      return;
    }

    const durationHours =
      roundToTwoDecimals(
        durationMinutes / 60,
      );

    const blockDescription =
      currentBlock.firstShift.id ===
      currentBlock.lastShift.id
        ? `${formatShiftLabel(
            currentBlock.firstShift,
          )} umfasst ${durationHours} Stunden ohne dokumentierte Ruhepause von mindestens 15 Minuten.`
        : `Zwischen dem Beginn von ${formatShiftLabel(
            currentBlock.firstShift,
          )} und dem Ende von ${formatShiftLabel(
            currentBlock.lastShift,
          )} liegen ${durationHours} Stunden ohne dokumentierte Ruhepause von mindestens 15 Minuten.`;

    issues.push(
      createIssue(
        "critical",
        "Mehr als 6 Stunden ohne dokumentierte Pause",
        `${blockDescription} Nach § 4 ArbZG darf nicht länger als sechs Stunden hintereinander ohne Ruhepause gearbeitet werden.`,
        currentBlock.lastShift.id,
      ),
    );
  }

  for (const shift of sortedShifts) {
    /*
     * Ab 15 hinterlegten Pausenminuten kann eine
     * gesetzlich relevante Pausenunterbrechung
     * vorhanden sein. Da die genaue Pausenlage im
     * aktuellen Datenmodell nicht gespeichert wird,
     * endet hier die sicher feststellbare
     * ununterbrochene Arbeitsphase.
     */
    if (shift.breakMinutes >= 15) {
      evaluateCurrentBlock();
      currentBlock = null;
      continue;
    }

    const shiftStart =
      getShiftStart(shift);

    const shiftEnd =
      getShiftEnd(shift);

    if (!currentBlock) {
      currentBlock = {
        start: shiftStart,
        end: shiftEnd,
        firstShift: shift,
        lastShift: shift,
      };

      continue;
    }

    const gapMinutes =
      minutesBetween(
        currentBlock.end,
        shiftStart,
      );

    /*
     * Eine Unterbrechung ab 15 Minuten kann eine
     * Ruhepause darstellen. Kürzere Lücken und
     * Überschneidungen unterbrechen den bekannten
     * Arbeitsblock nicht.
     */
    if (gapMinutes >= 15) {
      evaluateCurrentBlock();

      currentBlock = {
        start: shiftStart,
        end: shiftEnd,
        firstShift: shift,
        lastShift: shift,
      };

      continue;
    }

    if (
      shiftEnd.getTime() >
      currentBlock.end.getTime()
    ) {
      currentBlock.end = shiftEnd;
    }

    currentBlock.lastShift = shift;
  }

  evaluateCurrentBlock();

  return issues;
}

interface WorkingDayBoundary {
  dateKey: string;
  firstStart: Date;
  lastEnd: Date;
  firstShift: Shift;
  lastEndingShift: Shift;
}

function createWorkingDayBoundaries(
  shifts: Shift[],
): WorkingDayBoundary[] {
  const shiftsByDate =
    new Map<string, Shift[]>();

  for (
    const shift of
    shifts.filter(isComplianceRelevant)
  ) {
    /*
     * Identische Beginn- und Endzeit wird bereits
     * als unplausible Eingabe gemeldet. Für eine
     * Ruhezeitberechnung wäre die technische
     * 24-Stunden-Interpretation irreführend.
     */
    if (
      shift.startTime ===
      shift.endTime
    ) {
      continue;
    }

    const current =
      shiftsByDate.get(shift.date) ?? [];

    shiftsByDate.set(
      shift.date,
      [...current, shift],
    );
  }

  return Array.from(
    shiftsByDate.entries(),
  )
    .map(([dateKey, dayShifts]) => {
      const sortedByStart =
        [...dayShifts].sort(
          (firstShift, secondShift) =>
            getShiftStart(
              firstShift,
            ).getTime() -
            getShiftStart(
              secondShift,
            ).getTime(),
        );

      const sortedByEnd =
        [...dayShifts].sort(
          (firstShift, secondShift) =>
            getShiftEnd(
              firstShift,
            ).getTime() -
            getShiftEnd(
              secondShift,
            ).getTime(),
        );

      const firstShift =
        sortedByStart[0];

      const lastEndingShift =
        sortedByEnd[
          sortedByEnd.length - 1
        ];

      return {
        dateKey,
        firstStart:
          getShiftStart(firstShift),
        lastEnd:
          getShiftEnd(
            lastEndingShift,
          ),
        firstShift,
        lastEndingShift,
      };
    })
    .sort(
      (firstDay, secondDay) =>
        firstDay.firstStart.getTime() -
        secondDay.firstStart.getTime(),
    );
}

function checkRestTimes(
  shifts: Shift[],
): ComplianceIssue[] {
  const workingDays =
    createWorkingDayBoundaries(shifts);

  const issues: ComplianceIssue[] = [];

  for (
    let index = 0;
    index < workingDays.length - 1;
    index++
  ) {
    const currentDay =
      workingDays[index];

    const nextDay =
      workingDays[index + 1];

    const restHours = hoursBetween(
      currentDay.lastEnd,
      nextDay.firstStart,
    );

    if (restHours < 10) {
      issues.push(
        createIssue(
          "critical",
          "Ruhezeit unter 10 Stunden",
          `Zwischen ${formatShiftLabel(
            currentDay.lastEndingShift,
          )} und ${formatShiftLabel(
            nextDay.firstShift,
          )} liegen nur ${restHours} h Ruhezeit. Auch im Krankenhaus- und Pflegebereich ist das kritisch.`,
          nextDay.firstShift.id,
        ),
      );

      continue;
    }

    if (restHours < 11) {
      issues.push(
        createIssue(
          "warning",
          "Ruhezeit unter 11 Stunden",
          `Zwischen ${formatShiftLabel(
            currentDay.lastEndingShift,
          )} und ${formatShiftLabel(
            nextDay.firstShift,
          )} liegen ${restHours} h Ruhezeit. Im Krankenhaus- und Pflegebereich kann eine Verkürzung auf mindestens 10 Stunden möglich sein, wenn innerhalb eines Monats oder innerhalb von vier Wochen ein Ausgleich durch eine Ruhezeit von mindestens 12 Stunden erfolgt.`,
          nextDay.firstShift.id,
        ),
      );
    }
  }

  return issues;
}

function startOfDay(date: Date): Date {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  );
}

function addDays(
  date: Date,
  days: number,
): Date {
  const result = new Date(date);

  result.setDate(
    result.getDate() + days,
  );

  return result;
}

function getWeekendStartDate(
  date: Date,
): Date | null {
  const day = date.getDay();

  if (day === 6) {
    return startOfDay(date);
  }

  if (day === 0) {
    return addDays(
      startOfDay(date),
      -1,
    );
  }

  return null;
}

function getWeekendKeysForShift(
  shift: Shift,
): string[] {
  const start = getShiftStart(shift);
  const end = getShiftEnd(shift);

  const weekendKeys =
    new Set<string>();

  let cursor = startOfDay(start);

  while (cursor < end) {
    const nextDay = addDays(
      cursor,
      1,
    );

    const overlapsDay =
      start < nextDay &&
      end > cursor;

    if (overlapsDay) {
      const weekendStart =
        getWeekendStartDate(cursor);

      if (weekendStart) {
        weekendKeys.add(
          formatDateKey(weekendStart),
        );
      }
    }

    cursor = nextDay;
  }

  return Array.from(weekendKeys);
}

function daysBetween(
  firstDate: Date,
  secondDate: Date,
): number {
  return Math.round(
    (secondDate.getTime() -
      firstDate.getTime()) /
      1000 /
      60 /
      60 /
      24,
  );
}

function dateFromDateKey(
  dateKey: string,
): Date {
  const [year, month, day] =
    dateKey
      .split("-")
      .map(Number);

  return new Date(
    year,
    month - 1,
    day,
  );
}

function checkConsecutiveWeekends(
  shifts: Shift[],
): ComplianceIssue[] {
  const workedShifts =
    sortShifts(shifts).filter(
      isComplianceRelevant,
    );

  const weekendShifts =
    new Map<string, Shift[]>();

  const issues: ComplianceIssue[] = [];

  for (const shift of workedShifts) {
    const weekendKeys =
      getWeekendKeysForShift(shift);

    for (
      const weekendKey of weekendKeys
    ) {
      const current =
        weekendShifts.get(
          weekendKey,
        ) ?? [];

      weekendShifts.set(
        weekendKey,
        [...current, shift],
      );
    }
  }

  const weekendKeys = Array.from(
    weekendShifts.keys(),
  ).sort();

  for (
    let index = 0;
    index < weekendKeys.length - 1;
    index++
  ) {
    const currentWeekendKey =
      weekendKeys[index];

    const nextWeekendKey =
      weekendKeys[index + 1];

    const currentDate =
      dateFromDateKey(
        currentWeekendKey,
      );

    const nextDate =
      dateFromDateKey(
        nextWeekendKey,
      );

    if (
      daysBetween(
        currentDate,
        nextDate,
      ) !== 7
    ) {
      continue;
    }

    const relatedShift =
      weekendShifts.get(
        nextWeekendKey,
      )?.[0];

    issues.push(
      createIssue(
        "warning",
        "Zwei Wochenenden in Folge gearbeitet",
        `Es wurden zwei aufeinanderfolgende Wochenenden gearbeitet: Wochenende ab ${formatDateGerman(
          currentWeekendKey,
        )} und Wochenende ab ${formatDateGerman(
          nextWeekendKey,
        )}. Prüfen, ob nach der Dienstplanregel jedes zweite Wochenende frei sein sollte.`,
        relatedShift?.id,
      ),
    );
  }

  return issues;
}

function createDuplicateKey(
  shift: Shift,
): string {
  return [
    shift.date,
    shift.startTime,
    shift.endTime,
    shift.breakMinutes,
    shift.type,
  ].join("|");
}

function checkDuplicateEntries(
  shifts: Shift[],
): ComplianceIssue[] {
  const seenEntries = new Map<string, Shift>();
  const issues: ComplianceIssue[] = [];

  for (const shift of sortShifts(shifts)) {
    const duplicateKey =
      createDuplicateKey(shift);

    const existingShift =
      seenEntries.get(duplicateKey);

    if (!existingShift) {
      seenEntries.set(
        duplicateKey,
        shift,
      );

      continue;
    }

    issues.push(
      createIssue(
        "critical",
        "Doppelter Kalendereintrag",
        `${formatShiftLabel(
          shift,
        )} wurde mehrfach mit derselben Eintragsart, Zeit und Pause erfasst.`,
        shift.id,
      ),
    );
  }

  return issues;
}

function areExactDuplicates(
  firstShift: Shift,
  secondShift: Shift,
): boolean {
  return (
    createDuplicateKey(firstShift) ===
    createDuplicateKey(secondShift)
  );
}

function shiftsOverlap(
  firstShift: Shift,
  secondShift: Shift,
): boolean {
  const firstStart =
    getShiftStart(firstShift);

  const firstEnd =
    getShiftEnd(firstShift);

  const secondStart =
    getShiftStart(secondShift);

  const secondEnd =
    getShiftEnd(secondShift);

  return (
    firstStart < secondEnd &&
    secondStart < firstEnd
  );
}

function checkShiftOverlaps(
  shifts: Shift[],
): ComplianceIssue[] {
  const sortedShifts = sortShifts(
    shifts.filter(
      isComplianceRelevant,
    ),
  );

  const issues: ComplianceIssue[] = [];

  for (
    let firstIndex = 0;
    firstIndex < sortedShifts.length;
    firstIndex++
  ) {
    const firstShift =
      sortedShifts[firstIndex];

    const firstEnd =
      getShiftEnd(firstShift);

    for (
      let secondIndex = firstIndex + 1;
      secondIndex < sortedShifts.length;
      secondIndex++
    ) {
      const secondShift =
        sortedShifts[secondIndex];

      const secondStart =
        getShiftStart(secondShift);

      if (secondStart >= firstEnd) {
        break;
      }

      if (
        areExactDuplicates(
          firstShift,
          secondShift,
        )
      ) {
        continue;
      }

      if (
        shiftsOverlap(
          firstShift,
          secondShift,
        )
      ) {
        issues.push(
          createIssue(
            "critical",
            "Dienste überschneiden sich",
            `${formatShiftLabel(
              firstShift,
            )} überschneidet sich mit ${formatShiftLabel(
              secondShift,
            )}. Zeiten und Einträge prüfen.`,
            secondShift.id,
          ),
        );
      }
    }
  }

  return issues;
}

function getUniqueWorkingDays(
  shifts: Shift[],
): Array<{
  dateKey: string;
  relatedShift: Shift;
}> {
  const shiftsByDate = new Map<string, Shift[]>();

  for (
    const shift of
    sortShifts(shifts).filter(
      isComplianceRelevant,
    )
  ) {
    const current =
      shiftsByDate.get(shift.date) ?? [];

    shiftsByDate.set(
      shift.date,
      [...current, shift],
    );
  }

  return Array.from(
    shiftsByDate.entries(),
  )
    .sort(([firstDate], [secondDate]) =>
      firstDate.localeCompare(secondDate),
    )
    .map(([dateKey, dayShifts]) => ({
      dateKey,
      relatedShift:
        dayShifts[dayShifts.length - 1],
    }));
}

function checkConsecutiveWorkingDays(
  shifts: Shift[],
): ComplianceIssue[] {
  const workingDays =
    getUniqueWorkingDays(shifts);

  const issues: ComplianceIssue[] = [];

  if (workingDays.length < 7) {
    return issues;
  }

  let streakStartIndex = 0;

  function evaluateStreak(
    streakEndIndex: number,
  ) {
    const streakLength =
      streakEndIndex -
      streakStartIndex +
      1;

    if (streakLength < 7) {
      return;
    }

    const firstWorkingDay =
      workingDays[streakStartIndex];

    const lastWorkingDay =
      workingDays[streakEndIndex];

    issues.push(
      createIssue(
        "warning",
        "Sieben oder mehr Arbeitstage in Folge",
        `Vom ${formatDateGerman(
          firstWorkingDay.dateKey,
        )} bis ${formatDateGerman(
          lastWorkingDay.dateKey,
        )} wurden ${streakLength} aufeinanderfolgende Arbeitstage erkannt. Dies ist ein Planungshinweis; Erholungszeiten und freie Tage prüfen.`,
        lastWorkingDay.relatedShift.id,
      ),
    );
  }

  for (
    let index = 1;
    index < workingDays.length;
    index++
  ) {
    const previousDate =
      dateFromDateKey(
        workingDays[index - 1].dateKey,
      );

    const currentDate =
      dateFromDateKey(
        workingDays[index].dateKey,
      );

    const difference =
      daysBetween(
        previousDate,
        currentDate,
      );

    if (difference === 1) {
      continue;
    }

    evaluateStreak(index - 1);
    streakStartIndex = index;
  }

  evaluateStreak(
    workingDays.length - 1,
  );

  return issues;
}

function checkLateToEarlySequences(
  shifts: Shift[],
): ComplianceIssue[] {
  const sortedShifts = sortShifts(
    shifts.filter(isComplianceRelevant),
  );

  const issues: ComplianceIssue[] = [];

  for (
    let index = 0;
    index < sortedShifts.length - 1;
    index++
  ) {
    const currentShift = sortedShifts[index];
    const nextShift = sortedShifts[index + 1];

    if (
      currentShift.type !== "LATE" ||
      nextShift.type !== "EARLY"
    ) {
      continue;
    }

    const currentDate =
      dateFromDateKey(currentShift.date);

    const nextDate =
      dateFromDateKey(nextShift.date);

    if (
      daysBetween(
        currentDate,
        nextDate,
      ) !== 1
    ) {
      continue;
    }

    const restHours = hoursBetween(
      getShiftEnd(currentShift),
      getShiftStart(nextShift),
    );

    /*
     * Unter 11 Stunden wird bereits durch die
     * Ruhezeitprüfung gemeldet. Dadurch vermeiden
     * wir eine doppelte Warnung.
     */
    if (restHours < 11) {
      continue;
    }

    issues.push(
      createIssue(
        "warning",
        "Ungünstige Dienstfolge Spät zu Früh",
        `Auf den Spätdienst ${formatShiftLabel(
          currentShift,
        )} folgt am nächsten Tag der Frühdienst ${formatShiftLabel(
          nextShift,
        )}. Die Ruhezeit beträgt ${restHours} Stunden. Die gesetzliche Mindestprüfung ist unauffällig, die kurze Vorwärtsrotation sollte planerisch dennoch geprüft werden.`,
        nextShift.id,
      ),
    );
  }

  return issues;
}

function getUniqueNightShiftDays(
  shifts: Shift[],
): Array<{
  dateKey: string;
  relatedShift: Shift;
}> {
  const nightShiftsByDate =
    new Map<string, Shift[]>();

  for (
    const shift of
    sortShifts(shifts).filter(
      (currentShift) =>
        currentShift.type === "NIGHT" &&
        isComplianceRelevant(currentShift),
    )
  ) {
    const current =
      nightShiftsByDate.get(
        shift.date,
      ) ?? [];

    nightShiftsByDate.set(
      shift.date,
      [...current, shift],
    );
  }

  return Array.from(
    nightShiftsByDate.entries(),
  )
    .sort(([firstDate], [secondDate]) =>
      firstDate.localeCompare(secondDate),
    )
    .map(([dateKey, dayShifts]) => ({
      dateKey,
      relatedShift:
        dayShifts[dayShifts.length - 1],
    }));
}

function checkConsecutiveNightShifts(
  shifts: Shift[],
): ComplianceIssue[] {
  const nightShiftDays =
    getUniqueNightShiftDays(shifts);

  const issues: ComplianceIssue[] = [];

  if (nightShiftDays.length < 4) {
    return issues;
  }

  let streakStartIndex = 0;

  function evaluateNightStreak(
    streakEndIndex: number,
  ) {
    const streakLength =
      streakEndIndex -
      streakStartIndex +
      1;

    if (streakLength < 4) {
      return;
    }

    const firstNight =
      nightShiftDays[streakStartIndex];

    const lastNight =
      nightShiftDays[streakEndIndex];

    issues.push(
      createIssue(
        "warning",
        "Vier oder mehr Nachtdienste in Folge",
        `Vom ${formatDateGerman(
          firstNight.dateKey,
        )} bis ${formatDateGerman(
          lastNight.dateKey,
        )} wurden ${streakLength} aufeinanderfolgende Nachtdienste erkannt. Belastung, Erholung und anschließende Dienstfolge prüfen.`,
        lastNight.relatedShift.id,
      ),
    );
  }

  for (
    let index = 1;
    index < nightShiftDays.length;
    index++
  ) {
    const previousDate =
      dateFromDateKey(
        nightShiftDays[index - 1].dateKey,
      );

    const currentDate =
      dateFromDateKey(
        nightShiftDays[index].dateKey,
      );

    if (
      daysBetween(
        previousDate,
        currentDate,
      ) === 1
    ) {
      continue;
    }

    evaluateNightStreak(index - 1);
    streakStartIndex = index;
  }

  evaluateNightStreak(
    nightShiftDays.length - 1,
  );

  return issues;
}

function checkRecoveryAfterNightSeries(
  shifts: Shift[],
): ComplianceIssue[] {
  const sortedShifts = sortShifts(
    shifts.filter(isComplianceRelevant),
  );

  const issues: ComplianceIssue[] = [];

  for (
    let index = 0;
    index < sortedShifts.length;
    index++
  ) {
    const firstNight = sortedShifts[index];

    if (firstNight.type !== "NIGHT") {
      continue;
    }

    let lastNightIndex = index;

    while (
      lastNightIndex + 1 <
      sortedShifts.length
    ) {
      const currentNight =
        sortedShifts[lastNightIndex];

      const possibleNextNight =
        sortedShifts[lastNightIndex + 1];

      if (
        possibleNextNight.type !== "NIGHT"
      ) {
        break;
      }

      const currentDate =
        dateFromDateKey(
          currentNight.date,
        );

      const nextDate =
        dateFromDateKey(
          possibleNextNight.date,
        );

      if (
        daysBetween(
          currentDate,
          nextDate,
        ) !== 1
      ) {
        break;
      }

      lastNightIndex++;
    }

    const nightSeriesLength =
      lastNightIndex - index + 1;

    if (nightSeriesLength < 2) {
      continue;
    }

    const nextShift =
      sortedShifts[lastNightIndex + 1];

    if (!nextShift) {
      break;
    }

    if (
      nextShift.type !== "EARLY" &&
      nextShift.type !== "DAY"
    ) {
      index = lastNightIndex;
      continue;
    }

    const lastNight =
      sortedShifts[lastNightIndex];

    const restHours = hoursBetween(
      getShiftEnd(lastNight),
      getShiftStart(nextShift),
    );

    if (
      restHours >= 11 &&
      restHours < 24
    ) {
      issues.push(
        createIssue(
          "warning",
          "Kurze Erholung nach Nachtserie",
          `Nach ${nightSeriesLength} aufeinanderfolgenden Nachtdiensten endet die Nachtserie mit ${formatShiftLabel(
            lastNight,
          )}. Danach folgt ${formatShiftLabel(
            nextShift,
          )} mit nur ${restHours} Stunden Erholungszeit. Nach Nachtserien sollte eine längere Regenerationsphase planerisch geprüft werden.`,
          nextShift.id,
        ),
      );
    }

    index = lastNightIndex;
  }

  return issues;
}

export function checkCompliance(
  shifts: Shift[],
): ComplianceIssue[] {
  const complianceRelevantShifts =
    shifts.filter(
      isComplianceRelevant,
    );

  const issues: ComplianceIssue[] = [];

  issues.push(
    ...checkDuplicateEntries(shifts),
  );

  issues.push(
    ...checkShiftOverlaps(
      complianceRelevantShifts,
    ),
  );

  /*
   * Tagesarbeitszeit und Pausen werden als Summe
   * aller compliance-relevanten Einträge desselben
   * gespeicherten Kalendertages geprüft.
   */
  issues.push(
    ...checkDailyWorkingTime(
      complianceRelevantShifts,
    ),
  );

  issues.push(
    ...checkDailyBreakRequirements(
      complianceRelevantShifts,
    ),
  );

  issues.push(
    ...checkContinuousWorkWithoutDocumentedBreak(
      complianceRelevantShifts,
    ),
  );

  for (
    const shift of
    complianceRelevantShifts
  ) {
    issues.push(
      ...checkTimePlausibility(
        shift,
      ),
    );
  }

  issues.push(
    ...checkRestTimes(
      complianceRelevantShifts,
    ),
  );

  issues.push(
    ...checkConsecutiveWeekends(
      complianceRelevantShifts,
    ),
  );

  issues.push(
    ...checkConsecutiveWorkingDays(
      complianceRelevantShifts,
    ),
  );

  issues.push(
    ...checkLateToEarlySequences(
      complianceRelevantShifts,
    ),
  );

  issues.push(
    ...checkConsecutiveNightShifts(
      complianceRelevantShifts,
    ),
  );

  issues.push(
    ...checkRecoveryAfterNightSeries(
      complianceRelevantShifts,
    ),
  );

  return issues;
}