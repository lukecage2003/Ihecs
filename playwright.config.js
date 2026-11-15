import { defineConfig, devices } from "@playwright/test";

const PORT = 4173;

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: { baseURL: `http://127.0.0.1:${PORT}/`, trace: "off", locale: "fr-BE", timezoneId: "Europe/Brussels" },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } }
  ],
  webServer: { command: `PORT=${PORT} node scripts/serve.mjs`, url: `http://127.0.0.1:${PORT}/`, reuseExistingServer: !process.env.CI, timeout: 20000 }
});
