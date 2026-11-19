# Einsatzbetrieb mit Appwrite

Einstieg: `treeline.html?betrieb=1`. Derselbe Link führt nach Anmeldung zur
passenden Arbeitsfläche. Die öffentliche Profilvorschau bleibt separat. Es gibt
keine automatische Übernahme der lokalen Vorschau in den Betrieb.

## Einmalig einrichten

1. Das Appwrite-Projekt in Frankfurt aktivieren. Als Web-Plattform den Host
   `kevin1337pro.github.io` (für lokale Tests zusätzlich `localhost`) zulassen.
   Für den Regelbetrieb eine eigene Web-Domain verwenden. E-Mail/Passwort als
   Anmeldeverfahren aktivieren.
2. Einen neuen kurzlebigen Einrichtungsschlüssel in der Konsole erstellen und
   lokal als `APPWRITE_API_KEY` bereitstellen. Frühere geteilte Schlüssel widerrufen.
   Für das Setup sind Datenbanken, Tabellen, Spalten, Indizes und Functions
   (jeweils Lesen/Schreiben) nötig; für Kontozuordnungen zusätzlich Benutzer lesen
   und Zeilen lesen/schreiben. Keine Schlüssel in Frontend oder Geräte-URLs.
3. Mit Node 22+ und `tar` im Projektordner `npm run appwrite:dispatch` ausführen.
   Das Skript wartet auf Indizes und die aktive Funktionsbereitstellung. Es nutzt
   eine separate Datenbank `treeline_dispatch` und verändert keine vorhandenen
   Aufträge oder Demo-Daten. Nicht das alte `appwrite:setup` dafür verwenden.
4. In der Appwrite-Konsole Konten für Büro, persönliche Handys und ein separates
   Display anlegen. Keine gemeinsame Anmeldung für Mitarbeiter. Beispiel für die
   Zuordnung vorhandener Konten (Platzhalter ersetzen):

```sh
npm run appwrite:dispatch -- bind ACCOUNT_ID_BUERO office dispo Büro
npm run appwrite:dispatch -- bind ACCOUNT_ID_PERSON employee personal-001 "Anzeigename"
npm run appwrite:dispatch -- bind ACCOUNT_ID_IPAD display wand-01 "Aushang Betriebshof"
```

Die Auswahl im Büro verwendet nur zugeordnete Mitarbeiter. Die Profilkennung
bleibt über die Beschäftigungszeit stabil; nicht für eine andere Person
wiederverwenden. Die Auftrags- und Fahrzeugauswahl kommt weiterhin aus dem
Katalog des Bürobrowsers. Freigaben speichern die Namen und Daten als Kopie.
Zum Entziehen des Zugangs das Konto sperren, seine Sitzungen widerrufen und die
Zuordnung entfernen. Keine Anmeldedaten über öffentliche Links verteilen.

## Tagesgeschäft

- **Büro:** Tag und Einsätze bearbeiten, als Entwurf speichern, dann freigeben.
  Ein bereits freigegebener Stand bleibt sichtbar, bis das Büro die Änderungen
  erneut freigibt. Gleichzeitiges Speichern desselben Ausgangsstands führt zu
  einem Konflikthinweis statt zu einem stillen Überschreiben.
- **Handy:** Das Postfach zeigt bis zu 50 der jüngsten persönlichen Mitteilungen
  mit den eigenen Einsatzzeilen. Bei Umbesetzungen kommt auch eine Absage an.
  „Einteilung bestätigen“ quittiert genau diese Freigabe, nicht spätere
  Änderungen. Das Büro sieht pro Person „Ausstehend“ oder den Bestätigungszeitpunkt.
- **iPad:** Mit dem Displaykonto anmelden und „Aktueller Tag“ aktivieren oder
  den gewünschten Tag auswählen. Während die Seite sichtbar ist, wird alle
  20 Sekunden aktualisiert, bei Rückkehr und nach Wiederverbindung sofort.
  Bei einem vorübergehenden Netzfehler bleibt der letzte geladene Stand mit
  Warnung sichtbar. Ein gesperrtes Gerät oder ein geschlossener Browser
  aktualisiert sich erst beim nächsten Öffnen; keine Push-Nachrichten.

## Daten und Abnahme

Die Sammlungen `profiles`, `versions` und `receipts` sind für Browser nicht
direkt les- oder beschreibbar. Nur die Funktion `dispatch_gateway` prüft die
Appwrite-Sitzung, lädt die zugeordnete Rolle und liefert den passenden
Ausschnitt. Entwurf oder Freigabe werden jeweils als ein unveränderliches
Dokument gespeichert. Bestätigungen sind pro Person und Freigabe eindeutig.
Persönliche Pläne liegen im Browser nur im Arbeitsspeicher. Es gibt keine
öffentliche Liste und keinen Offline-Schreibmodus.

Nach der Einrichtung mit drei getrennten Sitzungen prüfen: Entwurf zunächst
unsichtbar, Freigabe auf beiden Geräten sichtbar, Bestätigung im Büro, geänderte
Freigabe erneut offen, Absage bei Entfernung. Zusätzlich das Wandgerät einmal
offline schalten und die Wiederverbindung prüfen. Alte Versionen und
Bestätigungen bleiben erhalten; vor dem Regelbetrieb Aufbewahrungsdauer,
Löschverfahren und Datensicherung festlegen.
