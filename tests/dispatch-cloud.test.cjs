const { test } = require("node:test");
const assert = require("node:assert/strict");
const { fixture } = require("./dispatch-cloud-fixture.cjs");
const date = "2026-11-20";
const resources = { vehicles: [], equipment: [], orders: [] };
const make = (site, worker) => ({ id: site, site, orderId: "", address: "", start: "07:00", end: "14:00", notes: "", meeting: "", task: "", employeeIds: ["p-" + worker], vehicleIds: [], equipmentIds: [] });
test("Entwürfe, persönliche Zustellung, Bestätigung, Änderung und vollständige Absage", async () => {
  const run = fixture();
  const entries = [make("Nord","staff"), make("Süd","other")];
  await run("office","draft",{date,version:0,entries,resources,note:""});
  assert.equal((await run("wall","board",{date})).release,null);
  assert.deepEqual((await run("staff","inbox")).messages,[]);
  await run("office","publish",{date,version:1});
  const first = (await run("staff","inbox")).messages[0];
  assert.deepEqual(first.rows.map(r => r.site),["Nord"]);
  assert.ok(!JSON.stringify(first).includes("Süd"));
  assert.equal((await run("wall","board",{date})).release.rows.length,2);
  await run("staff","confirm",{id:first.id,profileId:"p-other"});
  await run("staff","confirm",{id:first.id});
  assert.equal(Object.keys((await run("office","office",{date})).receipts).length,1);
  const draft = {date,version:2,note:"",entries:[],resources};
  const writers = await Promise.allSettled([run("office","draft",draft),run("office","draft",draft)]);
  assert.equal(writers.filter(x => x.status === "fulfilled").length,1);
  assert.equal((await run("wall","board",{date})).release.id,first.id);
  await run("office","publish",{date,version:3});
  const cancel = (await run("staff","inbox")).messages[0];
  assert.deepEqual(cancel.rows,[]); assert.equal(cancel.readAt,null);
  assert.equal((await run("wall","board",{date})).release.rows.length,0);
  assert.deepEqual((await run("office","office",{date})).receipts,{});
  await assert.rejects(run("staff","confirm",{id:first.id}),{code:409});
  await run("staff","confirm",{id:cancel.id});
});
test("Rollen sind serverseitig; ein fremder oder nicht zugeordneter Nutzer erhält keine Daten", async () => {
  const run = fixture();
  for (const [user,action,code] of [["","board",401],["unknown","profile",403],["wall","draft",403],["wall","inbox",403],["staff","publish",403],["staff","board",403]]) {
    await assert.rejects(run(user,action,{date,role:"office"}),{code});
  }
  await run("office","draft",{date,version:0,entries:[make("Nord","staff")],note:"",resources});
  await run("office","publish",{date,version:1});
  assert.deepEqual((await run("other","inbox")).messages,[]);
  const {id} = (await run("staff","inbox")).messages[0];
  await assert.rejects(run("other","confirm",{id}),{code:403});
});
