# CareCheck TVoeD

CareCheck TVoeD ist eine lokale React-App fuer Dienstplanung, Arbeitszeitpruefung und Monatsberichte im Kontext TVoeD-P-orientierter Pflegearbeit.

## Produktziel

- Dienstplan monatlich erfassen und pruefen
- Soll-, Ist- und Differenzstunden nachvollziehbar darstellen
- Feiertage, Wochenendfolgen und ArbZG-Basispruefungen sichtbar machen
- TVoeD-P-nahe Grundwerte und Zuschlaege transparent ausweisen
- Monatsberichte als CSV, XLSX und Druck/PDF vorbereiten
- Daten lokal sichern, wiederherstellen und als PWA nutzen
- Planungsablaeufe mit Folgen, Vorlagen, Kopieren/Verschieben und Import beschleunigen

## Aktueller Stand

- Stabiler Release-Stand: `v1.7.0 - Planung und Komfort`
- Aktiver Hauptstand: `main`

## Fachliche Leitplanken

- Statistik- und Compliance-Logik bleiben fuer neue Komfort- und Auswertungsfunktionen unveraendert, sofern kein Release dies ausdruecklich fachlich prueft.
- TVoeD-P-Auswertung ist ab v1.3.0 fachlich von ArbZG-/Compliance-Pruefungen getrennt.
- Jahresauswertungen ab v1.4.0 verwenden bestehende Monatslogik und aendern keine Compliance-Regeln.
- Regeltransparenz ab v1.5.0 erklaert bestehende Compliance-Hinweise, ohne die Prueflogik zu veraendern.
- Fairness ab v1.6.0 ist eine Planungshilfe und aendert keine ArbZG-, Statistik- oder TVoeD-P-Berechnung.
- Planungskomfort ab v1.7.0 erzeugt und prueft Entwuerfe, nutzt beim Speichern aber weiter die bestehende Dienstnormalisierung.
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
