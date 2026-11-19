const { test, expect } = require("@playwright/test");

test.beforeEach(async ({ page }) => {
  await page.route("https://fra.cloud.appwrite.io/**", route => route.abort());
});

async function expectLogo(image, file) {
  await expect(image).toBeVisible();
  await expect.poll(() => image.evaluate(node => node.complete && node.naturalWidth > 0)).toBe(true);
  const dimensions = await image.evaluate(node => {
    const rect = node.getBoundingClientRect();
    return { source: node.currentSrc, ratio: rect.width / rect.height, naturalRatio: node.naturalWidth / node.naturalHeight };
  });
  expect(dimensions.source).toContain(file);
  expect(dimensions.ratio).toBeCloseTo(dimensions.naturalRatio, 2);
}

async function expectNoOverflow(page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
}

for (const width of [320, 390, 768, 1440]) {
  test(`branding stays legible and navigation works at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/treeline.html");
    const mobile = width <= 768;
    await expectLogo(page.locator(mobile ? ".login-mobile-logo img" : ".login-brand-logo img"), mobile ? "stacked" : "horizontal-dark");
    await expect(page.locator(mobile ? ".login-brand" : ".login-mobile-logo")).toBeHidden();
    await expectNoOverflow(page);
    await page.screenshot({ path: testInfo.outputPath("login.png"), fullPage: true });

    await page.getByRole("button", { name: /Als Mara anmelden/ }).click();
    if (mobile) await page.getByRole("button", { name: "Navigation öffnen", exact: true }).click();
    const logo = page.locator(".sidebar-brand img");
    await expectLogo(logo, "horizontal-600");
    await expect.poll(() => logo.evaluate(node => {
      const image = node.getBoundingClientRect();
      const sidebar = node.closest("aside").getBoundingClientRect();
      return image.left >= sidebar.left && image.right <= sidebar.right;
    })).toBe(true);
    await page.screenshot({ path: testInfo.outputPath("navigation.png") });

    await page.getByRole("button", { name: "Aufträge", exact: true }).first().click();
    if (mobile) await page.getByRole("button", { name: "Navigation öffnen", exact: true }).click();
    await page.getByRole("button", { name: "Treeline: Übersicht öffnen", exact: true }).click();
    await expect(page.getByText(/Willkommen, Mara/)).toBeVisible();
    if (mobile) {
      await expect(page.getByRole("button", { name: "Navigation öffnen", exact: true })).toBeVisible();
    } else {
      await page.getByRole("button", { name: "Navigation schließen", exact: true }).click();
      await expectLogo(logo, "symbol-128");
      await page.screenshot({ path: testInfo.outputPath("collapsed.png"), fullPage: true });
    }
    await expectNoOverflow(page);
  });
}

for (const width of [320, 390, 1440]) {
  test(`display and print keep the original logo proportions at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/treeline.html?view=board");
    await page.getByRole("button", { name: /Als Mara anmelden/ }).click();
    const logo = page.locator(".dp-board-brand img");
    await expectLogo(logo, "stacked");
    await expect(page.getByRole("heading", { name: "Tägliche Einsatzliste" })).toBeVisible();
    await expect(page.locator(".dp-board-brand").getByText("Baumdienst Enbergs")).toBeVisible();
    const imageBox = await logo.boundingBox();
    const titleBox = await page.locator(".dp-board-brand > div").boundingBox();
    expect(imageBox.x + imageBox.width).toBeLessThanOrEqual(titleBox.x);
    await expectNoOverflow(page);
    await page.screenshot({ path: testInfo.outputPath("display.png"), fullPage: true });
    await page.emulateMedia({ media: "print" });
    await expectLogo(logo, "stacked");
    await expect(page.locator(".dp-board-tools")).toBeHidden();
    expect((await logo.boundingBox()).width).toBe(72);
    await expectNoOverflow(page);
    await page.screenshot({ path: testInfo.outputPath("print.png"), fullPage: true });
  });
}

test("icons, PNG fallbacks and manifest resolve under the GitHub Pages subdirectory", async ({ page }) => {
  await page.route("**/treeline/**", async route => {
    const url = new URL(route.request().url());
    url.pathname = url.pathname.replace(/^\/treeline\//, "/");
    const response = await route.fetch({ url: url.toString() });
    await route.fulfill({ response });
  });
  await page.goto("/treeline/index.html?view=board&date=2026-10-26");
  await expect(page).toHaveURL(/\/treeline\/treeline\.html\?view=board&date=2026-10-26$/);
  await expectLogo(page.locator(".login-brand-logo img"), "/treeline/assets/brand/");

  const metadata = await page.evaluate(async () => {
    const manifestUrl = document.querySelector('link[rel="manifest"]').href;
    const manifest = await (await fetch(manifestUrl)).json();
    const urls = [
      ...Array.from(document.querySelectorAll('link[rel="icon"], link[rel="apple-touch-icon"]'), link => link.href),
      ...manifest.icons.map(icon => new URL(icon.src, manifestUrl).href),
      ...["treeline-horizontal-600", "treeline-horizontal-dark-600", "treeline-stacked-400"].map(file => new URL(`assets/brand/logos/${file}.png`, location.href).href),
    ];
    const images = [];
    for (const url of urls) {
      // Playwright suppresses requests ending in /favicon.ico before route handlers run.
      const requestUrl = url.endsWith("/favicon.ico") ? `${url}?branding-check=1` : url;
      const response = await fetch(requestUrl);
      if (!response.ok) throw new Error(`Missing branding asset: ${url}`);
      const objectUrl = URL.createObjectURL(await response.blob());
      const image = new Image();
      image.src = objectUrl;
      try { await image.decode(); }
      catch (_) { throw new Error(`Cannot decode branding asset: ${url}`); }
      finally { URL.revokeObjectURL(objectUrl); }
      images.push({ url, width: image.naturalWidth });
    }
    return { images, start: new URL(manifest.start_url, manifestUrl).pathname, scope: new URL(manifest.scope, manifestUrl).pathname };
  });
  expect(metadata.start).toBe("/treeline/treeline.html");
  expect(metadata.scope).toBe("/treeline/");
  for (const image of metadata.images) {
    expect(new URL(image.url).pathname).toMatch(/^\/treeline\/assets\/brand\//);
    expect(image.width).toBeGreaterThan(0);
  }
});
