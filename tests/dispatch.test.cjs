const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const Dispatch = require("../components/dispatch.js");
const Catalog = require("../components/planning-catalog.js");
const date = "2026-09-30";
const admin = { id: "office", role: "admin", name: "Disposition" };
function fixture() {
  const items = new Map();
  const storage = { getItem: key => items.get(key) || null, setItem: (key, value) => items.set(key, value) };
  const data = { users: [{ id: "kira", name: "Kira", role: "team" }, { id: "tilo", name: "Tilo", role: "team" }], vehicles: [{ id: "lift", name: "Hubsteiger", plate: "DEMO-LIFT-01" }], equipment: [{ id: "chipper", name: "Hacker" }], orders: [{ id: "order" }] };
  const repo = Dispatch.createRepository(storage, () => data);
  const entry = { id: "one", site: "Musterstraße", address: "Musterstadt", start: "07:00", end: "15:30", employeeIds: ["kira", "tilo"], vehicleIds: ["lift"], equipmentIds: ["chipper"], orderId: "order", meeting: "Hof", notes: "", task: "Kronenpflege" };
  return { repo, storage, data, entry };
}
test("drafts are invisible; publication snapshots survive later edits and master-data changes", () => {
  const { repo, entry, data } = fixture();
  const draft = repo.saveDraft(date, { entries: [entry], note: "Helme mitbringen" }, 0);
  assert.deepEqual(repo.messages("kira"), []);
  const published = repo.publish(date, draft.version, admin);
  assert.equal(repo.messages("kira")[0].rows[0].site, entry.site);
  repo.saveDraft(date, { entries: [{ ...entry, site: "Andere Baustelle" }], note: "Neu" }, published.version);
  data.users[0].name = "Geaendert";
  assert.equal(repo.messages("kira")[0].rows[0].site, entry.site);
  assert.equal(repo.messages("kira")[0].rows[0].employees[0].name, "Kira");
  assert.equal(repo.messages("kira")[0].entries, undefined);
});
test("republication reaches removed employees and requires a new read receipt", () => {
  const { repo, entry } = fixture();
  repo.saveDraft(date, { entries: [entry] }, 0);
  repo.publish(date, 1, admin);
  repo.markRead("kira", `${date}-v1`);
  repo.saveDraft(date, { entries: [{ ...entry, employeeIds: ["tilo"] }] }, 2);
  repo.publish(date, 3, admin);
  const messages = repo.messages("kira");
  assert.equal(messages.length, 2);
  assert.deepEqual(messages[0].rows, []);
  assert.equal(messages[0].readAt, null);
  assert.ok(messages[1].readAt);
  assert.equal(messages[0].revision, 2);
});
test("unrelated assignments never appear in personal messages", () => {
  const { repo, entry } = fixture();
  repo.saveDraft(date, { entries: [{ ...entry, employeeIds: ["tilo"] }] }, 0);
  repo.publish(date, 1, admin);
  assert.deepEqual(repo.messages("kira"), []);
  assert.throws(() => repo.markRead("kira", `${date}-v1`), /nicht zugeordnet/);
});
test("duplicate publication, stale writes and non-office publication are rejected", () => {
  const { repo, entry } = fixture();
  repo.saveDraft(date, { entries: [entry] }, 0);
  assert.throws(() => repo.saveDraft(date, { entries: [] }, 0), /zwischenzeitlich/);
  assert.throws(() => repo.publish(date, 1, { role: "team" }), /Disposition/);
  repo.publish(date, 1, admin);
  assert.equal(Dispatch.dirty(repo.day(date)), false);
  assert.throws(() => repo.publish(date, 2, admin), /bereits freigegeben/);
  assert.equal(repo.day(date).version, 2);
});
test("overlapping employee, vehicle and equipment use is rejected; adjacent work is allowed", () => {
  const { repo, entry, data } = fixture();
  const second = { ...entry, id: "two", site: "Hof" };
  assert.equal(Dispatch.validate([entry, second], data).filter(issue => issue.includes("zeitgleich")).length, 4);
  assert.throws(() => repo.saveDraft(date, { entries: [entry, second] }, 0), /zeitgleich/);
  assert.deepEqual(Dispatch.validate([entry, { ...second, start: "15:30", end: "16:30" }], data), []);
});
test("required fields, times, invalid dates and missing resources are rejected", () => {
  const { repo, entry } = fixture();
  for (const patch of [{ site: " " }, { employeeIds: [] }, { vehicleIds: ["unknown"] }, { start: "25:00" }, { end: "06:00" }, { orderId: "missing" }]) {
    assert.throws(() => repo.saveDraft(date, { entries: [{ ...entry, ...patch }] }, 0));
  }
  assert.throws(() => repo.saveDraft("2026-02-30", { entries: [entry] }, 0), /Datum/);
  assert.throws(() => repo.publish(date, 0, admin), /Tageshinweis/);
});
test("empty-day release cancels earlier assignments without destroying history", () => {
  const { repo, entry } = fixture();
  repo.saveDraft(date, { entries: [entry] }, 0);
  repo.publish(date, 1, admin);
  repo.saveDraft(date, { entries: [], note: "Sturm: alle Einsaetze abgesagt" }, 2);
  repo.publish(date, 3, admin);
  assert.equal(repo.messages("kira")[0].rows.length, 0);
  assert.equal(repo.messages("kira")[0].note, "Sturm: alle Einsaetze abgesagt");
  assert.equal(repo.day(date).releases.length, 2);
});
test("corrupt storage and quota failures do not overwrite existing plans", () => {
  const { repo, storage, entry } = fixture();
  storage.setItem(Dispatch.KEY, "{broken");
  assert.throws(() => repo.read(), /unlesbar/);
  assert.throws(() => repo.saveDraft(date, { entries: [entry] }, 0));
  assert.equal(storage.getItem(Dispatch.KEY), "{broken");
  storage.setItem(Dispatch.KEY, JSON.stringify({ schema: 2 }));
  assert.throws(() => repo.read(), /datenformat/);
  const full = Dispatch.createRepository({ getItem: () => null, setItem: () => { throw Error("QuotaExceeded"); } }, () => ({}));
  assert.throws(() => full.saveDraft(date, { entries: [] }, 0), /Speicher/);
});
test("local calendar arithmetic handles month/year changes and daylight savings", () => {
  assert.equal(Dispatch.localDate(1, new Date(2026, 11, 31, 23)), "2027-01-01");
  assert.equal(Dispatch.localDate(1, new Date(2026, 2, 28, 23)), "2026-03-29");
  assert.equal(Dispatch.localDate(-1, new Date(2026, 9, 26, 1)), "2026-10-25");
});
test("an empty tree list does not reset all existing local application data", () => {
  const saved = { version: 4, data: { trees: [], orders: [{ id: "keep-me" }] } };
  const context = { window: {}, localStorage: { getItem: () => JSON.stringify(saved), setItem: () => assert.fail("must not reset") } };
  vm.runInNewContext(fs.readFileSync(require.resolve("../components/data.js"), "utf8"), context);
  assert.equal(context.window.MOCK_DATA.orders[0].id, "keep-me");
});

test("catalog import preserves existing records and remains idempotent after edits and deletions", () => {
  const changed = { id: "PLAN-DEMO-01", title: "Eigener Auftrag" };
  const data = { trees: [], orders: [changed], users: [{ id: "custom", name: "Eigene Mitarbeiterin" }], vehicles: [], equipment: [] };
  const merged = Catalog.merge(data);
  assert.equal(merged.orders[0], changed);
  assert.equal(merged.users[0], data.users[0]);
  assert.equal(data.orders.length, 1);
  assert.equal(merged.trees.length, 0);
  merged.users[1].name = "Korrigierter Name";
  merged.orders.pop();
  assert.equal(Catalog.merge(merged), merged);
  assert.equal(merged.users[1].name, "Korrigierter Name");
  for (const key of ["orders", "users", "vehicles", "equipment"]) assert.equal(new Set(merged[key].map(item => item.id)).size, merged[key].length);
});

test("catalog has complete references, demo names and no invented email or driving data", () => {
  const context = { window: {}, localStorage: { getItem: () => null, setItem: () => {} } };
  vm.runInNewContext(fs.readFileSync(require.resolve("../components/data.js"), "utf8"), context);
  const data = Catalog.merge(context.window.MOCK_DATA);
  assert.equal(data.orders.length, 6);
  assert.equal(data.vehicles.length, 6);
  assert.equal(data.users.length, 18);
  assert.equal(data.equipment.length, 3);
  for (const name of ["Malin", "Jonna", "Ari"]) assert.ok(data.users.some(user => user.name === name));
  for (const user of Catalog.catalog.users) {
    assert.equal(user.email, "");
    assert.deepEqual(user.licenses, []);
  }
  for (const order of data.orders) {
    for (const [field, records] of [["crewIds", data.users], ["vehicleIds", data.vehicles], ["equipmentIds", data.equipment]]) {
      assert.ok(order[field].every(id => records.some(record => record.id === id)), `${order.id}: ${field}`);
    }
  }
  assert.ok(data.orders.find(order => order.id === "PLAN-DEMO-03").crewIds.includes("user-007"));
  assert.ok(data.orders.find(order => order.id === "PLAN-DEMO-05").vehicleIds.includes("veh-002"));
  assert.equal(Catalog.catalog.orders.filter(order => order.startTime).length, 1);
  assert.ok(Catalog.catalog.orders.every(order => order.scheduledDate === ""));
});

test("catalog quota failures leave core data intact and are surfaced", () => {
  const data = { users: [], orders: [], vehicles: [], equipment: [] };
  const window = { MOCK_DATA: data, localStorage: { getItem: () => JSON.stringify({ version: 4, data }), setItem: () => { throw Error("QuotaExceeded"); } } };
  vm.runInNewContext(fs.readFileSync(require.resolve("../components/planning-catalog.js"), "utf8"), { window });
  assert.equal(window.MOCK_DATA, data);
  assert.match(window.TREELINE_CATALOG_ERROR, /nicht gespeichert/);
});

test("search supports case, accents, plate numbers and multiple words", () => {
  assert.ok(Dispatch.matchesSearch({ title: "Kronenpflege Musterstraße", city: "Musterstadt" }, "MUSTERSTADT strasse"));
  assert.ok(Dispatch.matchesSearch({ name: "Kippanhänger" }, "kipphanger") === false);
  assert.ok(Dispatch.matchesSearch({ name: "Kippanhänger" }, "kippanhanger"));
  assert.ok(Dispatch.matchesSearch({ name: "VW TGE 3", plate: "DEMO-TRANS-42" }, "tge 42"));
  assert.equal(Dispatch.matchesSearch({ name: "Malin" }, "Ari"), false);
});

test("order presets copy arrays, keep unspecified times and leave notes intact", () => {
  const { entry } = fixture();
  const order = Catalog.catalog.orders.find(item => item.id === "PLAN-DEMO-04");
  const applied = Dispatch.applyOrder({ ...entry, notes: "Rückruf", start: "09:00" }, order);
  assert.equal(applied.start, "09:00");
  assert.equal(applied.notes, "Rückruf");
  assert.equal(applied.site, "Lichtung Nord");
  applied.employeeIds.pop();
  assert.equal(order.crewIds.length, 2);
});

test("availability ignores the current row and adjacent time slots", () => {
  const { entry } = fixture();
  const other = { ...entry, id: "second", start: "15:30", end: "16:00" };
  assert.deepEqual(Dispatch.resourceBookings([entry, other], entry, "employeeIds", "kira"), []);
  other.start = "15:00";
  assert.deepEqual(Dispatch.resourceBookings([entry, other], entry, "vehicleIds", "lift"), [other]);
});
