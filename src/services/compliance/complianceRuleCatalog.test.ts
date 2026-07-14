import {
  describe,
  expect,
  it,
} from "vitest";
import type {
  ComplianceIssue,
  Shift,
} from "../../types/index";
import {
  complianceRuleCatalog,
  complianceRuleProfile,
  complianceTransparencyLimits,
  createComplianceIssueExplanation,
  getComplianceRuleForIssue,
} from "./complianceRuleCatalog";

const existingIssueTitles = [
  "Dienstbeginn und Dienstende identisch",
  "Negativer Pausenwert",
  "Pause länger als Dienstzeit",
  "Ungewöhnlich lange Dienstzeit",
  "Tagesarbeitszeit über 10 Stunden",
  "Tagesarbeitszeit über 8 Stunden",
  "Pause zu kurz",
  "Unterbrechung als Pause prüfen",
  "Mehr als 6 Stunden ohne dokumentierte Pause",
  "Ruhezeit unter 10 Stunden",
  "Ruhezeit unter 11 Stunden",
  "Zwei Wochenenden in Folge gearbeitet",
  "Doppelter Kalendereintrag",
  "Dienste überschneiden sich",
  "Sieben oder mehr Arbeitstage in Folge",
  "Ungünstige Dienstfolge Spät zu Früh",
  "Vier oder mehr Nachtdienste in Folge",
  "Kurze Erholung nach Nachtserie",
];

function createIssue(
  title: string,
): ComplianceIssue {
  return {
    id: `issue-${title}`,
    severity: "critical",
    title,
    description: "Testbeschreibung",
    relatedShiftId: "shift-1",
  };
}

function createShift(): Shift {
  return {
    id: "shift-1",
    date: "2026-07-01",
    startTime: "08:00",
    endTime: "17:00",
    breakMinutes: 30,
    type: "EARLY",
  };
}

describe(
  "complianceRuleCatalog",
  () => {
    it("ordnet alle bestehenden Hinweis-Titel einer spezifischen Regel zu", () => {
      for (const title of existingIssueTitles) {
        const rule =
          getComplianceRuleForIssue({
            title,
          });

        expect(rule.id).not.toBe(
          "manual-review",
        );
      }
    });

    it("fällt bei unbekannten Hinweisen auf fachliche Einzelprüfung zurück", () => {
      const rule =
        getComplianceRuleForIssue({
          title: "Unbekannter Hinweis",
        });

      expect(rule.id).toBe(
        "manual-review",
      );
    });

    it("stellt Eingangsdaten und Berechnungsergebnis für UI-Erklärungen bereit", () => {
      const explanation =
        createComplianceIssueExplanation(
          createIssue("Pause zu kurz"),
          [createShift()],
        );

      expect(explanation.rule.id).toBe(
        "daily-break",
      );

      expect(
        explanation.sourceData,
      ).toContainEqual({
        label: "Zugeordneter Eintrag",
        value: "01.07.2026 · Frühdienst",
      });

      expect(
        explanation.sourceData,
      ).toContainEqual({
        label: "Pause",
        value: "30 min",
      });

      expect(
        explanation.sourceData.some(
          (datum) =>
            datum.label ===
              "Berechnungsergebnis" &&
            datum.value ===
              "Testbeschreibung",
        ),
      ).toBe(true);
    });

    it("dokumentiert offizielle Rechtsquellen und interne Planungsregeln getrennt", () => {
      const references = Object.values(
        complianceRuleCatalog,
      ).flatMap((rule) => rule.references);

      const lawReferences =
        references.filter(
          (reference) =>
            reference.type === "law",
        );

      const internalReferences =
        references.filter(
          (reference) =>
            reference.type === "internal",
        );

      expect(lawReferences.length).toBeGreaterThan(
        0,
      );

      expect(
        internalReferences.length,
      ).toBeGreaterThan(0);

      for (const reference of lawReferences) {
        expect(reference.url).toContain(
          "gesetze-im-internet.de/arbzg",
        );
      }
    });

    it("enthält ein aktives Prüfprofil und dokumentierte Grenzen", () => {
      expect(
        complianceRuleProfile.length,
      ).toBeGreaterThanOrEqual(5);

      for (const setting of complianceRuleProfile) {
        expect(setting.label).not.toBe("");
        expect(setting.value).not.toBe("");
        expect(setting.description).not.toBe(
          "",
        );
      }

      expect(
        complianceTransparencyLimits.length,
      ).toBeGreaterThanOrEqual(3);
    });
  },
);
