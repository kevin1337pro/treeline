const { test, expect } = require("@playwright/test");
const { fixture } = require("./dispatch-cloud-fixture.cjs");
test("Büro, Handy und Aushang: Freigabe und Bestätigung ohne Neuladen", async ({ browser, baseURL }) => {
  test.setTimeout(120000);
  const run = fixture(), contexts = [];
  let disconnected = false;
  async function device(user, viewport) {
    const ctx = await browser.newContext({ baseURL, viewport, timezoneId:"Europe/Berlin" });
    contexts.push(ctx);
    let session = false;
    await ctx.route("https://fra.cloud.appwrite.io/**", async route => {
      const path = new URL(route.request().url()).pathname;
      const send = (json, status = 200) => route.fulfill({status,json});
      if (path.endsWith("/account")) return send({},session ? 200 : 401);
      if (path.endsWith("/sessions/email")) { session = true; return send({},201); }
      if (path.endsWith("/executions") && session) {
        if (user === "wall" && disconnected) return route.abort();
        const input = JSON.parse(route.request().postDataJSON().body);
        try { return send({responseStatusCode:200,responseBody:JSON.stringify(await run(user,input.action,input))},201); }
        catch (e) { return send({responseStatusCode:e.code || 500,responseBody:JSON.stringify({message:e.message})},201); }
      }
      return send({},403);
    });
    const p = await ctx.newPage();
    await p.goto("/treeline.html?betrieb=1&date=2026-11-20");
    await p.getByLabel("E-Mail").fill(user+"@example.invalid");
    await p.getByLabel("Passwort").fill("test-only");
    await p.getByRole("button",{name:"Mit Betriebskonto anmelden"}).click();
    return p;
  }
  try {
    const office = await device("office",{width:1200,height:850});
    const phone = await device("staff",{width:390,height:844});
    const wall = await device("wall",{width:1024,height:768});
    await office.getByRole("button",{name:"Neuer Einsatz"}).click();
    await office.getByLabel("Baustelle",{exact:true}).fill("Probeeinsatz Nord");
    await office.getByRole("checkbox",{name:"Team Nord",exact:true}).check();
    await office.getByRole("button",{name:"Entwurf speichern"}).click();
    await expect(wall.getByText("Noch kein Tagesplan freigegeben")).toBeVisible();
    await expect(phone.getByText("Keine Einsatzmitteilungen")).toBeVisible();
    await office.getByRole("button",{name:"Tagesplan freigeben",exact:true}).click();
    await office.getByRole("button",{name:"Jetzt freigeben"}).click();
    await expect(wall.locator(".dp-screen-rows").getByText("Probeeinsatz Nord")).toBeVisible({timeout:30000});
    await expect(phone.getByText("Probeeinsatz Nord")).toBeVisible({timeout:30000});
    await phone.getByRole("button",{name:"Einteilung bestätigen"}).click();
    await expect(phone.getByRole("button",{name:"Bestätigt",exact:true})).toBeDisabled();
    await office.evaluate(() => dispatchEvent(new Event("focus")));
    await expect(office.locator("summary").filter({hasText:"Bestätigungen"})).toContainText("1/1");
    disconnected = true; await wall.evaluate(() => dispatchEvent(new Event("online")));
    await expect(wall.getByRole("alert")).toBeVisible();
    await expect(wall.locator(".dp-screen-rows").getByText("Probeeinsatz Nord")).toBeVisible();
    disconnected = false; await wall.evaluate(() => dispatchEvent(new Event("online")));
    await expect(wall.getByRole("alert")).toHaveCount(0);
    await office.getByRole("button",{name:"Einsatz bearbeiten: Probeeinsatz Nord"}).click();
    await office.getByRole("checkbox",{name:"Team Nord",exact:true}).uncheck();
    await office.getByRole("checkbox",{name:"Team Süd",exact:true}).check();
    await office.getByRole("button",{name:"Entwurf speichern"}).click();
    await office.getByRole("button",{name:"Änderungen freigeben",exact:true}).click();
    await office.getByRole("button",{name:"Jetzt freigeben"}).click();
    await expect(office.locator("summary").filter({hasText:"Bestätigungen"})).toContainText("0/2");
    await wall.evaluate(() => dispatchEvent(new Event("focus")));
    await phone.evaluate(() => dispatchEvent(new Event("focus")));
    await expect(wall.locator(".dp-screen-rows").getByText("Team Süd")).toBeVisible();
    await expect(phone.getByText("Kein Einsatz zugeteilt")).toBeVisible();
    await expect(phone.getByRole("button",{name:"Einteilung bestätigen"})).toBeEnabled();
  } finally { for (const ctx of contexts) await ctx.close(); }
});
