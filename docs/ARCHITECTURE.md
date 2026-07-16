# CareCheck Architektur

## Persistenzgrenzen

CareCheck bleibt in v1.9.0 eine lokale Offline-App. Die fachlichen Services fuer Statistik, Tarif, Export und Compliance erhalten weiterhin reine Eingabedaten und kennen kein konkretes Speichermedium.

Die Persistenz wird schrittweise in drei Ebenen getrennt:

- UI und AppContext nutzen Repository-Interfaces.
- Repository-Implementierungen koordinieren Laden, Speichern und lokale Sync-Revisionen.
- Storage-Adapter kapseln das konkrete Browser-Speichermedium.

Aktueller Adapter:

- `localCareCheckRepositories.ts` nutzt die bestehenden Local-Storage-Services.
- `indexedDbCareCheckRepositories.ts` bereitet dieselben Domaenen ueber eine async Repository-Schicht fuer IndexedDB vor.
- `persistenceAdapter.ts` kapselt IndexedDB, Local Storage, Memory-Testspeicher und Fallback-Kombinationen.
- Direkte `localStorage`-Zugriffe bleiben in `src/services/storage`.
- UI-Komponenten importieren keine konkreten Storage-Services mehr.

## Repository-Schnittstellen

Die erste Repository-Grenze umfasst:

- `ProfileRepository`
- `ShiftRepository`
- `ShiftTemplateRepository`
- `PlanningTemplateRepository`
- `FairnessTeamRepository`
- `AppDataRepository`

Diese Schicht ist bewusst klein gehalten. Sie veraendert keine Fachberechnung und keine Backup-Version. Spaetere Schritte koennen hier Domain-Metadaten, Migration, IndexedDB und Mock-Sync anhaengen.

Ab v1.9.1 existiert zusaetzlich eine async Repository-Grenze mit denselben Domaenen. Sie ist fuer IndexedDB, adapterunabhaengiges Backup/Restore und spaetere Synchronisation vorbereitet, wird aber noch nicht als produktiver AppContext-Speicher erzwungen.

## Technisches Domain-Grundmodell

`domainModel.ts` definiert eine additive technische Huelle fuer relevante Fachdaten. Sie beschreibt:

- stabile ID
- Schema-Version
- Erstellungszeitpunkt
- Aenderungszeitpunkt
- Revision
- Datenherkunft
- optionalen Loeschzeitpunkt
- kuenftige Benutzerzuordnung
- kuenftige Geraetezuordnung
- Konfliktstatus

Abgedeckte Domaenen:

- Profil
- Dienste
- Dienstvorlagen
- Planungsvorlagen
- Fairness-Teamdaten
- Tarifkonfiguration
- Pruefprofil
- App-Einstellungen

Das Modell ist noch keine produktive Migration. Bestehende Fachdaten bleiben unveraendert gespeichert; die deterministische Migration wird derzeit fuer Export-, Backup- und spaetere Sync-Grenzen vorbereitet.

## Migrationsvorbereitung

`domainMigrationService.ts` bereitet die Migration vorhandener lokaler Daten deterministisch vor:

- vorhandene IDs bleiben erhalten
- fehlende IDs werden aus einem stabilen Seed erzeugt
- doppelte IDs werden fuer nachfolgende Datensaetze deterministisch ersetzt
- Migrationswarnungen dokumentieren fehlende oder doppelte IDs
- der Service schreibt keine Daten zurueck

Damit kann Backup-Version 3 auf einem pruefbaren Domain-Snapshot aufbauen, ohne die aktuelle lokale Speicherung sofort umzubauen.

## Backup-Version 3

Backup-Version 3 transportiert weiterhin die fachlichen CareCheck-Daten und bleibt rueckwaertskompatibel zu Backup v1 und v2.

Enthalten sind:

- Profil
- Dienste
- Dienstvorlagen
- Planungsvorlagen
- Fairness-Teamdaten
- deterministisch erzeugter Domain-Snapshot

Geraetespezifische Sync-Metadaten bleiben bewusst ausserhalb des Backups. Beim Restore alter v1/v2-Backups werden nur die alten Datenbereiche ersetzt; v3-Datenbereiche wie Planungsvorlagen und Fairness-Teamdaten werden dadurch nicht geloescht.

Beim Import werden beschaedigte Eintraege in Diensten, Dienstvorlagen, Planungsvorlagen und Fairness-Teamdaten isoliert. Gueltige Eintraege bleiben importierbar; uebersprungene Eintraege werden als Import-Warnungen am Backup-Ergebnis ausgewiesen.

## Lokale Datenintegritaet und IndexedDB-Vorbereitung

v1.9.1 ergaenzt technische Persistenzbausteine, ohne die bestehende UI-Laufzeit oder Fachberechnung auf ein neues Speichermedium umzuschalten:

- IndexedDB-Adapter mit Key-Value-Store `carecheck-local-data`
- Local-Storage-Fallback, falls IndexedDB nicht verfuegbar ist oder eine Operation fehlschlaegt
- lokale Aenderungswarteschlange unter `carecheck.localChangeQueue.v1`
- Integritaetscheck fuer Profil, Dienste, Dienstvorlagen, Planungsvorlagen, Fairness-Teamdaten, Sync-Metadaten und lokale Queue
- technische Pre-Migration-Backups unter `carecheck.preMigrationBackups.v1`
- Helper fuer kuenftige Migrationen, die vor dem Migrationsschritt automatisch ein Backup erstellt

Die neuen Bausteine sind additiv. Die bestehende synchrone Local-Storage-Repository-Schicht bleibt fuer die aktuelle App-Oberflaeche erhalten.

## Datenschutz- und Sicherheitsgrundlage

v1.9.2 ergaenzt eine technische Datenschutz-Registry unter `src/services/security/dataProtectionRegistry.ts`.

Die Registry dokumentiert und prueft:

- alle bekannten lokalen CareCheck-Speicherschluessel
- Datenklasse und Sensitivitaet je Datenbereich
- lokalen Zweck und Aufbewahrung
- Loeschpfad ueber die zentrale lokale Loeschfunktion
- Backup- und Portabilitaetsumfang
- technische Datenbereiche, die aus Nutzerexporten ausgeschlossen bleiben

Der Portabilitaetsexport nutzt die Registry fuer `includedLocalData` und `excludedLocalData`. Backup und Portabilitaetsexport werden ueber Export-Scope-Tests gegen unbeabsichtigte technische Datenfelder abgesichert.

Aus Nutzerexporten ausgeschlossen:

- `carecheck.syncMetadata.v1`
- `carecheck.localChangeQueue.v1`
- `carecheck.preMigrationBackups.v1`

Die Datenschutztext-Vorlage in `docs/V1.9.2_PRIVACY_TEXT_TEMPLATE.md` ist eine technische Vorlage und ersetzt keine fachliche oder rechtliche Pruefung.

## Synchronisationsprotokoll und Mock-Sync

v1.9.3 ergaenzt eine lokale Contract-Schicht fuer spaetere Synchronisierung, ohne bereits ein Backend, Benutzerkonten oder produktiven Cloud-Sync einzufuehren.

Die Sync-Schicht liegt unter `src/services/sync` und umfasst:

- `syncProtocol.ts` fuer Push-/Pull-Requests, Cursor, Remote-Changes, Outbox-Change-IDs und Tombstones
- `syncConflictRules.ts` fuer deterministische Konfliktregeln je syncbarer Domaene
- `mockSyncAdapter.ts` fuer einen In-Memory-Mock-Sync-Server mit mehreren simulierten Geraeten

Das Protokoll nutzt monotone Cursor-Revisionen und stabile Change-IDs aus Device-ID und Outbox-Eintrag. Wiederholte Pushes werden dedupliziert. Delete-Changes werden als Tombstones transportiert. Stale Pushes gegen eine neuere Remote-Revision werden als `remote-newer` zurueckgewiesen.

Die Mock-Schicht ist ein Test- und Vertragswerkzeug. Sie schreibt keine App-Daten produktiv um und aendert keine Statistik-, Tarif-, Export- oder Compliance-Berechnung.

## Abgrenzung

Noch nicht umgesetzt:

- produktive Migration vorhandener lokaler Daten in dieses Modell
- produktive Umschaltung des AppContext auf IndexedDB
- finale Datenschutzerklaerung oder Rechtspruefung
- verschluesselte Backup-Dateien
- produktive Cloud-Synchronisierung
- Benutzerkonten, Backend und echte Mehrgeraete-Sitzungen
