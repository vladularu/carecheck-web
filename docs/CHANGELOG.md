# Changelog

## v1.9.0 - in Entwicklung

- Sync-Vorbereitung als lokales Datenmodell ohne Cloud-Anbindung gestartet.
- Separate Sync-Metadaten mit Schema-Version, Device-ID, lokalen Revisionen, Soft-Delete- und Konfliktfeldern ergaenzt.
- Profil-, Dienst- und Dienstvorlagen-Aenderungen markieren kuenftig lokale Revisionen.
- Planungsvorlagen und Fairness-Teamdaten in die lokale Revisionierung aufgenommen.
- Datenschutz- und Loeschkonzept inklusive Backup-Entscheidung dokumentiert.
- Profil-UI zum vollstaendigen lokalen Loeschen mit zweistufiger Bestaetigung ergaenzt.
- Separaten Portabilitaets-Export fuer Profil, Dienste, Vorlagen, Planung und Fairness ergaenzt.
- Repository-Interfaces und lokale Adapter fuer die erste Persistenzabstraktion ergaenzt.
- AppContext, Planer, Fairness und Profil-Datenkarte von konkreten Storage-Imports entkoppelt.
- Backup-Version 2 und bestehende Restore-Kompatibilitaet unveraendert gelassen.
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
