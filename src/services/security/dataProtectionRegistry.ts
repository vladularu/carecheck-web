import { CARECHECK_LOCAL_STORAGE_KEYS } from "../storage/appDataStorage";

export type CareCheckDataClass =
  | "profile"
  | "shift-plan"
  | "template"
  | "fairness"
  | "technical-metadata"
  | "technical-backup"
  | "report-output";

export type CareCheckDataSensitivity =
  | "personal"
  | "sensitive"
  | "technical";

export type CareCheckExportKind =
  | "backup"
  | "portability";

export type CareCheckExportScope =
  | "included"
  | "excluded"
  | "not-applicable";

export interface DataProtectionInventoryEntry {
  id: string;
  name: string;
  storageKey?: (typeof CARECHECK_LOCAL_STORAGE_KEYS)[number];
  dataClass: CareCheckDataClass;
  sensitivity: CareCheckDataSensitivity;
  purpose: string;
  retention: string;
  localDeletion: string;
  backupExport: CareCheckExportScope;
  portabilityExport: CareCheckExportScope;
  exportExclusionReason?: string;
  notes: string;
}

export interface LocalDataCategory {
  key: string;
  name: string;
}

export interface ExcludedLocalDataCategory
  extends LocalDataCategory {
  reason: string;
}

export interface ExportScopeDefinition {
  kind: CareCheckExportKind;
  allowedRootKeys: string[];
  allowedDataKeys: string[];
  excludedLocalStorageKeys: string[];
}

export interface ExportScopeValidationInput {
  kind: CareCheckExportKind;
  rootKeys: string[];
  dataKeys?: string[];
}

export interface ExportScopeIssue {
  path: string;
  key: string;
  message: string;
}

export interface ExportScopeValidationResult {
  kind: CareCheckExportKind;
  ok: boolean;
  issues: ExportScopeIssue[];
}

const dataProtectionInventory: DataProtectionInventoryEntry[] =
  [
    {
      id: "profile",
      name: "Profil",
      storageKey: "carecheck.profile",
      dataClass: "profile",
      sensitivity: "personal",
      purpose:
        "Grunddaten fuer Bundesland, Sollstunden und TVoeD-P-nahe Auswertung.",
      retention:
        "Lokal gespeichert, bis der Nutzer die Daten aendert oder alle lokalen Daten loescht.",
      localDeletion:
        "Wird durch die zentrale lokale Loeschfunktion entfernt.",
      backupExport: "included",
      portabilityExport: "included",
      notes:
        "Enthaelt keine direkte Identitaet, kann aber personenbezogen sein, sobald die App nur fuer eine Person genutzt wird.",
    },
    {
      id: "shifts",
      name: "Dienste und Abwesenheiten",
      storageKey: "carecheck.shifts",
      dataClass: "shift-plan",
      sensitivity: "sensitive",
      purpose:
        "Dienstplanung, Arbeitszeitpruefung, Zuschlaege, Berichte und Auswertungen.",
      retention:
        "Lokal gespeichert, bis einzelne Dienste oder alle lokalen Daten geloescht werden.",
      localDeletion:
        "Wird durch Dienstloeschung oder zentrale lokale Loeschfunktion entfernt.",
      backupExport: "included",
      portabilityExport: "included",
      notes:
        "Kann Notizen, Krankheits- und Abwesenheitsinformationen enthalten und ist daher besonders vorsichtig zu behandeln.",
    },
    {
      id: "shiftTemplates",
      name: "Dienstvorlagen",
      storageKey: "carecheck.shiftTemplates",
      dataClass: "template",
      sensitivity: "personal",
      purpose:
        "Wiederverwendbare Dienstzeiten fuer schnellere Erfassung.",
      retention:
        "Lokal gespeichert, bis Vorlagen geaendert oder alle lokalen Daten geloescht werden.",
      localDeletion:
        "Wird durch die zentrale lokale Loeschfunktion entfernt.",
      backupExport: "included",
      portabilityExport: "included",
      notes:
        "Vorlagen sind meist weniger sensibel als echte Dienste, koennen aber Arbeitsmuster einer Person erkennen lassen.",
    },
    {
      id: "planningTemplates",
      name: "Planungsvorlagen",
      storageKey:
        "carecheck.planningTemplates.v1",
      dataClass: "template",
      sensitivity: "sensitive",
      purpose:
        "Wiederverwendbare Monatsmuster und Komfortplanung.",
      retention:
        "Lokal gespeichert, bis Vorlagen geaendert oder alle lokalen Daten geloescht werden.",
      localDeletion:
        "Wird durch die zentrale lokale Loeschfunktion entfernt.",
      backupExport: "included",
      portabilityExport: "included",
      notes:
        "Kann Dienst- und Abwesenheitsmuster enthalten.",
    },
    {
      id: "fairnessTeam",
      name: "Fairness-Teamdaten",
      storageKey: "carecheck.fairnessTeam.v1",
      dataClass: "fairness",
      sensitivity: "personal",
      purpose:
        "Lokaler Vergleich von Dienstbelastung und Fairness-Kennzahlen.",
      retention:
        "Lokal gespeichert, bis Teamdaten geaendert oder alle lokalen Daten geloescht werden.",
      localDeletion:
        "Wird durch die zentrale lokale Loeschfunktion entfernt.",
      backupExport: "included",
      portabilityExport: "included",
      notes:
        "Kann Teamvergleichswerte enthalten. Namen sollten nach Moeglichkeit anonymisiert werden.",
    },
    {
      id: "syncMetadata",
      name: "Sync-Metadaten",
      storageKey: "carecheck.syncMetadata.v1",
      dataClass: "technical-metadata",
      sensitivity: "technical",
      purpose:
        "Geraetelokale Revisionen, Entity-Keys, Konflikt- und Tombstone-Vorbereitung.",
      retention:
        "Lokal gespeichert, bis alle lokalen Daten geloescht werden.",
      localDeletion:
        "Wird durch die zentrale lokale Loeschfunktion entfernt.",
      backupExport: "excluded",
      portabilityExport: "excluded",
      exportExclusionReason:
        "Geraetespezifische technische Revisionen; kein fachlicher Portabilitaetsinhalt.",
      notes:
        "Darf vor realem Sync nicht unbewertet in Backup oder Datenexport wandern.",
    },
    {
      id: "localChangeQueue",
      name: "Lokale Aenderungswarteschlange",
      storageKey:
        "carecheck.localChangeQueue.v1",
      dataClass: "technical-metadata",
      sensitivity: "technical",
      purpose:
        "Vorbereitung einer spaeteren lokalen Outbox fuer Synchronisation.",
      retention:
        "Lokal gespeichert, bis Aenderungen verarbeitet oder alle lokalen Daten geloescht werden.",
      localDeletion:
        "Wird durch die zentrale lokale Loeschfunktion entfernt.",
      backupExport: "excluded",
      portabilityExport: "excluded",
      exportExclusionReason:
        "Technische Outbox fuer spaetere Synchronisation; kein fachlicher Exportinhalt.",
      notes:
        "Kann Entity-IDs und Aenderungszeitpunkte enthalten, aber keine vollstaendigen Fachobjekte.",
    },
    {
      id: "preMigrationBackups",
      name: "Technische Pre-Migration-Backups",
      storageKey:
        "carecheck.preMigrationBackups.v1",
      dataClass: "technical-backup",
      sensitivity: "sensitive",
      purpose:
        "Kurzfristige lokale Sicherung vor spaeteren technischen Migrationen.",
      retention:
        "Lokal rollierend auf die letzten fuenf Sicherungen begrenzt.",
      localDeletion:
        "Wird durch die zentrale lokale Loeschfunktion entfernt.",
      backupExport: "excluded",
      portabilityExport: "excluded",
      exportExclusionReason:
        "Technische Sicherheitskopie kann sensible Fachdaten duplizieren und bleibt geraetelokal.",
      notes:
        "Nicht in Nutzerexporte aufnehmen, damit alte technische Zwischenstaende nicht versehentlich verbreitet werden.",
    },
    {
      id: "generatedReports",
      name: "Monats- und Jahresberichte",
      dataClass: "report-output",
      sensitivity: "sensitive",
      purpose:
        "Vom Nutzer erzeugte CSV-, XLSX- und Druck-/PDF-Berichte.",
      retention:
        "Nicht in der App gespeichert; exportierte Dateien liegen ausserhalb des App-Speichers.",
      localDeletion:
        "Muss vom Nutzer im Dateisystem oder Browser-Downloadbereich geloescht werden.",
      backupExport: "not-applicable",
      portabilityExport: "not-applicable",
      notes:
        "Berichte koennen Dienstzeiten, Abwesenheiten, Zuschlaege und Pruefhinweise enthalten.",
    },
  ];

const exportScopes: Record<
  CareCheckExportKind,
  ExportScopeDefinition
> = {
  backup: {
    kind: "backup",
    allowedRootKeys: [
      "app",
      "backupVersion",
      "exportedAt",
      "profile",
      "shifts",
      "shiftTemplates",
      "planningTemplates",
      "fairnessTeamMembers",
      "domainSnapshot",
      "sourceBackupVersion",
      "importIssues",
    ],
    allowedDataKeys: [],
    excludedLocalStorageKeys:
      getExcludedStorageKeys("backup"),
  },
  portability: {
    kind: "portability",
    allowedRootKeys: [
      "app",
      "exportType",
      "exportVersion",
      "exportedAt",
      "format",
      "data",
      "metadata",
    ],
    allowedDataKeys: [
      "profile",
      "shifts",
      "shiftTemplates",
      "planningTemplates",
      "fairnessTeamMembers",
    ],
    excludedLocalStorageKeys:
      getExcludedStorageKeys(
        "portability",
      ),
  },
};

function getExcludedStorageKeys(
  kind: CareCheckExportKind,
): string[] {
  return dataProtectionInventory
    .filter((entry) => {
      const scope =
        kind === "backup"
          ? entry.backupExport
          : entry.portabilityExport;

      return (
        Boolean(entry.storageKey) &&
        scope === "excluded"
      );
    })
    .map((entry) => entry.storageKey as string);
}

function cloneEntry(
  entry: DataProtectionInventoryEntry,
): DataProtectionInventoryEntry {
  return {
    ...entry,
  };
}

function createLocalDataCategory(
  entry: DataProtectionInventoryEntry,
): LocalDataCategory {
  return {
    key: entry.storageKey ?? entry.id,
    name: entry.name,
  };
}

function createExcludedLocalDataCategory(
  entry: DataProtectionInventoryEntry,
): ExcludedLocalDataCategory {
  return {
    ...createLocalDataCategory(entry),
    reason:
      entry.exportExclusionReason ??
      "Datenbereich ist fuer diesen Export nicht vorgesehen.",
  };
}

export function getCareCheckDataProtectionInventory(): DataProtectionInventoryEntry[] {
  return dataProtectionInventory.map(
    cloneEntry,
  );
}

export function getCareCheckStoredDataKeys(): string[] {
  return dataProtectionInventory
    .filter((entry) =>
      Boolean(entry.storageKey),
    )
    .map((entry) => entry.storageKey as string);
}

export function getIncludedLocalDataForPortabilityExport(): LocalDataCategory[] {
  return dataProtectionInventory
    .filter(
      (entry) =>
        entry.storageKey &&
        entry.portabilityExport ===
          "included",
    )
    .map(createLocalDataCategory);
}

export function getExcludedLocalDataForPortabilityExport(): ExcludedLocalDataCategory[] {
  return dataProtectionInventory
    .filter(
      (entry) =>
        entry.storageKey &&
        entry.portabilityExport ===
          "excluded",
    )
    .map(
      createExcludedLocalDataCategory,
    );
}

export function getCareCheckExportScope(
  kind: CareCheckExportKind,
): ExportScopeDefinition {
  const scope = exportScopes[kind];

  return {
    kind: scope.kind,
    allowedRootKeys: [
      ...scope.allowedRootKeys,
    ],
    allowedDataKeys: [
      ...scope.allowedDataKeys,
    ],
    excludedLocalStorageKeys: [
      ...scope.excludedLocalStorageKeys,
    ],
  };
}

export function validateCareCheckExportScope({
  kind,
  rootKeys,
  dataKeys = [],
}: ExportScopeValidationInput): ExportScopeValidationResult {
  const scope = getCareCheckExportScope(kind);
  const rootKeySet = new Set(
    scope.allowedRootKeys,
  );
  const dataKeySet = new Set(
    scope.allowedDataKeys,
  );
  const issues: ExportScopeIssue[] = [];

  rootKeys.forEach((key) => {
    if (!rootKeySet.has(key)) {
      issues.push({
        path: key,
        key,
        message:
          "Dieser Top-Level-Schluessel ist fuer den Export nicht freigegeben.",
      });
    }
  });

  dataKeys.forEach((key) => {
    if (!dataKeySet.has(key)) {
      issues.push({
        path: `data.${key}`,
        key,
        message:
          "Dieser Daten-Schluessel ist fuer den Export nicht freigegeben.",
      });
    }
  });

  return {
    kind,
    ok: issues.length === 0,
    issues,
  };
}
