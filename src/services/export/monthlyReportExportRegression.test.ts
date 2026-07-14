import * as XLSX from "xlsx";
import {
  describe,
  expect,
  it,
} from "vitest";
import type {
  ComplianceIssue,
  Shift,
  UserProfile,
} from "../../types/index";
import type { MonthlyHoursResult } from "../calculation/monthlyHoursCalculator";
import type { MonthlyPremiumResult } from "../calculation/monthlyPremiumCalculator";
import {
  createMonthlyReportCsv,
  createMonthlyReportCsvFileName,
} from "./monthlyReportCsvService";
import {
  createMonthlyReportExportFileName,
} from "./monthlyReportExportMetadata";
import { createMonthlyReportExportPreview } from "./monthlyReportExportPreview";
import {
  createMonthlyReportWorkbook,
  createMonthlyReportXlsxFileName,
} from "./monthlyReportXlsxService";
import {
  monthlyReportLabels,
  monthlyReportSeverityLabels,
} from "./monthlyReportLabels";

const monthLabel = "Juli 2026";
const fileBaseName =
  "CareCheck_Monatsbericht_2026-07_Juli";

const profile: UserProfile = {
  federalState: "HE",
  weeklyHours: 38.5,
  payGroup: "P8",
  payLevel: 4,
};

const monthlyHours = {
  targetHours: 177.1,
  actualHours: 15.7,
  balanceHours: -161.4,
  overtimeHours: 0,
  undertimeHours: 161.4,
  shiftCount: 2,
  shiftTypeCounts: [],
  calendarEntryCount: 2,
  planningEntryCount: 2,
  workShiftCount: 1,
  complianceRelevantShiftCount: 1,
  vacationDayCount: 1,
  sickDayCount: 0,
  vacationHours: 7.7,
  sickHours: 0,
  absenceHours: 7.7,
  trainingDayCount: 0,
  freeDayCount: 0,
  plannedDayCount: 2,
  workingDayCount: 23,
  publicHolidayCount: 0,
  holidayReductionHours: 0,
  averageDailyHours: 7.7,
} satisfies MonthlyHoursResult;

const monthlyPremiums = {
  lines: [
    {
      key: "night",
      label: "Nachtarbeit",
      hours: 5.5,
      percentage: 20,
      amount: 25.08,
    },
  ],
  totalAmount: 25.08,
  shiftCountWithPremiums: 1,
} satisfies MonthlyPremiumResult;

const complianceIssues: ComplianceIssue[] = [
  {
    id: "warning-1",
    severity: "warning",
    title: "Ruhezeit prüfen",
    description:
      "Beschreibung mit Semikolon; bleibt lesbar.",
  },
];

const shifts: Shift[] = [
  {
    id: "custom-1",
    date: "2026-07-06",
    startTime: "08:00",
    endTime: "16:30",
    breakMinutes: 30,
    type: "CUSTOM",
    note: "Station A; Dokumentation",
  },
  {
    id: "vacation-1",
    date: "2026-07-07",
    startTime: "00:00",
    endTime: "00:00",
    breakMinutes: 0,
    type: "VACATION",
    creditedHours: 7.7,
    hourCreditSource: "DAILY_TARGET",
  },
];

const input = {
  monthLabel,
  profile,
  shifts,
  monthlyHours,
  monthlyPremiums,
  complianceIssues,
};

function parseCsvRows(csv: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;

  for (let index = 0; index < csv.length; index += 1) {
    const character = csv[index];

    if (quoted) {
      if (character === '"') {
        if (csv[index + 1] === '"') {
          cell += '"';
          index += 1;
        } else {
          quoted = false;
        }
      } else {
        cell += character;
      }

      continue;
    }

    if (character === '"') {
      quoted = true;
      continue;
    }

    if (character === ";") {
      row.push(cell);
      cell = "";
      continue;
    }

    if (character === "\r" || character === "\n") {
      if (
        character === "\r" &&
        csv[index + 1] === "\n"
      ) {
        index += 1;
      }

      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
      continue;
    }

    cell += character;
  }

  row.push(cell);
  rows.push(row);

  return rows;
}

function getWorkbookRows(
  workbook: XLSX.WorkBook,
  sheetName: string,
): Array<Array<string | number>> {
  const sheet = workbook.Sheets[sheetName];

  return XLSX.utils.sheet_to_json(
    sheet,
    {
      header: 1,
      raw: true,
      defval: "",
    },
  ) as Array<Array<string | number>>;
}

function getRowByLabel(
  rows: Array<Array<string | number>>,
  label: string,
): Array<string | number> {
  const row = rows.find(
    ([firstCell]) => firstCell === label,
  );

  if (!row) {
    throw new Error(`Row not found: ${label}`);
  }

  return row;
}

function getSectionIndex(
  rows: string[][],
  sectionLabel: string,
): number {
  const index = rows.findIndex(
    (row) =>
      row.length === 1 && row[0] === sectionLabel,
  );

  if (index < 0) {
    throw new Error(
      `Section not found: ${sectionLabel}`,
    );
  }

  return index;
}

function formatCsvNumber(value: number): string {
  return String(value).replace(".", ",");
}

function normalizeXlsxCalendarRow(
  row: Array<string | number>,
): string[] {
  return [
    String(row[0]),
    String(row[1]),
    String(row[2]),
    String(row[3]),
    `${formatCsvNumber(Number(row[4]))} h`,
    String(row[5]),
    String(row[6]),
  ];
}

function normalizeXlsxPremiumRow(
  row: Array<string | number>,
): string[] {
  return [
    String(row[0]),
    `${formatCsvNumber(Number(row[1]))} h`,
    String(row[2]),
    String(row[3]),
  ];
}

describe(
  "monthlyReportExportRegression",
  () => {
    it("verwendet dieselbe Monatsbasis und Dateibasis fuer CSV, XLSX und PDF", () => {
      const csvRows = parseCsvRows(
        createMonthlyReportCsv(input),
      );
      const workbook =
        createMonthlyReportWorkbook(input);
      const overviewRows = getWorkbookRows(
        workbook,
        monthlyReportLabels.sections.overview,
      );
      const preview =
        createMonthlyReportExportPreview(input);

      expect(
        getRowByLabel(
          csvRows,
          monthlyReportLabels.fields.month,
        )[1],
      ).toBe(monthLabel);
      expect(
        getRowByLabel(
          overviewRows,
          monthlyReportLabels.fields.month,
        )[1],
      ).toBe(monthLabel);

      expect(
        createMonthlyReportCsvFileName(monthLabel),
      ).toBe(`${fileBaseName}.csv`);
      expect(
        createMonthlyReportXlsxFileName(monthLabel),
      ).toBe(`${fileBaseName}.xlsx`);
      expect(
        createMonthlyReportExportFileName(
          monthLabel,
          "pdf",
        ),
      ).toBe(`${fileBaseName}.pdf`);

      expect(preview).toMatchObject({
        displayMonthLabel: monthLabel,
        monthKey: "2026-07",
        fileBaseName,
        pdfFileName: `${fileBaseName}.pdf`,
        calendarEntryCount:
          monthlyHours.calendarEntryCount,
        workShiftCount: monthlyHours.workShiftCount,
        complianceIssueCount:
          complianceIssues.length,
        status: "warning",
        statusLabel: "Warnungen",
      });
    });

    it("haelt Abschnittsbegriffe fuer CSV, XLSX und Druck/PDF synchron", () => {
      const csvRows = parseCsvRows(
        createMonthlyReportCsv(input),
      );
      const workbook =
        createMonthlyReportWorkbook(input);

      const csvSections = [
        monthlyReportLabels.sections.workingTime,
        monthlyReportLabels.sections.planning,
        monthlyReportLabels.sections.premiums,
        monthlyReportLabels.sections.compliance,
        monthlyReportLabels.sections.calendarEntries,
      ];

      const csvSectionPositions = csvSections.map(
        (section) =>
          getSectionIndex(csvRows, section),
      );

      const printableSections = [
        monthlyReportLabels.sections.workingTime,
        monthlyReportLabels.sections.planning,
        monthlyReportLabels.sections.premiums,
        monthlyReportLabels.sections.compliance,
        monthlyReportLabels.sections.calculationBasis,
        monthlyReportLabels.sections.calendarEntries,
      ];

      expect(csvSectionPositions).toEqual(
        [...csvSectionPositions].sort(
          (left, right) => left - right,
        ),
      );
      expect(workbook.SheetNames).toEqual([
        monthlyReportLabels.sections.overview,
        monthlyReportLabels.sections.premiums,
        monthlyReportLabels.sections.compliance,
        monthlyReportLabels.sections.calendarEntries,
      ]);
      expect(
        printableSections.filter(
          (section) =>
            section !==
            monthlyReportLabels.sections.calculationBasis,
        ),
      ).toEqual(csvSections);
    });

    it("exportiert Kalender, Zuschlaege und Pruefhinweise in CSV und XLSX deckungsgleich", () => {
      const csvRows = parseCsvRows(
        createMonthlyReportCsv(input),
      );
      const workbook =
        createMonthlyReportWorkbook(input);

      const csvCalendarIndex = getSectionIndex(
        csvRows,
        monthlyReportLabels.sections.calendarEntries,
      );
      const xlsxCalendarRows = getWorkbookRows(
        workbook,
        monthlyReportLabels.sections.calendarEntries,
      );

      expect(csvRows[csvCalendarIndex + 1]).toEqual([
        ...monthlyReportLabels.tables.calendarEntries,
      ]);
      expect(xlsxCalendarRows[0]).toEqual([
        ...monthlyReportLabels.tables.calendarEntries,
      ]);
      expect(
        xlsxCalendarRows
          .slice(1)
          .map(normalizeXlsxCalendarRow),
      ).toEqual(
        csvRows.slice(
          csvCalendarIndex + 2,
          csvCalendarIndex + 2 + shifts.length,
        ),
      );

      const csvPremiumIndex = getSectionIndex(
        csvRows,
        monthlyReportLabels.sections.premiums,
      );
      const xlsxPremiumRows = getWorkbookRows(
        workbook,
        monthlyReportLabels.sections.premiums,
      );

      expect(csvRows[csvPremiumIndex + 1]).toEqual([
        ...monthlyReportLabels.tables.premiums,
      ]);
      expect(xlsxPremiumRows[0]).toEqual([
        ...monthlyReportLabels.tables.premiums,
      ]);
      expect(
        normalizeXlsxPremiumRow(
          xlsxPremiumRows[1],
        ),
      ).toEqual(csvRows[csvPremiumIndex + 2]);

      const csvComplianceIndex = getSectionIndex(
        csvRows,
        monthlyReportLabels.sections.compliance,
      );
      const xlsxComplianceRows = getWorkbookRows(
        workbook,
        monthlyReportLabels.sections.compliance,
      );

      expect(csvRows[csvComplianceIndex + 1]).toEqual([
        ...monthlyReportLabels.tables.compliance,
      ]);
      expect(xlsxComplianceRows[0]).toEqual([
        ...monthlyReportLabels.tables.compliance,
      ]);
      expect(csvRows[csvComplianceIndex + 2]).toEqual([
        monthlyReportSeverityLabels.warning,
        complianceIssues[0].title,
        complianceIssues[0].description,
      ]);
      expect(xlsxComplianceRows[1]).toEqual([
        monthlyReportSeverityLabels.warning,
        complianceIssues[0].title,
        complianceIssues[0].description,
      ]);
    });
  },
);
