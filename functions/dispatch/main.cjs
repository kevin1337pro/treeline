"use strict";
const { dispatch, q } = require("./service.cjs");
const D = require("./dispatch.cjs");
module.exports = async ({ req, res, error }) => {
  const endpoint = process.env.APPWRITE_FUNCTION_API_ENDPOINT;
  const project = process.env.APPWRITE_FUNCTION_PROJECT_ID;
  const headers = { "X-Appwrite-Project": project, "Content-Type": "application/json" };
  const token = req.headers["x-appwrite-user-jwt"];
  try {
    if (!token) return res.json({ message: "Bitte anmelden." }, 401);
    const auth = await fetch(endpoint + "/account", { headers: { ...headers, "X-Appwrite-JWT": token } });
    if (!auth.ok) return res.json({ message: "Anmeldung nicht verfügbar." }, auth.status === 401 ? 401 : 503);
    const account = await auth.json();
    headers["X-Appwrite-Key"] = req.headers["x-appwrite-key"];
    const path = c => endpoint + "/databases/treeline_dispatch/collections/" + c + "/documents";
    async function call(url, options = {}) {
      const r = await fetch(url, { headers, ...options });
      if (!r.ok) throw Object.assign(new Error("Appwrite-Datenzugriff fehlgeschlagen."), { code: r.status, internal: true });
      return r.json();
    }
    const db = {
      async get(c, id) { try { return await call(path(c) + "/" + encodeURIComponent(id)); } catch (e) { if (e.code === 404) return null; throw e; } },
      async list(c, queries) { const u = new URL(path(c)); for (const query of queries) u.searchParams.append("queries[]", JSON.stringify(query)); return (await call(u)).documents; },
      async all(c, queries) { const rows = []; let batch;
        do { batch = await this.list(c, [...queries, q("limit", null, [100]), ...(rows.length ? [q("cursorAfter", null, [rows.at(-1).$id])] : [])]); rows.push(...batch); } while (batch.length === 100); return rows; },
      create(c, documentId, data) { return call(path(c), { method: "POST", body: JSON.stringify({ documentId, data, permissions: [] }) }); },
    };
    return res.json(await dispatch(D, db, account.$id, req.bodyJson || {}));
  } catch (e) {
    if (e.internal || !e.code) error("dispatch: " + (Number(e.code) || 500));
    const code = e.code === 409 ? 409 : e.internal ? 503 : [400,401,403].includes(e.code) ? e.code : 500;
    return res.json({ message: e.internal && code === 409 ? "Plan inzwischen geändert. Bitte neu öffnen." : e.internal || code === 500 ? "Betriebsdaten derzeit nicht verfügbar." : e.message }, code);
  }
};
