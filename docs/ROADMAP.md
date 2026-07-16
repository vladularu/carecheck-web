# CareCheck - Master-Roadmap

Stand: waehrend Entwicklung `v1.9.3`

Aktuell stabil: `v1.9.2 - Datenschutz- und Sicherheitsgrundlage`

Aktiver Entwicklungszweig: `feature/v1.9.3-mock-sync-protocol`

## Abgeschlossen

### v1.0-v1.2.4: Produktgrundlage

- Dienstplanerfassung und Kalender
- Tagesdetails und Bearbeitung
- Soll-, Ist- und Differenzstunden
- Feiertage aller Bundeslaender
- Wochenendfolge-Pruefung
- TVoeD-P-Grundwerte und ArbZG-Basispruefung
- CSV-, XLSX- und Druckexport
- PWA-Installation
- JSON-Backup und Wiederherstellung
- Dienstvorlagen
- responsive Grundlage
- Premium-Dashboard und ShiftForm
- Kalender-Quick-Add

### v1.2.5-v1.2.7: Statistik und Qualitaet

- zentrale Statistik- und Compliance-Logik
- einheitliche Datenbasis fuer Dashboard und Kalender
- Tagesgesamtarbeitszeit und Tagespausen
- ununterbrochene Arbeitsphasen
- Nachtdienste ueber Mitternacht
- Urlaubs- und Krankstundenlogik
- Backup-Version 2 mit v1-Kompatibilitaet
- Storage-Validierung
- CSV-/XLSX-Haertung und Exporttests
- sichere Dateinamen
- XLSX Lazy Loading und Code-Splitting
- GitHub Actions
- 14 Testdateien und 125 bestandene Tests
- erfolgreicher ESLint- und Produktions-Build

### v1.2.8: UI Consistency

Ziel: eine einheitliche, verstaendliche und vorfuehrbare Produktoberflaeche.

- UI-Bestandsaufnahme
- zentrale Farben, Abstaende, Typografie und Design-Tokens
- Dashboard-Karten vereinheitlicht
- Kalender und Tagesdetails angeglichen
- Diensterfassung konsistenter gestaltet
- Profil, Vorlagen, Backup und Export angeglichen
- einheitliche Begriffe und Kennzahlen geschaerft
- iPhone-Ansicht priorisiert
- klassische Desktop-Uebersicht erhalten
- vollstaendige Regression mit Lint, Tests und Build
- GitHub Release `v1.2.8` erstellt

### v1.2.9: Reporting & Export

Ziel: Monatsbericht, CSV, XLSX und Druck/PDF-Ausgabe verstaendlicher, konsistenter und besser pruefbar machen, ohne Statistik-, Tarif- oder Compliance-Logik zu veraendern.

Bereits umgesetzt:

- einheitliche CSV-, XLSX- und Druckbegriffe ueber zentrale Report-Labels
- sortierbare Monatsbericht-Dateinamen fuer CSV, XLSX und Druck/PDF-Hinweis
- Exportvorschau in Dashboard und Monatsbericht
- nachvollziehbare Berechnungsgrundlagen im Monatsbericht
- verstaendlichere Pruefhinweise mit stabiler Compliance-Datenbasis
- gehaertete Druck-/PDF-Paginierung fuer Monatsbericht-Abschnitte
- Regressionstests fuer Exportnamen, Labels, Vorschau und Berichtskonsistenz
- erfolgreiche lokale Regression mit ESLint, Tests und Produktions-Build
- GitHub Release `v1.2.9` erstellt

### v1.3.0: TVoeD-P Fachmodul

- Schicht- und Wechselschichtindikatoren
- Nacht-, Sonntags- und Feiertagszuschlaege
- Samstagszuschlaege 13-21 Uhr
- Ueberschneidungen von Zuschlagszeitraeumen minutenbasiert behandelt
- Wochenendbewertung fuer den ausgewaehlten Monat
- Feiertage nach Bundesland ueber bestehendes Feiertagsmodul
- planmaessige und tatsaechliche Arbeitszeiten getrennt dargestellt
- transparente Trennung von ArbZG- und TVoeD-P-Auswertung
- tarifliche Werte versionierbar gemacht
- Regressionstests fuer Tarifversion, Zuschlagskollisionen und Fachmodul
- GitHub Release `v1.3.0` erstellt

Die jeweils aktuellen TVoeD-P-Regeln muessen vor produktiver Abrechnung fachlich und rechtlich geprueft werden.

### v1.4.0: Jahresauswertung

- Uebersicht ueber alle zwoelf Monate
- Jahres-Soll- und Iststunden
- kumulierter Stundensaldo
- Urlaub, Krankheit und Fortbildung
- Wochenend- und Nachtdienstverteilung
- Feiertagsarbeit
- Trends und Monatsvergleiche
- Jahresbericht als CSV-Export
- Regressionstests fuer Jahresauswertung und Export
- GitHub Release `v1.4.0` erstellt

### v1.5.0: Regelwerk und Transparenz

- zentraler Regelkatalog fuer alle bestehenden Compliance-Hinweise
- Erklaerung fuer jede Warnung und jeden kritischen Hinweis
- Darstellung der verwendeten Eingangsdaten je Hinweis
- verstaendliche Berechnungsschritte je Regeltyp
- Schweregrad-Erklaerungen fuer Info, Warnung und kritisch
- Verlinkung auf relevante ArbZG-Regelgrundlagen und interne CareCheck-Regeln
- aktives Pruefprofil mit dokumentierten Schwellenwerten
- dokumentierte Grenzen der Pruefung
- iPhone-taugliche Detailansicht mit aufklappbaren Regelinformationen
- Regressionstests fuer Regelzuordnung, Quellen, Pruefprofil und Eingangsdaten
- Release-Tag `v1.5.0` erstellt

### v1.6.0: Dienstplanpruefung und Fairness

- eigene Fairness-Seite mit Monatsnavigation
- aktuelle Person automatisch aus dem Dienstplan berechnet
- manuelle Teamvergleichswerte lokal gespeichert
- Vergleich von Nacht-, Wochenend- und Feiertagsdiensten
- Pruefung "grundsaetzlich jedes zweite Wochenende frei"
- individuelle Beschaeftigungsumfaenge ueber Wochenstundenanteil
- faire Verteilung nach Teilzeitanteil
- erkennbare Abweichungen und Belastungshinweise
- anonymisierbare Team-Auswertung
- Regressionstests fuer Fairness-Service und Storage
- Release-Tag `v1.6.0` erstellt

### v1.7.0: Planung und Komfort

- Komfortplanung direkt im Dienstplan
- wiederkehrende Dienstfolgen aus bestehenden Dienstvorlagen
- Monatsvorlagen lokal speichern und auf andere Monate anwenden
- Mehrfacherfassung ueber Dienstfolgen, Vorlagen und Import
- Kopieren und Verschieben kompletter Tagesplaene
- Konfliktvorschau fuer belegte Tage, Dubletten und zeitliche Ueberschneidungen
- verbesserte Such- und Filterfunktionen in der Dienstliste
- optionaler CSV-Import vorhandener Dienstplaene
- iPhone-taugliche Planungswerkzeuge und klassische Desktop-Uebersicht
- Regressionstests fuer Planungskomfort-Service und Vorlagen-Storage
- Statistik-, Tarif- und Compliance-Logik unveraendert gelassen
- Release-Tag `v1.7.0` erstellt
- GitHub Release `v1.7.0` erstellt

### v1.8.0: Product UI Refresh

Ziel: eine sauberere, demo-taugliche und primaer iPhone-orientierte Produktoberflaeche, ohne Statistik-, Tarif- oder Compliance-Logik zu veraendern.

- iPhone-first App-Navigation mit klaren Hauptbereichen
- sekundaere Bereiche ueber ein kompaktes Mehr-Menue
- ruhigere App-Shell mit klinisch sauberer Farb- und Flaechenwirkung
- kompaktere Karten, Buttons, Formulare und Seitenkoepfe
- Dashboard optisch sachlicher und vorfuehrbarer machen
- Planer und Komfortplanung visuell ordnen
- klassische Desktop-Uebersicht erhalten
- Barrierefreiheit und Tastaturbedienung pruefen
- vollstaendige Regression mit Lint, Tests und Build
- mobile Sichtpruefung im iPhone-Viewport `390x844`
- Release-Tag `v1.8.0` erstellt
- GitHub Release `v1.8.0` erstellt

### v1.9.0: Domain-Modell und Persistenzabstraktion

- Branch `feature/v1.9.0-sync-prep-data-model` angelegt
- persistente Datenstruktur fuer spaetere Synchronisierung pruefen
- lokale IDs, Versionierung und Konfliktfelder vorbereiten
- lokale Sync-Metadaten separat von Fachobjekten speichern
- Profil-, Dienst- und Dienstvorlagen-Aenderungen lokal revisionieren
- Planungsvorlagen und Fairness-Teamdaten lokal revisionieren
- Backup-/Restore-Kompatibilitaet bewahren
- Datenschutz- und Loeschkonzept fachlich vorbereiten
- Sync-Metadaten bleiben in v1.9.0 geraete-lokal und ausserhalb der Backups
- vollstaendiges lokales Loeschen in der Profil-UI absichern
- vollstaendigen lokalen Portabilitaets-Export bereitstellen
- Repository-Interfaces fuer Profil, Dienste, Dienstvorlagen, Planungsvorlagen, Fairness-Team und App-Daten einfuehren
- bestehenden Local-Storage-Adapter hinter Repository-Schicht kapseln
- AppContext und UI-Komponenten von konkreten Storage-Imports entkoppeln
- einheitliches technisches Domain-Grundmodell je relevanter Entitaet definieren
- Migration vorhandener lokaler Daten deterministisch vorbereiten
- Backup-Version 3 vorbereiten, mit Rueckwaertskompatibilitaet zu Backup v1 und v2
- beschaedigte Datensaetze isolieren statt ganze Importe abzubrechen

### v1.9.1: Lokale Datenintegritaet und IndexedDB

- IndexedDB-Adapter hinter der Repository-Schicht vorbereitet
- async Repository-Grenze fuer spaetere IndexedDB-Umschaltung ergaenzt
- Local Storage als Fallback bei nicht verfuegbarer IndexedDB definiert
- lokale Aenderungswarteschlange fuer spaetere Sync-Outbox vorbereitet
- Validierung vor dem Speichern ueber Repository-Adapter gestaerkt
- Datenintegritaetscheck fuer lokale CareCheck-Datenbereiche ergaenzt
- automatische Sicherung vor spaeteren Migrationen vorbereitet
- adapterunabhaengige Persistenz- und Repository-Tests ergaenzt
- Statistik-, Tarif-, Export- und Compliance-Logik unveraendert gelassen
- Release-Tag und GitHub Release `v1.9.1` erstellt

### v1.9.2: Datenschutz- und Sicherheitsgrundlage

- Dateninventar aller gespeicherten Informationen als technische Registry ergaenzt
- Datenklassen fuer Profil, Dienstplan, gesundheitsbezogene Abwesenheiten, Vorlagen, Fairness, Reports und technische Metadaten getrennt
- Export-Scope fuer Backup und Portabilitaetsexport pruefbar gemacht
- technische Sync-Metadaten, lokale Aenderungswarteschlange und Pre-Migration-Backups aus Nutzerexporten ausgeschlossen
- vollstaendige lokale Loeschung gegen alle bekannten CareCheck-Speicherschluessel abgeglichen
- Aufbewahrungsregeln und Bedrohungsmodell dokumentiert
- keine Secrets oder Backend-Schluessel im Frontend eingefuehrt
- optionale verschluesselte Backup-Dateien als offene v2.x-Entscheidung dokumentiert
- Datenschutztexte als technische Vorlage vorbereitet
- Statistik-, Tarif-, Export- und Compliance-Logik unveraendert gelassen
- Release-Tag und GitHub Release `v1.9.2` erstellt

## In Entwicklung

### v1.9.3: Synchronisationsprotokoll und Mock-Sync

- versioniertes Sync-Protokoll mit Push, Pull, Cursor, Tombstones und Outbox definiert
- idempotente Synchronisationsoperationen und Change-ID-Deduplizierung getestet
- deterministische Konfliktregeln je Datentyp festgelegt
- In-Memory-Mock-Sync-Server fuer mehrere simulierte Geraete ergaenzt
- Contract Tests fuer Client und spaeteres Backend vorbereitet
- keine Benutzerkonten, kein Backend und keine Cloud-Synchronisierung eingefuehrt
- Statistik-, Tarif-, Export- und Compliance-Logik unveraendert gelassen
- Empfehlung: `v1.9.3-beta` erst nach gruenem Mock-Sync-, Konflikt- und Contract-Testfenster erstellen

## Langfristige Produktreife

### v2.0.0-alpha.1: Backend und Benutzerkonten

- Backend-Varianten vor Implementierung vergleichen
- Registrierung, Anmeldung, Abmeldung und sichere Sitzung
- benutzerbezogene Datentrennung und serverseitige Zugriffsregeln
- lokaler Modus ohne Konto
- Uebernahme lokaler Daten in ein Konto ohne Berechnungsaenderung

### v2.0.0-alpha.2: Reale Synchronisationsengine

- lokale Outbox und serverseitiger Aenderungs-Cursor
- automatische Wiederholungsversuche und Offline-Warteschlange
- Synchronisation nach App-Start, lokalen Aenderungen und manuell
- Konflikterkennung, Deduplizierung und Wiederaufnahme nach Verbindungsabbruch

### v2.0.0-beta.1: Mehrgeraete-UX

- sichtbarer Synchronisationsstatus und Zeitpunkt der letzten Synchronisation
- ausstehende Aenderungen, Offline-Anzeige und Wiederholung
- Konfliktansicht und Geraeteverwaltung
- iPhone-first Sync-Oberflaeche mit vollstaendiger Desktop-Unterstuetzung

### v2.0.0-rc.1: Sicherheits-, Migrations- und Release-Audit

- Authentifizierung, Benutzertrennung, Sync, Migration, Backup und Restore pruefen
- Konto-Uebernahme, Konto-Loeschung, Offline-Betrieb und Konfliktbehandlung pruefen
- Monatswechsel, Jahreswechsel, Nachtdienste, Urlaub, Krankheit, Tarif und Compliance regressionspruefen
- Lint, Tests, Build, Release-Dokumentation und Datenschutzfunktionen als Release-Gates

### v2.0.0: Synchronisierung und Mehrgeraetebetrieb

- Benutzerkonten
- sichere Datensynchronisierung
- Nutzung auf mehreren Geraeten
- Datenschutz- und Loeschkonzept
- verschluesselte Datenuebertragung
- Rollen- und Berechtigungskonzept
- Offline-/Online-Konfliktbehandlung
- moegliche native iOS-/Android-Strategie

## Empfohlene Veroeffentlichungsphase

Die folgenden Pre-Releases sind Empfehlungen fuer sichere Testfenster. Sie ersetzen keine fachlichen Meilensteine und werden erst erstellt, wenn die jeweiligen Release-Gates erfolgreich sind.

### v1.9.0-alpha.1: Technischer Architekturstand

Empfohlen nach Abschluss von Repository-Schicht, Domain-Grundmodell, deterministischer Migration und Backup-v3-Vorbereitung.

Status v1.9.0: Gate erfuellt. Ein Alpha-Release bleibt optional und wurde nicht erstellt.

Ziel:

- lokale Daten bleiben erhalten
- alte Backups bleiben importierbar
- Statistik-, Tarif-, Export- und Compliance-Ergebnisse bleiben unveraendert
- keine Cloud-, Konto- oder Sync-Abhaengigkeit

### v1.9.0-beta.1: Lokale Datenmigration

Empfohlen nach erfolgreichen Migrationstests fuer alte Profile, alte Dienste, doppelte IDs, fehlende IDs, ungueltige Revisionen, aktive Entitaeten ohne Tombstone und wiederholte Migration.

Status v1.9.0: Gate erfuellt. Ein Beta-Release bleibt optional und wurde nicht erstellt.

Ziel:

- echte lokale Testgeraete koennen ohne Datenverlust migrieren
- Backup-v1/v2/v3-Roundtrip ist gruen
- beschaedigte Datensaetze werden isoliert statt den gesamten Import abzubrechen

### v1.9.1-beta: Robuste lokale Persistenz

Empfohlen nach IndexedDB-Adapter, Integritaetscheck, automatischer Sicherung vor Migrationen und Fallback bei nicht verfuegbarer IndexedDB.

Ziel:

- groessere Jahresdatenbestaende bleiben performant
- unterbrochene Schreib- oder Migrationsvorgaenge beschaedigen nicht den gesamten Datenbestand
- Backup und Restore funktionieren unabhaengig vom Speicheradapter

### v1.9.2-beta: Datenschutz- und Sicherheitspruefung

Empfohlen nach Dateninventar, Aufbewahrungsregeln, Bedrohungsmodell, Export-/Loeschpruefung und Kontrolle, dass keine Secrets oder Backend-Schluessel im Frontend liegen.

Ziel:

- Nutzer koennen Daten vollstaendig exportieren und lokal loeschen
- sensible Datenklassen sind dokumentiert
- Datenschutztexte liegen als technische Vorlage vor

### v1.9.3-beta: Mock-Sync und Konfliktverhalten

Empfohlen nach Mock-Sync, Outbox, Tombstones, Deduplizierung und deterministischen Konfliktregeln.

Ziel:

- mehrere simulierte Geraete koennen Daten austauschen
- wiederholte Uebertragung erzeugt keine Duplikate
- Konflikte veraendern keine Arbeitszeit- oder Compliance-Ergebnisse unbemerkt

### v2.0.0-alpha.1 bis v2.0.0-rc.1

- `v2.0.0-alpha.1`: Backend und Benutzerkonten fuer interne technische Tests
- `v2.0.0-alpha.2`: reale Synchronisationsengine fuer kontrollierte Mehrgeraete-Tests
- `v2.0.0-beta.1`: Mehrgeraete-UX fuer ausgewaehlte Tester
- `v2.0.0-rc.1`: Sicherheits-, Migrations- und Release-Audit vor stabilem Release

### Release-Gates fuer jede Alpha, Beta und RC

- ESLint erfolgreich
- alle Unit-, Integrations- und relevanten Contract Tests erfolgreich
- Produktions-Build erfolgreich
- Backup, Restore und Migration erfolgreich
- keine bekannten Datenverlustfehler
- keine Aenderung an Statistik-, Tarif-, Export- oder Compliance-Ergebnissen ohne dokumentierte fachliche Entscheidung
- Changelog, Roadmap und Audit-Dokumente aktualisiert
- GitHub Release als Pre-release markieren, solange es Alpha, Beta oder RC ist

## Spaetere Vision

- Einrichtungen und Teams
- gemeinschaftliche Dienstplanpruefung
- Betriebsrats- oder Mitarbeitervertretungsansicht
- konfigurierbare Tarif- und Betriebsregeln
- Import aus verbreiteten Dienstplansystemen
- nachvollziehbare Audit-Berichte
- optionale Cloud- und lokale Betriebsmodelle

## Verbindliche fachliche Grundlage

- FREE zaehlt keine Stunden und keinen Planungstag und wird nicht auf Compliance geprueft.
- VACATION, SICK und TRAINING bleiben planungs- und stundenrelevant.
- Urlaub und Krankheit gelten nicht als tatsaechliche ArbZG-Arbeitsdienste.
- EARLY, LATE, NIGHT, DAY und CUSTOM gelten als Arbeitsdienste.
- Nachtdienste ueber Mitternacht muessen korrekt verarbeitet werden.
- Compliance-Auswertungen beziehen sich auf den ausgewaehlten Monat.
- Datum: `dd.mm.yyyy`
- Uhrzeit: 24-Stunden-Format
- Mobile iPhone-Ansicht hat Prioritaet.
- Die klassische Desktop-Uebersicht bleibt erhalten.
