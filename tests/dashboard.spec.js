const { test, expect } = require("@playwright/test");

test.beforeEach(async ({ page, context }) => {
  await context.route("https://fra.cloud.appwrite.io/**", route => route.abort());
  await page.clock.install({ time: new Date("2026-10-21T08:00:00Z") });
  await page.goto("/treeline.html");
  await page.getByRole("button", { name: /Als Mara anmelden/ }).click();
  await page.evaluate(() => {
    MOCK_DATA.measures = [
      { id: "test-future", title: "Kronenpflege am Sportplatz", date: "2026-10-24", type: "baumschnitt", status: "geplant", assignedTo: "user-007", treeId: "TRE-2024-001" },
      { id: "test-overdue", title: "Eichenprozessionsspinnerkontrolle an der Musterstraße im Straßenrandbereich", date: "2026-10-20", type: "eps", status: "in_arbeit", assignedTo: "user-008", treeId: "TRE-2024-003" },
      { id: "test-today", title: "Baumkontrolle heute", date: "2026-10-21", type: "seilklettern", status: "geplant", assignedTo: "user-007" },
      { id: "test-done", title: "Abgeschlossene Pflege", date: "2026-09-15", type: "baumschnitt", status: "abgeschlossen", assignedTo: "user-007" },
      { id: "test-no-date", title: "Baumkontrolle ohne Termin", date: "", type: "baumschnitt", status: "geplant" },
    ];
    TREELINE_DB.save();
  });
  await page.reload();
  await expect(page.getByRole("heading", { name: "Übersicht", exact: true })).toBeVisible();
});

async function dashboard(page) {
  const menu = page.getByRole("button", { name: "Navigation öffnen", exact: true });
  if (await menu.isVisible()) await menu.click();
  await page.getByRole("button", { name: "Übersicht", exact: true }).click();
}

test("monthly chart uses due-date records, normal HTML labels and selectable periods", async ({ page }) => {
  const chart = page.getByRole("region", { name: "Maßnahmen / Monat", exact: true });
  await expect(chart).toContainText("Nach Fälligkeit · 4 im Zeitraum");
  await expect(chart.getByRole("img", { name: "Oktober 2026: 3 offen, 0 abgeschlossen" })).toBeVisible();
  await expect(chart.getByRole("img", { name: "September 2026: 0 offen, 1 abgeschlossen" })).toBeVisible();
  expect(await chart.locator(".db-bar-open").first().evaluate(el => el.getBoundingClientRect().height)).toBeGreaterThan(0);
  await expect(chart.locator("svg text")).toHaveCount(0);
  await expect(chart.locator(".db-month-label")).toHaveCount(6);
  await page.getByLabel("Diagrammzeitraum").selectOption("12");
  await expect(chart.locator(".db-month-label")).toHaveCount(12);
  await expect(chart.locator(".db-month-year").first()).toHaveText("2025");
  await page.getByLabel("Diagrammzeitraum").selectOption("3");
  await expect(chart.locator(".db-month-label")).toHaveCount(3);
});

test("measure filters, search, team counts and urgent-tree navigation work", async ({ page }) => {
  const section = page.getByRole("region", { name: "Maßnahmen im Blick" });
  await expect(section.locator(".db-measures > li").first()).toContainText("Eichenprozessionsspinnerkontrolle");
  await expect(section).not.toContainText("Abgeschlossene Pflege");
  await expect(page.getByRole("region", { name: "Aufgaben im Team" })).toContainText("1 Maßnahme ohne Mitarbeiterzuordnung");
  await page.getByRole("button", { name: "1 überfällige Maßnahme", exact: true }).click();
  await expect(section.locator(".db-measures > li")).toHaveCount(1);
  await expect(section.getByRole("button", { name: "Überfällig", exact: true })).toHaveAttribute("aria-pressed", "true");
  await section.getByRole("button", { name: "Nächste 7 Tage" }).click();
  await expect(section.locator(".db-measures > li")).toHaveCount(2);
  await page.getByLabel("Maßnahmen suchen").fill("Sportplatz");
  await expect(section.locator(".db-measures > li")).toHaveCount(1);
  await page.getByLabel("Maßnahmen suchen").fill("nichtvorhanden");
  await expect(section).toContainText("Keine Maßnahmen für diese Auswahl.");
  const urgent = page.getByRole("region", { name: "Handlungsbedarf", exact: true });
  await expect(urgent.locator("li").first()).toContainText("Kritisch");
  await urgent.locator("li").first().getByRole("button").click();
  await expect.poll(() => page.evaluate(() => localStorage.getItem("treeline_public_selectedTree"))).toBe("TRE-2024-003");
});

test("daily preview respects release snapshots, personal assignment and chosen planning date", async ({ page }) => {
  await page.evaluate(() => {
    const entry = { id: "kira-job", site: "Kira heute", address: "Musterstadt", start: "07:00", end: "15:30", employeeIds: ["user-007"], vehicleIds: [], equipmentIds: [], orderId: "AUF-2026-001", meeting: "Hof", notes: "", task: "Pflege" };
    DISPATCH_STORE.saveDraft("2026-10-21", { note: "Hinweis nur für eingeteilte Mitarbeiter", entries: [entry, { ...entry, id: "tilo-job", site: "Tilo heute", employeeIds: ["user-008"] }] }, 0);
    DISPATCH_STORE.publish("2026-10-21", 1, MOCK_DATA.users[0]);
    const day = DISPATCH_STORE.day("2026-10-21");
    DISPATCH_STORE.saveDraft("2026-10-21", { ...day, entries: day.entries.map(row => ({ ...row, site: `Entwurf ${row.site}` })) }, day.version);
  });
  const schedule = page.getByRole("region", { name: "Einsätze", exact: true });
  await expect(schedule).toContainText("Entwurf Kira heute");
  await schedule.getByRole("button", { name: "Morgen", exact: true }).click();
  await expect(schedule).toContainText("Noch keine Einsätze geplant");
  await schedule.getByRole("button", { name: "Tagesplanung öffnen", exact: true }).click();
  await expect(page.getByLabel("Einsatzdatum")).toHaveValue("2026-10-22");
  await dashboard(page);
  await page.getByRole("button", { name: "Einsatzplanung öffnen", exact: true }).click();
  await expect(page.getByLabel("Einsatzdatum")).toHaveValue("2026-10-21");
  await page.getByLabel("Demo-Profil wechseln").selectOption("user-007");
  await dashboard(page);
  const personal = page.getByRole("region", { name: "Meine Einsätze", exact: true });
  await expect(personal).toContainText("Kira heute");
  await expect(personal).not.toContainText("Entwurf");
  await expect(personal).not.toContainText("Tilo heute");
  await personal.getByRole("button", { name: "Auftragskarte: Kira heute", exact: true }).click();
  await expect(page.getByLabel("Auftrag auf Karte auswählen")).toHaveValue("AUF-2026-001");
  await page.getByLabel("Demo-Profil wechseln").selectOption("user-002");
  await dashboard(page);
  await expect(page.getByRole("region", { name: "Meine Einsätze", exact: true })).not.toContainText("Hinweis nur für eingeteilte Mitarbeiter");
});

test("empty and corrupt states render without invented counts or browser errors", async ({ page }) => {
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.evaluate(() => {
    MOCK_DATA.trees = []; MOCK_DATA.measures = []; MOCK_DATA.orders = [];
    TREELINE_DB.save();
    localStorage.setItem(Dispatch.KEY, "{broken");
  });
  await page.reload();
  await expect(page.getByRole("alert")).toContainText("unlesbar");
  await expect(page.locator(".db-chart-legend")).toContainText("Keine Maßnahmen im Zeitraum");
  await expect(page.locator(".db-stat-top strong")).toHaveText(["0", "0", "0", "0"]);
  await expect(page.locator(".dashboard-page")).not.toContainText("NaN");
  expect(errors).toEqual([]);
});

test("today moves with Berlin midnight and client profiles have no dispatch preview", async ({ page }) => {
  await page.clock.setSystemTime(new Date("2026-10-21T21:59:59Z"));
  await page.clock.fastForward(61000);
  await expect(page.locator(".db-header")).toContainText("22. Oktober 2026");
  await page.getByLabel("Demo-Profil wechseln").selectOption("user-006");
  await expect(page.getByRole("region", { name: "Einsätze", exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Einsatzplanung öffnen", exact: true })).toHaveCount(0);
  await expect(page.getByRole("region", { name: "Aufgaben im Team" })).toHaveCount(0);
});

for (const width of [320, 390, 768, 1024, 1440]) {
  test(`dashboard layout and chart labels at ${width}px`, async ({ page }, testInfo) => {
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.setViewportSize({ width, height: 900 });
    await page.reload();
    const root = page.locator(".dashboard-page");
    await expect(root.getByRole("heading", { name: "Übersicht", exact: true })).toBeVisible();
    const overflow = await root.evaluate(root => [...root.querySelectorAll(".db-section, .db-stat, .db-header, .db-measures li, .db-alerts button")].filter(el => {
      const box = el.getBoundingClientRect();
      return box.left < -1 || box.right > innerWidth + 1 || el.scrollWidth > el.clientWidth + 1;
    }).map(el => el.className));
    expect(overflow).toEqual([]);
    const labels = await root.locator(".db-month-label").evaluateAll(elements => elements.map(el => ({ font: getComputedStyle(el).fontSize, transform: getComputedStyle(el).transform, width: el.clientWidth, height: el.clientHeight, scroll: el.scrollWidth })));
    expect(labels).toHaveLength(6);
    for (const label of labels) { expect(label.font).toBe("13px"); expect(label.transform).toBe("none"); expect(label.scroll).toBeLessThanOrEqual(label.width); expect(label.height).toBe(20); }
    await page.screenshot({ path: testInfo.outputPath(`dashboard-${width}.png`), fullPage: true });
    await page.getByRole("region", { name: "Maßnahmen / Monat", exact: true }).screenshot({ path: testInfo.outputPath(`dashboard-chart-${width}.png`) });
    await page.getByLabel("Diagrammzeitraum").selectOption("12");
    expect(await root.evaluate(el => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
    const open = page.getByRole("button", { name: "Navigation öffnen", exact: true });
    if (await open.isVisible()) await open.click();
    else await page.getByRole("button", { name: "Navigation schließen", exact: true }).click();
    expect(errors).toEqual([]);
  });
}
