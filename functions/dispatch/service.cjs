"use strict";
const { createHash } = require("node:crypto");
const fail = (code, message) => { throw Object.assign(new Error(message), { code }); };
const receiptId = (id, profile) => createHash("sha256").update(JSON.stringify([id, profile])).digest("hex").slice(0, 36);
const q = (method, attribute, values) => ({ method, ...(attribute ? { attribute } : {}), ...(values ? { values } : {}) });
const eq = (key, ...values) => q("equal", key, values);
const desc = key => q("orderDesc", key);
const head = q("limit", null, [1]);
const cleanId = id => typeof id === "string" && /^[a-zA-Z0-9][a-zA-Z0-9._-]{0,63}$/.test(id);

async function dispatch(D, db, accountId, input, team) {
  if (!accountId) fail(401, "Bitte anmelden.");
  const profile = await db.get("profiles", accountId);
  if (!profile || !["office", "employee", "display"].includes(profile.role)) fail(403, "Für dieses Konto ist kein Betriebszugang zugeordnet.");
  const { role, profileId, name } = profile;
  const { action, date } = input;
  if (action === "profile") return { role, id: profileId, name };
  if (typeof action === "string" && /^(team|tree):/.test(action) && team) return team.run(db, { role, id: profileId, name }, input);
  const allowed = { office: ["office", "draft", "publish", "board"], employee: ["inbox", "confirm"], display: ["board"] };
  if (!allowed[role].includes(action)) fail(403, "Diese Aktion ist für dieses Konto nicht freigegeben.");
  const unpack = doc => doc && JSON.parse(doc.payload);
  const current = async (date, releaseOnly) => unpack((await db.list("versions", [eq("day", date), ...(releaseOnly ? [eq("released", true)] : []), desc("version"), head]))[0]);
  if (action === "inbox") {
    const docs = await db.list("versions", [q("contains", "audience", [profileId]), desc("$createdAt"), q("limit", null, [50])]);
    const acks = docs.length ? await db.list("receipts", [eq("$id", ...docs.map(doc => receiptId(doc.$id, profileId))), q("limit", null, [50])]) : [];
    return { messages: docs.map(doc => {
      const { id, date, revision, publishedAt, publishedBy, rows, note } = unpack(doc);
      return { id, date, revision, publishedAt, publishedBy, note, rows: rows.filter(row => row.employeeIds.includes(profileId)), readAt: acks.find(r => r.releaseId === id)?.$createdAt || null };
    }) };
  }
  if (action === "confirm") {
    if (!cleanId(input.id)) fail(400, "Ungültige Freigabe.");
    const doc = await db.get("versions", input.id);
    if (!doc?.released || !doc.audience.includes(profileId)) fail(403, "Keine eigene Einsatzmitteilung.");
    if ((await current(doc.day, true))?.id !== input.id) fail(409, "Der Plan wurde geändert. Bitte die aktuelle Version bestätigen.");
    try { await db.create("receipts", receiptId(input.id, profileId), { releaseId: input.id, profileId }); }
    catch (err) { if (err.code !== 409) throw err; }
    return { ok: true };
  }
  if (!D.validDate(date)) fail(400, "Ungültiges Einsatzdatum.");
  if (action === "board") {
    const release = await current(date, true);
    if (!release) return { release: null };
    const { id, revision, publishedAt, publishedBy, rows, note } = release;
    return { release: { id, date, revision, publishedAt, publishedBy, rows, note } };
  }
  const last = await current(date, false);
  const release = last?.revision ? last : last?.releaseId ? unpack(await db.get("versions", last.releaseId)) : null;
  // Two requests for the same base version compete for one immutable document ID.
  const day = { date, version: last?.version || 0, note: last?.note || "", entries: last?.entries || [], releases: release ? [release] : [] };
  const staff = (await db.all("profiles", [eq("role", "employee")])).map(p => ({ id: p.profileId, name: p.name, role: "employee" }));
  if (action === "office") {
    const receipts = {};
    if (release) for (const r of await db.all("receipts", [eq("releaseId", release.id)])) receipts[r.profileId + ":" + release.id] = r.$createdAt;
    return { day, receipts, staff };
  }
  if (input.version !== day.version || (release && release.version > day.version)) fail(409, "Plan inzwischen geändert. Bitte neu öffnen.");
  const version = day.version + 1;
  const id = date + "-s" + version;
  let next, audience = [];
  if (action === "draft") {
    const { entries, note, resources } = input;
    if (!Array.isArray(entries) || entries.length > 100 || !entries.every(D.entryShape) || typeof note !== "string" || note.length > 2000) fail(400, "Ungültige Einsatzdaten.");
    if (!resources || !["vehicles", "equipment", "orders"].every(k => Array.isArray(resources[k]) && resources[k].every(r => cleanId(r.id) && typeof r.name === "string"))) fail(400, "Ungültige Ressourcen.");
    const catalog = { ...resources, users: staff };
    const issues = D.validate(entries, catalog);
    if (issues.length) fail(400, issues.join("\n"));
    next = { date, version, releaseId: release?.id || null, entries, note: note.trim(), rows: entries.map(e => D.snapshot(e, catalog)) };
  } else {
    if (!last || !D.dirty(day)) fail(409, "Kein geänderter Entwurf vorhanden.");
    if (!day.entries.length && !day.note && !release) fail(400, "Für einen leeren Plan bitte einen Tageshinweis angeben.");
    const ids = day.entries.flatMap(e => e.employeeIds);
    if (ids.some(id => !staff.some(person => person.id === id))) fail(400, "Ein Mitarbeiterkonto ist nicht mehr zugeordnet. Bitte den Entwurf korrigieren.");
    audience = [...new Set([...(release?.recipients || []), ...ids])];
    next = { ...last, id, version, revision: (release?.revision || 0) + 1, recipients: audience,
      publishedAt: new Date().toISOString(), publishedBy: name };
  }
  const payload = JSON.stringify(next);
  if (Buffer.byteLength(payload) > 190000) fail(400, "Der Tagesplan ist zu groß.");
  await db.create("versions", id, { day: date, version, released: action === "publish", audience, payload });
  return { ok: true };
}
module.exports = { dispatch, q };
