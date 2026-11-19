"use strict";
const D = require("../components/dispatch.js");
const { dispatch } = require("../functions/dispatch/service.cjs");
function fixture() {
  const tables = { profiles: new Map(), versions: new Map(), receipts: new Map() };
  const db = {
    async get(c, id) { return tables[c].get(id); },
    async create(c, id, data) {
      if (tables[c].has(id)) throw Object.assign(new Error("Versionskonflikt"), { code: 409 });
      const doc = { ...structuredClone(data), $id: id, $createdAt: new Date(Date.UTC(2026, 0, 1, 0, 0, tables[c].size)).toISOString() };
      tables[c].set(id, doc); return doc;
    },
    async list(c, queries) {
      let items = [...tables[c].values()];
      for (const { method, attribute, values } of queries) {
        if (method === "equal") items = items.filter(i => values.includes(i[attribute]));
        else if (method === "contains") items = items.filter(i => i[attribute].includes(values[0]));
        else if (method === "orderDesc") items.sort((a,b) => a[attribute] < b[attribute] ? 1 : -1);
        else if (method === "limit") items = items.slice(0,values[0]);
        else throw new Error("Unsupported query: " + method);
      }
      return items;
    },
    all(c, queries) { return this.list(c, queries); },
  };
  for (const [id, role, name] of [["office","office","Testbüro"],["staff","employee","Team Nord"],["other","employee","Team Süd"],["wall","display","Wanddisplay"]]) {
    tables.profiles.set(id, { $id: id, profileId: "p-" + id, name, role });
  }
  return (id, action, input = {}) => dispatch(D, db, id, { ...input, action });
}
module.exports = { fixture };
