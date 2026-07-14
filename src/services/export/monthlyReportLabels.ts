import type {
  ComplianceIssue,
  Shift,
} from "../../types/index";

export const monthlyReportLabels = {
  title: "CareCheck TVöD Monatsbericht",
  fields: {
    month: "Monat",
    federalState: "Bundesland",
    weeklyHours: "Wochenarbeitszeit",
    payGroup: "TVöD-P Gruppe",
    payLevel: "Stufe",
  },
  sections: {
    overview: "Übersicht",
    workingTime: "Arbeitszeit",
    planning: "Monatsplanung",
    premiums: "Zuschläge",
    compliance: "Prüfhinweise",
    calculationBasis: "Berechnungsgrundlagen",
    calendarEntries: "Kalendereinträge",
  },
  workingTime: {
    targetHours: "Sollstunden",
    actualHours: "Iststunden",
    balance: "Saldo",
    overtime: "Überstunden",
    undertime: "Unterstunden",
    workingDays: "Soll-Arbeitstage",
    holidays: "Feiertage",
    holidayReduction: "Feiertagsabzug",
    averageDailyHours:
      "Durchschnittliche tägliche Sollzeit",
  },
  planning: {
    workShifts: "Arbeitsdienste",
    planningEntries: "Planungseinträge",
    plannedDays: "Planungstage",
    calendarEntries: "Kalendereinträge",
    vacationDays: "Urlaubstage",
    sickDays: "Krankheitstage",
    vacationHours: "Urlaubsstunden",
    sickHours: "Krankstunden",
    absenceHours: "Abwesenheitsstunden",
    trainingDays: "Fortbildungstage",
    freeDays: "Frei-Tage",
    complianceRelevantEntries:
      "Compliance-relevante Einträge",
  },
  tables: {
    premiums: [
      "Art",
      "Stunden",
      "Prozent",
      "Betrag",
    ],
    compliance: [
      "Schweregrad",
      "Titel",
      "Beschreibung",
    ],
    calendarEntries: [
      "Datum",
      "Eintragsart",
      "Zeit",
      "Pause",
      "Stunden",
      "Stundenquelle",
      "Notiz",
    ],
  },
  totals: {
    premiums: "Summe Zuschläge",
  },
  emptyStates: {
    premiums:
      "Keine zuschlagspflichtigen Zeiten erkannt",
    compliance: "Keine Auffälligkeiten",
    complianceReport:
      "Keine Auffälligkeiten gefunden.",
    calendarEntries: "Keine Kalendereinträge",
    calendarEntriesReport:
      "Keine Kalendereinträge erfasst.",
  },
} as const;

export const monthlyReportShiftLabels: Record<
  Shift["type"],
  string
> = {
  EARLY: "Frühdienst",
  LATE: "Spätdienst",
  NIGHT: "Nachtdienst",
  DAY: "Tagdienst",
  TRAINING: "Fortbildung",
  VACATION: "Urlaub",
  SICK: "Krank",
  FREE: "Frei",
  CUSTOM: "Individuell",
};

export const monthlyReportSeverityLabels: Record<
  ComplianceIssue["severity"],
  string
> = {
  info: "Info",
  warning: "Warnung",
  critical: "Kritisch",
};
