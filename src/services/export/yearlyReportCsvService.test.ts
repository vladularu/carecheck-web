import { describe, expect, it } from "vitest";
import type { Shift, UserProfile } from "../../types/index";
import { calculateYearlyAnalysis } from "../yearly/yearlyAnalysisService";
import {
  createYearlyReportCsv,
  createYearlyReportCsvFileContent,
  createYearlyReportCsvFileName,
} from "./yearlyReportCsvService";

const profile: UserProfile = {
  federalState: "HE",
  weeklyHours: 38.5,
  payGroup: "P8",
  payLevel: 4,
};

const shifts: Shift[] = [
  {
    id: "shift-1",
    date: "2026-05-01",
    startTime: "08:00",
    endTime: "12:00",
    breakMinutes: 0,
    type: "DAY",
  },
];

describe("yearlyReportCsvService", () => {
  it("erstellt einen sortierbaren Jahresbericht-Dateinamen", () => {
    expect(createYearlyReportCsvFileName(2026)).toBe(
      "CareCheck_Jahresbericht_2026.csv",
    );
  });

  it("erstellt eine Excel-kompatible CSV mit Jahres- und Monatsdaten", () => {
    const analysis = calculateYearlyAnalysis(shifts, profile, 2026);
    const csv = createYearlyReportCsv({
      profile,
      analysis,
    });

    expect(csv).toContain('"CareCheck Jahresbericht"');
    expect(csv).toContain('"Jahr";"2026"');
    expect(csv).toContain('"Jahressummen"');
    expect(csv).toContain('"Monatsvergleich"');
    expect(csv).toContain('"Mai 2026"');
    expect(csv).toContain('"Feiertagsarbeit";"4 h"');
  });

  it("stellt eine UTF-8-BOM fuer Excel bereit", () => {
    const analysis = calculateYearlyAnalysis(shifts, profile, 2026);

    expect(
      createYearlyReportCsvFileContent({
        profile,
        analysis,
      }).charCodeAt(0),
    ).toBe(0xfeff);
  });
});
