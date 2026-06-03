const { test, expect } = require("@playwright/test");

test.beforeEach(async ({ page }) => {
  await page.goto("/treeline.html");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

test("login and primary navigation render without browser errors", async ({ page }) => {
  const browserErrors = [];
  page.on("pageerror", error => browserErrors.push(error.message));
  page.on("console", message => {
    if (message.type() !== "error") return;
    const text = message.text();
    if (text.includes("Failed to load resource")) return;
    browserErrors.push(text);
  });

  await page.getByRole("button", { name: /Als Markus anmelden/ }).click();
  await expect(page.getByRole("button", { name: "Karte" }).first()).toBeVisible();
  await expect(page.getByText(/Willkommen, Markus/)).toBeVisible();

  for (const label of ["Aufträge", "Karte", "Bäume", "Maßnahmen", "Neupflanzungen", "Team", "Medien"]) {
    await page.getByRole("button", { name: label }).first().click();
    await expect(page.getByText(label).first()).toBeVisible();
  }

  await page.getByRole("button", { name: "Karte" }).first().click();
  await expect(page.getByRole("button", { name: "Satellit" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Auftrag fokussieren" })).toBeVisible();
  await expect(page.getByText("Werkzeug")).toBeVisible();
  await expect(page.getByRole("button", { name: "Route zeichnen" })).toBeVisible();
  await expect(page.getByRole("button", { name: "3D" })).toBeVisible();

  expect(browserErrors).toEqual([]);
});

test("measure creation adds a new item", async ({ page }) => {
  await page.getByRole("button", { name: /Als Markus anmelden/ }).click();
  await page.getByRole("button", { name: "Maßnahmen" }).first().click();
  await page.getByRole("button", { name: "+ Neue Maßnahme" }).click();
  await page.locator("input[placeholder*='Kronenpflege']").fill("Smoke-Test Maßnahme");
  await page.getByRole("button", { name: "Erstellen" }).click();

  await expect(page.getByText("Smoke-Test Maßnahme")).toBeVisible();
});

test("sample order shows crew, vehicles and tree route", async ({ page }) => {
  await page.getByRole("button", { name: /Als Markus anmelden/ }).click();
  await page.getByRole("button", { name: "Aufträge" }).first().click();

  await expect(page.getByText("Kronenpflege Gahlener Straße Dorsten").first()).toBeVisible();
  await expect(page.getByText("Kevin Stumpe")).toBeVisible();
  await expect(page.getByText("Thorsten Thesing")).toBeVisible();
  await expect(page.getByText("BOT - RR - 220").first()).toBeVisible();
  await expect(page.getByText("BOT - BE - 118").first()).toBeVisible();
  await expect(page.getByText("Linke Straßenseite", { exact: true })).toBeVisible();
  await expect(page.getByText("Rechte Straßenseite", { exact: true })).toBeVisible();
});

test("existing order can be edited", async ({ page }) => {
  await page.getByRole("button", { name: /Als Markus anmelden/ }).click();
  await page.getByRole("button", { name: "Aufträge" }).first().click();
  await page.getByRole("button", { name: "Bearbeiten" }).click();
  await page.locator("input[placeholder='z.B. Kronenpflege Musterstraße']").fill("Kronenpflege Gahlener Straße aktualisiert");
  await page.getByRole("button", { name: "Änderungen speichern" }).click();

  await expect(page.getByRole("heading", { name: "Kronenpflege Gahlener Straße aktualisiert" })).toBeVisible();
  await expect(page.getByText("Kronenpflege Gahlener Straße aktualisiert").first()).toBeVisible();
});

test("order creation opens the selected order on the map", async ({ page }) => {
  await page.getByRole("button", { name: /Als Markus anmelden/ }).click();
  await page.getByRole("button", { name: "Aufträge" }).first().click();
  await page.getByRole("button", { name: "Neuer Auftrag" }).click();
  await page.locator("input[placeholder='z.B. Kronenpflege Musterstraße']").fill("Kronenpflege Testallee");
  await page.locator("input[placeholder='Straße, Hausnummer oder Abschnitt']").fill("Testallee 12");
  await page.getByRole("button", { name: "Auftrag erstellen" }).click();

  await expect(page.getByText("Kronenpflege Testallee").first()).toBeVisible();
  await page.getByRole("button", { name: "In Karte öffnen" }).click();

  await expect(page.getByLabel("Auftrag auf Karte auswählen")).toContainText("Kronenpflege Testallee");
});

test("mobile order and map controls stay reachable", async ({ page }) => {
  await page.setViewportSize({ width:390, height:844 });
  await page.goto("/treeline.html");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.getByRole("button", { name: /Als Markus anmelden/ }).click();
  await page.getByRole("button", { name: /Navigation öffnen/ }).click();
  await page.getByRole("button", { name: "Aufträge" }).first().click();

  await expect(page.getByRole("button", { name: "Neuer Auftrag" })).toBeVisible();

  await page.getByRole("button", { name: /Navigation öffnen/ }).click();
  await page.getByRole("button", { name: "Karte" }).first().click();
  await expect(page.getByLabel("Auftrag auf Karte auswählen")).toBeVisible();
  await expect(page.getByRole("button", { name: "Werkzeug öffnen" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Route zeichnen" })).toBeHidden();
  await page.getByRole("button", { name: "Werkzeug öffnen" }).click();
  await expect(page.getByRole("button", { name: "Route zeichnen" })).toBeVisible();
});

test("team invite adds and selects a user", async ({ page }) => {
  await page.getByRole("button", { name: /Als Markus anmelden/ }).click();
  await page.getByRole("button", { name: "Team" }).first().click();
  await page.getByRole("button", { name: "+ Einladen" }).click();
  await page.locator("input[placeholder='Max Mustermann']").fill("Laura Test");
  await page.locator("input[placeholder='m.mustermann@enbergs.de']").fill("laura.test@example.com");
  await page.getByRole("button", { name: "Einladung senden" }).click();

  await expect(page.getByText("Laura Test").first()).toBeVisible();
  await expect(page.getByText("laura.test@example.com").first()).toBeVisible();
});

test("planting creation adds and selects a planting", async ({ page }) => {
  await page.getByRole("button", { name: /Als Markus anmelden/ }).click();
  await page.getByRole("button", { name: "Neupflanzungen" }).first().click();
  await page.getByRole("button", { name: "+ Neu" }).click();
  await page.locator("input[placeholder='z.B. Stieleiche']").fill("Winterlinde");
  await page.locator("input[placeholder='z.B. Quercus robur']").fill("Tilia cordata");
  await page.locator("input[placeholder='Adresse oder Gebiet']").fill("Testallee 1");
  await page.getByRole("button", { name: "Pflanzung anlegen" }).click();

  await expect(page.getByText("Winterlinde").first()).toBeVisible();
  await expect(page.getByText("Tilia cordata").first()).toBeVisible();
});

test("tree form auto-fills latin species", async ({ page }) => {
  await page.getByRole("button", { name: /Als Markus anmelden/ }).click();
  await page.getByRole("button", { name: "Bäume" }).first().click();
  await page.getByRole("button", { name: "+ Neu" }).click();
  await page.locator("input[placeholder='z.B. Stieleiche']").fill("Stileiche");

  await expect(page.locator("input[placeholder='Quercus robur']")).toHaveValue("Quercus robur");
});
