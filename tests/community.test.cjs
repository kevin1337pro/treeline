const { test } = require("node:test");
const assert = require("node:assert/strict");
const { fixture } = require("./dispatch-cloud-fixture.cjs");
test("Gespräche, Autorenrechte und idempotente Reaktionen",async()=>{
  const run=fixture(), post={id:"p1",topic:"Frage",text:"Treffpunkt?",author:"other"};
  await run("office","team:post",post);await run("office","team:post",post);
  await run("staff","team:reply",{id:"r1",thread:"p1",text:"Im Hof."});
  await assert.rejects(run("other","team:edit",{id:"r1",text:"Geändert"}),{code:403});
  await run("staff","team:edit",{id:"r1",text:"Am Tor."});
  await run("staff","team:like",{thread:"p1",on:true});await run("staff","team:like",{thread:"p1",on:true});
  const {posts}=await run("office","team:feed");assert.equal(posts.length,1);
  assert.equal(posts[0].name,"Testbüro");assert.equal(posts[0].likes,1);assert.equal(posts[0].liked,false);
  assert.equal(posts[0].comments[0].text,"Am Tor.");
  await run("staff","team:like",{thread:"p1",on:false});assert.equal((await run("staff","team:feed")).posts[0].likes,0);
  await assert.rejects(run("wall","team:feed"),{code:403});await assert.rejects(run("office","team:reply",{id:"r2",thread:"missing",text:"?"}),{code:404});
  await assert.rejects(run("office","team:post",{...post,id:"l"+"a".repeat(34)}),{code:400});
});
test("Ersteller bleibt bei der Baumbearbeitung unverändert; Uhrzeit und Name stammen vom Dienst",async()=>{
  const run=fixture(), form={id:"baum1",name:"Stieleiche",species:"Quercus robur",place:"Hof",notes:"",creator:"Fremdname"};
  const {tree}=await run("office","tree:new",form);
  const {tree:changed}=await run("staff","tree:update",{...form,updatedAt:tree.updatedAt,notes:"Prüfen"});
  assert.equal(changed.createdBy,"Testbüro");assert.equal(changed.updatedBy,"Team Nord");assert.equal(changed.createdAt,tree.createdAt);
  assert.notEqual(changed.updatedAt,tree.updatedAt);assert.equal((await run("other","tree:list")).trees[0].notes,"Prüfen");
  await assert.rejects(run("office","tree:update",{...form,updatedAt:tree.updatedAt}),{code:409});await assert.rejects(run("wall","tree:list"),{code:403});
});
