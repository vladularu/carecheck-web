# Changelog

## v1.9.2 - in Entwicklung

- Zentrales Datenschutz-Dateninventar fuer lokale CareCheck-Speicherbereiche ergaenzt.
- Datenklassen fuer Profil, Dienste, Abwesenheiten, Vorlagen, Fairness und technische Metadaten dokumentiert.
- Export-Scope-Guard fuer Backup und Portabilitaetsexport ergaenzt.
- Technische Sync-Metadaten, lokale Aenderungswarteschlange und Pre-Migration-Backups bleiben aus Nutzerexporten ausgeschlossen.
- Aufbewahrungsregeln, Bedrohungsmodell und Datenschutztext-Vorlage dokumentiert.
- Regressionstests fuer Dateninventar und Export-Scope ergaenzt.
- Statistik-, Tarif-, Export- und Compliance-Berechnungslogik unveraendert gelassen.

## v1.9.1

- IndexedDB-Adapter hinter einer async Repository-Schicht vorbereitet.
- Local-Storage-Fallback fuer Browser ohne verfuegbare IndexedDB definiert.
- Lokale Aenderungswarteschlange fuer spaetere Sync-Outbox vorbereitet.
- Datenintegritaetscheck fuer lokale CareCheck-Datenbereiche ergaenzt.
- Automatische technische Sicherung vor spaeteren Migrationen vorbereitet.
- Adapterunabhaengige Tests fuer Persistenz, Queue, Integritaet und async Repository-Grenze ergaenzt.
- Statistik-, Tarif-, Export- und Compliance-Berechnungslogik unveraendert gelassen.

## v1.9.0

- Sync-Vorbereitung als lokales Datenmodell ohne Cloud-Anbindung gestartet.
- Separate Sync-Metadaten mit Schema-Version, Device-ID, lokalen Revisionen, Soft-Delete- und Konfliktfeldern ergaenzt.
- Profil-, Dienst- und Dienstvorlagen-Aenderungen markieren kuenftig lokale Revisionen.
- Planungsvorlagen und Fairness-Teamdaten in die lokale Revisionierung aufgenommen.
- Datenschutz- und Loeschkonzept inklusive Backup-Entscheidung dokumentiert.
- Profil-UI zum vollstaendigen lokalen Loeschen mit zweistufiger Bestaetigung ergaenzt.
- Separaten Portabilitaets-Export fuer Profil, Dienste, Vorlagen, Planung und Fairness ergaenzt.
- Repository-Interfaces und lokale Adapter fuer die erste Persistenzabstraktion ergaenzt.
- AppContext, Planer, Fairness und Profil-Datenkarte von konkreten Storage-Imports entkoppelt.
- Empfohlene Alpha-, Beta- und RC-Veroeffentlichungsphase mit Release-Gates in der Roadmap dokumentiert.
- Technisches Domain-Grundmodell fuer relevante Entitaeten definiert.
- Deterministische Migration lokaler Legacy-Daten in Domain-Entitaeten vorbereitet.
- Backup-Version 3 mit Planungsvorlagen, Fairness-Teamdaten und Domain-Snapshot vorbereitet.
- Backup v1/v2 bleiben importierbar und ueberschreiben keine v3-Datenbereiche.
- Beschaedigte Backup-Eintraege werden beim Import isoliert und als Warnungen ausgewiesen.
- Migrationstests fuer alte Profile, alte Dienste, fehlende und doppelte IDs, Revisionswerte und wiederholte Migration ergaenzt.
- Alpha- und Beta-Empfehlungsgates fuer v1.9.0 als erfuellt dokumentiert; es wurde kein Pre-Release erstellt.
- Statistik-, Tarif-, Export- und Compliance-Berechnungslogik unveraendert gelassen.

## v1.8.0

- Product UI Refresh als eigener Zwischenschritt vor Sync/Auth eingeordnet.
- iPhone-first Navigation mit Haupttabs und Mehr-Menue vorbereitet.
- App-Shell, Karten, Buttons und Formulare optisch ruhiger ausgerichtet.
- Dashboard-Pruefstatus sachlicher ohne Emoji dargestellt.
- Statistik-, Tarif- und Compliance-Berechnungslogik unveraendert gelassen.

## v1.7.0

- Komfortplanung im Dienstplan ergaenzt.
- Wiederkehrende Dienstfolgen aus bestehenden Dienstvorlagen erzeugbar gemacht.
- Monatsvorlagen lokal speicherbar und auf andere Monate anwendbar gemacht.
- Kopieren und Verschieben kompletter Tagesplaene ergaenzt.
- CSV-Import fuer vorhandene Dienstplaene mit Vorschau und Fehlerhinweisen ergaenzt.
- Konfliktvorschau fuer belegte Tage, Dubletten und zeitliche Ueberschneidungen eingefuehrt.
- Dienstliste um Suche und Dienstart-Filter erweitert.
- Regressionstests fuer Planungskomfort-Service und Vorlagen-Storage ergaenzt.
- Statistik-, Tarif- und Compliance-Berechnungslogik unveraendert gelassen.

## v1.6.0

- Fairness-Seite fuer Dienstverteilung im Team ergaenzt.
- Aktuelle Person automatisch aus dem Monatsdienstplan berechnet.
- Manuelle Teamvergleichswerte lokal speicherbar gemacht.
- Nacht-, Wochenend- und Feiertagsdienste nach Wochenstundenanteil vergleichbar gemacht.
- Pruefung "grundsaetzlich jedes zweite Wochenende frei" als Fairness-Hinweis ergaenzt.
- Anonymisierbare Team-Auswertung ergaenzt.
- Regressionstests fuer Fairness-Service und Teamdaten-Storage ergaenzt.
- Statistik-, Tarif- und Compliance-Berechnungslogik unveraendert gelassen.

## v1.5.0

- Zentralen Regelkatalog fuer bestehende Compliance-Hinweise ergaenzt.
- Compliance-Seite um aufklappbare Details fuer Regel, Eingangsdaten, Berechnungsschritte und Grenzen erweitert.
- Relevante ArbZG-Regelgrundlagen und interne CareCheck-Planungsregeln getrennt verlinkt.
- Aktives Pruefprofil mit dokumentierten Schwellenwerten sichtbar gemacht.
- Schweregrad-Erklaerungen fuer Info, Warnung und kritisch ergaenzt.
- Regressionstests fuer Regelzuordnung, Quellen, Pruefprofil und Eingangsdaten ergaenzt.
- Statistik- und Compliance-Berechnungslogik unveraendert gelassen.

## v1.4.0

- Jahresauswertung fuer alle zwoelf Monate ergaenzt.
- Jahressummen fuer Soll, Ist, Saldo, Abwesenheiten, Zuschlaege, Nacht-, Wochenend- und Feiertagsarbeit eingefuehrt.
- Monatsvergleich mit Trends fuer Saldo, Iststunden und Nachtstunden ergaenzt.
- CSV-Export fuer Jahresberichte ergaenzt.
- Jahresweite Compliance-Zaehler aus bestehenden Monatspruefungen abgeleitet, ohne Compliance-Regeln zu aendern.
- Mobile Jahresansicht und klassische Desktop-Uebersicht umgesetzt.
- Regressionstests fuer Jahresauswertung, CSV-Export und Zuschlagsfilter ergaenzt.

## v1.3.0

- TVoeD-P Fachmodul auf der Gehaltsseite ergaenzt.
- Tarifwerte versionierbar gemacht, ohne vorhandene Tabellenwerte zu veraendern.
- Zeitzuschlaege fuer Nacht, Sonntag, Feiertag und Samstag 13-21 Uhr fachlich getrennt ausgewiesen.
- Ueberschneidungen tagesbezogener Zuschlaege minutenbasiert bereinigt; Nachtzuschlag bleibt additiv.
- Schicht- und Wechselschichtindikatoren sowie Wochenendbewertung fuer den ausgewaehlten Monat ergaenzt.
- TVoeD-P-Auswertung klar von ArbZG-/Compliance-Pruefungen getrennt.
- Regressionstests fuer Tarifversion, Zuschlagskollisionen und Fachmodul ergaenzt.

## v1.2.9

- Monatsbericht, CSV, XLSX und Druck/PDF-Ausgabe mit gemeinsamen Report-Labels vereinheitlicht.
- Sortierbare Monatsbericht-Dateinamen mit klarer Monatskennung fuer CSV, XLSX und Drucktitel ergaenzt.
- Exportvorschau in Dashboard und Monatsbericht eingefuehrt.
- Berechnungsgrundlagen, Compliance-Hinweise und Druck-/PDF-Paginierung im Monatsbericht verbessert.
- Regressionstests fuer Exportnamen, Labels, Vorschau und Berichtskonsistenz ergaenzt.
- Statistik-, Tarif- und Compliance-Logik unveraendert gelassen.

## v1.2.8

- UI-Konsistenz für Profil, Plan, Gehalt, Prüfung, Kalender und Monatsbericht verbessert.
- iPhone-Ansicht für Bottom-Navigation, Kalender, Tagesdetails, Formulare und Bericht stabilisiert.
- Klassische Desktop-Ansicht erhalten und CSS-Kaskade durch Entfernen eines doppelten Imports bereinigt.
- Statistik-, Tarif-, Export- und Compliance-Logik unverändert gelassen.

## v0.1.0

- React eingerichtet
- Git eingerichtet
- Erste Oberfläche entwickelt
