// Téléphone : pas d'accès aux dossiers, on ouvre une copie de structure.json.
import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { planImport } from "../../src/data/v2/course-pack.js";
import { newStructure } from "../../src/data/v2/workspace.js";
import { ICON_NAMES } from "../../src/core/icons.js";

const APP = "https://app.test/IHECS-STUDY-OS.html";
const PACK = JSON.parse(readFileSync(resolve("fixtures/packs/exemple-cours.json"), "utf8"));
const NOW = new Date("2026-11-16T10:00:00Z");
const WID = "6f1c9a52-3b7e-4d2a-9c11-2a4b5c6d7e8f";
const structureOf = (pack) => planImport(newStructure({ workspaceId: WID, now: NOW }), pack, { now: NOW, sourceName: "cours.json", iconNames: ICON_NAMES }).nextStructure;
const file = (obj, name = "structure.json") => ({ name, mimeType: "application/json", buffer: Buffer.from(JSON.stringify(obj)) });

test.beforeEach(async ({ page }, info) => {
  info.errors = [];
  info.external = [];
  page.on("pageerror", (e) => info.errors.push(e.message));
  page.on("console", (m) => { if (m.type() === "error") info.errors.push(m.text()); });
  page.on("request", (r) => { if (!/^(https:\/\/app\.test\/|data:|blob:)/.test(r.url())) info.external.push(r.url()); });
  await page.route("https://app.test/**", (route) => route.fulfill({ path: resolve("IHECS-STUDY-OS.html"), contentType: "text/html; charset=utf-8" }));
  await page.addInitScript(() => { delete window.showDirectoryPicker; });
});
test.afterEach(async ({}, info) => {
  expect(info.errors, "erreurs JS ou CSP").toEqual([]);
  expect(info.external, "requêtes externes").toEqual([]);
});

async function openSettings(page) {
  await page.goto(APP + "#parametres");
  await expect(page.locator("body")).toHaveAttribute("data-ready", "1");
  await expect(page.locator("#ws-body")).toContainText("structure.json");
}

test("ouvrir une copie : cours visibles, progression séparée de la démo, gardée au rechargement", async ({ page }) => {
  await openSettings(page);
  // Progression de démonstration existante : ne doit pas apparaître dans la copie.
  await page.evaluate(() => localStorage.setItem("revisions-ihecs-v1", JSON.stringify({ prenom: "Démo" })));
  const st = structureOf(PACK);
  await page.locator("#copy-file").setInputFiles(file(st));
  await expect(page.locator("#ws-body")).toContainText(st.subjects.length + " matière(s) ouverte(s)");
  await expect(page.locator(".pill", { hasText: "Copie" }).first()).toBeAttached();
  await page.locator("#set-name").fill("Copie");
  await page.evaluate(() => { location.hash = "#accueil"; });
  await expect(page.locator("#view")).toContainText("Copie de tes cours");
  await expect(page.locator("#view")).toContainText(st.subjects[0].nom);
  await expect(page.locator("#view")).not.toContainText("Mode démonstration");
  await page.reload();
  await expect(page.locator("body")).toHaveAttribute("data-ready", "1");
  await expect(page.locator("#view")).toContainText("Copie de tes cours");
  const keys = await page.evaluate(() => ({ demo: JSON.parse(localStorage.getItem("revisions-ihecs-v1")).prenom, copy: Object.keys(localStorage).filter((k) => k.startsWith("ihecs-copie-")) }));
  expect(keys.demo).toBe("Démo");
  expect(keys.copy).toEqual(["ihecs-copie-" + WID]);
  // Pas d'import ni de modification sur la copie
  await page.evaluate(() => { location.hash = "#importer"; });
  await expect(page.locator("#view")).toContainText("Import sur ordinateur");
  await page.evaluate((id) => { location.hash = "#m-" + id; }, st.subjects[0].id);
  await expect(page.locator("#exam-card")).toBeVisible();
  await expect(page.getByRole("button", { name: "Modifier" })).toHaveCount(0);
  // Retour en démonstration : la démo retrouve sa progression
  await page.evaluate(() => { location.hash = "#parametres"; });
  await page.getByRole("button", { name: "Passer en démonstration" }).click();
  await expect(page.locator("#set-name")).toHaveValue("Démo");
});

test("copie : fichier de cours ou JSON invalide refusés sans rien changer", async ({ page }) => {
  await openSettings(page);
  await page.locator("#copy-file").setInputFiles(file(PACK, "exemple-cours.json"));
  await expect(page.locator("#ws-body")).toContainText("C'est un fichier de cours");
  await page.locator("#copy-file").setInputFiles({ name: "x.json", mimeType: "application/json", buffer: Buffer.from("{oups") });
  await expect(page.locator("#ws-body")).toContainText("pas du JSON lisible");
  await page.evaluate(() => { location.hash = "#accueil"; });
  await expect(page.locator("#view")).toContainText("Mode démonstration");
});

test("mettre à jour la copie : nouvelles matières, progression conservée", async ({ page }) => {
  await openSettings(page);
  const small = Object.assign({}, PACK, { subjects: PACK.subjects.slice(0, 1) });
  await page.locator("#copy-file").setInputFiles(file(structureOf(small)));
  await expect(page.locator("#ws-body")).toContainText("1 matière(s) ouverte(s)");
  await page.locator("#set-name").fill("Léa");
  await page.locator("#copy-file").setInputFiles(file(structureOf(PACK)));
  await expect(page.locator("#ws-body")).toContainText(PACK.subjects.length + " matière(s) ouverte(s)");
  await expect(page.locator("#set-name")).toHaveValue("Léa");
});
