import type { UserProfile } from "../../types/index";
import type { YearlyAnalysisResult } from "../yearly/yearlyAnalysisService";

export interface YearlyReportCsvInput {
  profile: UserProfile;
  analysis: YearlyAnalysisResult;
}

function protectSpreadsheetFormula(value: string): string {
  if (
    /^[=+@]/.test(value) ||
    /^-\D/.test(value) ||
    /^[\t\r]/.test(value)
  ) {
    return `'${value}`;
  }

  return value;
}

function escapeCsv(value: string | number | null | undefined): string {
  const text =
    typeof value === "string"
      ? protectSpreadsheetFormula(value)
      : String(value ?? "");

  return `"${text.replace(/"/g, '""')}"`;
}

function createRow(values: Array<string | number | null | undefined>): string {
  return values.map(escapeCsv).join(";");
}

function formatNumber(value: number): string {
  return String(value).replace(".", ",");
}

function formatEuro(value: number | null): string {
  if (value === null) {
    return "";
  }

  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
  }).format(value);
}

export function createYearlyReportCsvFileName(year: number): string {
  return `CareCheck_Jahresbericht_${year}.csv`;
}

export function createYearlyReportCsv({
  profile,
  analysis,
}: YearlyReportCsvInput): string {
  const rows: string[] = [];

  rows.push(createRow(["CareCheck Jahresbericht"]));
  rows.push(createRow(["Jahr", analysis.year]));
  rows.push(createRow(["Bundesland", profile.federalState]));
  rows.push(createRow(["Wochenstunden", `${formatNumber(profile.weeklyHours)} h`]));
  rows.push(createRow(["Entgeltgruppe", profile.payGroup]));
  rows.push(createRow(["Stufe", profile.payLevel]));
  rows.push("");

  rows.push(createRow(["Jahressummen"]));
  rows.push(createRow(["Sollstunden", `${formatNumber(analysis.summary.targetHours)} h`]));
  rows.push(createRow(["Iststunden", `${formatNumber(analysis.summary.actualHours)} h`]));
  rows.push(createRow(["Saldo", `${formatNumber(analysis.summary.balanceHours)} h`]));
  rows.push(createRow(["Urlaub", `${formatNumber(analysis.summary.vacationHours)} h`]));
  rows.push(createRow(["Krank", `${formatNumber(analysis.summary.sickHours)} h`]));
  rows.push(createRow(["Fortbildungstage", analysis.summary.trainingDays]));
  rows.push(createRow(["Nachtdienststunden", `${formatNumber(analysis.summary.distribution.nightHours)} h`]));
  rows.push(createRow(["Wochenenddienste", analysis.summary.distribution.weekendShiftCount]));
  rows.push(createRow(["Feiertagsarbeit", `${formatNumber(analysis.summary.distribution.holidayWorkHours)} h`]));
  rows.push(createRow(["Zuschlaege", formatEuro(analysis.summary.premiumTotalAmount)]));
  rows.push(createRow(["Pruefhinweise", analysis.summary.compliance.issueCount]));
  rows.push("");

  rows.push(createRow(["Monatsvergleich"]));
  rows.push(
    createRow([
      "Monat",
      "Sollstunden",
      "Iststunden",
      "Saldo",
      "Arbeitsdienste",
      "Urlaub h",
      "Krank h",
      "Nachtdienst h",
      "Wochenenddienste",
      "Feiertagsarbeit h",
      "Zuschlaege",
      "Pruefhinweise",
    ]),
  );

  for (const month of analysis.months) {
    rows.push(
      createRow([
        month.monthLabel,
        `${formatNumber(month.monthlyHours.targetHours)} h`,
        `${formatNumber(month.monthlyHours.actualHours)} h`,
        `${formatNumber(month.monthlyHours.balanceHours)} h`,
        month.monthlyHours.workShiftCount,
        `${formatNumber(month.monthlyHours.vacationHours)} h`,
        `${formatNumber(month.monthlyHours.sickHours)} h`,
        `${formatNumber(month.distribution.nightHours)} h`,
        month.distribution.weekendShiftCount,
        `${formatNumber(month.distribution.holidayWorkHours)} h`,
        formatEuro(month.monthlyPremiums.totalAmount),
        month.compliance.issueCount,
      ]),
    );
  }

  return rows.join("\r\n");
}

export function createYearlyReportCsvFileContent(
  input: YearlyReportCsvInput,
): string {
  return `\uFEFF${createYearlyReportCsv(input)}`;
}

export function downloadYearlyReportCsv(input: YearlyReportCsvInput): void {
  const content = createYearlyReportCsvFileContent(input);

  const blob = new Blob([content], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = createYearlyReportCsvFileName(input.analysis.year);

  document.body.appendChild(link);
  link.click();

  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
