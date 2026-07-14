# CareCheck TVoeD

CareCheck TVoeD ist eine lokale React-App fuer Dienstplanung, Arbeitszeitpruefung und Monatsberichte im Kontext TVoeD-P-orientierter Pflegearbeit.

## Produktziel

- Dienstplan monatlich erfassen und pruefen
- Soll-, Ist- und Differenzstunden nachvollziehbar darstellen
- Feiertage, Wochenendfolgen und ArbZG-Basispruefungen sichtbar machen
- TVoeD-P-nahe Grundwerte und Zuschlaege transparent ausweisen
- Monatsberichte als CSV, XLSX und Druck/PDF vorbereiten
- Daten lokal sichern, wiederherstellen und als PWA nutzen

## Aktueller Stand

- Stabiler Release-Stand: `v1.5.0 - Regelwerk und Transparenz`
- Aktiver Hauptstand: `main`

## Fachliche Leitplanken

- Statistik- und Compliance-Logik bleiben fuer v1.3.0 unveraendert.
- TVoeD-P-Auswertung ist ab v1.3.0 fachlich von ArbZG-/Compliance-Pruefungen getrennt.
- Jahresauswertungen ab v1.4.0 verwenden bestehende Monatslogik und aendern keine Compliance-Regeln.
- Regeltransparenz ab v1.5.0 erklaert bestehende Compliance-Hinweise, ohne die Prueflogik zu veraendern.
- FREE zaehlt keine Stunden und keinen Planungstag und wird nicht auf Compliance geprueft.
- VACATION, SICK und TRAINING bleiben planungs- und stundenrelevant.
- Urlaub und Krankheit gelten nicht als tatsaechliche ArbZG-Arbeitsdienste.
- EARLY, LATE, NIGHT, DAY und CUSTOM gelten als Arbeitsdienste.
- Nachtdienste ueber Mitternacht muessen korrekt verarbeitet werden.
- Compliance-Auswertungen beziehen sich auf den ausgewaehlten Monat.

## UI-Leitplanken

- Mobile iPhone-Ansicht hat Prioritaet.
- Die klassische Desktop-Uebersicht bleibt erhalten.
- Datum wird als `dd.mm.yyyy` dargestellt.
- Uhrzeiten verwenden das 24-Stunden-Format.
