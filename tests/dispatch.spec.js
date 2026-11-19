const { test, expect } = require("@playwright/test");

test.beforeEach(async ({ context, page }) => {
  await context.route("https://fra.cloud.appwrite.io/**", route => route.abort());
  await page.goto("/treeline.html");
  await page.getByRole("button", { name: /Als Mara anmelden/ }).click();
  await expect(page.getByLabel("Demo-Profil wechseln")).toBeVisible();
});

async function navigate(page, label) {
  await expect(page.getByRole("button", { name: /Navigation (öffnen|schließen)/ })).toBeVisible();
  const menu = page.getByRole("button", { name: "Navigation öffnen", exact: true });
  if (await menu.isVisible()) await menu.click();
  await page.getByRole("button", { name: label, exact: true }).first().click();
}
async function addSample(page) {
  await navigate(page, "Einsatzplanung");
  await page.getByRole("button", { name: "Neuer Einsatz" }).click();
  await page.getByRole("dialog").getByLabel("Auftrag", { exact: true }).selectOption("AUF-2026-001");
  await page.getByLabel("Besonderheiten", { exact: true }).fill("Warnkleidung und Absperrmaterial mitnehmen.");
  await page.getByRole("button", { name: "Entwurf speichern" }).click();
  await expect(page.getByRole("dialog")).toBeHidden();
}
async function publish(page, changed = false) {
  await page.getByRole("button", { name: changed ? "Änderungen freigeben" : "Tagesplan freigeben", exact: true }).click();
  await page.getByRole("button", { name: "Jetzt freigeben" }).click();
  await expect(page.getByRole("dialog")).toBeHidden();
}

test("office draft -> publication -> personal inbox -> read -> updated and cancelled assignment", async ({ page }) => {
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await addSample(page);
  await page.getByLabel("Demo-Profil wechseln").selectOption("user-007");
  await expect(page.getByRole("heading", { name: "Keine Einsatzmitteilungen" })).toBeVisible();
  await page.getByLabel("Demo-Profil wechseln").selectOption("user-001");
  await navigate(page, "Einsatzplanung");
  await publish(page);
  await page.getByLabel("Demo-Profil wechseln").selectOption("user-007");
  await expect(page.getByRole("heading", { name: "Mein Postfach" })).toBeVisible();
  await expect(page.getByText("Warnkleidung und Absperrmaterial mitnehmen.")).toBeVisible();
  await page.getByRole("button", { name: "Als gelesen bestätigen", exact: true }).click();
  await expect(page.getByRole("button", { name: "Postfach: 0 ungelesen" })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("button", { name: "Als gelesen bestätigt", exact: true })).toBeDisabled();
  await page.getByLabel("Demo-Profil wechseln").selectOption("user-001");
  await navigate(page, "Einsatzplanung");
  await expect(page.getByText(/1\/2 gelesen/)).toBeVisible();
  await page.getByRole("button", { name: /Einsatz bearbeiten:/ }).click();
  await page.getByLabel("Beginn", { exact: true }).fill("08:00");
  await page.getByRole("button", { name: "Entwurf speichern" }).click();
  await page.getByLabel("Demo-Profil wechseln").selectOption("user-007");
  await expect(page.getByText("07:30", { exact: true })).toBeVisible();
  await expect(page.getByText("08:00", { exact: true })).toHaveCount(0);
  await page.getByLabel("Demo-Profil wechseln").selectOption("user-001");
  await navigate(page, "Einsatzplanung");
  await publish(page, true);
  await page.getByLabel("Demo-Profil wechseln").selectOption("user-007");
  await expect(page.getByText("08:00", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Postfach: 1 ungelesen" })).toBeVisible();
  await page.getByLabel("Demo-Profil wechseln").selectOption("user-001");
  await navigate(page, "Einsatzplanung");
  await page.getByRole("button", { name: /Einsatz bearbeiten:/ }).click();
  await page.getByRole("checkbox", { name: "Kira Saal", exact: true }).uncheck();
  await page.getByRole("button", { name: "Entwurf speichern" }).click();
  await publish(page, true);
  await page.getByLabel("Demo-Profil wechseln").selectOption("user-007");
  await expect(page.getByRole("heading", { name: "Kein Einsatz zugeteilt" })).toBeVisible();
  await page.getByLabel("Demo-Profil wechseln").selectOption("user-002");
  await expect(page.getByRole("heading", { name: "Keine Einsatzmitteilungen" })).toBeVisible();
  expect(errors).toEqual([]);
});

test("resource conflicts leave the saved draft intact", async ({ page }) => {
  await addSample(page);
  await page.getByRole("button", { name: "Neuer Einsatz" }).click();
  await page.getByRole("dialog").getByLabel("Auftrag", { exact: true }).selectOption("AUF-2026-001");
  await page.getByRole("button", { name: "Entwurf speichern" }).click();
  await expect(page.getByRole("alert")).toContainText("zeitgleich");
  await page.getByRole("button", { name: "Dialog schließen" }).click();
  await expect(page.getByTestId("dispatch-row")).toHaveCount(1);
});

test("demo orders prefill demo staff and all pickers preserve selection during search", async ({ page }) => {
  await navigate(page, "Einsatzplanung");
  await page.getByRole("button", { name: "Neuer Einsatz" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Aufträge suchen", { exact: true }).fill("lichtung");
  await expect(dialog.getByLabel("Auftrag", { exact: true }).locator("option")).toHaveCount(2);
  await dialog.getByLabel("Auftrag", { exact: true }).selectOption("PLAN-DEMO-04");
  await expect(dialog.getByLabel("Baustelle", { exact: true })).toHaveValue("Lichtung Nord");
  await expect(dialog.getByRole("checkbox", { name: "Jonna", exact: true })).toBeChecked();
  await expect(dialog.getByRole("checkbox", { name: "Silas", exact: true })).toBeChecked();
  await dialog.getByLabel("Mitarbeiter suchen", { exact: true }).fill("ma");
  await dialog.getByRole("checkbox", { name: "Malin", exact: true }).check();
  await dialog.getByLabel("Mitarbeiter suchen", { exact: true }).fill("ari");
  await dialog.getByRole("checkbox", { name: "Ari", exact: true }).check();
  await expect(dialog.getByLabel("Mitarbeiter: Auswahl", { exact: true })).toContainText("Jonna");
  await expect(dialog.getByLabel("Mitarbeiter: Auswahl", { exact: true })).toContainText("Malin");
  await dialog.getByLabel("Fahrzeuge suchen", { exact: true }).fill("42");
  await dialog.getByRole("checkbox", { name: "VW TGE 3", exact: true }).check();
  await dialog.getByLabel("Fahrzeuge suchen", { exact: true }).fill("keine treffer");
  await expect(dialog.getByLabel("Fahrzeuge: Auswahl", { exact: true })).toContainText("VW TGE 3");
  await dialog.getByLabel("Geräte / Anhänger suchen", { exact: true }).fill("kippanhanger");
  await dialog.getByRole("checkbox", { name: "Kippanhänger", exact: true }).check();
  await dialog.getByRole("button", { name: "Entwurf speichern" }).click();
  await expect(dialog).toBeHidden();
  await page.reload();
  const row = page.getByTestId("dispatch-row");
  for (const text of ["Lichtung Nord", "Jonna", "Silas", "Malin", "Ari", "VW TGE 3", "Kippanhänger"]) await expect(row).toContainText(text);
  await publish(page);
  await page.getByLabel("Demo-Profil wechseln").selectOption("staff-demo-3");
  await expect(page.getByRole("heading", { name: "Mein Postfach" })).toBeVisible();
  await expect(page.getByTestId("dispatch-row")).toContainText("Lichtung Nord");
});

test("changing orders requires a decision and can preserve custom entries", async ({ page }) => {
  await addSample(page);
  await page.getByRole("button", { name: /Einsatz bearbeiten:/ }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Baustelle", { exact: true }).fill("Eigene Einteilung");
  await dialog.getByLabel("Auftrag", { exact: true }).selectOption("PLAN-DEMO-01");
  await expect(dialog.getByRole("button", { name: "Entwurf speichern" })).toBeDisabled();
  await dialog.getByRole("button", { name: "Wechsel abbrechen" }).click();
  await expect(dialog.getByLabel("Auftrag", { exact: true })).toHaveValue("AUF-2026-001");
  await dialog.getByLabel("Auftrag", { exact: true }).selectOption("PLAN-DEMO-01");
  await dialog.getByRole("button", { name: "Nur verknüpfen" }).click();
  await expect(dialog.getByLabel("Baustelle", { exact: true })).toHaveValue("Eigene Einteilung");
  await expect(dialog.getByRole("checkbox", { name: "Kira Saal", exact: true })).toBeChecked();
  await dialog.getByLabel("Auftrag", { exact: true }).selectOption("PLAN-DEMO-04");
  await dialog.getByRole("button", { name: "Vorgaben übernehmen" }).click();
  await expect(dialog.getByLabel("Baustelle", { exact: true })).toHaveValue("Lichtung Nord");
  await expect(dialog.getByRole("checkbox", { name: "Kira Saal", exact: true })).not.toBeChecked();
  await expect(dialog.getByRole("checkbox", { name: "Jonna", exact: true })).toBeChecked();
  await dialog.getByRole("button", { name: "Entwurf speichern" }).click();
  await expect(page.getByTestId("dispatch-row")).toContainText("Lichtung Nord");
});

test("bulk selection only affects filtered employees and never submits the form", async ({ page }) => {
  await addSample(page);
  await page.getByRole("button", { name: /Einsatz bearbeiten:/ }).click();
  const dialog = page.getByRole("dialog");
  const picker = dialog.getByRole("group", { name: /^Mitarbeiter / });
  await dialog.getByLabel("Aufträge suchen", { exact: true }).press("Enter");
  await expect(dialog).toBeVisible();
  await picker.getByLabel("Mitarbeiter suchen", { exact: true }).fill("ma");
  await picker.getByLabel("Mitarbeiter suchen", { exact: true }).press("Enter");
  await expect(dialog).toBeVisible();
  await picker.getByRole("checkbox", { name: "Alle Treffer auswählen" }).check();
  await expect(picker.getByRole("checkbox", { name: "Malin", exact: true })).toBeChecked();
  await expect(picker.getByRole("checkbox", { name: "Mats", exact: true })).toBeChecked();
  await picker.getByRole("checkbox", { name: "Alle Treffer auswählen" }).uncheck();
  await expect(picker.getByLabel("Mitarbeiter: Auswahl", { exact: true })).toContainText("Kira Saal");
  await picker.getByLabel("Mitarbeiter suchen", { exact: true }).fill("");
  await picker.getByRole("checkbox", { name: "Nur ausgewählte" }).check();
  await expect(picker.getByLabel("Mitarbeiter: Treffer", { exact: true }).getByRole("checkbox")).toHaveCount(2);
  await picker.getByRole("button", { name: "Kira Saal abwählen" }).click();
  await expect(dialog).toBeVisible();
  await expect(picker.getByLabel("Mitarbeiter: Treffer", { exact: true }).getByRole("checkbox")).toHaveCount(1);
  await dialog.getByRole("button", { name: "Abbrechen", exact: true }).click();
  await expect(page.getByTestId("dispatch-row")).toContainText("Kira Saal");
});

test("availability is shown before save and reacts to time changes", async ({ page }) => {
  await addSample(page);
  await page.getByRole("button", { name: "Neuer Einsatz" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Mitarbeiter suchen", { exact: true }).fill("kira");
  await expect(dialog.locator(".dp-busy").first()).toContainText("Kronenpflege Musterstraße");
  await dialog.getByLabel("Beginn", { exact: true }).fill("15:30");
  await dialog.getByLabel("Ende", { exact: true }).fill("16:30");
  await expect(dialog.locator(".dp-busy")).toHaveCount(0);
});

test("staff without email select their own profile, not another blank-email account", async ({ page }) => {
  await page.getByTitle("Abmelden", { exact: true }).click();
  for (const [id, name] of [["staff-demo-3", "Jonna"], ["staff-demo-8", "Ari"]]) {
    await page.getByLabel("Beispielprofil", { exact: true }).selectOption(id);
    await page.getByRole("button", { name: new RegExp(`Als ${name} anmelden`) }).click();
    await expect(page.getByLabel("Demo-Profil wechseln")).toHaveValue(id);
    await expect(page.getByText(`Für ${name} ist noch kein Tagesplan freigegeben.`)).toBeVisible();
    await page.getByTitle("Abmelden", { exact: true }).click();
  }
});

test("demo order details mark missing driving data and support three-person crews", async ({ page }) => {
  await navigate(page, "Aufträge");
  await page.getByRole("button", { name: /PLAN-DEMO-02/ }).click();
  const details = page.locator(".orders-detail");
  await expect(details.getByRole("heading", { name: "Pflege am Musterforum" })).toBeVisible();
  await expect(details).toContainText("Führerschein: nicht erfasst");
  await expect(details).toContainText("Daten fehlen");
  await expect(details).not.toContainText("alle Fahrzeuge");
  await expect(details).not.toContainText("NaN");
  expect(await details.evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
});

test("stale editors cannot overwrite a newer draft", async ({ page }) => {
  await addSample(page);
  await page.getByRole("button", { name: /Einsatz bearbeiten:/ }).click();
  await page.evaluate(() => {
    const date = Dispatch.localDate(1), day = DISPATCH_STORE.day(date);
    DISPATCH_STORE.saveDraft(date, { ...day, entries: day.entries.map(entry => ({ ...entry, site: "Neuere Planung" })) }, day.version);
  });
  await page.getByLabel("Baustelle", { exact: true }).fill("Veraltete Planung");
  await page.getByRole("button", { name: "Entwurf speichern" }).click();
  await expect(page.getByRole("alert")).toContainText("zwischenzeitlich");
  await page.getByRole("button", { name: "Dialog schließen" }).click();
  await expect(page.getByTestId("dispatch-row")).toContainText("Neuere Planung");
});

test("damaged local plans produce a visible error without resetting data", async ({ page }) => {
  await page.evaluate(() => localStorage.setItem(Dispatch.KEY, "{broken"));
  await navigate(page, "Einsatzplanung");
  await expect(page.getByRole("alert")).toContainText("unlesbar");
  await expect(page.getByRole("button", { name: "Neuer Einsatz" })).toBeDisabled();
  expect(await page.evaluate(() => localStorage.getItem(Dispatch.KEY))).toBe("{broken");
});

test("board root links retain dates; current-day mode follows midnight", async ({ page }) => {
  await page.goto("/?view=board&date=2026-09-30");
  await expect(page.getByRole("heading", { name: "Tägliche Einsatzliste" })).toBeVisible();
  await expect(page).toHaveURL(/view=board&date=2026-09-30/);
  await page.clock.install({ time: new Date("2026-09-30T23:59:58+02:00") });
  await page.getByRole("checkbox", { name: "Aktueller Tag" }).check();
  await page.clock.fastForward(3000);
  await expect(page.getByRole("heading", { name: "Donnerstag, 01. Oktober 2026" })).toBeVisible();
  await page.getByLabel("Einsatzdatum").fill("2026-09-30");
  await page.clock.fastForward(86400000);
  await expect(page.getByRole("heading", { name: "Mittwoch, 30. September 2026" })).toBeVisible();
});

test("wall display follows new releases across tabs, never drafts", async ({ context, page }) => {
  await addSample(page);
  await publish(page);
  const date = await page.getByLabel("Einsatzdatum").inputValue();
  const board = await context.newPage();
  await board.goto(`/treeline.html?view=board&date=${date}`);
  await expect(board.getByRole("heading", { name: "Tägliche Einsatzliste" })).toBeVisible();
  await page.getByRole("button", { name: /Einsatz bearbeiten:/ }).click();
  await page.getByLabel("Baustelle", { exact: true }).fill("Geänderter Einsatzort");
  await page.getByRole("button", { name: "Entwurf speichern" }).click();
  await expect(board.locator(".dp-screen-rows")).not.toContainText("Geänderter Einsatzort");
  await publish(page, true);
  await expect(board.locator(".dp-screen-rows")).toContainText("Geänderter Einsatzort");
  await board.reload();
  await expect(board.getByText("Freigegeben · Version 2", { exact: true })).toBeVisible();
});

for (const width of [320, 390, 768, 1440]) {
  test(`responsive dispatch, dialog and inbox at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 900 });
    await page.reload();
    await addSample(page);
    await expect(page.getByRole("button", { name: "Tagesplan freigeben", exact: true })).toBeVisible();
    async function noOverflow() {
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      const bounds = await page.getByLabel("Demo-Profil wechseln").boundingBox();
      expect(bounds.x + bounds.width).toBeLessThanOrEqual(width);
    }
    await noOverflow();
    await page.screenshot({ path: testInfo.outputPath(`dispatch-${width}.png`), fullPage: true });
    await page.getByRole("button", { name: /Einsatz bearbeiten:/ }).click();
    expect(await page.getByRole("dialog").evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
    await page.getByLabel("Mitarbeiter suchen", { exact: true }).fill("Jonna");
    await page.getByRole("checkbox", { name: "Jonna", exact: true }).check();
    await expect(page.getByLabel("Mitarbeiter: Auswahl", { exact: true })).toContainText("Jonna");
    await page.screenshot({ path: testInfo.outputPath(`picker-${width}.png`) });
    expect(await page.getByRole("dialog").evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
    await page.getByRole("button", { name: "Dialog schließen" }).click();
    await publish(page);
    await page.getByLabel("Demo-Profil wechseln").selectOption("user-007");
    await noOverflow();
    await expect(page.getByRole("button", { name: "Als gelesen bestätigen", exact: true })).toBeVisible();
    await page.screenshot({ path: testInfo.outputPath(`inbox-${width}.png`), fullPage: true });
  });
}

test("board renders desktop and iPad, paginates and prints all assignments", async ({ page }, testInfo) => {
  await addSample(page);
  await page.evaluate(() => {
    const date = Dispatch.localDate(1);
    const day = DISPATCH_STORE.day(date);
    const first = day.entries[0];
    const entries = Array.from({ length: 6 }, (_, index) => ({ ...first, id: `job-${index}`, site: `Baustelle ${index + 1}`, start: `${String(index + 7).padStart(2, "0")}:00`, end: `${String(index + 8).padStart(2, "0")}:00` }));
    DISPATCH_STORE.saveDraft(date, { ...day, entries }, day.version);
  });
  await publish(page);
  await page.clock.install();
  await page.getByRole("button", { name: "Aushang", exact: true }).click();
  await page.setViewportSize({ width: 1920, height: 1080 });
  await expect(page.locator(".dp-screen-rows").getByTestId("dispatch-row")).toHaveCount(3);
  await page.screenshot({ path: testInfo.outputPath("board-desktop.png"), fullPage: true });
  await page.clock.fastForward(15001);
  await expect(page.locator(".dp-screen-rows")).toContainText("Baustelle 4");
  await page.getByRole("button", { name: "Seitenwechsel pausieren" }).click();
  await page.getByRole("button", { name: "Nächste Seite", exact: true }).click();
  await expect(page.locator(".dp-screen-rows")).toContainText("Baustelle 1");
  await page.setViewportSize({ width: 1024, height: 768 });
  await expect(page.locator(".dp-screen-rows").getByTestId("dispatch-row")).toHaveCount(1);
  expect(await page.locator(".dp-board-footer").evaluate(el => el.getBoundingClientRect().bottom)).toBeLessThanOrEqual(768);
  await page.screenshot({ path: testInfo.outputPath("board-ipad.png"), fullPage: true });
  await page.emulateMedia({ media: "print" });
  await expect(page.locator(".dp-print-rows").getByTestId("dispatch-row")).toHaveCount(6);
  await expect(page.locator(".dp-screen-rows")).toBeHidden();
  await page.pdf({ path: testInfo.outputPath("einsatzliste.pdf"), format: "A4", landscape: true, printBackground: true });
});
