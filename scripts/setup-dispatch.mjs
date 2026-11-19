import { mkdtemp, copyFile, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import { setTimeout as wait } from "node:timers/promises";

const endpoint = "https://fra.cloud.appwrite.io/v1";
const project = "6a1eb74900004d821d08";
const key = process.env.APPWRITE_API_KEY;
const db = "/databases/treeline_dispatch";
const fn = "/functions/dispatch_gateway";
if (!key) throw new Error("APPWRITE_API_KEY lokal setzen, nicht ins Repository schreiben.");
async function api(path, method = "GET", data) {
  const multipart = data instanceof FormData;
  const r = await fetch(endpoint + path, { method, headers: { "X-Appwrite-Key": key, "X-Appwrite-Project": project, ...(!multipart && { "Content-Type": "application/json" }) },
    body: multipart ? data : JSON.stringify(data) });
  const body = await r.json();
  if (!r.ok) throw Object.assign(new Error(method + " " + path + ": " + (body.type || r.status) + " · " + body.message), { code: r.status });
  return body;
}
async function ensure(path, create) {
  try { return await api(path); } catch (e) { if (e.code !== 404) throw e; }
  return create();
}
async function ready(path) {
  for (let i = 0; i < 90; i++) {
    const item = await api(path);
    if (item.status === "available") return;
    if (["failed", "stuck"].includes(item.status)) throw new Error("Einrichtung fehlgeschlagen: " + path);
    await wait(1000);
  }
  throw new Error("Zeitüberschreitung: " + path);
}
const s = (key, size, array = false) => ({ key, size, array, required: !array, type: "string" });
const schema = {
  profiles: { attrs: [s("profileId", 64), s("name", 160), s("role", 16)], indexes: [["profile_unique", ["profileId"], "unique"], ["role_lookup", ["role"]]] },
  versions: { attrs: [s("day", 10), { key: "version", type: "integer", required: true }, { key: "released", type: "boolean", required: true }, s("audience", 64, true), s("payload", 200000)], indexes: [["day_version", ["day","version"]], ["published_version", ["day","released","version"]], ["personal_inbox", ["audience"]]] },
  receipts: { attrs: [s("releaseId", 36), s("profileId", 64)], indexes: [["by_release", ["releaseId"]]] },
};
async function setup() {
  await ensure(db, () => api("/databases", "POST", { databaseId: "treeline_dispatch", name: "Treeline Einsatzbetrieb" }));
  for (const [collectionId, { attrs, indexes }] of Object.entries(schema)) {
    const path = db + "/collections/" + collectionId;
    const col = await ensure(path, () => api(db + "/collections", "POST", { collectionId, name: collectionId, permissions: [], documentSecurity: false }));
    if (col.$permissions?.length || col.documentSecurity) throw new Error("Unerwartete Zugriffsrechte: " + collectionId);
    for (const { type, ...attr } of attrs) {
      const p = path + "/attributes/" + attr.key;
      const a = await ensure(p, () => api(path + "/attributes/" + type, "POST", attr));
      if (a.type !== type || a.required !== attr.required || !!a.array !== !!attr.array || (attr.size && a.size < attr.size)) throw new Error("Abweichendes Feld: " + p);
      await ready(p);
    }
    for (const [key, attributes, type = "key"] of indexes) {
      const p = path + "/indexes/" + key;
      const idx = await ensure(p, () => api(path + "/indexes", "POST", { key, type, attributes }));
      if (idx.type !== type || JSON.stringify(idx.attributes) !== JSON.stringify(attributes)) throw new Error("Abweichender Index: " + p);
      await ready(p);
    }
  }
  const settings = { name: "Treeline Einsatzdienst", runtime: "node-22", execute: ["users"], scopes: ["rows.read", "rows.write"], entrypoint: "main.cjs", commands: "", enabled: true, logging: false, timeout: 30 };
  const existing = await ensure(fn, () => api("/functions", "POST", { functionId: "dispatch_gateway", ...settings }));
  if (existing.name !== settings.name) throw new Error("Funktionskennung bereits anderweitig belegt.");
  await api(fn, "PUT", settings);
  const dir = await mkdtemp(join(tmpdir(), "treeline-dispatch-"));
  try {
    for (const [from, to] of [["functions/dispatch/main.cjs","main.cjs"],["functions/dispatch/service.cjs","service.cjs"],["components/dispatch.js","dispatch.cjs"]]) await copyFile(new URL("../" + from, import.meta.url), join(dir, to));
    execFileSync("tar", ["-czf", join(dir,"code.tar.gz"), "-C", dir, "main.cjs", "service.cjs", "dispatch.cjs"], { env: { ...process.env, COPYFILE_DISABLE: "1" } });
    const form = new FormData();
    form.set("code", new Blob([await readFile(join(dir,"code.tar.gz"))]), "code.tar.gz");
    form.set("activate", "true"); form.set("entrypoint", "main.cjs");
    const deployment = await api(fn + "/deployments", "POST", form);
    for (let i = 0; i < 180; i++) {
      if ((await api(fn)).deploymentId === deployment.$id) { console.log("Privates Schema und Einsatzdienst aktiv."); return; }
      const d = await api(fn + "/deployments/" + deployment.$id);
      if (["failed", "canceled"].includes(d.status)) throw new Error("Bereitstellung fehlgeschlagen: " + deployment.$id);
      await wait(2000);
    }
    throw new Error("Aktivierung nicht bestätigt. Bitte Bereitstellung in Appwrite prüfen.");
  } finally { await rm(dir, { recursive: true, force: true }); }
}

async function bind([accountId, role, profileId, name]) {
  if (!["office","employee","display"].includes(role) || ![accountId,profileId].every(v => typeof v === "string" && /^[a-zA-Z0-9][a-zA-Z0-9._-]{0,35}$/.test(v)) || !name?.trim()) throw new Error("bind ACCOUNT_ID office|employee|display PROFIL_ID 'Anzeigename'");
  await api("/users/" + accountId);
  const path = db + "/collections/profiles/documents";
  const record = await ensure(path + "/" + accountId, () => api(path, "POST", { documentId: accountId, data: { role, name, profileId }, permissions: [] }));
  if (record.role !== role || record.name !== name || record.profileId !== profileId) throw new Error("Bestehende Zuordnung weicht ab; nicht überschrieben.");
  console.log("Betriebskonto zugeordnet.");
}
try {
  if (process.argv[2] === "bind") await bind(process.argv.slice(3));
  else if (!process.argv[2]) await setup();
  else throw new Error("Unbekannter Aufruf.");
} catch (err) { console.error(err.message); process.exitCode = 1; }
