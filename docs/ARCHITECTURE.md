# CareCheck Architektur

## Persistenzgrenzen

CareCheck bleibt in v1.9.0 eine lokale Offline-App. Die fachlichen Services fuer Statistik, Tarif, Export und Compliance erhalten weiterhin reine Eingabedaten und kennen kein konkretes Speichermedium.

Die Persistenz wird schrittweise in drei Ebenen getrennt:

- UI und AppContext nutzen Repository-Interfaces.
- Repository-Implementierungen koordinieren Laden, Speichern und lokale Sync-Revisionen.
- Storage-Adapter kapseln das konkrete Browser-Speichermedium.

Aktueller Adapter:

- `localCareCheckRepositories.ts` nutzt die bestehenden Local-Storage-Services.
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

Das Modell ist noch keine Migration. Bestehende Fachdaten bleiben unveraendert gespeichert, bis der deterministische Migrationsschritt und Backup-Version 3 umgesetzt sind.

## Abgrenzung

Noch nicht umgesetzt:

- Migration vorhandener lokaler Daten in dieses Modell
- Backup-Version 3
- IndexedDB-Adapter
- Mock-Sync oder Cloud-Sync
