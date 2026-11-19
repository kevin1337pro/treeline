const { test, expect } = require("@playwright/test");

test.setTimeout(60000);
test.beforeEach(async ({ page }) => {
  await page.route("https://fra.cloud.appwrite.io/**", route => route.abort());
  await page.addInitScript(() => localStorage.setItem("treeline_public_mapbox_token", "pk.test"));
  // Exercise the real renderer with a small deterministic style. Live tiles are checked separately.
  await page.route("https://api.mapbox.com/styles/v1/mapbox/**", route => route.fulfill({ json: {
    version: 8, glyphs: "mapbox://fonts/mapbox/{fontstack}/{range}.pbf", sources: {},
    layers: [{ id: "background", type: "background", paint: { "background-color": "#dbe8e2" } }],
  } }));
  await page.goto("/treeline.html");
  await page.getByRole("button", { name: /Als Mara anmelden/ }).click();
  await page.evaluate(() => {
    const Original = mapboxgl.Map;
    mapboxgl.Map = class extends Original {
      constructor(options) { super({ ...options, preserveDrawingBuffer: true }); window.testMap = this; }
    };
  });
  await page.getByRole("button", { name: "Karte", exact: true }).first().click();
  await expect.poll(() => page.evaluate(() => !!window.testMap?.getSource("treeline-trees"))).toBe(true);
  await expect.poll(() => page.evaluate(() => testMap.loaded()), { timeout: 15000 }).toBe(true);
  // Keep tests local even if a cloud client is configured in the future.
  await page.evaluate(() => { TREELINE_DB.saveTree = async () => {}; TREELINE_DB.saveOrder = async () => {}; if (window.TREELINE_APPWRITE) TREELINE_APPWRITE.saveRoute = async () => {}; });
});

async function tool(page, name) {
  await page.getByRole("button", { name: "Werkzeug öffnen", exact: true }).click();
  await page.getByRole("button", { name, exact: true }).click();
}
async function points(page) {
  return page.evaluate(() => testMap.getStyle().sources["treeline-planning-route-points"]?.data.features.map(f => f.geometry.coordinates));
}

test("compact menus close on selection and route editing persists across style changes", async ({ page }) => {
  const errors = []; page.on("pageerror", e => errors.push(e.message));
  await expect(page.locator(".map-options")).toHaveCount(0);
  await tool(page, "Route zeichnen");
  await expect(page.locator(".map-options")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Route speichern", exact: true })).toBeDisabled();
  const canvas = page.locator(".mapboxgl-canvas");
  await canvas.click({ position: { x: 220, y: 230 } });
  await canvas.click({ position: { x: 300, y: 270 } });
  await expect(page.locator(".map-edit-state")).toContainText("2 Punkte");
  await expect(page.getByRole("region", { name: "Baumdetails" })).toHaveCount(0);
  const saved = await points(page);
  expect(saved).toHaveLength(2);
  await page.getByRole("button", { name: "Kartenansicht öffnen" }).click();
  const nextStyle = page.waitForResponse(response => response.url().includes("/styles/v1/mapbox/streets-v12"));
  await page.getByRole("radio", { name: "Straße", exact: true }).check();
  await nextStyle;
  await expect(page.getByRole("button", { name: "Auftrag fokussieren" })).toBeEnabled();
  await expect.poll(() => points(page)).toEqual(saved);
  await page.getByRole("button", { name: "Menü schließen" }).click();
  await page.getByRole("button", { name: "Letzten Routenpunkt zurücknehmen" }).click();
  await expect(page.locator(".map-edit-state")).toContainText("1 Punkt");
  await canvas.click({ position: { x: 320, y: 300 } });
  await expect.poll(async () => (await points(page))?.length).toBe(2);
  const toSave = await points(page);
  await page.getByRole("button", { name: "Route speichern", exact: true }).click();
  await expect(page.locator(".map-edit-bar")).toHaveCount(0);
  expect(await page.evaluate(() => MOCK_DATA.orders[0].planningRoute)).toEqual(toSave);
  expect(await page.evaluate(() => localStorage.getItem(`treeline_public_route_draft_${MOCK_DATA.orders[0].id}`))).toBeNull();
  await page.reload();
  await expect.poll(() => page.evaluate(() => MOCK_DATA.orders[0].planningRoute)).toEqual(toSave);
  expect(errors).toEqual([]);
});

test("placing a tree creates a visible feature with Latin species and closes the form", async ({ page }) => {
  const count = await page.evaluate(() => MOCK_DATA.trees.length);
  await tool(page, "Baum setzen");
  await page.locator(".mapboxgl-canvas").click({ position: { x: 280, y: 290 } });
  await expect(page.getByRole("region", { name: "Neuer Baum", exact: true })).toBeVisible();
  await page.getByLabel("Bezeichnung", { exact: true }).fill("Stileiche");
  await expect(page.getByLabel("Art (lateinisch)", { exact: true })).toHaveValue("Quercus robur");
  await page.getByRole("button", { name: "Baum anlegen", exact: true }).click();
  await expect(page.getByRole("region", { name: "Neuer Baum", exact: true })).toHaveCount(0);
  await expect(page.getByRole("region", { name: "Baumdetails" })).toContainText("Stileiche");
  await expect(page.getByRole("region", { name: "Baumdetails" }).locator(".tree-audit")).toContainText("Angelegt: Mara");
  expect(await page.evaluate(() => MOCK_DATA.trees.length)).toBe(count + 1);
  await expect.poll(() => page.evaluate(() => testMap.getStyle().sources["treeline-trees"].data.features.length)).toBe(count + 1);
  expect(await page.evaluate(() => MOCK_DATA.orders[0].treeIds.includes(MOCK_DATA.trees.at(-1).id))).toBe(true);
  await expect(page.locator(".mapboxgl-popup")).toHaveCount(0);
});

test("filters survive style changes, search opens a tree and resizing keeps the canvas aligned", async ({ page }) => {
  await page.getByRole("button", { name: "Kartenansicht öffnen" }).click();
  await page.getByLabel("Baumzustand", { exact: true }).selectOption("kritisch");
  const nextStyle = page.waitForResponse(response => response.url().includes("/styles/v1/mapbox/outdoors-v12"));
  await page.getByRole("radio", { name: "Outdoor", exact: true }).check();
  await nextStyle;
  await expect(page.getByRole("button", { name: "Auftrag fokussieren" })).toBeEnabled();
  await expect.poll(() => page.evaluate(() => testMap.getStyle().sources["treeline-trees"]?.data.features.map(f => f.properties.status))).toEqual(["kritisch"]);
  await page.getByRole("button", { name: "Menü schließen" }).click();
  await page.getByRole("button", { name: "Kartenfilter zurücksetzen" }).click();
  await page.getByRole("button", { name: "Suche öffnen" }).click();
  await page.getByLabel("Baum, Auftrag oder Adresse").fill("TRE-2024-001");
  await page.getByRole("button", { name: "Suchen", exact: true }).click();
  await expect(page.getByRole("region", { name: "Baumdetails" })).toContainText("TRE-2024-001");
  const aligned = () => page.evaluate(() => Math.abs(testMap.getCanvas().getBoundingClientRect().width - document.querySelector(".map-stage").clientWidth) < 2);
  await expect.poll(aligned).toBe(true);
  await page.getByRole("button", { name: "Navigation schließen" }).click();
  await expect.poll(aligned).toBe(true);
  await page.getByRole("button", { name: "Kartenansicht vergrößern" }).click();
  await expect(page.locator(".map-workspace")).toHaveClass(/map-expanded/);
  await expect.poll(aligned).toBe(true);
  await page.getByRole("button", { name: "Baumdetails schließen" }).click();
  await page.keyboard.press("Escape");
  await expect(page.locator(".map-workspace")).not.toHaveClass(/map-expanded/);
});

test("switching orders restores their draft and resets drawing mode", async ({ page }) => {
  const ids = await page.evaluate(() => MOCK_DATA.orders.slice(0, 2).map(o => o.id));
  await page.evaluate(id => localStorage.setItem(`treeline_public_route_draft_${id}`, JSON.stringify([[6.98, 51.6], [6.981, 51.601]])), ids[1]);
  await tool(page, "Route zeichnen");
  await page.locator(".mapboxgl-canvas").click({ position: { x: 200, y: 250 } });
  const draft = await points(page);
  await page.getByLabel("Auftrag auf Karte auswählen").selectOption(ids[1]);
  await expect(page.locator(".map-edit-bar")).toHaveCount(0);
  await expect.poll(() => points(page)).toEqual([[6.98, 51.6], [6.981, 51.601]]);
  await page.getByLabel("Auftrag auf Karte auswählen").selectOption(ids[0]);
  await expect.poll(() => points(page)).toEqual(draft);
});

test("3D returns to a flat north-facing map and access errors can be retried", async ({ page }) => {
  expect(await page.evaluate(() => testMap.getPitch())).toBe(0);
  expect(await points(page)).toEqual([]);
  await page.getByRole("button", { name: "Kartenansicht öffnen" }).click();
  await page.getByRole("checkbox", { name: "3D-Ansicht", exact: true }).check();
  await expect.poll(() => page.evaluate(() => testMap.getPitch())).toBeGreaterThan(55);
  await page.getByRole("checkbox", { name: "3D-Ansicht", exact: true }).uncheck();
  expect(await page.evaluate(() => ({ pitch: testMap.getPitch(), bearing: testMap.getBearing(), terrain: testMap.getTerrain() }))).toEqual({ pitch: 0, bearing: 0, terrain: null });
  await page.getByRole("button", { name: "Menü schließen" }).click();
  await page.evaluate(() => testMap.fire("error", { error: { status: 403 } }));
  await expect(page.getByRole("alert")).toContainText("Mapbox-Zugriff abgelehnt");
  await page.getByRole("button", { name: "Karte erneut laden" }).click();
  await expect(page.getByRole("alert")).toHaveCount(0);
  await expect.poll(() => page.evaluate(() => !!testMap.getSource("treeline-trees"))).toBe(true);
});

test("a late address result cannot override a newly selected order", async ({ page }) => {
  let release;
  const gate = new Promise(resolve => { release = resolve; });
  await page.route("https://api.mapbox.com/geocoding/**", async route => {
    await gate;
    await route.fulfill({ json: { features: [{ center: [13.4, 52.5] }] } });
  });
  const ids = await page.evaluate(() => MOCK_DATA.orders.slice(0, 2).map(o => o.id));
  const pending = page.waitForRequest(request => request.url().includes("/geocoding/"));
  await page.getByLabel("Auftrag auf Karte auswählen").selectOption(ids[1]);
  await pending;
  await page.getByLabel("Auftrag auf Karte auswählen").selectOption(ids[0]);
  const response = page.waitForResponse(result => result.url().includes("/geocoding/"));
  release();
  await response;
  await expect.poll(() => page.evaluate(() => Math.abs(testMap.getCenter().lng - 7.4798) < .01)).toBe(true);
  await page.waitForTimeout(850);
  expect(await page.evaluate(() => testMap.getCenter().lng)).toBeCloseTo(7.4798, 2);
});

for (const width of [320, 390, 768, 1440]) {
  test(`map and controls fit ${width}px without covering the work area`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 844 });
    if (width <= 768) {
      const close = page.getByRole("button", { name: "Navigation schließen", exact: true });
      if (await close.isVisible()) await close.click();
    }
    await expect.poll(() => page.locator(".map-stage").evaluate(el => el.clientHeight)).toBeGreaterThan(700);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.getByRole("button", { name: "Kartenansicht öffnen" }).click();
    for (const box of await page.locator(".map-options, .map-rail, .map-order-bar, .mapboxgl-ctrl-top-right").evaluateAll(els => els.map(el => ({ className: el.className, left: el.getBoundingClientRect().left, right: el.getBoundingClientRect().right, clientWidth: el.clientWidth, scrollWidth: el.scrollWidth })))) {
      expect(box.left).toBeGreaterThanOrEqual(0); expect(box.right).toBeLessThanOrEqual(width); expect(box.scrollWidth, JSON.stringify(box)).toBeLessThanOrEqual(box.clientWidth + 1);
    }
    await page.keyboard.press("Escape");
    await tool(page, "Route zeichnen");
    const area = await page.locator(".map-stage").boundingBox();
    const bar = await page.locator(".map-edit-bar").boundingBox();
    expect(bar.width).toBeLessThanOrEqual(area.width); expect(bar.height).toBeLessThan(60);
    await page.screenshot({ path: testInfo.outputPath(`map-${width}.png`) });
    await page.getByRole("button", { name: "Bearbeitung beenden" }).click();
    await tool(page, "Baum setzen");
    await page.locator(".mapboxgl-canvas").click({ position: { x: Math.min(230, area.width - 80), y: 280 } });
    await expect(page.getByRole("region", { name: "Neuer Baum", exact: true })).toBeVisible();
    expect((await page.locator(".map-stage").boundingBox()).height).toBeGreaterThan(300);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.getByRole("button", { name: "Baumerfassung abbrechen" }).click();
  });
}
