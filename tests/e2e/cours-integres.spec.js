// Cours intégrés au site : ouverts directement, sans import ni dossier.
import { test, expect } from "@playwright/test";
import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";

const APP = "https://app.test/IHECS-STUDY-OS.html";
const COURS = readdirSync(resolve("cours")).filter((f) => f.endsWith(".json")).map((f) => JSON.parse(readFileSync(resolve("cours", f), "utf8")));
const NOMS = COURS.flatMap((p) => p.subjects.map((s) => s.nom));

test.beforeEach(async ({ page }, info) => {
  info.errors = [];
  info.external = [];
  page.on("pageerror", (e) => info.errors.push(e.message));
  page.on("console", (m) => { if (m.type() === "error") info.errors.push(m.text()); });
  page.on("request", (r) => { if (!/^(https:\/\/app\.test\/|data:|blob:)/.test(r.url())) info.external.push(r.url()); });
  await page.route("https://app.test/**", (route) => route.fulfill({ path: resolve("IHECS-STUDY-OS.html"), contentType: "text/html; charset=utf-8" }));
});
test.afterEach(async ({}, info) => {
  expect(info.errors, "erreurs JS ou CSP").toEqual([]);
  expect(info.external, "requêtes externes").toEqual([]);
});
const ready = (page) => expect(page.locator("body")).toHaveAttribute("data-ready", "1");

test("première ouverture : tous les cours sont là, sans démo ni dossier", async ({ page }) => {
  await page.goto(APP + "#matieres");
  await ready(page);
  for (const n of NOMS) await expect(page.locator("#view")).toContainText(n);
  await expect(page.locator("#view")).not.toContainText("Mode démonstration");
  await page.evaluate(() => { location.hash = "#examens"; });
  await expect(page.locator("#view")).toContainText("Date à confirmer");
});

test("modification gardée et choix de la démo respecté au rechargement", async ({ page }) => {
  await page.goto(APP + "#accueil");
  await ready(page);
  const id = COURS[0].subjects[0].id;
  await page.evaluate((id) => { location.hash = "#m-" + id; }, id);
  await page.getByRole("button", { name: "Modifier" }).click();
  await page.locator("#ed-lieu").fill("Auditoire 3");
  await page.getByRole("button", { name: "Enregistrer" }).click();
  await expect(page.locator("#exam-card")).toContainText("Auditoire 3");
  await page.reload();
  await ready(page);
  await expect(page.locator("#exam-card")).toContainText("Auditoire 3");
  await page.evaluate(() => { location.hash = "#parametres"; });
  await page.getByRole("button", { name: "Passer en démonstration" }).click();
  await page.reload();
  await ready(page);
  await page.evaluate(() => { location.hash = "#accueil"; });
  await expect(page.locator("#view")).toContainText("Mode démonstration");
});
