// Import d'un fichier de cours dans l'espace réel (dossier simulé par OPFS, voir espace-reel.spec.js).
import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const APP = "https://app.test/IHECS-STUDY-OS.html";
const FOLDER = "IHECS STUDY OS";
const PACK_PATH = resolve("fixtures/packs/exemple-cours.json");
const PACK_TEXT = readFileSync(PACK_PATH, "utf8");

test.beforeEach(async ({ page }, info) => {
  info.errors = [];
  info.external = [];
  page.on("pageerror", (e) => info.errors.push(e.message));
  page.on("console", (m) => { if (m.type() === "error") info.errors.push(m.text()); });
  page.on("request", (r) => { if (!/^(https:\/\/app\.test\/|data:|blob:)/.test(r.url())) info.external.push(r.url()); });
  await page.route("https://app.test/**", (route) => route.fulfill({ path: resolve("IHECS-STUDY-OS.html"), contentType: "text/html; charset=utf-8" }));
  await page.addInitScript((folder) => {
    const pick = async () => (await navigator.storage.getDirectory()).getDirectoryHandle(folder, { create: true });
    window.showDirectoryPicker = pick;
    window.__IHECS_TEST_HANDLE_STORE__ = {
      get: async () => (sessionStorage.getItem("root") ? pick() : undefined),
      set: async () => sessionStorage.setItem("root", "1"),
      clear: async () => sessionStorage.removeItem("root")
    };
  }, FOLDER);
});
test.afterEach(async ({}, info) => {
  expect(info.errors, "erreurs JS ou CSP").toEqual([]);
  expect(info.external, "requêtes externes").toEqual([]);
});

const folderOp = (page, op, a, b) => page.evaluate(async ([folder, op, a, b]) => {
  const dir = await (await navigator.storage.getDirectory()).getDirectoryHandle(folder, { create: true });
  const sub = async (path, create) => { let d = dir; for (const p of path.split("/").filter(Boolean)) d = await d.getDirectoryHandle(p, { create }); return d; };
  if (op === "list") { try { const d = await sub(a || "", false); const out = []; for await (const [n] of d.entries()) out.push(n); return out.sort(); } catch { return null; } }
  const parts = a.split("/"); const d = await sub(parts.slice(0, -1).join("/"), op === "write"); const name = parts.at(-1);
  if (op === "read") return (await (await d.getFileHandle(name)).getFile()).text();
  if (op === "write") { const w = await (await d.getFileHandle(name, { create: true })).createWritable(); await w.write(b); await w.close(); return true; }
}, [FOLDER, op, a, b]);
const list = (page, p) => folderOp(page, "list", p);
const read = (page, p) => folderOp(page, "read", p);
const write = (page, p, t) => folderOp(page, "write", p, t);
const ready = (page) => expect(page.locator("body")).toHaveAttribute("data-ready", "1");

async function createSpace(page) {
  await page.goto(APP + "#parametres");
  await ready(page);
  await page.getByRole("button", { name: "Choisir mon dossier Drive" }).click();
  await page.getByRole("button", { name: "Créer mon espace" }).click();
  await expect(page.locator("#ws-body")).toContainText("Ton espace a été créé");
}

async function importPack(page, file = PACK_PATH) {
  await page.evaluate(() => { location.hash = "#importer"; });
  await expect(page.getByRole("heading", { name: "Importer mes cours" })).toBeVisible();
  await page.locator("#pack-file").setInputFiles(file);
  await expect(page.locator("#imp-preview")).toContainText("Aperçu");
}

test("démonstration : l'import est impossible (D3)", async ({ page }) => {
  await page.goto(APP + "#importer");
  await ready(page);
  await expect(page.getByText("Ton espace réel n'est pas ouvert")).toBeVisible();
});

test("import complet : aperçu, écriture, archive, sauvegarde, cours visibles", async ({ page }) => {
  await createSpace(page);
  await importPack(page);
  await expect(page.locator("#imp-preview")).toContainText("5 matière(s) à ajouter");
  await expect(page.locator("#imp-preview")).toContainText("42 fiches");
  expect(await list(page, "imports"), "rien n'est écrit pendant l'aperçu").toBeNull();
  await page.getByRole("button", { name: "Importer", exact: true }).click();
  await expect(page.locator("#imp-preview")).toContainText("Import terminé");
  const structure = JSON.parse(await read(page, "structure.json"));
  expect(structure.subjects.map((s) => s.id)).toEqual(JSON.parse(PACK_TEXT).subjects.map((s) => s.id));
  const archives = await list(page, "imports");
  expect(archives.length).toBe(1);
  expect(await read(page, "imports/" + archives[0])).toBe(PACK_TEXT);
  expect((await list(page, "sauvegardes")).length).toBe(1);
  await page.evaluate(() => { location.hash = "#accueil"; });
  await expect(page.locator(".subject-card", { hasText: "Sociologie de la communication (exemple)" })).toBeVisible();
  await page.evaluate(() => { location.hash = "#m-exsocio"; });
  await expect(page.getByText("Les modèles de la communication")).toBeVisible();
});

test("réimport : matières déjà présentes ignorées, bouton désactivé", async ({ page }) => {
  await createSpace(page);
  await importPack(page);
  await page.getByRole("button", { name: "Importer", exact: true }).click();
  await expect(page.locator("#imp-preview")).toContainText("Import terminé");
  await importPack(page);
  await expect(page.locator("#imp-preview")).toContainText("0 matière(s) à ajouter");
  await expect(page.locator("#imp-preview")).toContainText("Déjà à jour");
  await expect(page.getByRole("button", { name: "Importer", exact: true })).toBeDisabled();
});

test("remplacement : la progression liée aux identifiants est conservée", async ({ page }) => {
  await createSpace(page);
  await importPack(page);
  await page.getByRole("button", { name: "Importer", exact: true }).click();
  await expect(page.locator("#imp-preview")).toContainText("Import terminé");
  await page.evaluate(() => { location.hash = "#c-exsocio-c1-resume"; });
  await page.getByRole("button", { name: "Marquer comme lu" }).click();
  await expect(page.locator("#sync-status")).toContainText("Enregistré dans Drive");
  const updated = JSON.parse(PACK_TEXT);
  updated.subjects[0].chapitres[0].titre = "Les modèles de la communication (version corrigée)";
  await importPack(page, { name: "cours-v2.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify(updated)) });
  await page.locator('[data-replace="exsocio"]').check();
  await expect(page.locator("#imp-preview")).toContainText("1 à mettre à jour");
  await page.getByRole("button", { name: "Importer", exact: true }).click();
  await expect(page.locator("#imp-preview")).toContainText("Import terminé");
  await page.evaluate(() => { location.hash = "#c-exsocio-c1-resume"; });
  await expect(page.getByRole("heading", { name: "Les modèles de la communication (version corrigée)" })).toBeVisible();
  await expect(page.getByText("Chapitre lu")).toBeVisible();
  expect((await list(page, "sauvegardes")).length).toBe(2);
});

test("fichier invalide : erreurs affichées, rien n'est écrit", async ({ page }) => {
  await createSpace(page);
  const before = await read(page, "structure.json");
  const bad = JSON.parse(PACK_TEXT);
  delete bad.subjects[0].chapitres[0].fiches[0].id;
  bad.subjects[1].couleur = "rouge";
  await page.evaluate(() => { location.hash = "#importer"; });
  await page.locator("#pack-file").setInputFiles({ name: "mauvais.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify(bad)) });
  await expect(page.locator("#imp-preview")).toContainText("Ce fichier ne peut pas être importé");
  await expect(page.locator("#imp-preview")).toContainText("identifiant stable manquant");
  await expect(page.locator("#imp-preview")).toContainText("couleur invalide");
  await expect(page.locator("#imp-preview")).toContainText("Rien n'a été modifié");
  expect(await read(page, "structure.json")).toBe(before);
  expect(await list(page, "imports")).toBeNull();
  await page.locator("#pack-file").setInputFiles({ name: "pas-json.json", mimeType: "application/json", buffer: Buffer.from("{oups") });
  await expect(page.locator("#imp-preview")).toContainText("n'est pas du JSON valide");
});

test("structure modifiée entre l'aperçu et l'import : rien n'est écrit", async ({ page }) => {
  await createSpace(page);
  await importPack(page);
  const changed = JSON.parse(await read(page, "structure.json"));
  changed.updatedAt = new Date().toISOString();
  const changedText = JSON.stringify(changed);
  await write(page, "structure.json", changedText);
  await page.getByRole("button", { name: "Importer", exact: true }).click();
  await expect(page.locator("#imp-preview")).toContainText("a changé depuis l'aperçu");
  expect(await read(page, "structure.json")).toBe(changedText);
  expect(await list(page, "imports")).toBeNull();
  expect(await list(page, "sauvegardes")).toBeNull();
});

test("documents : ouverts depuis le dossier, fichier manquant signalé", async ({ page }) => {
  await createSpace(page);
  await importPack(page);
  await page.getByRole("button", { name: "Importer", exact: true }).click();
  await expect(page.locator("#imp-preview")).toContainText("Import terminé");
  await page.evaluate(() => { location.hash = "#m-exsocio"; });
  await page.getByRole("button", { name: /Slides du chapitre 1/ }).click();
  await expect(page.locator("#toast")).toContainText("Fichier introuvable dans ton dossier : cours/socio/chapitre-1.pdf");
  await write(page, "cours/socio/chapitre-1.pdf", "%PDF-1.4 exemple");
  // Chromium sans interface n'affiche pas les PDF : on vérifie que c'est bien le fichier du dossier qui est ouvert.
  await page.evaluate(() => { const orig = URL.createObjectURL; URL.createObjectURL = (b) => { window.__lastBlob = { name: b.name, size: b.size }; return orig(b); }; });
  const popup = page.waitForEvent("popup");
  await page.getByRole("button", { name: /Slides du chapitre 1/ }).click();
  await popup;
  expect(await page.evaluate(() => window.__lastBlob)).toEqual({ name: "chapitre-1.pdf", size: "%PDF-1.4 exemple".length });
});

test("examens sans date : listés à part avec format, crédits et consignes", async ({ page }) => {
  const pack = {
    format: "ihecs-study-os", kind: "course-pack", schemaVersion: 2, title: "Examen sans date (exemple)", createdAt: "2026-11-16T10:00:00.000Z",
    source: { kind: "manual", note: "test" },
    subjects: [{
      id: "exnodate", nom: "Matière sans date (exemple)", prof: "Prof. Exemple", credits: 5, quadrimestre: "Q1", couleur: "#30d158", icone: "book",
      examen: { type: "Écrit : QCM", duree: "1 h 30", consignes: ["Session de janvier, date à venir."] },
      documents: [],
      chapitres: [{ id: "c1", titre: "Chapitre exemple", duree: 10, resume: "Résumé.", pointsCles: [], definitions: [], fiches: [{ id: "card:exnodate:c1:001", q: "Q ?", r: "R." }], quiz: [], sources: [] }]
    }]
  };
  await createSpace(page);
  await page.evaluate(() => { location.hash = "#importer"; });
  await page.locator("#pack-file").setInputFiles({ name: "sans-date.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify(pack)) });
  await expect(page.locator("#imp-preview")).toContainText("Aperçu");
  await page.getByRole("button", { name: "Importer", exact: true }).click();
  await expect(page.locator("#imp-preview")).toContainText("Import terminé");
  await page.evaluate(() => { location.hash = "#examens"; });
  await expect(page.getByRole("heading", { name: "Date à confirmer" })).toBeVisible();
  const row = page.locator(".exam-row", { hasText: "Matière sans date (exemple)" });
  await expect(row).toContainText("Écrit : QCM");
  await expect(row).toContainText("5 ECTS");
  await row.locator("summary").click();
  await expect(row).toContainText("Session de janvier, date à venir.");
});

test("plusieurs fichiers : un seul aperçu, mises à jour cochées, chaque fichier archivé", async ({ page }) => {
  const base = JSON.parse(PACK_TEXT);
  const a = Object.assign({}, base, { subjects: base.subjects.slice(0, 2) });
  await createSpace(page);
  await importPack(page, { name: "a.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify(a)) });
  await page.getByRole("button", { name: "Importer", exact: true }).click();
  await expect(page.locator("#imp-preview")).toContainText("Import terminé");
  const a2 = JSON.parse(JSON.stringify(a));
  a2.subjects[0].chapitres[0].titre = "Titre mis à jour";
  const b = Object.assign({}, base, { subjects: base.subjects.slice(2, 4) });
  await page.locator("#pack-file").setInputFiles([
    { name: "a-v2.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify(a2)) },
    { name: "b.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify(b)) }
  ]);
  const pv = page.locator("#imp-preview");
  await expect(pv).toContainText("2 matière(s) à ajouter · 1 à mettre à jour · 1 inchangée(s)");
  await expect(page.locator('[data-replace="' + a.subjects[0].id + '"]')).toBeChecked();
  await expect(pv).toContainText("Déjà à jour");
  await page.getByRole("button", { name: "Importer", exact: true }).click();
  await expect(pv).toContainText("Fichiers archivés");
  expect((await list(page, "imports")).length).toBe(3);
  const st = JSON.parse(await read(page, "structure.json"));
  expect(st.subjects.map((s) => s.id)).toEqual(base.subjects.slice(0, 4).map((s) => s.id));
  expect(st.subjects[0].chapitres[0].titre).toBe("Titre mis à jour");
  expect(st.subjects[2].importedFrom.file).toBe("b.json");
});

test("modifier l'examen dans le site : enregistré avec sauvegarde, gardé au réimport", async ({ page }) => {
  const pack = JSON.parse(PACK_TEXT);
  const id = pack.subjects[0].id;
  await createSpace(page);
  await importPack(page);
  await page.getByRole("button", { name: "Importer", exact: true }).click();
  await expect(page.locator("#imp-preview")).toContainText("Import terminé");
  await page.evaluate((id) => { location.hash = "#m-" + id; }, id);
  await page.getByRole("button", { name: "Modifier" }).click();
  await page.locator("#ed-date").fill("2027-01-14T13:30");
  await page.locator("#ed-lieu").fill("Auditoire Delvaux");
  await page.locator("#ed-credits").fill("4");
  await page.locator("#ed-consignes").fill("Apporter la carte étudiant\nPas de téléphone");
  await page.getByRole("button", { name: "Enregistrer" }).click();
  const card = page.locator("#exam-card");
  await expect(card).toContainText("Auditoire Delvaux");
  await expect(card).toContainText("Pas de téléphone");
  await expect(page.locator(".subject-hero")).toContainText("4 ECTS");
  const st = JSON.parse(await read(page, "structure.json"));
  expect(st.subjects[0].examen.date).toBe("2027-01-14T13:30");
  expect(st.subjects[0].userEdits.credits).toBe(4);
  expect((await list(page, "sauvegardes")).length).toBe(2);
  // Erreur de saisie : rien n'est écrit
  await page.getByRole("button", { name: "Modifier" }).click();
  await page.locator("#ed-credits").fill("99");
  await page.getByRole("button", { name: "Enregistrer" }).click();
  await expect(page.locator("#ed-err")).toContainText("Crédits");
  await page.getByRole("button", { name: "Annuler" }).click();
  // Réimport du même fichier : déjà à jour, modifications conservées
  await importPack(page);
  await expect(page.locator("#imp-preview")).toContainText("Tout est déjà à jour");
  await page.evaluate(() => { location.hash = "#examens"; });
  await expect(page.locator(".timeline").first()).toContainText("Auditoire Delvaux");
});

test("dossier Drive qui ne répond plus : le site s'ouvre quand même, étape affichée, démonstration possible", async ({ page }) => {
  await createSpace(page);
  // Au prochain chargement, toute lecture de fichier dans le dossier reste en attente.
  await page.addInitScript(() => {
    if (sessionStorage.getItem("hang") !== "1") return;
    FileSystemDirectoryHandle.prototype.getFileHandle = () => new Promise(() => {});
  });
  await page.evaluate(() => sessionStorage.setItem("hang", "1"));
  await page.clock.install();
  await page.reload();
  // Le site s'ouvre sans lire le dossier : pas de blocage au démarrage.
  await expect(page.locator("body")).toHaveAttribute("data-ready", "1");
  await page.getByRole("button", { name: "Ouvrir mon espace" }).click();
  await expect(page.locator("#gate-msg")).toContainText("Ouverture");
  await page.clock.runFor(9000);
  await expect(page.locator("#gate-msg")).toContainText("Ça prend du temps");
  await expect(page.locator("#gate-msg")).toContainText("ihecs-study-os.json");
  await page.evaluate(() => sessionStorage.setItem("hang", "0"));
  await page.getByRole("button", { name: "Continuer en démonstration" }).click();
  await expect(page.locator("body")).toHaveAttribute("data-ready", "1");
  await expect(page.locator("#view")).toContainText("Mode démonstration");
});

test("écran d'ouverture : « sans dossier » mène à l'import dans ce navigateur", async ({ page }) => {
  await createSpace(page);
  await page.reload();
  await ready(page);
  await page.getByRole("button", { name: "Sans dossier : mes cours dans ce navigateur" }).click();
  await expect(page.getByRole("heading", { name: "Importer mes cours" })).toBeVisible();
  await expect(page.locator("#pack-file")).toBeAttached();
});
