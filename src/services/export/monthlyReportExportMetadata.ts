export type MonthlyReportExportExtension =
  | "csv"
  | "xlsx";

export interface MonthlyReportExportMetadata {
  displayMonthLabel: string;
  monthKey: string;
  fileMonthPart: string;
  fileBaseName: string;
}

interface MonthDefinition {
  aliases: string[];
  displayName: string;
  fileName: string;
  monthNumber: number;
}

const monthDefinitions: MonthDefinition[] = [
  {
    aliases: ["januar"],
    displayName: "Januar",
    fileName: "Januar",
    monthNumber: 1,
  },
  {
    aliases: ["februar"],
    displayName: "Februar",
    fileName: "Februar",
    monthNumber: 2,
  },
  {
    aliases: ["marz", "maerz"],
    displayName: "März",
    fileName: "Maerz",
    monthNumber: 3,
  },
  {
    aliases: ["april"],
    displayName: "April",
    fileName: "April",
    monthNumber: 4,
  },
  {
    aliases: ["mai"],
    displayName: "Mai",
    fileName: "Mai",
    monthNumber: 5,
  },
  {
    aliases: ["juni"],
    displayName: "Juni",
    fileName: "Juni",
    monthNumber: 6,
  },
  {
    aliases: ["juli"],
    displayName: "Juli",
    fileName: "Juli",
    monthNumber: 7,
  },
  {
    aliases: ["august"],
    displayName: "August",
    fileName: "August",
    monthNumber: 8,
  },
  {
    aliases: ["september"],
    displayName: "September",
    fileName: "September",
    monthNumber: 9,
  },
  {
    aliases: ["oktober"],
    displayName: "Oktober",
    fileName: "Oktober",
    monthNumber: 10,
  },
  {
    aliases: ["november"],
    displayName: "November",
    fileName: "November",
    monthNumber: 11,
  },
  {
    aliases: ["dezember"],
    displayName: "Dezember",
    fileName: "Dezember",
    monthNumber: 12,
  },
];

function removeControlCharacters(value: string): string {
  return Array.from(value)
    .filter((character) => {
      const codePoint =
        character.codePointAt(0) ?? 0;

      return (
        codePoint >= 32 &&
        codePoint !== 127
      );
    })
    .join("");
}

function transliterateGermanCharacters(
  value: string,
): string {
  return value
    .replace(/Ä/g, "Ae")
    .replace(/Ö/g, "Oe")
    .replace(/Ü/g, "Ue")
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss");
}

function sanitizeFileNamePart(
  value: string,
  fallback: string,
): string {
  const sanitized =
    transliterateGermanCharacters(
      removeControlCharacters(value),
    )
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim()
      .replace(/[<>:"/\\|?*]/g, "")
      .replace(/\s+/g, "_")
      .replace(/_+/g, "_")
      .replace(/^\.+|\.+$/g, "");

  return sanitized || fallback;
}

function normalizeForSearch(value: string): string {
  return transliterateGermanCharacters(
    removeControlCharacters(value),
  )
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function getYear(value: string): number | null {
  const match =
    removeControlCharacters(value).match(
      /(?:^|\D)(\d{4})(?:\D|$)/,
    );

  if (!match) {
    return null;
  }

  return Number(match[1]);
}

function getMonthDefinition(
  value: string,
): MonthDefinition | null {
  const tokens = normalizeForSearch(
    value,
  ).split(/\s+/);

  return (
    monthDefinitions.find((definition) =>
      definition.aliases.some((alias) =>
        tokens.includes(alias),
      ),
    ) ?? null
  );
}

function formatMonthKey(
  year: number,
  monthNumber: number,
): string {
  return `${year}-${String(monthNumber).padStart(
    2,
    "0",
  )}`;
}

export function createMonthlyReportExportMetadata(
  monthLabel: string,
): MonthlyReportExportMetadata {
  const displayMonthLabel =
    removeControlCharacters(monthLabel)
      .trim()
      .replace(/\s+/g, " ") ||
    "Monatsbericht";

  const year = getYear(displayMonthLabel);
  const monthDefinition =
    getMonthDefinition(displayMonthLabel);

  if (year !== null && monthDefinition) {
    const monthKey = formatMonthKey(
      year,
      monthDefinition.monthNumber,
    );
    const fileMonthPart = `${monthKey}_${monthDefinition.fileName}`;

    return {
      displayMonthLabel: `${monthDefinition.displayName} ${year}`,
      monthKey,
      fileMonthPart,
      fileBaseName: `CareCheck_Monatsbericht_${fileMonthPart}`,
    };
  }

  const fileMonthPart = sanitizeFileNamePart(
    displayMonthLabel,
    "Monatsbericht",
  );

  return {
    displayMonthLabel,
    monthKey: fileMonthPart,
    fileMonthPart,
    fileBaseName: `CareCheck_Monatsbericht_${fileMonthPart}`,
  };
}

export function createMonthlyReportExportFileName(
  monthLabel: string,
  extension: MonthlyReportExportExtension,
): string {
  return `${createMonthlyReportExportMetadata(
    monthLabel,
  ).fileBaseName}.${extension}`;
}
