"use strict";
const D = require("../components/dispatch.js");
const { dispatch } = require("../functions/dispatch/service.cjs");
function fixture() {
  const tables = { profiles: new Map(), versions: new Map(), receipts: new Map(), community:new Map(), trees:new Map() };
  const db = {
    async get(c, id) { return tables[c].get(id); },
    async create(c, id, data) {
      if (tables[c].has(id)) throw Object.assign(new Error("Versionskonflikt"), { code: 409 });
      const doc = { ...structuredClone(data), $id: id, $createdAt: new Date(Date.UTC(2026, 0, 1, 0, 0, tables[c].size)).toISOString() };
      doc.$updatedAt = doc.$createdAt;
      tables[c].set(id, doc); return doc;
    },
    async list(c, queries) {
      let items = [...tables[c].values()];
      for (const { method, attribute, values } of queries) {
        if (method === "equal") items = items.filter(i => values.includes(i[attribute]));
        else if (method === "contains") items = items.filter(i => i[attribute].includes(values[0]));
        else if (method === "orderDesc" || method === "orderAsc") items.sort((a,b) => (a[attribute] < b[attribute] ? 1 : -1) * (method === "orderDesc" ? 1 : -1));
        else if (method === "limit") items = items.slice(0,values[0]);
        else throw new Error("Unsupported query: " + method);
      }
      return items;
    },
    all(c, queries) { return this.list(c, queries); },
    update(c,id,data) { return Object.assign(tables[c].get(id),data,{$updatedAt:new Date().toISOString()}); },
    remove(c,id) { if (!tables[c].delete(id)) throw Object.assign(new Error(),{code:404}); },
  };
  for (const [id, role, name] of [["office","office","Testbüro"],["staff","employee","Team Nord"],["other","employee","Team Süd"],["wall","display","Wanddisplay"]]) {
    tables.profiles.set(id, { $id: id, profileId: "p-" + id, name, role });
  }
  return (id, action, input = {}) => dispatch(D, db, id, { ...input, action },require("../components/team-service.js"));
}
module.exports = { fixture };
