// Parcours de bout en bout dans un vrai navigateur (Chromium, bureau et mobile).
import { test, expect } from "@playwright/test";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";

// Le fichier testé est exactement celui que l'on ouvre par double-clic.
const APP = pathToFileURL(resolve("IHECS-STUDY-OS.html")).href;

const KEY = "revisions-ihecs-v1";
const state = (page) => page.evaluate((k) => JSON.parse(localStorage.getItem(k) || "{}"), KEY);

// Chaque test vérifie qu'aucune erreur JS, aucune violation CSP et aucune requête
// hors de l'application n'a eu lieu (aucun CDN, aucune donnée envoyée ailleurs).
test.beforeEach(async ({ page }, info) => {
  info.errors = [];
  info.external = [];
  page.on("pageerror", (e) => info.errors.push(e.message));
  page.on("console", (m) => { if (m.type() === "error") info.errors.push(m.text()); });
  page.on("request", (r) => { if (!/^(file:|data:|blob:)/.test(r.url())) info.external.push(r.url()); });
});
test.afterEach(async ({}, info) => {
  expect(info.errors, "erreurs JS ou CSP").toEqual([]);
  expect(info.external, "requêtes externes").toEqual([]);
});

const ROUTES = ["accueil", "matieres", "m-socio", "m-anglais", "c-socio-c1-resume", "c-socio-c1-essentiel", "c-socio-c1-fiches", "c-socio-c1-quiz", "blanc-droit", "revision", "examens", "planning", "parametres"];

test("toutes les pages s'affichent, sans défilement horizontal", async ({ page }) => {
  for (const r of ROUTES) {
    await page.goto(APP + "#" + r);
    await expect(page.locator("#view h1, #view .h-large").first()).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    expect(overflow, "débordement sur #" + r).toBe(false);
  }
});

test("l'espace de démonstration est clairement signalé (D3)", async ({ page }) => {
  await page.goto(APP + "#accueil");
  await expect(page.getByText("Mode démonstration.")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.dataset.workspace)).toBe("demo");
});

test("une route inconnue affiche une page introuvable", async ({ page }) => {
  await page.goto(APP + "#nimporte-quoi");
  await expect(page.getByRole("heading", { name: "Page introuvable" })).toBeVisible();
});

test("marquer un chapitre comme lu persiste après rechargement", async ({ page }) => {
  await page.goto(APP + "#c-socio-c1-resume");
  await page.getByRole("button", { name: "Marquer comme lu" }).click();
  await page.reload();
  await expect(page.getByText("Chapitre lu")).toBeVisible();
  expect((await state(page)).lu["socio|c1"]).toBe(true);
});

test("fiches : on ne peut noter qu'après avoir retourné, puis l'échéance est enregistrée", async ({ page }) => {
  await page.goto(APP + "#c-eco-c1-fiches");
  await page.locator("#fc").focus();
  await page.keyboard.press("3");
  expect((await state(page)).cartes || {}).toEqual({});
  await page.keyboard.press("Space");
  await expect(page.locator("#rate")).toBeVisible();
  await page.getByRole("button", { name: /^Facile/ }).click();
  const cartes = (await state(page)).cartes;
  const [k, v] = Object.entries(cartes)[0];
  expect(k).toMatch(/^eco\|c1\|\d+$/);
  expect(v.box).toBe(2);
});

test("quiz : un parcours complet enregistre le résultat", async ({ page }) => {
  await page.goto(APP + "#c-semio-c1-quiz");
  for (let i = 0; i < 5; i++) {
    await page.locator(".choice").first().click();
    await page.locator("#q-next").click();
  }
  await expect(page.getByRole("button", { name: "Recommencer" })).toBeVisible();
  const q = (await state(page)).quiz["semio|c1"];
  expect(q.tries).toBe(1);
  expect(q.best).toBeGreaterThanOrEqual(0);
});

test("onglets du chapitre : navigation au clavier avec les flèches", async ({ page }) => {
  await page.goto(APP + "#c-socio-c1-resume");
  await page.getByRole("tab", { name: "Résumé" }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(page).toHaveURL(/#c-socio-c1-essentiel$/);
  await expect(page.getByRole("tab", { name: "L'essentiel" })).toHaveAttribute("aria-selected", "true");
  await expect(page.getByRole("tabpanel")).toBeVisible();
});

test("planning : cocher une tâche persiste", async ({ page }) => {
  await page.goto(APP + "#planning");
  await page.locator("[data-task]").first().click();
  expect(Object.values((await state(page)).plan).some(Boolean)).toBe(true);
});

test("sauvegarde : export puis import restaure l'état, un code invalide est refusé", async ({ page }) => {
  await page.goto(APP + "#c-socio-c1-resume");
  await page.getByRole("button", { name: "Marquer comme lu" }).click();
  const code = await page.evaluate((k) => btoa(unescape(encodeURIComponent(localStorage.getItem(k)))), KEY);
  await page.evaluate(() => localStorage.clear());
  await page.goto(APP + "#parametres");
  await page.reload();
  await page.locator("#imp-text").fill("nimportequoi");
  await page.getByRole("button", { name: "Restaurer" }).click();
  await expect(page.locator("#toast")).toContainText("Sauvegarde refusée");
  await page.locator("#imp-text").fill(code);
  await page.getByRole("button", { name: "Restaurer" }).click();
  await expect(page.locator("#toast")).toContainText("Progression restaurée");
  expect((await state(page)).lu["socio|c1"]).toBe(true);
});

test("réinitialisation : demande une confirmation et peut être annulée", async ({ page }) => {
  await page.goto(APP + "#c-socio-c1-resume");
  await page.getByRole("button", { name: "Marquer comme lu" }).click();
  await page.goto(APP + "#parametres");
  await page.getByRole("button", { name: "Réinitialiser" }).click();
  await page.getByRole("button", { name: "Annuler" }).click();
  expect((await state(page)).lu["socio|c1"]).toBe(true);
});

test("recherche : trouve une notion et y mène", async ({ page, isMobile }) => {
  await page.goto(APP + "#accueil");
  if (isMobile) await page.getByRole("button", { name: "Rechercher" }).click();
  else await page.keyboard.press("Control+k");
  await page.getByRole("combobox", { name: "Rechercher" }).fill("handyside");
  await expect(page.locator(".spot-item").first()).toBeVisible();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#c-droit-c1-/);
});

test("une progression existante (ancienne version) est lue sans être modifiée", async ({ page }) => {
  const legacy = { lu: { "socio|c1": true }, quiz: { "socio|c1": { best: 0.5, last: 0.5, tries: 2 } }, cartes: { "socio|c1|0": { box: 4, due: "2099-01-01" } }, plan: {}, journal: {}, prenom: "Alex", theme: "auto", focus: { min: 12 } };
  await page.addInitScript(([k, v]) => { if (!sessionStorage.getItem("seeded")) { localStorage.setItem(k, v); sessionStorage.setItem("seeded", "1"); } }, [KEY, JSON.stringify(legacy)]);
  await page.goto(APP + "#accueil");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Alex");
  expect(await state(page)).toEqual(legacy);
});

test("l'application fonctionne quand le stockage est bloqué", async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(window, "localStorage", { get() { throw new Error("bloqué"); } }));
  await page.goto(APP + "#accueil");
  await expect(page.locator(".subject-card").first()).toBeVisible();
});
