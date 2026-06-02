# Treeline

Treeline ist eine statische Demo-Anwendung fuer Baumverwaltung, Einsatzplanung und Team-Uebersicht im Umfeld von Baumkontrolle und Baumpflege. Die Anwendung laeuft aktuell direkt ueber `treeline.html` und bindet React, ReactDOM, Babel Standalone und Leaflet per CDN ein.

## Projektstatus

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
npm install
```

## Entwicklung starten

```bash
npm run dev
```

Danach ist die Anwendung lokal unter `http://localhost:4173` erreichbar.

## Tests

```bash
npm run test:smoke
```

Die Smoke-Tests starten bei Bedarf den lokalen Server und pruefen Login, Navigation, Massnahmen-Erstellung und Team-Einladung.

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

Die App enthaelt einen Beispielauftrag fuer die Gahlener Strasse in Dorsten:

- Kevin Stumpe und Thorsten Thesing als Aussendienst-Team
- Fuehrerscheinpruefung fuer B, C/CE und Fahrzeuggewicht
- Mercedes 22m Hubsteiger `BOT - RR - 220`
- VW TGE 3 `BOT - BE - 118`
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
- Werkzeugpanel fuer Auswahl, Baum setzen und Route zeichnen
- Routenpunkte koennen rueckgaengig gemacht, geloescht oder lokal gespeichert werden

Der Public Token wird beim GitHub-Pages-Deploy aus dem Actions Secret `MAPBOX_PUBLIC_TOKEN` in `components/mapbox.config.js` geschrieben. Lokal kann fuer Entwicklung alternativ `localStorage.treeline_mapbox_token` gesetzt werden. In Mapbox sollte dieser Token auf die erlaubten Domains beschraenkt werden, zum Beispiel `localhost` und `kevin1337pro.github.io`.

## Appwrite Setup

Das Skript legt die Datenbank `treeline` und Collections fuer `trees`, `orders`, `measures`, `users`, `vehicles`, `equipment`, `plantings` und `media` an. Es braucht ein vorhandenes Appwrite-Projekt und einen API-Key:

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
