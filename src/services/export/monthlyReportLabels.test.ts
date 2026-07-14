import {
  describe,
  expect,
  it,
} from "vitest";
import {
  monthlyReportLabels,
  monthlyReportSeverityHelpLabels,
} from "./monthlyReportLabels";

describe("monthlyReportLabels", () => {
  it("definiert die gemeinsame Berichtsreihenfolge", () => {
    expect([
      monthlyReportLabels.sections.workingTime,
      monthlyReportLabels.sections.planning,
      monthlyReportLabels.sections.premiums,
      monthlyReportLabels.sections.compliance,
      monthlyReportLabels.sections.calculationBasis,
      monthlyReportLabels.sections.calendarEntries,
    ]).toEqual([
      "Arbeitszeit",
      "Monatsplanung",
      "Zuschläge",
      "Prüfhinweise",
      "Berechnungsgrundlagen",
      "Kalendereinträge",
    ]);
  });

  it("definiert gemeinsame Tabellenkoepfe fuer CSV, XLSX und Druck", () => {
    expect(
      monthlyReportLabels.tables.premiums,
    ).toEqual([
      "Art",
      "Stunden",
      "Prozent",
      "Betrag",
    ]);

    expect(
      monthlyReportLabels.tables.compliance,
    ).toEqual([
      "Schweregrad",
      "Titel",
      "Beschreibung",
    ]);

    expect(
      monthlyReportLabels.tables.calendarEntries,
    ).toEqual([
      "Datum",
      "Eintragsart",
      "Zeit",
      "Pause",
      "Stunden",
      "Stundenquelle",
      "Notiz",
    ]);
  });

  it("erklaert Schweregrade fuer den druckbaren Monatsbericht", () => {
    expect(
      monthlyReportSeverityHelpLabels,
    ).toEqual({
      info: "Information zur Monatsprüfung.",
      warning:
        "Bitte Planung prüfen und bei Bedarf korrigieren.",
      critical:
        "Vor Nutzung oder Weitergabe des Plans vorrangig prüfen.",
    });
  });
});
