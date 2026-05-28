# Treeline Roadmap

## Zielbild

Treeline soll von der statischen Demo zu einer erweiterbaren Fachanwendung fuer Baumkataster, Kontrollen, Massnahmenplanung, Medienverwaltung und Team-/Kundenarbeit wachsen. Der wichtigste naechste Schritt ist eine klare Trennung von UI, Domain-Logik und Persistenz, damit spaeter Appwrite oder ein anderes Backend ohne grosse Umbauten genutzt werden kann.

## Phase 1: Demo stabilisieren

- Smoke-Tests fuer Login, Navigation und Kernaktionen pflegen.
- Dialoge voll funktional machen: Baeume, Massnahmen, Pflanzungen, Medien und Nutzer speichern statt nur modale Platzhalter zu schliessen.
- Gemeinsame Validierung fuer Pflichtfelder, Datumsfelder, Zahlen und IDs einfuehren.
- Mobile Layouts fuer Sidebar, Tabellen und Detailansichten gezielt pruefen.
- Zentrale Fehler- und Leermeldungen fuer Appwrite, Netzwerk und lokale Speicherung einfuehren.

## Phase 2: Architektur vorbereiten

- Datenzugriff in ein Repository-Layer auslagern, z. B. `treeRepository`, `measureRepository`, `mediaRepository`.
- Domain-Helfer fuer ID-Erzeugung, Statuslabels, Rollenrechte und Datumsformatierung extrahieren.
- Komponenten in kleinere, testbare Bausteine teilen: Formulare, Tabellen, Badges, Detailpanels.
- Eine zentrale App-State-Schicht einfuehren, bevor die Datenmenge waechst.
- Konfiguration ueber `.env` oder eine sichere Runtime-Konfiguration statt editierter JS-Dateien laden.

## Phase 3: Backend und Rechte

- Appwrite-Collections fuer Baeume, Massnahmen, Befunde, Pflanzungen, Medien und Nutzer modellieren.
- Echte Authentifizierung mit Rollen und Berechtigungen anbinden.
- Mandantenfaehigkeit fuer mehrere Auftraggeber oder Standorte vorbereiten.
- Audit-Log fuer wichtige Aenderungen ergaenzen: Statuswechsel, Positionsaenderungen, Zertifizierungen.
- Offline-faehige lokale Queue fuer Aussendienst-Szenarien pruefen.

## Phase 4: Fachfunktionen

- Baumkontrollen mit wiederkehrenden Intervallen und Faelligkeiten.
- Massnahmen aus Befunden erzeugen und mit Kosten, Personal, Fahrzeugen und Status verfolgen.
- Kartenfunktionen erweitern: Cluster, Flurstuecke, GeoJSON-Import/Export, Umkreissuche.
- Medien Workflows: Upload, Zuordnung, EXIF/Drohnenmetadaten, Vorschau, Download, Loeschen.
- Berichte: Baumprofil-PDF, VTA-Protokoll, Pflanzprotokoll, Kundenuebersicht.

## Phase 5: Qualitaet und Betrieb

- Migration auf Vite oder Next/Vite-SPA, damit JSX nicht im Browser transpiliert wird.
- Unit-Tests fuer Domain-Logik und Playwright-Tests fuer Kernflows.
- CI mit `npm audit`, Smoke-Tests und optionalem Lighthouse/Accessibility-Check.
- Monitoring fuer Backend-Fehler und Upload-Probleme.
- Versionierte Datenmigrationen fuer lokale Demo-Daten und Appwrite-Schema.
