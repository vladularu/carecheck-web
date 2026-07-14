import {
  describe,
  expect,
  it,
} from "vitest";
import {
  createMonthlyReportExportFileName,
  createMonthlyReportExportMetadata,
} from "./monthlyReportExportMetadata";

describe(
  "monthlyReportExportMetadata",
  () => {
    it("erstellt eine sortierbare Monatskennung fuer deutsche Monatslabels", () => {
      expect(
        createMonthlyReportExportMetadata(
          "Juli 2026",
        ),
      ).toEqual({
        displayMonthLabel: "Juli 2026",
        monthKey: "2026-07",
        fileMonthPart: "2026-07_Juli",
        fileBaseName:
          "CareCheck_Monatsbericht_2026-07_Juli",
      });
    });

    it("transliteriert Monatsnamen im Dateinamen", () => {
      expect(
        createMonthlyReportExportMetadata(
          "März 2026",
        ).fileMonthPart,
      ).toBe("2026-03_Maerz");
    });

    it("nutzt einen sicheren Fallback fuer nicht erkannte Monatslabels", () => {
      expect(
        createMonthlyReportExportFileName(
          'Monat/2026: "Test"',
          "csv",
        ),
      ).toBe(
        "CareCheck_Monatsbericht_Monat2026_Test.csv",
      );
    });

    it("erstellt einheitliche Dateinamen fuer CSV und XLSX", () => {
      expect(
        createMonthlyReportExportFileName(
          "Juli 2026",
          "csv",
        ),
      ).toBe(
        "CareCheck_Monatsbericht_2026-07_Juli.csv",
      );

      expect(
        createMonthlyReportExportFileName(
          "Juli 2026",
          "xlsx",
        ),
      ).toBe(
        "CareCheck_Monatsbericht_2026-07_Juli.xlsx",
      );
    });
  },
);
