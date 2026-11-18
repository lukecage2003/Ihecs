// Espace « dans ce navigateur » : cours importés une fois, affichés directement ensuite.
import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const APP = "https://app.test/IHECS-STUDY-OS.html";
const PACK_PATH = resolve("fixtures/packs/exemple-cours.json");
const PACK = JSON.parse(readFileSync(PACK_PATH, "utf8"));

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

async function importHere(page, button) {
  await page.goto(APP + "#parametres");
  await ready(page);
  await page.getByRole("button", { name: button }).click();
  await expect(page.getByRole("heading", { name: "Importer mes cours" })).toBeVisible();
  await page.locator("#pack-file").setInputFiles(PACK_PATH);
  await expect(page.locator("#imp-preview")).toContainText("Aperçu");
  await page.getByRole("button", { name: "Importer", exact: true }).click();
  await expect(page.locator("#imp-preview")).toContainText("Import terminé");
}

test("sans dossier : cours importés une fois, affichés directement à la réouverture", async ({ page }) => {
  await importHere(page, "Sans dossier : mes cours dans ce navigateur");
  await page.reload();
  await ready(page);
  await page.evaluate(() => { location.hash = "#accueil"; });
  await expect(page.locator("#view")).toContainText(PACK.subjects[0].nom);
  await expect(page.locator("#view")).not.toContainText("Mode démonstration");
  await expect(page.locator("#view")).not.toContainText("Ouvrir ton espace académique");
  await expect(page.locator(".pill", { hasText: "Mon espace" }).first()).toBeAttached();
  // Modifier l'examen fonctionne aussi ici, et survit au rechargement.
  await page.evaluate((id) => { location.hash = "#m-" + id; }, PACK.subjects[0].id);
  await page.getByRole("button", { name: "Modifier" }).click();
  await page.locator("#ed-lieu").fill("Salle 12");
  await page.getByRole("button", { name: "Enregistrer" }).click();
  await expect(page.locator("#exam-card")).toContainText("Salle 12");
  await page.reload();
  await ready(page);
  await expect(page.locator("#exam-card")).toContainText("Salle 12");
  // Réimport du même fichier : rien à faire.
  await page.evaluate(() => { location.hash = "#importer"; });
  await page.locator("#pack-file").setInputFiles(PACK_PATH);
  await expect(page.locator("#imp-preview")).toContainText("Tout est déjà à jour");
});

test("téléphone sans accès aux dossiers : import direct des fichiers de cours", async ({ page }) => {
  await page.addInitScript(() => { delete window.showDirectoryPicker; });
  await importHere(page, "Importer mes fichiers de cours ici");
  await page.reload();
  await ready(page);
  await page.evaluate(() => { location.hash = "#accueil"; });
  await expect(page.locator("#view")).toContainText(PACK.subjects[0].nom);
  // La démonstration garde sa propre progression (D3).
  await page.evaluate(() => { location.hash = "#parametres"; });
  await page.getByRole("button", { name: "Passer en démonstration" }).click();
  await page.evaluate(() => { location.hash = "#accueil"; });
  await expect(page.locator("#view")).toContainText("Mode démonstration");
  await expect(page.locator("#view")).not.toContainText(PACK.subjects[0].nom);
});
