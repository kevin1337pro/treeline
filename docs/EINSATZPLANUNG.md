# Digitale Einsatzliste

## Umfang dieser Vorschau

Die Liste ersetzt das Papierformular mit Baustelle, Fahrzeug, Beginn, Besonderheiten
und Mitarbeitern. Die Handschrift auf der Vorlage dient nur als Layoutreferenz:
Es wurden keine vermeintlich echten Mitarbeiter oder Auftraege daraus angelegt.
Verwendet werden die vorhandenen Beispielprofile, darunter Kevin und Thorsten.

Die Einsatzplanung ist bewusst **lokal**, nicht mit Appwrite verbunden. Es gibt
keine echten Anmeldungen, E-Mails, Push-Nachrichten oder geraeteuebergreifende
Zustellung. Rollenwahl und Profilwechsel sind eine Vorschau, keine Zugriffssperre.
Auf einem anderen iPad erscheint diese lokale Liste noch nicht automatisch.

## Ablauf

1. Als Markus anmelden und `Einsatzplanung` oeffnen. Standard ist der morgige Tag.
2. `Neuer Einsatz`: Auftrag auswaehlen oder einen freien Hof-/Baustelleneinsatz
   erfassen. Auftrag uebernimmt Adresse, Arbeit, Mannschaft, Fahrzeuge und Geraete.
3. Beginn, Ende, Treffpunkt und Besonderheiten ergaenzen. Speichern erzeugt einen
   Entwurf; zeitliche Doppelbelegungen werden abgewiesen. Nachtuebergreifende
   Einsaetze sind noch nicht enthalten und muessen auf zwei Tage verteilt werden.
4. `Tagesplan freigeben` mit Bestaetigung erzeugt eine unveraenderliche Version.
5. Im Kopfbereich `Demo: Kevin Stumpe` waehlen. Das Postfach zeigt nur die ihm
   zugeordneten Einsaetze und die Tageshinweise. `Als gelesen bestaetigen`
   speichert eine versionsbezogene Lesebestaetigung.
6. Als Markus weiterbearbeiten und erneut freigeben. Bis dahin bleibt im
   Mitarbeiterpostfach und Aushang die alte Version sichtbar. Herausgenommene
   Mitarbeiter erhalten eine Mitteilung, dass sie nicht mehr eingeteilt sind.
7. `Aushang` oeffnet eine schreibgeschuetzte Ansicht der letzten Freigabe. Datum,
   Vollbild (browserabhaengig), Druck und automatischer Seitenwechsel sind vorhanden.

Der Aushang ist ueber `treeline.html?view=board&date=2026-09-30` erreichbar.
Ohne `date` folgt er dem aktuellen lokalen Kalendertag, auch nach Mitternacht.
Tabs desselben Browserprofils aktualisieren sich ueber Storage-Ereignisse.
Die Seitenaufteilung richtet sich nach Bildschirmhoehe und tatsaechlicher Zeilenhoehe.
Ein einzelner sehr langer Einsatz kann weiterhin vertikales Scrollen erfordern.
Die Druckansicht enthaelt immer alle Einsaetze, nicht nur die sichtbare Seite.

## Datenmodell und Grenzen

- `components/dispatch.js`: Domain-Logik und austauschbare Repository-Fabrik.
- `components/DispatchView.jsx`: Disposition, Editor, Postfach, Aushang.
- `components/dispatch.css`: gemeinsame, responsive Darstellung.
- LocalStorage `treeline_dispatch_v1`: `schema`, `days`, `receipts`.
- Pro Tag: `version`, Entwurfszeilen, Tageshinweis und freigegebene `releases`.
- Eine Freigabe speichert Namen und Fahrzeugkennzeichen als Snapshot; spaetere
  Stammdatenaenderungen schreiben historische Tageslisten nicht um.
- Lesebestaetigungen sind nach Profil-ID und Freigabe-ID getrennt.
- Versionsvergleich erkennt veraltete Entwurfsdialoge. LocalStorage bietet aber
  keine atomaren Transaktionen zwischen gleichzeitig schreibenden Browser-Tabs.
- Browserdatenloeschung entfernt die Vorschau. Es gibt noch keine Datensicherung,
  Dateisynchronisierung oder native Offline-App. Externe React-/Babel-CDNs bleiben
  fuer den ersten Seitenaufruf erforderlich.
- Die Doppelbelegungspruefung ist keine Fahrerfreigabe: konkrete Fahrerzuordnung,
  Zugkombination, Qualifikation, Verfuegbarkeit und Abwesenheit sind eigene Ausbauschritte.
- Der Aushang zeigt bewusst die ganze Mannschaft; persoenliche Mitteilungen und
  vertrauliche Hinweise gehoeren spaeter in getrennte Datenbereiche.

## Sichere Appwrite-Ausbaustufe

Keine Mitarbeiterkonten, Datenbanken oder Berechtigungen wurden fuer diese lokale
Vorschau im Cloud-Projekt geaendert. Die bestehenden Beispielprofile behalten ihre IDs.

Vor echtem Betrieb ist folgende Erweiterung notwendig:

| Bereich | Vorgeschlagenes Modell | Berechtigung |
| --- | --- | --- |
| Profilzuordnung | employeeId, accountId, tenantId, active | Disposition verwaltet; Mitarbeiter eigenes Profil |
| dispatch_drafts | tenantId, date, revision, entries, note | Nur Disposition |
| dispatch_releases | date, revision, snapshot, publishedBy, publishedAt | Disposition; keine oeffentlichen Schreibrechte |
| dispatch_inbox | accountId, releaseId, persoenlicher Snapshot | Nur Empfaenger liest; Server erstellt |
| dispatch_receipts | accountId, releaseId, readAt | Eigene Bestaetigung; Disposition liest |
| dispatch_display | date, revision, datensparsamer Aushang | Eigenes Display-Konto nur lesend |

1. Appwrite-Sitzungen statt Rollenwahl einfuehren; verifizierte Account-IDs den
   bestehenden employeeIds zuordnen. Mandantentrennung serverseitig durchsetzen.
2. Freigabe ueber eine Appwrite Function: Buero-Rolle pruefen, Konflikte und
   erwartete Revision validieren, Freigabe und Empfaengerzustellung idempotent
   erzeugen. Ein Retry darf keine zweite Version erzeugen.
3. Clients abonnieren nur berechtigte Dokumente. Nach Wiederverbindung zuerst
   vollstaendig nachladen, dann Realtime-Ereignisse anwenden. Offline-Status und
   Zeitpunkt der letzten bestaetigten Synchronisierung sichtbar machen.
4. Ein Display-Konto hat ausschliesslich Leserechte auf freigegebene Aushangdaten.
   Keine Administrator-Sitzung, kein API-Key und kein oeffentlicher Namenslisten-Link
   auf dem Wanddisplay. Geraet sperren und Zugang widerrufbar machen.
5. Optionaler Versand nach Feierabend wird als serverseitiger Job mit expliziter
   Zeitzone `Europe/Berlin`, festgelegter Versandzeit, Ruhezeiten, Abwesenheiten und
   Retry-/Deduplizierungsregeln implementiert. Jetzt erfolgt die Freigabe manuell.

Wichtig: Das vorhandene `scripts/setup-appwrite.mjs` verwendet Demo-Berechtigungen
mit `any` und kann Seed-Daten erneut schreiben. Es ist **kein sicherer Migrationsweg
fuer Mitarbeiterpostfaecher**. Nicht ungeprueft gegen Produktivdaten ausfuehren.
Frueher im Chat geteilte administrative API-Keys vor Produktivbetrieb widerrufen
und ersetzen; niemals in Frontend, Repository oder Display-URL speichern.

Grundlage: [Appwrite-Berechtigungen](https://appwrite.io/docs/advanced/security/permissions)
und [Account-Sitzungen](https://appwrite.io/docs/references/cloud/client-web/account).

## Verifikation

`npm run test:unit` prueft Freigabe, Unveraenderlichkeit, Empfaengerwechsel,
Lesebestaetigung, Konflikte, ungueltige Eingaben, Speicherfehler und Datumskanten.
`npm test` prueft bestehende Funktionen und den kompletten Ablauf mit Playwright,
einschliesslich 320/390/768/1440px, Tab-Aktualisierung, Aushang und Druck.
Cloud-Zugriffe werden in den Tests abgefangen; Testdaten gehen nicht an Appwrite.
