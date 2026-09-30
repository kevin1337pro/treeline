const port = Number(process.env.TREELINE_TEST_PORT || 4173);
const baseURL = `http://localhost:${port}`;

module.exports = {
  testDir: "./tests",
  testMatch: "**/*.spec.js",
  timeout: 30000,
  use: {
    baseURL,
    viewport: { width: 1365, height: 900 },
    locale: "de-DE",
    timezoneId: "Europe/Berlin",
    trace: "retain-on-failure",
  },
  webServer: {
    command: `npx serve . -l ${port}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 30000,
  },
};
