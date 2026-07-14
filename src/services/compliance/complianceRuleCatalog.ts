import type {
  ComplianceIssue,
  Shift,
  ShiftType,
} from "../../types/index";
import {
  calculateGrossHours,
  calculateNetHours,
} from "../calculation/workingTimeCalculator";

type ComplianceSeverity =
  ComplianceIssue["severity"];

export type ComplianceRuleId =
  | "time-plausibility"
  | "daily-working-time"
  | "daily-break"
  | "continuous-work"
  | "rest-time"
  | "weekend-sequence"
  | "entry-integrity"
  | "consecutive-working-days"
  | "shift-sequence"
  | "night-series"
  | "night-recovery"
  | "manual-review";

export interface ComplianceRuleReference {
  label: string;
  url?: string;
  type: "law" | "internal";
}

export interface ComplianceRuleSetting {
  label: string;
  value: string;
  description: string;
}

export interface ComplianceRule {
  id: ComplianceRuleId;
  title: string;
  category: string;
  scope: string;
  summary: string;
  calculationSteps: string[];
  severityGuide: Record<
    ComplianceSeverity,
    string
  >;
  references: ComplianceRuleReference[];
  settings: ComplianceRuleSetting[];
  limitations: string[];
}

export interface ComplianceSourceDatum {
  label: string;
  value: string;
}

export interface ComplianceIssueExplanation {
  rule: ComplianceRule;
  severityExplanation: string;
  sourceData: ComplianceSourceDatum[];
}

const arbzgBaseUrl =
  "https://www.gesetze-im-internet.de/arbzg/";

const legalReferences = {
  definition: {
    label: "ArbZG § 2 - Begriffsbestimmungen",
    url: `${arbzgBaseUrl}__2.html`,
    type: "law",
  },
  dailyWorkingTime: {
    label: "ArbZG § 3 - Arbeitszeit",
    url: `${arbzgBaseUrl}__3.html`,
    type: "law",
  },
  breaks: {
    label: "ArbZG § 4 - Ruhepausen",
    url: `${arbzgBaseUrl}__4.html`,
    type: "law",
  },
  restTime: {
    label: "ArbZG § 5 - Ruhezeit",
    url: `${arbzgBaseUrl}__5.html`,
    type: "law",
  },
  nightWork: {
    label: "ArbZG § 6 - Nacht- und Schichtarbeit",
    url: `${arbzgBaseUrl}__6.html`,
    type: "law",
  },
  sundayHolidayRest: {
    label: "ArbZG § 9 - Sonn- und Feiertagsruhe",
    url: `${arbzgBaseUrl}__9.html`,
    type: "law",
  },
  sundayHolidayExceptions: {
    label: "ArbZG § 10 - Ausnahmen",
    url: `${arbzgBaseUrl}__10.html`,
    type: "law",
  },
  replacementRest: {
    label: "ArbZG § 11 - Ausgleich",
    url: `${arbzgBaseUrl}__11.html`,
    type: "law",
  },
} satisfies Record<
  string,
  ComplianceRuleReference
>;

const internalCareCheckReference: ComplianceRuleReference =
  {
    label: "CareCheck interne Plausibilitäts- und Planungsregel",
    type: "internal",
  };

const shiftLabels: Record<ShiftType, string> = {
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

const defaultSeverityGuide: Record<
  ComplianceSeverity,
  string
> = {
  info: "Information ohne unmittelbaren Verstoß; zur fachlichen Einordnung prüfen.",
  warning: "Planungs- oder Ausgleichsbedarf; die Daten können zulässig sein, benötigen aber fachliche Prüfung.",
  critical: "Harte Auffälligkeit oder Datenkonflikt; Zeitangaben oder Dienstplanung vor Nutzung prüfen.",
};

const commonLimitations = [
  "CareCheck ersetzt keine arbeitsrechtliche Beratung und keine verbindliche Prüfung durch Arbeitgeber, Personalrat oder Aufsicht.",
  "Tarifverträge, Betriebsvereinbarungen, Rufbereitschaft und individuelle Ausnahmen werden nur berücksichtigt, wenn sie als Dienstplandaten erfassbar sind.",
  "Pausenlage und freie Nutzbarkeit einer Unterbrechung werden nicht minutengenau gespeichert und müssen fachlich bestätigt werden.",
];

export const complianceRuleCatalog: Record<
  ComplianceRuleId,
  ComplianceRule
> = {
  "time-plausibility": {
    id: "time-plausibility",
    title: "Zeit- und Pausenplausibilität",
    category: "Datenqualität",
    scope:
      "Prüft einzelne compliance-relevante Einträge auf technisch widersprüchliche Zeit- und Pausenwerte.",
    summary:
      "Diese Regel schützt die folgenden Berechnungen vor Eingaben, die keine belastbare Arbeitszeit ergeben.",
    calculationSteps: [
      "Eintrag als compliance-relevant einstufen.",
      "Beginn, Ende und Pause aus dem Eintrag lesen.",
      "Bruttozeit berechnen; Dienste über Mitternacht werden als Folgetag beendet.",
      "Identische Zeiten, negative Pausen, Pausen über Bruttozeit und sehr lange Bruttozeiten markieren.",
    ],
    severityGuide: defaultSeverityGuide,
    references: [
      legalReferences.definition,
      internalCareCheckReference,
    ],
    settings: [
      {
        label: "Maximale plausible Bruttozeit",
        value: "16 h",
        description:
          "Darüber wird der Eintrag als ungewöhnlich lang markiert.",
      },
      {
        label: "Mindestpause",
        value: "0 min",
        description:
          "Negative Pausenwerte sind ein Datenfehler.",
      },
    ],
    limitations: [
      "Die Regel erkennt technische Widersprüche, aber keine tatsächlich geleistete Tätigkeit.",
    ],
  },
  "daily-working-time": {
    id: "daily-working-time",
    title: "Tägliche Arbeitszeit",
    category: "Arbeitszeit",
    scope:
      "Summiert zusammenhängende Arbeitszeitgruppen ohne künstliche Teilung an Mitternacht.",
    summary:
      "Die Regel erklärt, warum ein Arbeitstag über acht oder zehn Nettoarbeitsstunden auffällt.",
    calculationSteps: [
      "Compliance-relevante Einträge chronologisch sortieren.",
      "Einträge zu einem zusammenhängenden Arbeitszeitraum bündeln.",
      "Nettoarbeitszeit je Gruppe summieren; hinterlegte Pausen werden abgezogen.",
      "Über acht Stunden als Ausgleichshinweis, über zehn Stunden als kritische Überschreitung melden.",
    ],
    severityGuide: defaultSeverityGuide,
    references: [
      legalReferences.definition,
      legalReferences.dailyWorkingTime,
      legalReferences.nightWork,
    ],
    settings: [
      {
        label: "Regelarbeitszeit",
        value: "8 h netto",
        description:
          "Oberhalb davon wird ein Ausgleichszeitraum relevant.",
      },
      {
        label: "Tagesobergrenze",
        value: "10 h netto",
        description:
          "Oberhalb davon wird der Hinweis kritisch eingestuft.",
      },
    ],
    limitations: [
      "Der sechsmonatige beziehungsweise 24-wöchige Ausgleichsdurchschnitt wird nicht vollständig rekonstruiert.",
    ],
  },
  "daily-break": {
    id: "daily-break",
    title: "Ruhepausen",
    category: "Pausen",
    scope:
      "Vergleicht die Nettoarbeitszeit eines Arbeitszeitraums mit den hinterlegten Pausenminuten.",
    summary:
      "Die Regel macht sichtbar, ob mindestens 30 oder 45 Minuten Pause dokumentiert oder fachlich zu bestätigen sind.",
    calculationSteps: [
      "Arbeitszeitgruppe bilden und Nettoarbeitszeit summieren.",
      "Erforderliche Pause bestimmen: über sechs Stunden 30 Minuten, über neun Stunden 45 Minuten.",
      "Hinterlegte Pausenminuten und erkannte Unterbrechungen von mindestens 15 Minuten berücksichtigen.",
      "Fehlende Pause kritisch melden oder eine fachliche Bestätigung der Unterbrechung anfordern.",
    ],
    severityGuide: defaultSeverityGuide,
    references: [
      legalReferences.breaks,
    ],
    settings: [
      {
        label: "Pause ab > 6 h",
        value: "30 min",
        description:
          "Mindestpause bei mehr als sechs bis neun Stunden Arbeitszeit.",
      },
      {
        label: "Pause ab > 9 h",
        value: "45 min",
        description:
          "Mindestpause bei mehr als neun Stunden Arbeitszeit.",
      },
      {
        label: "Pausenabschnitt",
        value: "15 min",
        description:
          "Kleinste berücksichtigte Unterbrechung zwischen Einträgen.",
      },
    ],
    limitations: [
      "Ob eine erkannte Lücke im Voraus feststand und frei genutzt werden konnte, muss fachlich bestätigt werden.",
    ],
  },
  "continuous-work": {
    id: "continuous-work",
    title: "Ununterbrochene Arbeitsphase",
    category: "Pausen",
    scope:
      "Sucht Arbeitsblöcke ohne dokumentierte Ruhepause von mindestens 15 Minuten.",
    summary:
      "Die Regel zeigt, wenn mehr als sechs Stunden ohne erkennbare Pausenunterbrechung gearbeitet wurden.",
    calculationSteps: [
      "Compliance-relevante Einträge chronologisch sortieren.",
      "Arbeitsblöcke fortschreiben, solange keine dokumentierte Pause oder Lücke von mindestens 15 Minuten vorliegt.",
      "Dauer des Blocks berechnen.",
      "Mehr als sechs Stunden ohne Unterbrechung kritisch melden.",
    ],
    severityGuide: defaultSeverityGuide,
    references: [
      legalReferences.breaks,
    ],
    settings: [
      {
        label: "Maximale Arbeitsphase",
        value: "6 h",
        description:
          "Länger darf ohne Ruhepause nicht weitergearbeitet werden.",
      },
      {
        label: "Erkannte Unterbrechung",
        value: "15 min",
        description:
          "Kürzere Lücken beenden den Block nicht.",
      },
    ],
    limitations: [
      "Die genaue Lage einer Pause innerhalb eines einzelnen Dienstes wird nicht gespeichert.",
    ],
  },
  "rest-time": {
    id: "rest-time",
    title: "Ruhezeit zwischen Arbeitstagen",
    category: "Ruhezeit",
    scope:
      "Misst die Zeit zwischen Ende eines Arbeitstags und Beginn des nächsten Arbeitstags.",
    summary:
      "Die Regel erklärt Verkürzungen unter elf Stunden und die besonders kritische Grenze unter zehn Stunden.",
    calculationSteps: [
      "Tagesgrenzen aus dem ersten Beginn und letzten Ende eines Arbeitstags bilden.",
      "Zeit bis zum nächsten Arbeitsbeginn berechnen.",
      "Unter elf Stunden als Warnung einstufen.",
      "Unter zehn Stunden kritisch melden.",
    ],
    severityGuide: defaultSeverityGuide,
    references: [
      legalReferences.restTime,
    ],
    settings: [
      {
        label: "Regelruhezeit",
        value: "11 h",
        description:
          "Grundwert für die tägliche Ruhezeit.",
      },
      {
        label: "Pflege/Krankenhaus-Untergrenze",
        value: "10 h",
        description:
          "Verkürzung kann nur mit Ausgleich zulässig sein.",
      },
    ],
    limitations: [
      "Ausgleichsruhezeiten werden nur erkannt, wenn sie im sichtbaren Dienstplanzeitraum liegen und eindeutig auswertbar sind.",
    ],
  },
  "weekend-sequence": {
    id: "weekend-sequence",
    title: "Wochenendfolge",
    category: "Wochenende",
    scope:
      "Erkennt Arbeit an zwei unmittelbar aufeinanderfolgenden Wochenenden.",
    summary:
      "Die Regel ist ein Planungs- und Fairnesshinweis und trennt sich bewusst von harten ArbZG-Verstößen.",
    calculationSteps: [
      "Alle compliance-relevanten Einträge mit Samstag- oder Sonntag-Überlappung sammeln.",
      "Wochenenden nach Startdatum gruppieren.",
      "Direkt aufeinanderfolgende Wochenenden erkennen.",
      "Folgewochenende als Planungshinweis markieren.",
    ],
    severityGuide: defaultSeverityGuide,
    references: [
      legalReferences.sundayHolidayRest,
      legalReferences.sundayHolidayExceptions,
      legalReferences.replacementRest,
      internalCareCheckReference,
    ],
    settings: [
      {
        label: "Wochenendfolge",
        value: "2 in Folge",
        description:
          "Ab zwei direkt aufeinanderfolgenden Wochenenden wird gewarnt.",
      },
    ],
    limitations: [
      "Die Regel bewertet keine vollständige Teamfairness und keine individuellen Betriebsvereinbarungen.",
    ],
  },
  "entry-integrity": {
    id: "entry-integrity",
    title: "Kalendereinträge und Überschneidungen",
    category: "Datenqualität",
    scope:
      "Sucht doppelte oder zeitlich überlappende compliance-relevante Einträge.",
    summary:
      "Diese Regel verhindert, dass fehlerhafte Einträge Arbeitszeit, Pausen und Ruhezeit verfälschen.",
    calculationSteps: [
      "Einträge nach Datum, Zeit, Pause und Typ vergleichen.",
      "Exakte Dubletten als Datenkonflikt melden.",
      "Zeitfenster compliance-relevanter Einträge vergleichen.",
      "Echte Überschneidungen kritisch markieren.",
    ],
    severityGuide: defaultSeverityGuide,
    references: [
      internalCareCheckReference,
    ],
    settings: [
      {
        label: "Dublettenprüfung",
        value: "Datum, Zeit, Pause, Typ",
        description:
          "Diese Felder bilden den technischen Vergleichsschlüssel.",
      },
    ],
    limitations: [
      "Ob eine Doppelung fachlich beabsichtigt war, kann nur anhand der Planung geklärt werden.",
    ],
  },
  "consecutive-working-days": {
    id: "consecutive-working-days",
    title: "Arbeitstage in Folge",
    category: "Erholung",
    scope:
      "Zählt Kalendertage mit mindestens einem compliance-relevanten Eintrag in Folge.",
    summary:
      "Die Regel macht längere Dienstfolgen sichtbar, ohne daraus automatisch einen Rechtsverstoß abzuleiten.",
    calculationSteps: [
      "Pro Kalendertag prüfen, ob ein compliance-relevanter Eintrag vorhanden ist.",
      "Aneinandergrenzende Arbeitstage zu einer Serie bündeln.",
      "Serien ab sieben Tagen markieren.",
      "Letzten Arbeitstag der Serie als Bezugspunkt verwenden.",
    ],
    severityGuide: defaultSeverityGuide,
    references: [
      internalCareCheckReference,
      legalReferences.restTime,
      legalReferences.replacementRest,
    ],
    settings: [
      {
        label: "Serienlänge",
        value: "7 Tage",
        description:
          "Ab sieben Arbeitstagen in Folge wird ein Planungshinweis erzeugt.",
      },
    ],
    limitations: [
      "Freie Tage, die außerhalb des ausgewerteten Zeitfensters liegen, können die Serie nur begrenzt einordnen.",
    ],
  },
  "shift-sequence": {
    id: "shift-sequence",
    title: "Dienstfolge Spät zu Früh",
    category: "Dienstfolge",
    scope:
      "Erkennt Spätdienst mit folgendem Frühdienst am nächsten Kalendertag.",
    summary:
      "Die Regel meldet eine belastende Vorwärtsrotation auch dann, wenn die gesetzliche Mindestruhezeit formal erreicht ist.",
    calculationSteps: [
      "Compliance-relevante Einträge chronologisch sortieren.",
      "Paare aus LATE und folgendem EARLY am nächsten Tag suchen.",
      "Ruhezeit zwischen Dienstende und Dienstbeginn berechnen.",
      "Nur melden, wenn die Ruhezeitprüfung nicht bereits unter elf Stunden war.",
    ],
    severityGuide: defaultSeverityGuide,
    references: [
      legalReferences.restTime,
      internalCareCheckReference,
    ],
    settings: [
      {
        label: "Dienstfolge",
        value: "Spät -> Früh",
        description:
          "Warnung bei kurzer planerischer Erholung trotz erfüllter Mindestprüfung.",
      },
    ],
    limitations: [
      "Individuelle Präferenzen und Teamrotationen werden nicht bewertet.",
    ],
  },
  "night-series": {
    id: "night-series",
    title: "Nachtdienste in Folge",
    category: "Nachtarbeit",
    scope:
      "Zählt aufeinanderfolgende Kalendertage mit Nachtdienst.",
    summary:
      "Die Regel macht längere Nachtserien sichtbar und verweist auf erhöhte Belastung und Erholungsbedarf.",
    calculationSteps: [
      "Nachtdienste aus den compliance-relevanten Einträgen filtern.",
      "Aufeinanderfolgende Nachtdiensttage zu Serien bündeln.",
      "Serien ab vier Nachtdiensten markieren.",
      "Letzten Nachtdienst der Serie als Bezugspunkt verwenden.",
    ],
    severityGuide: defaultSeverityGuide,
    references: [
      legalReferences.nightWork,
      internalCareCheckReference,
    ],
    settings: [
      {
        label: "Nachtserie",
        value: "4 Dienste",
        description:
          "Ab vier Nachtdiensten in Folge wird ein Planungshinweis erzeugt.",
      },
    ],
    limitations: [
      "Medizinische Belastungsbewertung, Wunschdienste und Teamkontext werden nicht berechnet.",
    ],
  },
  "night-recovery": {
    id: "night-recovery",
    title: "Erholung nach Nachtserie",
    category: "Nachtarbeit",
    scope:
      "Prüft den Folgedienst nach mindestens zwei aufeinanderfolgenden Nachtdiensten.",
    summary:
      "Die Regel zeigt kurze Erholung vor einem Früh- oder Tagdienst nach einer Nachtserie.",
    calculationSteps: [
      "Nachtserien ab zwei direkt aufeinanderfolgenden Nachtdiensten erkennen.",
      "Nächsten compliance-relevanten Dienst nach der Serie suchen.",
      "Nur Früh- oder Tagdienst als belastenden Wiedereinstieg bewerten.",
      "Zwischen 11 und unter 24 Stunden Erholung als Planungshinweis markieren.",
    ],
    severityGuide: defaultSeverityGuide,
    references: [
      legalReferences.nightWork,
      legalReferences.restTime,
      internalCareCheckReference,
    ],
    settings: [
      {
        label: "Nachtserie",
        value: "ab 2 Dienste",
        description:
          "Danach wird der nächste Früh- oder Tagdienst geprüft.",
      },
      {
        label: "Kurze Erholung",
        value: "11 bis < 24 h",
        description:
          "Unter 11 Stunden meldet bereits die Ruhezeitprüfung.",
      },
    ],
    limitations: [
      "Die Regel beschreibt planerische Erholung, aber keine individuelle Regenerationsfähigkeit.",
    ],
  },
  "manual-review": {
    id: "manual-review",
    title: "Fachliche Einzelprüfung",
    category: "Prüfung",
    scope:
      "Fallback für Hinweise, die keinem bekannten Regeltyp zugeordnet sind.",
    summary:
      "Der Hinweis bleibt sichtbar und wird fachlich anhand des Beschreibungstexts geprüft.",
    calculationSteps: [
      "Hinweistext lesen.",
      "Zugeordneten Kalendereintrag prüfen.",
      "Fachliche Relevanz anhand des Dienstplans bewerten.",
    ],
    severityGuide: defaultSeverityGuide,
    references: [
      internalCareCheckReference,
    ],
    settings: [],
    limitations: [
      "Für diesen Hinweis liegt noch keine spezifische Regelbeschreibung vor.",
    ],
  },
};

const issueTitleToRuleId: Record<
  string,
  ComplianceRuleId
> = {
  "Dienstbeginn und Dienstende identisch":
    "time-plausibility",
  "Negativer Pausenwert": "time-plausibility",
  "Pause länger als Dienstzeit": "time-plausibility",
  "Ungewöhnlich lange Dienstzeit": "time-plausibility",
  "Tagesarbeitszeit über 10 Stunden":
    "daily-working-time",
  "Tagesarbeitszeit über 8 Stunden":
    "daily-working-time",
  "Pause zu kurz": "daily-break",
  "Unterbrechung als Pause prüfen": "daily-break",
  "Mehr als 6 Stunden ohne dokumentierte Pause":
    "continuous-work",
  "Ruhezeit unter 10 Stunden": "rest-time",
  "Ruhezeit unter 11 Stunden": "rest-time",
  "Zwei Wochenenden in Folge gearbeitet":
    "weekend-sequence",
  "Doppelter Kalendereintrag": "entry-integrity",
  "Dienste überschneiden sich": "entry-integrity",
  "Sieben oder mehr Arbeitstage in Folge":
    "consecutive-working-days",
  "Ungünstige Dienstfolge Spät zu Früh":
    "shift-sequence",
  "Vier oder mehr Nachtdienste in Folge":
    "night-series",
  "Kurze Erholung nach Nachtserie":
    "night-recovery",
};

export const complianceRuleProfile: ComplianceRuleSetting[] =
  [
    {
      label: "Tägliche Arbeitszeit",
      value: "8 h / 10 h",
      description:
        "Warnung ab über acht Nettoarbeitsstunden, kritisch ab über zehn.",
    },
    {
      label: "Ruhepause",
      value: "30 / 45 min",
      description:
        "Ab über sechs Stunden 30 Minuten, ab über neun Stunden 45 Minuten.",
    },
    {
      label: "Ununterbrochene Arbeit",
      value: "6 h",
      description:
        "Ohne dokumentierte Pause von mindestens 15 Minuten kritisch.",
    },
    {
      label: "Ruhezeit",
      value: "11 h / 10 h",
      description:
        "Warnung unter elf Stunden, kritisch unter zehn Stunden.",
    },
    {
      label: "Wochenendfolge",
      value: "2 Wochenenden",
      description:
        "Zwei aufeinanderfolgende Wochenenden werden als Planungshinweis gemeldet.",
    },
    {
      label: "Nachtdienstfolge",
      value: "4 Nächte",
      description:
        "Ab vier aufeinanderfolgenden Nachtdiensten wird ein Planungshinweis erzeugt.",
    },
  ];

export const complianceTransparencyLimits =
  commonLimitations;

function formatDateGerman(dateKey: string): string {
  const [year, month, day] =
    dateKey.split("-");

  return `${day}.${month}.${year}`;
}

function formatHours(hours: number): string {
  return hours.toLocaleString("de-DE", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

function findRelatedShift(
  issue: ComplianceIssue,
  shifts: Shift[],
): Shift | null {
  if (!issue.relatedShiftId) {
    return null;
  }

  return (
    shifts.find(
      (shift) =>
        shift.id === issue.relatedShiftId,
    ) ?? null
  );
}

function createRelatedShiftData(
  shift: Shift | null,
): ComplianceSourceDatum[] {
  if (!shift) {
    return [
      {
        label: "Zugeordneter Eintrag",
        value:
          "Kein einzelner Kalendereintrag eindeutig zugeordnet",
      },
    ];
  }

  return [
    {
      label: "Zugeordneter Eintrag",
      value: `${formatDateGerman(shift.date)} · ${
        shiftLabels[shift.type]
      }`,
    },
    {
      label: "Zeitfenster",
      value: `${shift.startTime}-${shift.endTime}`,
    },
    {
      label: "Pause",
      value: `${shift.breakMinutes} min`,
    },
    {
      label: "Bruttozeit",
      value: `${formatHours(
        calculateGrossHours(shift),
      )} h`,
    },
    {
      label: "Nettozeit",
      value: `${formatHours(
        calculateNetHours(shift),
      )} h`,
    },
  ];
}

export function getComplianceRuleForIssue(
  issue: Pick<ComplianceIssue, "title">,
): ComplianceRule {
  const ruleId =
    issueTitleToRuleId[issue.title] ??
    "manual-review";

  return complianceRuleCatalog[ruleId];
}

export function createComplianceIssueExplanation(
  issue: ComplianceIssue,
  shifts: Shift[],
): ComplianceIssueExplanation {
  const rule =
    getComplianceRuleForIssue(issue);

  const relatedShift = findRelatedShift(
    issue,
    shifts,
  );

  return {
    rule,
    severityExplanation:
      rule.severityGuide[issue.severity],
    sourceData: [
      {
        label: "Hinweis",
        value: issue.title,
      },
      {
        label: "Schweregrad",
        value: issue.severity,
      },
      ...createRelatedShiftData(relatedShift),
      {
        label: "Berechnungsergebnis",
        value: issue.description,
      },
    ],
  };
}
