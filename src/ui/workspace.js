// Activation des espaces : démonstration (fixtures, localStorage) ou espace réel (dossier Drive).
// D3 : les deux ne partagent ni contenu ni progression.

import { WORKSPACES, realWorkspace } from "../content/workspaces.js";
import { contentFromStructure, reviewEntry, validateStructure } from "../data/v2/workspace.js";
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
export async function activateReal(root) {
  const dev = await deviceId();
  const opened = await openWorkspace(root, { deviceId: dev, now: new Date() });
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
  await setPref("activeWorkspace", "real");
}

export async function switchToDemo() {
  await setPref("activeWorkspace", "demo");
  activateDemo();
}

/** Oublie le dossier sur cet ordinateur. Aucun fichier n'est supprimé dans Drive. */
export async function forgetFolder() {
  await deletePref("realRoot");
  await setPref("activeWorkspace", "demo");
  activateDemo();
}

export async function storedRoot() {
  return getPref("realRoot");
}

export async function activeWorkspacePref() {
  return getPref("activeWorkspace");
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
  await setPref("activeWorkspace", "copy");
  return activateCopy();
}

export async function activateCopy() {
  const c = await getPref(COPY_PREF);
  if (!c || !c.structure) return false;
  reset();
  const wid = c.structure.workspaceId;
  app.workspace = Object.freeze({ id: wid, kind: "copy", label: "Copie", importedAt: c.importedAt, fileName: c.fileName, description: "Copie de tes cours ouverte sur cet appareil." });
  app.content = contentFromStructure(c.structure, { workspace: { name: "Mon espace" } });
  app.storage = keyed(safeStorage(), copyKey(wid));
  app.state = loadState(app.storage);
  app.persist = (st) => saveState(app.storage, st);
  Object.assign(sync, { state: "idle", at: null, message: "" });
  applyTheme(app.state.theme);
  return true;
}
