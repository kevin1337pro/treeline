# Treeline Roadmap

Aktueller Arbeitsstand: [Priorisierte Aufgabenliste vom 30.09.2026](docs/OFFENE_AUFGABEN.md).

## Zielbild

Treeline soll von der statischen Demo zu einer erweiterbaren Fachanwendung fuer Baumkataster, Kontrollen, Massnahmenplanung, Medienverwaltung und Team-/Kundenarbeit wachsen. Der wichtigste naechste Schritt ist eine klare Trennung von UI, Domain-Logik und Persistenz, damit spaeter Appwrite oder ein anderes Backend ohne grosse Umbauten genutzt werden kann.

## Einsatzplanung: umgesetzt und priorisiert

Die lokale Vorschau bietet jetzt Tagesentwuerfe, Auftragsuebernahme, Mannschaft/
Fahrzeuge/Geraete, Zeitkonfliktpruefung, versionierte Freigabe, persoenliche
Postfaecher mit Lesebestaetigung sowie Aushang mit Druck und Seitenwechsel.
[Ablauf, Datenmodell und Backend-Grenzen](docs/EINSATZPLANUNG.md).

Prioritaeten fuer die naechsten Iterationen:

1. **P0: Sichere Zustellung.** Echte Konten zu Beispielprofilen zuordnen, private
   Appwrite-Collections, serverseitige Freigabe, Display-Konto, Wiederverbindung.
   Abnahme: Kevin sieht seinen Plan auf einem zweiten Geraet; fremde Postfaecher
   bleiben auch bei direkten API-Aufrufen unzugaenglich.
2. **P1: Aussendienst offline.** Tagespaket aus Einsaetzen, Baumpositionen, Formularen
   und Medien lokal vorhalten. Warteschlange fuer Aenderungen mit sichtbarem
   Sync-Status und bewusstem Konfliktdialog. Kartenlizenzen vor Offline-Caching pruefen.
3. **P1: Baum sicher finden.** GPS-Genauigkeit und Erfassungszeit speichern,
   Positionsqualitaet anzeigen, Navigation zum Baum und QR-/NFC-Baumkennzeichnung.
   Smartphone-GPS nicht als vermessungsgenau darstellen.
4. **P1: Qualifikation und Verfuegbarkeit.** Fahrer je Fahrzeug/Zugkombination,
   freigegebene Qualifikationen, Abwesenheiten und Wartung in Planung einbeziehen.
   Disposition muss Warnungen nachvollziehbar aufloesen koennen.
5. **P2: Nachweise.** Strukturierte Befunde, kontrollierte Artenlisten, Vorher-/Nachher-
   Fotos, Erledigt-Status je Baum, Wiederkontrolle und PDF-Tagesbericht.
6. **P2: Weniger Doppelpflege.** Tag kopieren, Serienauftraege, Wochenplan,
   freigegebene Aenderungen hervorheben; optionaler Versand nach Feierabend.

## Vergleich mit bestehenden Werkzeugen

Recherche vom 29.09.2026; die folgenden Implementierungen sind eigene Vorschlaege,
keine bereits vorhandenen Treeline-Funktionen. QField ist ein mobiles GIS und
keine direkte Entsprechung einer betrieblichen Baumpflege-Disposition.

| Werkzeug / belegte Staerke | Ableitung fuer Treeline | Aufwand |
| --- | --- | --- |
| [QField Forst](https://qfield.org/solutions/forestry-and-silviculture/): Offline-Projekte, strukturierte Arten-/Massformulare, Synchronisierung | Tagespakete, validierte Baumformulare, Offline-Queue | Hoch; Backend und Konfliktmodell zuerst |
| [QField GNSS](https://docs.qfield.org/how-to/navigation-and-positioning/gnss/): Genauigkeitsanzeige, externe Empfaenger | Genauigkeit beim Setzen speichern; spaeter externe GNSS-Anbindung erproben | Mittel; Browser-/Geraetegrenzen beachten |
| [RIWA iSiWebGIS](https://www.riwa.de/isiwebgis): Baumkataster, Kontrollen, Massnahmen und Dokumentation | Befund -> Massnahme -> Auftrag -> Nachweis durchgaengig verknuepfen | Mittel bis hoch |
| [ArcGIS Field Maps](https://www.esri.com/en-us/arcgis/products/arcgis-field-maps/overview): mobile Karten, Formulare, Offline-Arbeit und Aufgabenkoordination | Persoenliche Tagesaufgaben direkt mit Karte und Erledigt-Status verbinden | Mittel; bestehende Auftragsverknuepfung nutzen |

Empfehlung: Treeline als betriebliche Planung und Ausfuehrung weiterentwickeln,
nicht alle GIS-Funktionen nachbauen. Zuerst GeoJSON-Import/Export mit stabilen IDs
und Koordinatenpruefung; spaeter QGIS/GeoPackage-Austausch als gesonderte Integration.
Eine hohe Detailstufe des Luftbilds ersetzt keine gemessene Baumposition.

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
