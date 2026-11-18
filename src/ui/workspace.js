// Activation des espaces : démonstration (fixtures, localStorage) ou espace réel (dossier Drive).
// D3 : les deux ne partagent ni contenu ni progression.

import COURS from "../content/cours-integres.js";
import { WORKSPACES, realWorkspace } from "../content/workspaces.js";
import { mergePacks, planImport } from "../data/v2/course-pack.js";
import { ICON_NAMES } from "../core/icons.js";
import { contentFromStructure, newStructure, reviewEntry, validateStructure } from "../data/v2/workspace.js";
import { loadState, saveState } from "../state/store.js";
import { deletePref, deviceId, getPref, setPref } from "../storage/prefs.js";
import { appendReview, createSaver, openWorkspace } from "../storage/real-workspace.js";
import { app, safeStorage } from "./app.js";
import { resetSearchIndex } from "./components/spotlight.js";
import { applyTheme } from "./theme.js";

/** État de l'enregistrement dans Drive, affiché dans l'interface. */
export const sync = { state: "idle", at: null, message: "" };

function reset() {
  app.startupError = null;
  app.real = null;
  app.gate = null;
  app.recordReview = null;
  app.retrySave = null;
  resetSearchIndex();
}

export function activateDemo() {
  reset();
  app.workspace = WORKSPACES.demo;
  app.content = WORKSPACES.demo.content;
  app.storage = safeStorage();
  app.state = loadState(app.storage);
  app.persist = (st) => saveState(app.storage, st);
  Object.assign(sync, { state: "idle", at: null, message: "" });
  applyTheme(app.state.theme);
}

/** Ouvre l'espace réel du dossier (permission déjà accordée). Lève une erreur explicite sinon. */
export async function activateReal(root, onStep) {
  const dev = await deviceId();
  const opened = await openWorkspace(root, { deviceId: dev, now: new Date(), onStep });
  reset();
  const saver = createSaver(root, {
    manifest: opened.manifest, deviceId: dev, stateDoc: opened.stateDoc,
    onStatus: (s) => { Object.assign(sync, s, s.state === "error" ? {} : { message: "" }); app.refreshChrome(); }
  });
  app.workspace = realWorkspace(opened.manifest, root.name);
  app.content = opened.content;
  app.state = opened.uiState;
  app.persist = (st) => saver.save(st);
  app.retrySave = () => saver.retry();
  app.recordReview = async ({ cardId, rating, before, after }) => {
    const entry = reviewEntry({ id: crypto.randomUUID(), cardId, rating, before, after, now: new Date(), deviceId: dev });
    try { await appendReview(root, { deviceId: dev, entry }); }
    catch (e) { Object.assign(sync, { state: "error", at: new Date(), message: "Journal des révisions non enregistré : " + e.message }); app.refreshChrome(); }
  };
  app.real = { root, manifest: opened.manifest, deviceId: dev, folderName: root.name };
  Object.assign(sync, { state: "saved", at: new Date(), message: "" });
  applyTheme(app.state.theme);
  await setPref("realRoot", root);
  await setPref("startWith", "real");
}

export async function switchToDemo() {
  await setPref("startWith", "demo");
  activateDemo();
}

/** Oublie le dossier sur cet ordinateur. Aucun fichier n'est supprimé dans Drive. */
export async function forgetFolder() {
  await deletePref("realRoot");
  await setPref("startWith", hasBuiltin() ? "local" : "demo");
  activateDemo();
}

export async function storedRoot() {
  return getPref("realRoot");
}

/** Espace à ouvrir au démarrage : "demo", "real", "local" ou non défini (= tes cours). */
export async function activeWorkspacePref() {
  return getPref("startWith");
}

/* ---------------- Copie de lecture (téléphone) ----------------
 * Sur téléphone, le site ne peut pas écrire dans le dossier Drive. On y ouvre une
 * COPIE de structure.json choisie dans l'app Fichiers / Google Drive : les cours sont
 * lus tels quels (jamais modifiés), la progression est gardée dans ce navigateur sous
 * une clé propre à l'espace (jamais celle de la démonstration, D3). */

const COPY_PREF = "copyStructure";
const copyKey = (wid) => "ihecs-copie-" + wid;
const keyed = (storage, key) => storage && { getItem: () => storage.getItem(key), setItem: (_, v) => storage.setItem(key, v) };

/** Vérifie le texte d'un structure.json. Renvoie { ok, structure } ou { ok: false, error }. */
export function parseCopy(text) {
  let data;
  try { data = JSON.parse(String(text).replace(/^\uFEFF/, "")); } catch (e) { return { ok: false, error: "Ce fichier n'est pas du JSON lisible." }; }
  if (data && data.kind === "course-pack") return { ok: false, error: "C'est un fichier de cours : sur téléphone, choisis plutôt structure.json dans ton dossier IHECS STUDY OS (ou importe ce fichier sur ordinateur)." };
  const errors = validateStructure(data, null);
  if (errors.length) return { ok: false, error: errors.join(" ") };
  return { ok: true, structure: data };
}

/** Enregistre une copie (dans ce navigateur) et l'ouvre. */
export async function saveCopy(structure, fileName) {
  await setPref(COPY_PREF, { structure, fileName: String(fileName || "structure.json").slice(0, 120), importedAt: new Date().toISOString() });
  await setPref("startWith", "local");
  return activateCopy();
}

export const LOCAL_MANIFEST = Object.freeze({ workspace: { name: "Mon espace" } });

/** Vrai si des cours sont déjà enregistrés dans ce navigateur. */
export async function hasLocal() { const c = await getPref(COPY_PREF); return !!(c && c.structure); }

/**
 * Crée (si besoin) l'espace « dans ce navigateur » et l'ouvre : aucun dossier, aucun cloud.
 * Les cours importés y restent ; le site les affiche directement à chaque ouverture.
 */
// Tests automatisés : sans cours intégrés, pour garder les parcours de démonstration.
const builtin = () => (typeof window !== "undefined" && window.__IHECS_TEST_NO_BUILTIN__ ? [] : COURS);
export const hasBuiltin = () => builtin().length > 0;
const builtinVersion = () => builtin().map((f) => f.name + "@" + f.pack.createdAt).join("|");

/**
 * Ajoute ou met à jour les cours intégrés au site dans l'espace du navigateur.
 * Seules les matières dont le contenu a changé sont remplacées ; tes modifications
 * (dates, crédits, consignes) sont conservées ; une matière que tu as importée
 * toi-même n'est jamais supprimée.
 */
async function syncBuiltin() {
  const files = builtin();
  if (!files.length) return;
  const c = await getPref(COPY_PREF);
  if (c.builtinVersion === builtinVersion()) return;
  const merged = mergePacks(files);
  const first = planImport(c.structure, merged.pack, { now: new Date(), sourceOf: merged.sourceOf, iconNames: ICON_NAMES });
  if (!first.ok) throw new Error("Cours intégrés invalides : " + first.errors.join(" "));
  const plan = first.changed.length ? planImport(c.structure, merged.pack, { replace: first.changed.map((s) => s.id), now: new Date(), sourceOf: merged.sourceOf, iconNames: ICON_NAMES }) : first;
  const res = await saveLocal(plan.nextStructure, c.rev || 0);
  if (!res.ok) throw new Error(res.error);
  await setPref(COPY_PREF, Object.assign({}, await getPref(COPY_PREF), { builtinVersion: builtinVersion() }));
}

export async function openLocal() {
  if (!(await hasLocal())) {
    const now = new Date();
    await setPref(COPY_PREF, { structure: newStructure({ workspaceId: crypto.randomUUID(), now }), source: "local", fileName: "", importedAt: now.toISOString(), rev: 0 });
  }
  await syncBuiltin();
  await setPref("startWith", "local");
  // Demande au navigateur de ne pas effacer ces données pour faire de la place.
  try { if (navigator.storage && navigator.storage.persist) await navigator.storage.persist(); } catch (e) { /* facultatif */ }
  return activateCopy();
}

/** Lit la structure enregistrée dans ce navigateur, avec son numéro de version. */
export async function readLocal() {
  const c = await getPref(COPY_PREF);
  if (!c || !c.structure) throw new Error("Aucun cours n'est enregistré dans ce navigateur.");
  return { data: c.structure, hash: c.rev || 0 };
}

/**
 * Enregistre une nouvelle structure dans ce navigateur, seulement si elle n'a pas changé
 * depuis la lecture (autre onglet). Les 5 versions précédentes sont gardées.
 */
export async function saveLocal(next, expectedRev) {
  const c = await getPref(COPY_PREF);
  if (!c || (c.rev || 0) !== expectedRev) return { ok: false, error: "Tes cours ont changé dans un autre onglet. Rien n'a été écrit : recharge la page et recommence." };
  const backups = ((await getPref("copyBackups")) || []).concat([{ at: new Date().toISOString(), structure: c.structure }]).slice(-5);
  await setPref("copyBackups", backups);
  await setPref(COPY_PREF, Object.assign({}, c, { structure: next, rev: (c.rev || 0) + 1, source: "local", updatedAt: new Date().toISOString() }));
  app.content = contentFromStructure(next, LOCAL_MANIFEST);
  app.workspace = Object.freeze(Object.assign({}, app.workspace, { source: "local", label: "Mon espace" }));
  resetSearchIndex();
  return { ok: true };
}

export async function activateCopy() {
  const c = await getPref(COPY_PREF);
  if (!c || !c.structure) return false;
  reset();
  const wid = c.structure.workspaceId, local = c.source === "local";
  app.workspace = Object.freeze({ id: wid, kind: "copy", source: local ? "local" : "structure", label: local ? "Mon espace" : "Copie", importedAt: c.importedAt, fileName: c.fileName,
    description: local ? "Tes cours, enregistrés dans ce navigateur." : "Copie de tes cours ouverte sur cet appareil." });
  app.content = contentFromStructure(c.structure, LOCAL_MANIFEST);
  app.storage = keyed(safeStorage(), copyKey(wid));
  app.state = loadState(app.storage);
  app.persist = (st) => saveState(app.storage, st);
  Object.assign(sync, { state: "idle", at: null, message: "" });
  applyTheme(app.state.theme);
  return true;
}
