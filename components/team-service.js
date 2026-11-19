(function (root) {
  "use strict";
  const fail = (code, message) => { throw Object.assign(new Error(message), { code }); };
  function text(value, max, required = false) {
    if (typeof value !== "string" || value.trim().length > max || (required && !value.trim())) fail(400, "Bitte Eingabe und Textlänge prüfen.");
    return value.trim();
  }
  function id(value) {
    if (typeof value !== "string" || !/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,35}$/.test(value)) fail(400, "Ungültige Kennung.");
    return value;
  }
  const q = (method, attribute, values) => ({ method, ...(attribute && { attribute }), ...(values && { values }) });
  const equal = (attr, values) => q("equal", attr, values);
  const topics = ["Allgemein", "Einsatz", "Frage"];
  async function likeId(post, user) {
    const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(JSON.stringify([post, user])));
    return "l" + Array.from(new Uint8Array(hash).slice(0,17), n => n.toString(16).padStart(2,"0")).join("");
  }
  const line = (doc, user) => ({ id: doc.$id, name: doc.byName, mine: doc.author === user.id, text: doc.body,
    topic: doc.topic, createdAt: doc.$createdAt, updatedAt: doc.$updatedAt });
  const tree = d => ({ id:d.$id, name:d.name, species:d.species, place:d.place, notes:d.notes,
    createdBy:d.creator, createdAt:d.$createdAt, updatedBy:d.editor, updatedAt:d.$updatedAt });
  async function run(db, user, input) {
    if (!user || !["office","employee"].includes(user.role)) fail(403, "Nur für das Betriebsteam.");
    const { action } = input;
    if (action === "tree:list") return { trees:(await db.all("trees",[q("orderDesc","$createdAt")])).map(tree) };
    if (["tree:new","tree:update"].includes(action)) {
      const fields = { name:text(input.name,160,true), species:text(input.species,160), place:text(input.place,240,true),
        notes:text(input.notes,2000), editor:user.name, editorId:user.id };
      const key = id(input.id);
      if (action === "tree:new") return { tree:tree(await db.create("trees",key,{ ...fields, creator:user.name, creatorId:user.id })) };
      const before = await db.get("trees",key);
      if (!before) fail(404,"Baum nicht gefunden.");
      if (input.updatedAt !== before.$updatedAt) fail(409,"Baum inzwischen geändert. Bitte die neue Fassung öffnen.");
      if (["name","species","place","notes"].every(k => fields[k] === before[k])) return { tree:tree(before) };
      return { tree:tree(await db.update("trees",key,fields)) };
    }
    if (action === "team:feed") {
      const queries = [equal("kind",["post"]), q("orderDesc","$createdAt"), q("limit",null,[16])];
      if (input.after) queries.push(q("cursorAfter",null,[id(input.after)]));
      const list = await db.list("community",queries);
      const page = list.slice(0,15);
      const children = page.length ? await db.all("community",[equal("thread",page.map(p => p.$id)),q("orderAsc","$createdAt")]) : [];
      return { next:list.length > 15 ? page.at(-1).$id : null, posts:page.map(p => {
        const group = children.filter(x => x.thread === p.$id);
        const likes = group.filter(x => x.kind === "like");
        return { ...line(p,user), likes:likes.length, liked:likes.some(x => x.author === user.id),
          comments:group.filter(x => x.kind === "reply").map(x => line(x,user)) };
      }) };
    }
    const collection = "community";
    if (action === "team:post" || action === "team:reply") {
      const reply = action === "team:reply";
      const topic = reply ? "-" : input.topic;
      if (!reply && !topics.includes(topic)) fail(400,"Bitte ein Thema wählen.");
      const thread = reply ? id(input.thread) : "-";
      if (reply && (await db.get(collection,thread))?.kind !== "post") fail(404,"Beitrag nicht mehr verfügbar.");
      const doc = { kind:reply ? "reply" : "post", thread, author:user.id, byName:user.name, topic, body:text(input.text,reply ? 1000 : 3000,true) };
      const key = id(input.id);
      if (/^l[0-9a-f]{34}$/.test(key)) fail(400,"Ungültige Beitragskennung.");
      try { await db.create(collection,key,doc); }
      catch (e) {
        if (e.code !== 409) throw e;
        const old = await db.get(collection,key);
        if (!old || Object.keys(doc).some(k => doc[k] !== old[k])) throw e;
      }
      return { ok:true };
    }
    if (action === "team:like") {
      const thread = id(input.thread);
      if (typeof input.on !== "boolean") fail(400,"Ungültige Reaktion.");
      if ((await db.get(collection,thread))?.kind !== "post") fail(404,"Beitrag nicht mehr verfügbar.");
      const key = await likeId(thread,user.id);
      try {
        if (input.on) await db.create(collection,key,{ kind:"like",thread,author:user.id,byName:user.name,topic:"-",body:"+" });
        else await db.remove(collection,key);
      } catch (e) { if (e.code !== (input.on ? 409 : 404)) throw e; }
      return { ok:true };
    }
    if (action === "team:edit") {
      const key = id(input.id), doc = await db.get(collection,key);
      if (!doc || !["post","reply"].includes(doc.kind)) fail(404,"Nachricht nicht verfügbar.");
      if (doc.author !== user.id) fail(403,"Nur eigene Texte können bearbeitet werden.");
      await db.update(collection,key,{ body:text(input.text,doc.kind === "post" ? 3000 : 1000,true) });
      return { ok:true };
    }
    fail(400,"Unbekannte Aktion.");
  }
  const api = { run, topics };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.TeamService = api;
})(typeof window === "undefined" ? globalThis : window);
