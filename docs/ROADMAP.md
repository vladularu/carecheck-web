# CareCheck - Master-Roadmap

Stand: nach Release-Tag `v1.8.0`

Aktuell stabil: `v1.8.0 - Product UI Refresh`

Aktiver Entwicklungszweig: `feature/v1.9.0-sync-prep-data-model`

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

## In Entwicklung

### v1.9.0: Sync-Vorbereitung und Datenmodell

- Branch `feature/v1.9.0-sync-prep-data-model` angelegt
- persistente Datenstruktur fuer spaetere Synchronisierung pruefen
- lokale IDs, Versionierung und Konfliktfelder vorbereiten
- lokale Sync-Metadaten separat von Fachobjekten speichern
- Profil-, Dienst- und Dienstvorlagen-Aenderungen lokal revisionieren
- Planungsvorlagen und Fairness-Teamdaten lokal revisionieren
- Backup-/Restore-Kompatibilitaet bewahren
- Datenschutz- und Loeschkonzept fachlich vorbereiten
- Sync-Metadaten bleiben in v1.9.0 geraete-lokal und ausserhalb von Backup-Version 2
- vollstaendiges lokales Loeschen in der Profil-UI absichern
- vollstaendigen lokalen Portabilitaets-Export bereitstellen

## Langfristige Produktreife

### v2.0: Synchronisierung und Mehrgeraetebetrieb

- Benutzerkonten
- sichere Datensynchronisierung
- Nutzung auf mehreren Geraeten
- Datenschutz- und Loeschkonzept
- verschluesselte Datenuebertragung
- Rollen- und Berechtigungskonzept
- Offline-/Online-Konfliktbehandlung
- moegliche native iOS-/Android-Strategie

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
