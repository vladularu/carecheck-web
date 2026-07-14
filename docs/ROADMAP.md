# CareCheck - Master-Roadmap

Stand: nach Release `v1.2.8`

Aktuell stabil: `v1.2.8 - UI Consistency`

Aktiver Hauptstand: `main`

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

## Naechste Meilensteine

### v1.2.9: Reporting & Export

- professioneller Monatsbericht
- verstaendliche Pruefhinweise
- einheitliche CSV-, XLSX- und Druckausgaben
- nachvollziehbare Berechnungsgrundlagen
- Exportvorschau
- bessere Dateinamen und Monatszuordnung
- PDF-Bericht pruefen beziehungsweise ergaenzen

### v1.3.0: TVoeD-P Fachmodul

- Schicht- und Wechselschichtlogik
- Nacht-, Sonntags- und Feiertagszuschlaege
- Samstagszuschlaege
- Ueberschneidungen von Zuschlagszeitraeumen
- Wochenendbewertung
- Feiertage nach Bundesland
- planmaessige und tatsaechliche Arbeitszeiten
- transparente Trennung von ArbZG- und TVoeD-P-Pruefungen
- tarifliche Werte versionierbar machen

Vor Umsetzung muessen die jeweils aktuellen TVoeD-P-Regeln fachlich und rechtlich geprueft werden.

### v1.4.0: Jahresauswertung

- Uebersicht ueber alle zwoelf Monate
- Jahres-Soll- und Iststunden
- kumulierter Stundensaldo
- Urlaub, Krankheit und Fortbildung
- Wochenend- und Nachtdienstverteilung
- Feiertagsarbeit
- Trends und Monatsvergleiche
- Jahresbericht und Export

### v1.5.0: Regelwerk und Transparenz

- Erklaerung fuer jede Warnung
- Darstellung der verwendeten Eingangsdaten
- verstaendliche Berechnungsschritte
- Schweregrade fuer Hinweise und Verstoesse
- Verlinkung auf relevante Regelgrundlagen
- konfigurierbare Pruefregeln
- dokumentierte Grenzen der Pruefung

### v1.6.0: Dienstplanpruefung und Fairness

- Dienstverteilung innerhalb eines Teams
- Vergleich von Nacht-, Wochenend- und Feiertagsdiensten
- Pruefung "grundsaetzlich jedes zweite Wochenende frei"
- individuelle Beschaeftigungsumfaenge
- faire Verteilung nach Teilzeitanteil
- erkennbare Abweichungen
- anonymisierbare Team-Auswertung

### v1.7.0: Planung und Komfort

- wiederkehrende Dienstfolgen
- Monatsvorlagen
- Mehrfacherfassung
- Kopieren und Verschieben von Diensten
- Konfliktwarnungen direkt bei der Eingabe
- verbesserte Such- und Filterfunktionen
- optionaler Import vorhandener Dienstplaene

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
