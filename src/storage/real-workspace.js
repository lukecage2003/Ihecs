// Ouverture, création et enregistrement de l'espace académique réel dans le dossier Drive.

import { DEVICES_DIR, MANIFEST_FILE, STATE_FILE, STRUCTURE_FILE, contentFromStructure, emptyUiState, newManifest, newStructure, reviewLogFile, uiStateToV2, v2ToUiState, validateDeviceState, validateManifest, validateStructure } from "../data/v2/workspace.js";
import { appendLine, createJsonIfAbsent, listNames, readJson, subdir, writeIfUnchanged, writeJson, writeNewFile } from "./folder.js";

/**
 * Examine un dossier sans rien y écrire.
 * @returns {{status: "existing", manifest} | {status: "empty", names} | {status: "invalid", errors}}
 */
export async function inspectFolder(root) {
  const m = await readJson(root, MANIFEST_FILE);
  if (!m.exists) return { status: "empty", names: await listNames(root) };
  if (m.error) return { status: "invalid", errors: [m.error] };
  const errors = validateManifest(m.data);
  return errors.length ? { status: "invalid", errors } : { status: "existing", manifest: m.data };
}

/**
 * Crée un espace dans un dossier qui n'en contient pas. N'écrase jamais rien :
 * si un manifeste apparaît entre-temps (synchronisation), la création s'arrête.
 * Le manifeste est écrit en dernier : sans lui, le dossier n'est pas un espace.
 */
export async function createWorkspace(root, { deviceId, now }) {
  const again = await inspectFolder(root);
  if (again.status !== "empty") throw new Error("Le dossier contient déjà un espace ou un fichier inattendu : création annulée.");
  const manifest = newManifest({ workspaceId: crypto.randomUUID(), deviceId, now });
  if (!(await createJsonIfAbsent(root, STRUCTURE_FILE, newStructure({ workspaceId: manifest.workspace.id, now })))) {
    throw new Error("Un fichier structure.json existe déjà sans manifeste : création annulée, rien n'a été modifié.");
  }
  const dev = await subdir(root, [DEVICES_DIR, deviceId], true);
  await createJsonIfAbsent(dev, STATE_FILE, uiStateToV2(emptyUiState(), { workspace: manifest.workspace, now }));
  if (!(await createJsonIfAbsent(root, MANIFEST_FILE, manifest))) throw new Error("Un manifeste est apparu pendant la création : rien n'a été écrasé.");
  return manifest;
}

/**
 * Ouvre un espace existant et charge la progression de cet appareil.
 * @returns {{manifest, structure, content, uiState, stateDoc}}
 */
export async function openWorkspace(root, { deviceId, now, onStep }) {
  const step = (t) => { if (onStep) onStep(t); };
  step("lecture de ihecs-study-os.json");
  const info = await inspectFolder(root);
  if (info.status !== "existing") throw new Error(info.status === "empty" ? "Ce dossier ne contient pas d'espace IHECS STUDY OS." : info.errors.join(" "));
  const manifest = info.manifest;
  step("lecture de structure.json");
  const s = await readJson(root, STRUCTURE_FILE);
  if (!s.exists) throw new Error("structure.json est introuvable. Si tu viens de créer l'espace sur un autre ordinateur, attends la fin de la synchronisation Drive puis réessaie.");
  if (s.error) throw new Error(s.error);
  const sErr = validateStructure(s.data, manifest.workspace.id);
  if (sErr.length) throw new Error(sErr.join(" "));
  step("lecture de ta progression (dossier appareils/)");
  const dev = await subdir(root, [DEVICES_DIR, deviceId], true);
  let st = await readJson(dev, STATE_FILE);
  if (!st.exists) {
    // Nouvel appareil : il démarre avec son propre fichier, sans toucher à ceux des autres.
    await createJsonIfAbsent(dev, STATE_FILE, uiStateToV2(emptyUiState(), { workspace: manifest.workspace, now }));
    st = await readJson(dev, STATE_FILE);
  }
  if (st.error) throw new Error(st.error);
  const stErr = validateDeviceState(st.data, manifest.workspace.id);
  if (stErr.length) throw new Error("Progression de cet appareil invalide : " + stErr.join(" "));
  return { manifest, structure: s.data, content: contentFromStructure(s.data, manifest), uiState: v2ToUiState(st.data), stateDoc: st.data };
}

/**
 * File d'enregistrement : écrit l'état de cet appareil, une écriture à la fois,
 * en regroupant les demandes rapprochées. Les échecs sont signalés, jamais ignorés.
 */
export function createSaver(root, { manifest, deviceId, stateDoc, onStatus }) {
  let prev = stateDoc, pending = null, running = false;
  const status = (s, extra) => onStatus && onStatus(Object.assign({ state: s, at: new Date() }, extra || {}));
  async function run() {
    if (running) return;
    running = true;
    while (pending) {
      const ui = pending; pending = null;
      status("saving");
      try {
        const doc = uiStateToV2(ui, { workspace: manifest.workspace, now: new Date(), prevDoc: prev });
        const errors = validateDeviceState(doc, manifest.workspace.id);
        if (errors.length) throw new Error("Document invalide, non enregistré : " + errors.join(" "));
        await writeJson(await subdir(root, [DEVICES_DIR, deviceId], true), STATE_FILE, doc);
        prev = doc;
        if (!pending) status("saved");
      } catch (e) {
        pending = pending || ui; // on garde la dernière version pour réessayer
        status("error", { message: (e && e.message) || String(e) });
        break;
      }
    }
    running = false;
  }
  return {
    save(ui) { pending = JSON.parse(JSON.stringify(ui)); run(); return true; },
    retry() { run(); },
    hasPending: () => !!pending || running
  };
}

/** Ajoute une révision au journal mensuel de cet appareil (ajout seul). */
export async function appendReview(root, { deviceId, entry }) {
  const dev = await subdir(root, [DEVICES_DIR, deviceId], true);
  await appendLine(dev, reviewLogFile(new Date(entry.at)), JSON.stringify(entry));
}


/** Lit structure.json avec son empreinte (pour l'écriture vérifiée). */
export async function readStructure(root, workspaceId) {
  const s = await readJson(root, STRUCTURE_FILE);
  if (!s.exists) throw new Error("structure.json est introuvable.");
  if (s.error) throw new Error(s.error);
  const errors = validateStructure(s.data, workspaceId);
  if (errors.length) throw new Error(errors.join(" "));
  return { data: s.data, hash: s.hash };
}

const stamp = (d) => d.toISOString().replace(/[:.]/g, "-").slice(0, 19);

/**
 * Applique un import planifié. Dans l'ordre :
 *  1. archive le fichier de cours tel quel dans imports/ ;
 *  2. sauvegarde la structure actuelle dans sauvegardes/ ;
 *  3. écrit la nouvelle structure SEULEMENT si structure.json n'a pas changé depuis l'aperçu.
 * Rien n'est jamais supprimé ni remplacé sans copie.
 */
export async function applyImport(root, { plan, expectedHash, packText, sourceName, files, now }) {
  const current = await readJson(root, STRUCTURE_FILE);
  if (!current.exists || current.hash !== expectedHash) {
    return { ok: false, error: "structure.json a changé depuis l'aperçu (synchronisation Drive ou autre fenêtre). Rien n'a été écrit : relance l'aperçu." };
  }
  // Chaque fichier choisi est archivé tel quel (plusieurs fichiers possibles).
  const list = files && files.length ? files : [{ name: sourceName, text: packText }];
  const dir = await subdir(root, ["imports"], true);
  const names = [];
  for (const f of list) names.push("imports/" + await writeNewFile(dir, stamp(now) + " " + (f.name || "cours.json").replace(/[\\/]/g, "_"), f.text));
  const archived = names.join(", ");
  const backup = await writeNewFile(await subdir(root, ["sauvegardes"], true), "structure " + stamp(now) + ".json", current.text);
  const res = await writeIfUnchanged(root, STRUCTURE_FILE, JSON.stringify(plan.nextStructure, null, 2) + "\n", expectedHash);
  if (!res.ok) return { ok: false, error: "structure.json a changé pendant l'import. Rien n'a été remplacé ; la sauvegarde « " + backup + " » est conservée." };
  return { ok: true, archived, archives: names, backup: "sauvegardes/" + backup };
}

/**
 * Enregistre une structure modifiée dans le site : copie de la version actuelle
 * dans sauvegardes/, puis écriture SEULEMENT si structure.json n'a pas changé.
 */
export async function saveStructure(root, { next, expectedHash, now }) {
  const current = await readJson(root, STRUCTURE_FILE);
  if (!current.exists || current.hash !== expectedHash) return { ok: false, error: "structure.json a changé entre-temps (synchronisation Drive ou autre fenêtre). Rien n'a été écrit : recharge la page et recommence." };
  const backup = await writeNewFile(await subdir(root, ["sauvegardes"], true), "structure " + stamp(now) + ".json", current.text);
  const res = await writeIfUnchanged(root, STRUCTURE_FILE, JSON.stringify(next, null, 2) + "\n", expectedHash);
  if (!res.ok) return { ok: false, error: "structure.json a changé pendant l'enregistrement. Rien n'a été remplacé ; la sauvegarde « " + backup + " » est conservée." };
  return { ok: true, backup: "sauvegardes/" + backup };
}
