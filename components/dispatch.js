(function (root) {
  "use strict";
  const KEY = "treeline_dispatch_v1";
  const clone = value => JSON.parse(JSON.stringify(value));
  const empty = () => ({ schema: 1, days: {}, receipts: {} });
  const localDate = (offset = 0, now = new Date()) => {
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset, 12);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  };
  function validDate(value) {
    return /^\d{4}-\d{2}-\d{2}$/.test(value) && localDate(0, new Date(`${value}T12:00:00`)) === value;
  }
  const blankDay = date => ({ date, version: 0, note: "", entries: [], releases: [] });
  const latest = day => day?.releases?.[day.releases.length - 1] || null;
  const content = day => JSON.stringify({ note: day.note, entries: day.entries });
  const dirty = day => !latest(day) || content(day) !== content(latest(day));
  const employees = data => data.users.filter(user => user.role !== "client");
  const record = value => value !== null && typeof value === "object" && !Array.isArray(value);
  const strings = value => Array.isArray(value) && value.every(item => typeof item === "string");
  const entryShape = entry => record(entry) && ["id", "site", "address", "start", "end", "orderId", "meeting", "notes", "task"].every(key => typeof entry[key] === "string") && ["employeeIds", "vehicleIds", "equipmentIds"].every(key => strings(entry[key]));
  const snapshotShape = row => entryShape(row) && ["employees", "vehicles", "equipment"].every(key => Array.isArray(row[key]) && row[key].every(item => record(item) && typeof item.id === "string" && typeof item.name === "string"));

  function validate(entries, data) {
    const issues = [];
    const ids = new Set();
    const time = value => /^([01]\d|2[0-3]):[0-5]\d$/.test(value || "");
    entries.forEach((entry, index) => {
      const label = entry.site || `Einsatz ${index + 1}`;
      if (!entry.id || ids.has(entry.id)) issues.push(`${label}: doppelte oder fehlende Kennung.`);
      ids.add(entry.id);
      if (!entry.site?.trim()) issues.push(`Einsatz ${index + 1}: Baustelle fehlt.`);
      if (!time(entry.start) || !time(entry.end) || entry.end <= entry.start) issues.push(`${label}: Ende muss am selben Tag nach Beginn liegen.`);
      if (!entry.employeeIds?.length) issues.push(`${label}: mindestens einen Mitarbeiter einteilen.`);
      for (const [field, records] of [["employeeIds", employees(data)], ["vehicleIds", data.vehicles], ["equipmentIds", data.equipment]]) {
        if (!Array.isArray(entry[field]) || entry[field].some(id => !records.some(record => record.id === id))) issues.push(`${label}: unbekannte Ressource.`);
      }
      if (entry.orderId && !data.orders.some(order => order.id === entry.orderId)) issues.push(`${label}: Auftrag nicht mehr vorhanden.`);
      for (const other of entries.slice(0, index)) {
        if (time(entry.start) && time(entry.end) && entry.start < other.end && other.start < entry.end) {
          for (const [field, records] of [["employeeIds", data.users], ["vehicleIds", data.vehicles], ["equipmentIds", data.equipment]]) {
            for (const id of entry[field] || []) {
              if (other[field]?.includes(id)) issues.push(`${records.find(item => item.id === id)?.name || id}: zeitgleich bei ${other.site} und ${label} eingeplant.`);
            }
          }
        }
      }
    });
    return issues;
  }

  function snapshot(entry, data) {
    return {
      ...clone(entry),
      employees: entry.employeeIds.map(id => ({ id, name: data.users.find(user => user.id === id).name })),
      vehicles: entry.vehicleIds.map(id => { const vehicle = data.vehicles.find(item => item.id === id); return { id, name: vehicle.name, plate: vehicle.plate }; }),
      equipment: entry.equipmentIds.map(id => ({ id, name: data.equipment.find(item => item.id === id).name })),
    };
  }

  function createRepository(storage, getData, emit = () => {}) {
    function read() {
      const raw = storage.getItem(KEY);
      if (!raw) return empty();
      let state;
      try { state = JSON.parse(raw); } catch (_) { throw new Error("Einsatzdaten sind unlesbar. Gespeicherte Daten wurden nicht ersetzt."); }
      if (state?.schema !== 1 || !record(state.days) || !record(state.receipts)) throw new Error("Unbekanntes Einsatzdatenformat. Daten wurden nicht ersetzt.");
      for (const [date, day] of Object.entries(state.days)) {
        if (!record(day) || day.date !== date || !validDate(date) || typeof day.note !== "string" || !Array.isArray(day.entries) || !day.entries.every(entryShape) || !Array.isArray(day.releases) || !Number.isInteger(day.version) || day.version < 0) throw new Error("Einsatzdaten sind unvollstaendig. Daten wurden nicht ersetzt.");
        for (const release of day.releases) {
          if (!record(release) || release.date !== date || typeof release.id !== "string" || typeof release.note !== "string" || typeof release.publishedBy !== "string" || !Number.isFinite(Date.parse(release.publishedAt)) || !Number.isInteger(release.revision) || !strings(release.recipients) || !Array.isArray(release.entries) || !release.entries.every(entryShape) || !Array.isArray(release.rows) || !release.rows.every(snapshotShape)) throw new Error("Freigabedaten sind unvollstaendig. Daten wurden nicht ersetzt.");
        }
      }
      return state;
    }
    function write(state) {
      try { storage.setItem(KEY, JSON.stringify(state)); }
      catch (_) { throw new Error("Speichern fehlgeschlagen. Der lokale Speicher ist voll oder gesperrt."); }
      emit();
    }
    function transact(date, expectedVersion, update) {
      if (!validDate(date)) throw new Error("Bitte ein gueltiges Datum auswaehlen.");
      const state = read();
      const day = state.days[date] || blankDay(date);
      if (day.version !== expectedVersion) throw new Error("Der Plan wurde zwischenzeitlich geaendert. Bitte neu laden und erneut bearbeiten.");
      update(day);
      day.version += 1;
      state.days[date] = day;
      write(state);
      return clone(day);
    }
    return {
      read,
      day(date) { return clone(read().days[date] || blankDay(date)); },
      saveDraft(date, draft, expectedVersion) {
        return transact(date, expectedVersion, day => {
          if (!Array.isArray(draft.entries) || !draft.entries.every(entryShape)) throw new Error("Ungueltige Einsatzdaten.");
          const issues = validate(draft.entries, getData());
          if (issues.length) throw new Error(issues.join("\n"));
          day.note = String(draft.note || "").trim();
          day.entries = clone(draft.entries).sort((a, b) => a.start.localeCompare(b.start) || a.id.localeCompare(b.id));
        });
      },
      publish(date, expectedVersion, actor) {
        if (actor?.role !== "admin") throw new Error("Nur die Disposition kann einen Plan freigeben.");
        return transact(date, expectedVersion, day => {
          const issues = validate(day.entries, getData());
          if (issues.length) throw new Error(issues.join("\n"));
          if (!dirty(day)) throw new Error("Diese Version ist bereits freigegeben.");
          if (!day.entries.length && !day.note) throw new Error("Bei einem leeren Tagesplan bitte einen Tageshinweis angeben.");
          const previous = latest(day);
          // Keep removed employees in the audience so they receive cancellation updates.
          const recipients = [...new Set([...(previous?.recipients || []), ...day.entries.flatMap(entry => entry.employeeIds)])];
          day.releases.push({
            id: `${date}-v${day.releases.length + 1}`, revision: day.releases.length + 1,
            date, note: day.note, entries: clone(day.entries),
            rows: day.entries.map(entry => snapshot(entry, getData())), recipients,
            publishedAt: new Date().toISOString(), publishedBy: actor.name,
          });
        });
      },
      messages(userId) {
        const state = read();
        return Object.values(state.days).flatMap(day => day.releases)
          .filter(release => release.recipients.includes(userId))
          .map(release => ({
            ...clone(release), rows: clone(release.rows.filter(entry => entry.employeeIds.includes(userId))),
            entries: undefined, recipients: undefined,
            readAt: state.receipts[`${userId}:${release.id}`] || null,
          }))
          .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt) || b.revision - a.revision);
      },
      markRead(userId, releaseId) {
        const state = read();
        const release = Object.values(state.days).flatMap(day => day.releases).find(item => item.id === releaseId);
        if (!release?.recipients.includes(userId)) throw new Error("Nachricht ist diesem Profil nicht zugeordnet.");
        state.receipts[`${userId}:${releaseId}`] = new Date().toISOString();
        write(state);
      },
    };
  }
  const api = { KEY, localDate, validDate, blankDay, latest, dirty, employees, validate, createRepository };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else {
    root.Dispatch = api;
    root.DISPATCH_STORE = createRepository(root.localStorage, () => root.MOCK_DATA, () => root.dispatchEvent(new Event("treeline:dispatch")));
  }
})(typeof window !== "undefined" ? window : globalThis);
