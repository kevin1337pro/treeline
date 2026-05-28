module.exports = {
  testDir: "./tests",
  timeout: 30000,
  use: {
    baseURL: "http://localhost:4173",
    viewport: { width: 1365, height: 900 },
    trace: "retain-on-failure",
  },
  webServer: {
    command: "npm run dev",
    url: "http://localhost:4173",
    reuseExistingServer: true,
    timeout: 10000,
  },
};
