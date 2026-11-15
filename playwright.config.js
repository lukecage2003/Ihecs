import { defineConfig, devices } from "@playwright/test";

// Aucun serveur : l'application est testée telle que tu l'ouvres, par double-clic
// sur IHECS-STUDY-OS.html (file://). Le laboratoire Drive est servi par interception.
export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: { trace: "off", locale: "fr-BE", timezoneId: "Europe/Brussels" },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } }
  ]
});
