# Offene Aufgaben fuer Treeline

Stand: 19.11.2026. Priorisierte Liste nach Pruefung des aktuellen Codes.
Die Website ist eine oeffentlich erreichbare Demo, kein produktives Mitarbeiterportal.

## Naechster Pilot

1. **Büro, Handy und Wand-iPad: Live-Abnahme.** Der [Appwrite-Betriebszugang](BETRIEBSZUGANG.md)
   ist in Appwrite aktiv und mit temporären Rollen-Konten geprüft. Nach Zuordnung der Betriebskonten einen Tagesplan mit zwei Einsätzen freigeben,
   eine Mannschaft umteilen und die neue Version auf beiden Geräten anzeigen.
   Das Büro sieht, wer die Änderung bestätigt hat. Das Display erhält ein eigenes Lesekonto.
2. **Fahrer je Fahrzeug einteilen.** Für Hubsteiger und Gespann jeweils Fahrer,
   Führerscheinklasse und zulässige Gesamtmasse erfassen. Fehlende Angaben und
   Doppelbelegungen vor der Freigabe anzeigen.
3. **Baum für Baum abarbeiten.** Im Postfach führt der Auftrag zum ersten offenen
   Baum. Straßenseite, Baumnummer und GPS-Genauigkeit helfen beim Auffinden.
   Die Kolonne erfasst erledigt oder blockiert mit Foto und Grund. Ein Test im
   Flugmodus prüft, dass jede Rückmeldung nach Wiederverbindung genau einmal ankommt.

## Bereits vorhanden

- Tagesplanung mit Baustelle, Auftrag, Zeiten, Mannschaft, Fahrzeugen und Geraeten.
- Bearbeitbare Entwuerfe, versionierte Freigaben und Zeitkonfliktpruefung.
- Persoenliche Demo-Postfaecher, Lesebestaetigungen und Mitteilungen bei Umbesetzung.
- Aushang mit Datumswahl, automatischem Seitenwechsel und Druck aller Einsaetze.
- Mobile Layouts, Browser- und Logiktests sowie GitHub-Pages-Veröffentlichung.
- Suchbare Auftrags- und Ressourcenauswahl, Vorbelegungen und Belegungshinweise mit fiktivem Planungskatalog.

Die lokale Demo speichert nur im jeweiligen Browser. Lokal erstellte Listen
werden durch einen Git-Push weder hochgeladen noch auf die Live-Domain uebertragen.
Ein zweites Handy oder Wand-iPad bekommt diese Listen deshalb noch nicht automatisch.

## P0: Vor echtem Mitarbeitereinsatz

- [ ] Betriebliche Stammdaten in einer privaten Installation pflegen und erst nach Anmeldung laden. Die öffentliche Demo nutzt fiktive Daten.

- [ ] **Echte Konten und Rollen.** Appwrite-Anmeldung, Einladungen und Passwort-
  Wiederherstellung umsetzen; bestehende Beispielprofile echten Konten zuordnen.
  Die aktuelle Profilauswahl ist keine Authentifizierung. `Einladung senden`
  im Team-Bereich legt derzeit nur ein lokales Profil an.
- [ ] **Berechtigungen absichern.** Buero, Mitarbeiter, Auftraggeber und Display
  serverseitig trennen. Die vorhandenen Demo-Skripte und Appwrite-Schreibzugriffe
  verwenden `any`-Berechtigungen; die Cloud-Konfiguration muss gesondert geprueft
  werden. Im Chat geteilte administrative API-Keys widerrufen und ersetzen.
- [ ] **Daten zwischen Geraeten synchronisieren.** Private Collections fuer
  Entwuerfe, Freigaben, Postfaecher, Lesebestaetigungen und Displaydaten anbinden.
  Auch Baeume und Auftraege zuverlaessig aus Appwrite laden, nicht nur schreiben.
  Freigabe, Empfaengerzuordnung und Konfliktpruefung muessen auf dem Server laufen.
- [ ] **Daten sichern.** Backup und Wiederherstellung testen; versionierte,
  nicht destruktive Migrationen statt erneutem Einspielen von Seed-Daten.
  Aufbewahrung und Loeschung von Mitarbeiterdaten festlegen.
- [ ] **Wanddisplay sicher betreiben.** Eigenes, widerrufbares Lesekonto,
  geraeteuebergreifende Aktualisierung und Anzeige des letzten Sync-Zeitpunkts.
  Keine Administrator-Sitzung am Display; keine vertraulichen Personalnotizen.

Abnahme P0: Das Buero gibt einen Plan frei. Kira sieht ihn auf einem anderen
Geraet und bestaetigt ihn. Die Bestaetigung erscheint im Buero. Fremde
Postfaecher bleiben auch bei direkten API-Aufrufen gesperrt.

## P1: Verlaesslicher Alltag im Buero und draussen

- [ ] **Versand nach Feierabend.** Uhrzeit, Zeitzone, Empfaenger, Ruhezeiten und
  Kanal festlegen. E-Mail/Push erst nach serverseitiger Freigabe, mit Wiederholung
  bei Fehlern und ohne doppelte Nachrichten. Derzeit wird manuell freigegeben.
- [ ] **Offline-Arbeit.** Tagespakete, Formulare und Aenderungswarteschlange mit
  Konfliktaufloesung und sichtbarem Sync-Status. Kartenlizenzen vor Offline-Caching
  pruefen; die aktuelle CDN-basierte Website ist keine vollstaendige Offline-App.
- [ ] **Fahrer und Verfuegbarkeit.** Konkrete Fahrer je Fahrzeug/Zugkombination,
  Qualifikationen, Urlaub, Krankheit und Fahrzeugwartung bei der Planung pruefen.
  Die vorhandene Zeitkonfliktpruefung ersetzt diese Freigaben nicht.
- [ ] **Baeume sicher finden.** Positionsgenauigkeit und Erfassungszeit speichern,
  Navigation zum einzelnen Baum, QR-/NFC-Kennzeichnung und bessere Bereichssuche.
  Reale Mapbox-Karten, GPS und Touch-Bedienung auf Einsatzgeraeten testen.
- [ ] **Fotos dauerhaft speichern.** Kamera-/Datei-Uploads an geschuetzten Storage
  anbinden, Dateien validieren, komprimieren und Baum/Auftrag zuordnen.
  Die aktuelle Medienansicht haelt neue Dateien nur temporaer im Browserzustand.
- [ ] **Ausfuehrung dokumentieren.** Erledigt-/Blockiert-Status je Baum,
  Vorher-/Nachher-Fotos und Rueckmeldungen zum Einsatz mit Zeit und Bearbeiter.

## P2: Ausbau und Wartbarkeit

- [ ] Wochenplanung, Vorlagen, Tag kopieren und wiederkehrende Auftraege.
- [ ] Mehrtaegige und nachtuebergreifende Einsaetze ohne manuelle Aufteilung.
- [ ] Strukturierte Baumkontrollen, Befunde, Fristen und wiederkehrende Kontrollen.
- [ ] Tagesberichte und Kunden-PDFs; spaeter Zeiterfassung und Abrechnungsgrundlagen.
- [ ] GeoJSON-Import/Export mit stabilen IDs; danach QGIS/GeoPackage-Anbindung.
- [ ] Vite/ES-Module statt JSX-Transpilation im Browser; einheitlicher Datenzugriff.
- [ ] Fehlerueberwachung, Accessibility-Tests und Tests fuer Netzabbrueche,
  echte Berechtigungen, echte Karten und sehr lange Aushangeintraege.
- [ ] Deployment an erfolgreiche CI-Tests koppeln; derzeit starten Tests und
  Pages-Veröffentlichung als getrennte Workflows.

## Empfohlene Reihenfolge

1. Zugang und Berechtigungen absichern, Schluessel ersetzen.
2. Gemeinsame Datenhaltung und serverseitige Freigabe umsetzen.
3. Zwei-Geraete-Test samt Lesebestaetigung und geschuetztem Wanddisplay abnehmen.
4. Benachrichtigungen, Offline-Arbeit und dauerhafte Fotodokumentation ergaenzen.
5. Wochenplanung, Kontrollen und Auswertungen ausbauen.

Details: [Einsatzplanung und Backend-Modell](EINSATZPLANUNG.md),
[Roadmap und Vergleich mit QField, RIWA und Field Maps](../ROADMAP.md).
