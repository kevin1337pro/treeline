# Treeline

Treeline ist eine statische Demo-Anwendung fuer Baumverwaltung, Einsatzplanung und Team-Uebersicht im Umfeld von Baumkontrolle und Baumpflege. Die Anwendung laeuft aktuell direkt ueber `treeline.html` und bindet React, ReactDOM, Babel Standalone und Mapbox GL JS per CDN ein.

## Digitale Tagesliste

Neu: `Einsatzplanung` fuer Buero-Entwuerfe und versionierte Freigaben, `Postfach`
fuer Mitarbeiter mit Lesebestaetigung und `Aushang` fuer Bildschirm/iPad und Druck.
Vorhandene Beispielprofile lassen sich ueber die Auswahl im Kopfbereich wechseln.
Echte Konten werden spaeter zugeordnet. Die neue Planung speichert ausschliesslich
lokal im Browser, ohne E-Mail-Versand oder Synchronisierung auf andere Geraete.

Die Einsatzplanung bietet suchbare Auftraege, Mitarbeiter, Fahrzeuge und Geraete
mit Mehrfachauswahl, Vorbelegung und Belegungshinweisen. Die oeffentliche Demo nutzt erfundene Auftraege und Profile sowie eigene lokale Browserdaten. Eine private Installation kann Appwrite mit ihrer eigenen Konfiguration anbinden.

[Bedienung, Datenmodell und sicherer Appwrite-Ausbau](docs/EINSATZPLANUNG.md).

Der getrennte [Betriebszugang](docs/BETRIEBSZUGANG.md) unter
`treeline.html?betrieb=1` nutzt Appwrite-Konten für Tagesplanfreigaben,
persönliche Bestätigungen und die automatische Aktualisierung des Aushangs.

Unter **Teamfunk** tauschen sich Büro und Mannschaft über Beiträge, Kommentare
und Likes aus. Unter **Bäume** steht dezent, wer einen Baum angelegt oder zuletzt
bearbeitet hat und wann. Die öffentliche Demo speichert ihre eigenen Beispieldaten
lokal; private Gruppeninhalte und Betriebsbäume bleiben in Appwrite.
[Priorisierte Erweiterungen und Vergleich mit QField, RIWA und Field Maps](ROADMAP.md).
[Konkrete offene Aufgaben bis zum Produktivbetrieb](docs/OFFENE_AUFGABEN.md).

## Projektstatus

### Uebersicht

Die Startansicht zeigt Kennzahlen, Einsaetze fuer heute/morgen, dringende Baeume
und eine filterbare Liste offener Massnahmen. Die Monatsgrafik zaehlt vorhandene
Massnahmen nach Faelligkeitsdatum fuer 3, 6 oder 12 Monate, getrennt nach offen
und abgeschlossen. Sie ist keine Auswertung tatsaechlicher Abschlusszeitpunkte.
Die Teamliste zeigt Aufgabenanzahlen, keine angenommene Personalkapazitaet.
Mitarbeiter sehen in der Einsatzvorschau nur eigene freigegebene Einsaetze;
die Disposition sieht auch Entwuerfe. Es bleibt eine lokale Demo ohne echte
Authentifizierung. Monatslabels sind HTML-Text und werden nicht mit einer SVG
verzerrt. `tests/dashboard.*` pruefen Datenaggregation, Navigation und Layout.

Das Projekt wurde als lokale Basis initialisiert mit:

- Git-Repository
- `package.json` mit Startskript fuer einen lokalen Entwicklungsserver
- `.gitignore` fuer typische lokale Artefakte
- dieser README-Datei als Einstiegspunkt fuer Entwicklung und Ausbau
- Playwright-Smoke-Tests fuer Login, Navigation und erste Kernaktionen

## Voraussetzungen

- Node.js 18+ empfohlen
- npm 9+ empfohlen

## Installation

```bash
npm ci
```

## Entwicklung starten

```bash
npm run dev
```

Danach ist die Anwendung lokal unter `http://localhost:4173` erreichbar.

## Tests

```bash
npx playwright install chromium
npm run test:unit
npm test
```

Die Tests starten bei Bedarf den lokalen Server und pruefen Demo-Login, Navigation,
Kernaktionen und den Ablauf von Einsatzentwurf bis Postfach/Aushang. Alle
Appwrite-Anfragen werden in den Tests abgefangen. `npm run test:smoke` fuehrt nur
die bisherigen Kernfunktionstests aus. `npm run icons` erzeugt die eingebundenen
Lucide-Icons aus der festgelegten Paketversion neu.

Ist Port 4173 bereits durch ein anderes Projekt belegt, einen freien Port waehlen:
`TREELINE_TEST_PORT=4174 npm test`. Ein bereits laufender Treeline-Server auf diesem
Port wird lokal wiederverwendet; CI startet einen eigenen Server.

## Projektstruktur

```text
.
├── treeline.html
├── index.html
├── components/
│   ├── App.jsx
│   ├── Dashboard.jsx
│   ├── Login.jsx
│   ├── MapView.jsx
│   ├── MassnahmenView.jsx
│   ├── PflanzungView.jsx
│   ├── Sidebar.jsx
│   ├── TeamView.jsx
│   ├── TreesView.jsx
│   ├── UploadView.jsx
│   └── data.js
├── tests/
├── ROADMAP.md
└── uploads/
```

## Technische Einordnung

- Frontend: React 18 ueber UMD-Skripte
- Transpilation im Browser: Babel Standalone
- Kartenfunktion: Mapbox GL JS
- Datenhaltung: lokale Mock-Daten in `components/data.js`
- Persistenz: teilweise ueber `localStorage`
- Auftragsplanung: eigene Ansicht fuer Einsatzplanung, Team-/Fahrzeugpruefung und Baumroute

## Auftragsplanung

Die App enthaelt einen Beispielauftrag fuer die Musterstrasse in Musterstadt:

- Kira Saal und Tilo Tal als Aussendienst-Team
- Fuehrerscheinpruefung fuer B, C/CE und Fahrzeuggewicht
- Mercedes 22m Hubsteiger `DEMO-LIFT-01`
- VW TGE 3 `DEMO-TRANS-42`
- Schliesing Hacker als Anhaenger am TGE
- Baumroute links/rechts entlang der Strasse mit direkter Baumprofil-Oeffnung

Die Ansicht `Auftraege` ist fuer die Buero-Planung und fuer die Bearbeitung draussen optimiert.

## Mapbox

Die Kartenansicht nutzt Mapbox GL JS mit umschaltbaren Kartenstilen:

- Satellit mit Strassennamen fuer konkrete Arbeiten draussen
- Strassenkarte fuer Disposition und Suche
- Outdoor-Karte fuer Gelaende- und Umfeldbezug
- helle Buerokarte fuer Planung
- 3D-Schalter fuer Terrain/Pitch und 3D-Gebaeude, soweit Mapbox-Daten verfuegbar sind
- Schmale Auftragsleiste und drei eingeklappte Menues fuer Suche, Kartenansicht und Werkzeug
- Werkzeugauswahl schliesst sich nach Auswahl; beim Zeichnen bleibt nur eine kompakte Aktionsleiste
- Baumdetails ohne zusaetzliches Popup, auf Mobilgeraeten als begrenzter unterer Bereich
- Kartenansicht vergroesserbar, Filter nach Baumzustand oder aktuellem Auftrag
- Routenpunkte koennen rueckgaengig gemacht, geloescht oder lokal gespeichert werden
- Auftrag direkt in der Karte auswaehlen und auf Baumroute oder Adresse fokussieren

Das Repository enthält eine leere Kartenkonfiguration in `components/mapbox.config.js`. GitHub Pages verwendet das konfigurierte Actions-Secret `MAPBOX_PUBLIC_TOKEN` fuer die Live-Karte. Nur wenn diese Konfiguration leer ist, wird `localStorage.treeline_public_mapbox_token` als Entwicklungs-Fallback verwendet. Niemals einen geheimen Server-Token hier hinterlegen. Den Browser-Token im Mapbox-Konto auf die tatsaechlich verwendeten Domains beschraenken, beispielsweise die lokale Vorschau und `kevin1337pro.github.io` ([Mapbox Token-Sicherheit](https://docs.mapbox.com/help/dive-deeper/how-to-use-mapbox-securely/)).

`tests/map.spec.js` prueft den echten Mapbox-Renderer mit einem kleinen Teststil: Routen, Baumaufnahme, Stilwechsel, Filter, Auftragswechsel und mobile Platzverhaeltnisse. Live-Satellitenbilder muessen zusaetzlich mit gueltigem Token und Netzwerk geprueft werden. Routen sind gezeichnete Arbeitslinien, keine automatisch berechnete Fahrzeugnavigation.

## Appwrite Setup

**Achtung:** Das bestehende Setup ist ein Demo-Seeder mit oeffentlichen
Berechtigungen und kann vorhandene Seed-Dokumente ueberschreiben. Nicht fuer echte
Mitarbeiterdaten verwenden oder ungeprueft gegen eine produktive Datenbank starten.
Die neue Einsatzplanung verwendet dieses Skript nicht.

Das Skript legt die Datenbank `treeline` und Collections fuer `trees`, `orders`, `measures`, `users`, `vehicles`, `equipment`, `routes`, `plantings` und `media` an. Es braucht ein vorhandenes Appwrite-Projekt und einen API-Key:

```bash
export APPWRITE_ENDPOINT="https://<REGION>.cloud.appwrite.io/v1"
export APPWRITE_PROJECT_ID="<PROJECT_ID>"
export APPWRITE_API_KEY="<API_KEY>"
npm run appwrite:setup
```

Ohne diese Umgebungsvariablen kann lokal kein Appwrite-Projekt oder Schema angelegt werden.

## Hinweise zum aktuellen Setup

- Das Projekt ist aktuell bewusst leichtgewichtig gehalten und benoetigt keinen Build-Prozess.
- Die Komponenten arbeiten ohne Modul-Bundler und werden direkt im Browser geladen.
- Fuer Entwicklung und Vorschau reicht deshalb ein einfacher statischer Server aus.

## Erweiterungen

- Migration auf Vite oder einen vergleichbaren Build-Stack, damit JSX nicht mehr im Browser transpiliert werden muss.
- Aufteilung der globalen Skriptstruktur in ES-Module mit echten Imports, um Wartbarkeit und Testbarkeit zu verbessern.
- Ersatz der Mock-Daten durch ein Backend oder eine JSON/API-Schicht fuer echte Baum-, Team- und Massnahmen-Daten.
- Einfuehrung einer sauberen Authentifizierung inklusive Rollen- und Rechtekonzept statt reinem `localStorage`-Login.
- Persistente Uploads mit Serveranbindung, Validierung und sauberem Dateimanagement fuer Medien.
- Formularvalidierung und Fehlerbehandlung in allen Views, insbesondere fuer Login, Upload und Datenerfassung.
- Testabdeckung mit Unit- und UI-Tests, zum Beispiel mit Vitest und Playwright.
- Extraktion gemeinsamer Styles in eine zentrale Design- oder Theme-Struktur statt vieler Inline-Styles.
- Responsives Verhalten weiter ausbauen, vor allem fuer Kartenansicht, Sidebar und datenreiche Tabellen auf kleinen Displays.
- Internationalisierung und Konfigurierbarkeit fuer verschiedene Standorte, Mandanten oder Kundenprojekte.
- Kartenfunktionen erweitern, etwa mit Marker-Clustering, Filterlogik, GeoJSON-Import und Export.
- Barrierefreiheit verbessern, zum Beispiel durch Tastaturbedienung, semantische Labels und Fokusfuehrung.

## Naechste sinnvolle Schritte

1. `npm run test:smoke` regelmaessig ausfuehren.
2. Die Roadmap in `ROADMAP.md` priorisieren.
3. Entscheiden, ob das Projekt als statische Demo bestehen bleibt oder auf einen modernen Frontend-Stack migriert werden soll.
4. Datenzugriff schrittweise aus den Komponenten in ein Repository-Layer extrahieren.
