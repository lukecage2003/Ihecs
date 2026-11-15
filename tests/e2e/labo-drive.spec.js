// Laboratoire Drive (prototype option A).
// Google Drive pour ordinateur n'est pas disponible dans l'environnement de test :
// le dossier choisi est remplacé par le système de fichiers privé du navigateur
// (OPFS), qui expose exactement la même API (FileSystemDirectoryHandle).
// Ces tests vérifient la mécanique du laboratoire, PAS le comportement réel de Drive.
import { test, expect } from "@playwright/test";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";

const URL_LABO = "https://labo.test/labo-drive.html";

test.beforeEach(async ({ page }, info) => {
  info.errors = [];
  info.external = [];
  page.on("pageerror", (e) => info.errors.push(e.message));
  page.on("console", (m) => { if (m.type() === "error") info.errors.push(m.text()); });
  page.on("request", (r) => { if (!/^(https:\/\/labo\.test\/|file:|blob:|data:)/.test(r.url())) info.external.push(r.url()); });
  // Remplace le sélecteur de dossier par un sous-dossier OPFS, et la mémorisation de
  // la poignée (IndexedDB, qui fait planter Chromium headless) par un équivalent
  // qui survit au rechargement de la page.
  await page.addInitScript(() => {
    const pick = async () => (await navigator.storage.getDirectory()).getDirectoryHandle("Mon Drive - IHECS STUDY OS", { create: true });
    window.showDirectoryPicker = pick;
    window.__LABO_TEST_HANDLE_STORE__ = {
      get: async () => (sessionStorage.getItem("labo-root") ? pick() : undefined),
      set: async () => sessionStorage.setItem("labo-root", "1")
    };
  });
  // Aucun serveur : les fichiers sont servis à la page par interception réseau.
  await page.route("https://labo.test/**", (route) => route.fulfill({ path: resolve("prototypes/drive/labo-drive.html"), contentType: "text/html; charset=utf-8" }));
});
test.afterEach(async ({}, info) => {
  expect(info.errors, "erreurs JS ou CSP").toEqual([]);
  expect(info.external, "requêtes externes").toEqual([]);
});

const report = (page) => page.evaluate(() => JSON.parse(document.getElementById("report-out").textContent));
const ready = (page) => expect(page.locator("body")).toHaveAttribute("data-ready", "1");

test("diagnostic, choix du dossier et autorisation conservée après réouverture", async ({ page }) => {
  await page.goto(URL_LABO);
  await ready(page);
  await expect(page.locator("#diag-pill")).toHaveText("Compatible");
  await page.getByRole("button", { name: "Choisir le dossier" }).click();
  await expect(page.locator("#folder-pill")).toContainText("«");
  await page.reload();
  await ready(page);
  await expect(page.locator("#e1-pill")).toHaveText("Persistante");
  const r = await report(page);
  expect(r.e1.length).toBe(2);
  expect(r.e1.map((c) => c.permission)).toEqual(["granted", "granted"]);
  expect(r.deviceId).toMatch(/^[0-9a-f-]{36}$/);
});

test("ordinateur → Drive : écrit dans _labo-ihecs/sortant et mesure le délai", async ({ page }) => {
  await page.goto(URL_LABO);
  await ready(page);
  await page.getByRole("button", { name: "Choisir le dossier" }).click();
  await page.getByRole("button", { name: "Écrire un fichier" }).click();
  await expect(page.locator("#e2-out")).toContainText("_labo-ihecs/sortant/sortant-");
  const names = await page.evaluate(async () => {
    const d = await (await (await (await navigator.storage.getDirectory()).getDirectoryHandle("Mon Drive - IHECS STUDY OS")).getDirectoryHandle("_labo-ihecs")).getDirectoryHandle("sortant");
    const out = []; for await (const [n] of d.entries()) out.push(n); return out;
  });
  expect(names.length).toBe(1);
  await page.getByRole("button", { name: "Je le vois dans Drive" }).click();
  await expect(page.locator("#e2-out")).toContainText("Visible dans Drive après");
  const r = await report(page);
  expect(r.e2[0].delayMs).toBeGreaterThanOrEqual(0);
});

test("Drive → ordinateur : détecte un fichier ajouté de l'extérieur", async ({ page }) => {
  await page.goto(URL_LABO);
  await ready(page);
  await page.getByRole("button", { name: "Choisir le dossier" }).click();
  await page.getByRole("button", { name: "Démarrer l'attente" }).click();
  await expect(page.locator("#e3-out")).toContainText("Attente démarrée");
  // Simule l'arrivée d'un fichier synchronisé depuis Drive.
  await page.evaluate(async () => {
    const d = await (await (await (await navigator.storage.getDirectory()).getDirectoryHandle("Mon Drive - IHECS STUDY OS")).getDirectoryHandle("_labo-ihecs")).getDirectoryHandle("entrant");
    const w = await (await d.getFileHandle("photo-du-telephone.jpg", { create: true })).createWritable();
    await w.write("x"); await w.close();
  });
  await expect(page.locator("#e3-out")).toContainText("Reçu après", { timeout: 8000 });
  const r = await report(page);
  expect(r.e3[0].result).toBe("reçu");
  expect(r.e3[0].files[0].name).toBe("photo-du-telephone.jpg");
});

test("modifications simultanées : conflit détecté avant d'écrire, rien n'est écrasé", async ({ page }) => {
  await page.goto(URL_LABO);
  await ready(page);
  await page.getByRole("button", { name: "Choisir le dossier" }).click();
  await page.getByRole("button", { name: "Préparer" }).click();
  await expect(page.locator("#e4-out")).toContainText("Préparé");
  // Une autre source modifie partage.json avant la modification locale.
  await page.evaluate(async () => {
    const d = await (await (await navigator.storage.getDirectory()).getDirectoryHandle("Mon Drive - IHECS STUDY OS")).getDirectoryHandle("_labo-ihecs");
    const w = await (await d.getFileHandle("partage.json")).createWritable();
    await w.write(JSON.stringify({ version: "web" })); await w.close();
  });
  await page.getByRole("button", { name: "Modifier côté ordinateur" }).click();
  await expect(page.locator("#e4-out")).toContainText("Conflit détecté AVANT d'écrire");
  const content = await page.evaluate(async () => {
    const d = await (await (await navigator.storage.getDirectory()).getDirectoryHandle("Mon Drive - IHECS STUDY OS")).getDirectoryHandle("_labo-ihecs");
    return (await (await d.getFileHandle("partage.json")).getFile()).text();
  });
  expect(JSON.parse(content).version).toBe("web");
});

test("modifications simultanées : l'analyse identifie la version gagnante et les copies", async ({ page }) => {
  await page.goto(URL_LABO);
  await ready(page);
  await page.getByRole("button", { name: "Choisir le dossier" }).click();
  await page.getByRole("button", { name: "Préparer" }).click();
  await page.getByRole("button", { name: "Modifier côté ordinateur" }).click();
  await expect(page.locator("#e4-out")).toContainText("ordinateur-2");
  // Simule ce que pourrait faire Drive : version web + copie de conflit.
  await page.evaluate(async () => {
    const d = await (await (await navigator.storage.getDirectory()).getDirectoryHandle("Mon Drive - IHECS STUDY OS")).getDirectoryHandle("_labo-ihecs");
    for (const [n, v] of [["partage.json", "web"], ["partage (Copie de conflit).json", "ordinateur-2"]]) {
      const w = await (await d.getFileHandle(n, { create: true })).createWritable();
      await w.write(JSON.stringify({ version: v })); await w.close();
    }
  });
  await page.getByRole("button", { name: "Analyser" }).click();
  await expect(page.locator("#e4-out")).toContainText("La version web a remplacé le fichier ; une autre copie existe aussi");
  const a = (await report(page)).e4.analyses[0];
  expect(a.externalChange).toBe(true);
  expect(a.extraFiles).toEqual(["partage (Copie de conflit).json"]);
});

test("aucune écriture en dehors de _labo-ihecs", async ({ page }) => {
  await page.goto(URL_LABO);
  await ready(page);
  await page.getByRole("button", { name: "Choisir le dossier" }).click();
  await page.getByRole("button", { name: "Écrire un fichier" }).click();
  await page.getByRole("button", { name: "Préparer" }).click();
  await expect(page.locator("#e4-out")).toContainText("Préparé");
  const top = await page.evaluate(async () => { const out = []; for await (const [n] of (await (await navigator.storage.getDirectory()).getDirectoryHandle("Mon Drive - IHECS STUDY OS")).entries()) out.push(n); return out; });
  expect(top).toEqual(["_labo-ihecs"]);
});

test("s'ouvre aussi par double-clic (file://) avec un contexte sécurisé", async ({ page, browserName }) => {
  test.skip(browserName !== "chromium");
  await page.goto(pathToFileURL(resolve("prototypes/drive/labo-drive.html")).href);
  await ready(page);
  expect(await page.evaluate(() => window.isSecureContext)).toBe(true);
  await expect(page.locator("#diag-pill")).toHaveText("Compatible");
});
