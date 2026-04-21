# Treeline

Treeline ist eine statische Demo-Anwendung fuer Baumverwaltung, Einsatzplanung und Team-Uebersicht im Umfeld von Baumkontrolle und Baumpflege. Die Anwendung laeuft aktuell direkt ueber `treeline.html` und bindet React, ReactDOM, Babel Standalone und Leaflet per CDN ein.

## Projektstatus

Das Projekt wurde als lokale Basis initialisiert mit:

- Git-Repository
- `package.json` mit Startskript fuer einen lokalen Entwicklungsserver
- `.gitignore` fuer typische lokale Artefakte
- dieser README-Datei als Einstiegspunkt fuer Entwicklung und Ausbau

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
└── uploads/
```

## Technische Einordnung

- Frontend: React 18 ueber UMD-Skripte
- Transpilation im Browser: Babel Standalone
- Kartenfunktion: Leaflet
- Datenhaltung: lokale Mock-Daten in `components/data.js`
- Persistenz: teilweise ueber `localStorage`

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

1. `npm install` ausfuehren.
2. `npm run dev` starten.
3. Entscheiden, ob das Projekt als statische Demo bestehen bleibt oder auf einen modernen Frontend-Stack migriert werden soll.
