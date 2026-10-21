const { defineConfig } = require("@playwright/test");
const { existsSync } = require("node:fs");

module.exports = defineConfig({
  testDir: "./tests",
  workers: 1,
  use: {
    baseURL: "http://127.0.0.1:3100",
    launchOptions: existsSync("/usr/bin/chromium") ? { executablePath: "/usr/bin/chromium" } : {},
  },
  webServer: {
    command: "node tests/support/auth-server.mjs",
    url: "http://127.0.0.1:3100/login",
    timeout: 120000,
    reuseExistingServer: false,
  },
});
