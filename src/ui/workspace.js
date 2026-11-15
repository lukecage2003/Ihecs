// Activation des espaces : démonstration (fixtures, localStorage) ou espace réel (dossier Drive).
// D3 : les deux ne partagent ni contenu ni progression.

import { WORKSPACES, realWorkspace } from "../content/workspaces.js";
import { reviewEntry } from "../data/v2/workspace.js";
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
