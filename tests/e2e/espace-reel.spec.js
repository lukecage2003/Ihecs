// Espace académique réel relié à un dossier (option A).
// Le dossier Drive est simulé par un sous-dossier du système de fichiers privé du
// navigateur (OPFS, même API). Le fichier testé est IHECS-STUDY-OS.html, servi par
// interception (aucun serveur). Ces tests vérifient l'application, pas Google Drive.
import { test, expect } from "@playwright/test";
import { resolve } from "node:path";

const APP = "https://app.test/IHECS-STUDY-OS.html";
const FOLDER = "IHECS STUDY OS";

test.beforeEach(async ({ page }, info) => {
  await page.addInitScript(() => { window.__IHECS_TEST_NO_BUILTIN__ = true; }); // parcours sans les cours intégrés
  info.errors = [];
  info.external = [];
  page.on("pageerror", (e) => info.errors.push(e.message));
  page.on("console", (m) => { if (m.type() === "error") info.errors.push(m.text()); });
  page.on("request", (r) => { if (!/^(https:\/\/app\.test\/|data:|blob:)/.test(r.url())) info.external.push(r.url()); });
  await page.route("https://app.test/**", (route) => route.fulfill({ path: resolve("IHECS-STUDY-OS.html"), contentType: "text/html; charset=utf-8" }));
  await page.addInitScript((folder) => {
    const pick = async () => (await navigator.storage.getDirectory()).getDirectoryHandle(folder, { create: true });
    window.showDirectoryPicker = pick;
    // Chromium headless plante en relisant une poignée depuis IndexedDB : mémorisation simulée.
    window.__IHECS_TEST_HANDLE_STORE__ = {
      get: async () => (sessionStorage.getItem("root") ? pick() : undefined),
      set: async () => sessionStorage.setItem("root", "1"),
      clear: async () => sessionStorage.removeItem("root")
    };
    if (sessionStorage.getItem("perm") === "prompt") {
      const proto = Object.getPrototypeOf(FileSystemDirectoryHandle.prototype) && FileSystemDirectoryHandle.prototype;
      proto.queryPermission = async () => "prompt";
      proto.requestPermission = async () => { sessionStorage.removeItem("perm"); return "granted"; };
    }
  }, FOLDER);
});
test.afterEach(async ({}, info) => {
  expect(info.errors, "erreurs JS ou CSP").toEqual([]);
  expect(info.external, "requêtes externes").toEqual([]);
});

const ready = (page) => expect(page.locator("body")).toHaveAttribute("data-ready", "1");

/** Opérations sur le dossier simulé (sans eval : la CSP de l'application l'interdit, à raison). */
const folderOp = (page, op, a, b) => page.evaluate(async ([folder, op, a, b]) => {
  const dir = await (await navigator.storage.getDirectory()).getDirectoryHandle(folder, { create: true });
  const sub = async (path) => { let d = dir; for (const p of path.split("/").filter(Boolean)) d = await d.getDirectoryHandle(p); return d; };
  if (op === "list") { const d = await sub(a || ""); const out = []; for await (const [n] of d.entries()) out.push(n); return out.sort(); }
  const parts = a.split("/"); const d = await sub(parts.slice(0, -1).join("/")); const name = parts.at(-1);
  if (op === "read") return (await (await d.getFileHandle(name)).getFile()).text();
  if (op === "write") { const w = await (await d.getFileHandle(name, { create: true })).createWritable(); await w.write(b); await w.close(); return true; }
  throw new Error("opération inconnue " + op);
}, [FOLDER, op, a, b]);
const list = (page, path) => folderOp(page, "list", path);
const read = (page, path) => folderOp(page, "read", path);
const write = (page, path, text) => folderOp(page, "write", path, text);

async function createSpace(page) {
  await page.goto(APP + "#parametres");
  await ready(page);
  await page.getByRole("button", { name: "Choisir mon dossier Drive" }).click();
  await page.getByRole("button", { name: "Créer mon espace" }).click();
  await expect(page.locator("#ws-body")).toContainText("Ton espace a été créé");
}

test("création de l'espace : fichiers valides, vide, sans cours d'exemple", async ({ page }) => {
  await createSpace(page);
  const names = await list(page);
  expect(names).toEqual(["appareils", "ihecs-study-os.json", "structure.json"]);
  const manifest = JSON.parse(await read(page, "ihecs-study-os.json"));
  expect(manifest.format).toBe("ihecs-study-os");
  expect(manifest.schemaVersion).toBe(2);
  expect(manifest.workspace.kind).toBe("real");
  const devices = await list(page, "appareils");
  expect(devices.length).toBe(1);
  const state = JSON.parse(await read(page, "appareils/" + devices[0] + "/etat.json"));
  expect(state.workspace.id).toBe(manifest.workspace.id);
  await page.goto(APP + "#accueil");
  await expect(page.getByRole("heading", { name: "Ton espace est prêt" })).toBeVisible();
  await expect(page.locator("#sidebar")).toContainText("Mon espace");
  await expect(page.getByText("Sociologie de la communication")).toHaveCount(0);
  await expect(page.getByText("Mode démonstration.")).toHaveCount(0);
});

test("les fichiers déjà présents dans le dossier ne sont ni modifiés ni supprimés", async ({ page }) => {
  await page.goto(APP + "#parametres");
  await ready(page);
  await write(page, "note-perso.txt", "à garder");
  await page.getByRole("button", { name: "Choisir mon dossier Drive" }).click();
  await expect(page.locator("#ws-body")).toContainText("note-perso.txt");
  await page.getByRole("button", { name: "Créer mon espace" }).click();
  await expect(page.locator("#ws-body")).toContainText("Ton espace a été créé");
  expect(await read(page, "note-perso.txt")).toBe("à garder");
});

test("la progression est enregistrée dans le dossier et retrouvée au rechargement", async ({ page }) => {
  await createSpace(page);
  await page.locator("#set-name").fill("Zoé");
  await expect(page.locator("#sync-status")).toContainText("Enregistré dans Drive");
  await page.reload();
  await ready(page);
  // Au démarrage, rien n'est lu dans le dossier avant le clic.
  await expect(page.getByRole("heading", { name: "Ouvrir ton espace académique" })).toBeVisible();
  await page.getByRole("button", { name: "Ouvrir mon espace" }).click();
  await expect(page.locator("#sidebar")).toContainText("Mon espace");
  await page.evaluate(() => { location.hash = "#accueil"; });
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Zoé");
  const dev = (await list(page, "appareils"))[0];
  const state = JSON.parse(await read(page, "appareils/" + dev + "/etat.json"));
  expect(state.settings.firstName).toBe("Zoé");
});

test("espaces séparés : la démo ne voit pas l'espace réel et inversement", async ({ page }) => {
  await createSpace(page);
  await page.locator("#set-name").fill("Prénom réel");
  await expect(page.locator("#sync-status")).toContainText("Enregistré dans Drive");
  await page.getByRole("button", { name: "Passer en démonstration" }).click();
  await page.goto(APP + "#accueil");
  await expect(page.getByText("Mode démonstration.")).toBeVisible();
  await expect(page.getByRole("heading", { level: 1 })).not.toContainText("Prénom réel");
  await expect(page.locator(".subject-card", { hasText: "Sociologie de la communication" })).toBeVisible();
});

test("une sauvegarde de la démo est refusée dans l'espace réel", async ({ page }) => {
  await page.goto(APP + "#parametres");
  await ready(page);
  const demoCode = await page.evaluate(() => btoa(JSON.stringify({ lu: { "socio|c1": true }, cartes: {}, quiz: {}, plan: {}, journal: {} })));
  await page.getByRole("button", { name: "Choisir mon dossier Drive" }).click();
  await page.getByRole("button", { name: "Créer mon espace" }).click();
  await expect(page.locator("#ws-body")).toContainText("Ton espace a été créé");
  await page.locator("#imp-text").fill(demoCode);
  await page.getByRole("button", { name: "Restaurer" }).click();
  await expect(page.locator("#toast")).toContainText("elle vient de la démonstration");
});

test("un espace existant est rouvert sans être recréé ni écrasé", async ({ page }) => {
  await createSpace(page);
  const before = await read(page, "ihecs-study-os.json");
  await page.getByRole("button", { name: "Oublier ce dossier" }).click();
  await page.getByRole("button", { name: "Oublier", exact: true }).click();
  await expect(page.getByRole("button", { name: "Choisir mon dossier Drive" })).toBeVisible();
  expect(await list(page)).toContain("ihecs-study-os.json");
  await page.getByRole("button", { name: "Choisir mon dossier Drive" }).click();
  await expect(page.locator("#ws-body")).toContainText("Dossier Drive");
  expect(await read(page, "ihecs-study-os.json")).toBe(before);
});

test("un manifeste illisible est signalé et rien n'est modifié", async ({ page }) => {
  await page.goto(APP + "#parametres");
  await ready(page);
  await write(page, "ihecs-study-os.json", "{pas du json");
  await page.getByRole("button", { name: "Choisir mon dossier Drive" }).click();
  await expect(page.locator("#ws-body")).toContainText("inutilisable");
  expect(await list(page)).toEqual(["ihecs-study-os.json"]);
  expect(await read(page, "ihecs-study-os.json")).toBe("{pas du json");
});

test("au redémarrage sans autorisation : écran d'accès, pas de démo à la place", async ({ page }) => {
  await createSpace(page);
  await page.evaluate(() => sessionStorage.setItem("perm", "prompt"));
  await page.reload();
  await ready(page);
  await expect(page.getByRole("heading", { name: "Ouvrir ton espace académique" })).toBeVisible();
  await expect(page.getByText("Sociologie de la communication")).toHaveCount(0);
  await page.getByRole("button", { name: "Ouvrir mon espace" }).click();
  // On reste sur la page où l'on était (Réglages), avec l'espace réel ouvert.
  await expect(page.locator("#ws-body")).toContainText("Dossier Drive");
  await expect(page.locator("#sidebar")).toContainText("Mon espace");
});

test("fiches avec identifiant stable : révision enregistrée dans l'état et dans le journal mensuel", async ({ page }) => {
  await createSpace(page);
  // Ajoute une matière de test directement dans structure.json (l'éditeur arrive à l'étape suivante).
  const st = JSON.parse(await read(page, "structure.json"));
  st.subjects.push({ id: "test", name: "Matière de test", color: "#0a84ff", icon: "book", chapters: [{ id: "c1", titre: "Chapitre test", resume: "Texte.", fiches: [{ id: "card-0001-test", q: "Question ?", r: "Réponse." }], quiz: [] }] });
  await write(page, "structure.json", JSON.stringify(st));
  await page.reload();
  await ready(page);
  await page.getByRole("button", { name: "Ouvrir mon espace" }).click();
  await expect(page.locator("#sidebar")).toContainText("Matière de test");
  await page.evaluate(() => { location.hash = "#c-test-c1-fiches"; });
  await page.locator("#fc").click();
  await page.getByRole("button", { name: /^Bien/ }).click();
  await expect(page.locator("#sync-status")).toContainText("Enregistré dans Drive");
  const dev = (await list(page, "appareils"))[0];
  const files = await list(page, "appareils/" + dev);
  const logName = files.find((f) => /^revisions-\d{4}-\d{2}\.jsonl$/.test(f));
  expect(logName).toBeTruthy();
  const lines = (await read(page, "appareils/" + dev + "/" + logName)).trim().split("\n").map((l) => JSON.parse(l));
  expect(lines.length).toBe(1);
  expect(lines[0]).toMatchObject({ cardId: "card-0001-test", rating: 3, scheduler: "leitner", before: { box: 0 }, after: { box: 1 } });
  await expect.poll(async () => JSON.parse(await read(page, "appareils/" + dev + "/etat.json")).progress.cards["card-0001-test"]).toMatchObject({ box: 1, origin: "app" });
});
