// Réglages : prénom, thème, espace de travail, sauvegarde, restauration, réinitialisation.

import { dayKey, fmtTime } from "../../core/dates.js";
import { esc } from "../../core/html.js";
import { blankState, decodeBackup, encodeBackup, validateBackup } from "../../state/store.js";
import { app } from "../app.js";
import { $, $$, toast } from "../dom.js";
import { applyTheme } from "../theme.js";
import { inspectFolder, createWorkspace } from "../../storage/real-workspace.js";
import { permission } from "../../storage/folder.js";
import { deviceId } from "../../storage/prefs.js";
import { activateReal, forgetFolder, openLocal, parseCopy, saveCopy, storedRoot, switchToDemo, sync } from "../workspace.js";

export function settingsView() {
  const S = app.state, w = app.workspace;
  const where = w.kind === "real" ? "Ta progression est enregistrée dans ton dossier Google Drive « " + esc(w.folderName) + " »." : w.kind === "copy" ? (w.source === "local" ? "Tes cours et ta progression sont enregistrés dans ce navigateur." : "Copie de tes cours : la progression est enregistrée sur cet appareil.") : "Mode démonstration : la progression est enregistrée dans ce navigateur.";
  const html = '<header class="page-head"><div><h1 class="h-large">Réglages</h1><p class="lead">' + where + "</p></div></header>" +
    '<div class="card" id="ws-card"><h2 class="h-card">Mon espace académique</h2><div id="ws-body"><p class="muted small">Chargement…</p></div></div>' +
    '<div class="card section"><div class="form-row"><div class="fl"><label for="set-name"><b>Prénom</b></label><span>Affiché sur le tableau de bord.</span></div><input class="input" id="set-name" type="text" autocomplete="given-name" maxlength="80" value="' + esc(S.prenom) + '" placeholder="Ton prénom"></div>' +
    '<div class="form-row"><div class="fl"><b id="theme-label">Apparence</b><span>Automatique suit le réglage de ton appareil.</span></div><div class="seg" id="set-theme" role="group" aria-labelledby="theme-label">' + [["auto", "Automatique"], ["light", "Clair"], ["dark", "Sombre"]].map((t) => '<button type="button" data-theme-set="' + t[0] + '" aria-pressed="' + (S.theme === t[0]) + '" class="' + (S.theme === t[0] ? "on" : "") + '">' + t[1] + "</button>").join("") + "</div></div>" +
    '<div class="form-row"><div class="fl"><b>Sauvegarder ma progression</b><span>Copie un code à garder, ou télécharge un fichier, pour la retrouver sur un autre appareil.</span></div><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn btn-plain btn-sm" id="exp-copy" type="button">Copier</button><button class="btn btn-plain btn-sm" id="exp-dl" type="button">Télécharger</button></div></div>' +
    '<div class="form-row"><div class="fl"><label for="imp-text"><b>Restaurer une sauvegarde</b></label><span>Colle le code copié ou choisis le fichier. Une sauvegarde invalide est refusée sans toucher à ta progression.</span></div><div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center"><input class="input" id="imp-text" type="text" placeholder="Colle le code ici"><button class="btn btn-plain btn-sm" id="imp-go" type="button">Restaurer</button><label class="btn btn-plain btn-sm" for="imp-file">Fichier…</label><input id="imp-file" type="file" accept="application/json,.json" hidden></div></div>' +
    '<div class="form-row"><div class="fl"><b>Réinitialiser</b><span>Efface toute la progression (fiches, quiz, planning).</span></div><div class="confirm" id="reset-zone"><button class="btn btn-danger btn-sm" id="reset" type="button">Réinitialiser</button></div></div></div>' +
    '<div class="card section"><h2 class="h-card">Raccourcis clavier</h2><dl class="kv"><dt><kbd>⌘</kbd> <kbd>K</kbd></dt><dd>Rechercher partout</dd><dt><kbd>Espace</kbd></dt><dd>Retourner une fiche</dd><dt><kbd>1</kbd> à <kbd>4</kbd></dt><dd>Noter une fiche (à revoir, difficile, bien, facile)</dd><dt><kbd>A</kbd> à <kbd>D</kbd></dt><dd>Répondre à une question de quiz</dd><dt><kbd>Entrée</kbd></dt><dd>Question suivante</dd><dt><kbd>←</kbd> <kbd>→</kbd></dt><dd>Changer d\'onglet dans un chapitre</dd></dl></div>';
  return { html, bind: () => { bindSettings(); renderWorkspaceCard(); } };
}

/* ---------------- Carte « Mon espace académique » ---------------- */

const fmtDate = (iso) => new Date(iso).toLocaleDateString("fr-BE", { day: "numeric", month: "long", year: "numeric" });

async function renderWorkspaceCard(message) {
  const body = $("#ws-body");
  if (!body) return;
  const msg = message ? '<p class="small" style="color:' + (message.error ? "var(--bad)" : "var(--good)") + '">' + esc(message.text) + "</p>" : "";
  if (app.real) {
    const m = app.real.manifest;
    const st = sync.state === "error" ? '<span class="pill pill-bad">Échec de l\'enregistrement</span>' : sync.state === "saving" ? '<span class="pill pill-info">Enregistrement…</span>' : '<span class="pill pill-good">Enregistré' + (sync.at ? " à " + fmtTime(sync.at) : "") + "</span>";
    body.innerHTML = msg + '<dl class="kv"><dt>Dossier Drive</dt><dd>' + esc(app.real.folderName) + "</dd><dt>Espace</dt><dd>" + esc(m.workspace.name) + " · créé le " + fmtDate(m.createdAt) + "</dd><dt>Cet ordinateur</dt><dd><code>" + esc(app.real.deviceId.slice(0, 8)) + "</code></dd><dt>État</dt><dd>" + st + (sync.state === "error" ? ' <span class="small">' + esc(sync.message) + "</span>" : "") + "</dd></dl>" +
      '<div class="confirm" id="ws-actions" style="margin-top:16px"><a class="btn btn-sm" href="#importer">Importer mes cours</a>' + (sync.state === "error" ? '<button class="btn btn-sm" id="ws-retry" type="button">Réessayer l\'enregistrement</button>' : "") + '<button class="btn btn-plain btn-sm" id="ws-demo" type="button">Passer en démonstration</button><button class="btn btn-danger btn-sm" id="ws-forget" type="button">Oublier ce dossier</button></div>';
    const retry = $("#ws-retry"); if (retry) retry.onclick = () => { app.retrySave && app.retrySave(); setTimeout(() => renderWorkspaceCard(), 300); };
    $("#ws-demo").onclick = async () => { await switchToDemo(); app.render(); };
    $("#ws-forget").onclick = () => {
      $("#ws-actions").innerHTML = '<span>Le site oubliera ce dossier sur cet ordinateur. Tes fichiers dans Drive ne seront ni modifiés ni supprimés.</span><button class="btn btn-danger btn-sm" id="ws-forget-yes" type="button">Oublier</button><button class="btn btn-plain btn-sm" id="ws-forget-no" type="button">Annuler</button>';
      $("#ws-forget-yes").onclick = async () => { await forgetFolder(); app.render(); };
      $("#ws-forget-no").onclick = () => renderWorkspaceCard();
    };
    return;
  }
  const supported = typeof window.showDirectoryPicker === "function";
  const root = await storedRoot();
  if (!supported || app.workspace.kind === "copy") { renderCopyCard(body, msg, supported); return; }
  body.innerHTML = msg + '<p class="muted" style="margin:6px 0 14px">Ton espace réel est enregistré dans un dossier synchronisé par <b>Google Drive pour ordinateur</b> (par exemple « Mon Drive/IHECS STUDY OS »). Il est séparé de la démonstration : les cours fictifs n\'y apparaissent jamais.</p>' +
    '<div class="confirm" id="ws-actions">' + (root ? '<button class="btn btn-sm" id="ws-open" type="button">Ouvrir mon espace (« ' + esc(root.name) + ' »)</button><button class="btn btn-plain btn-sm" id="ws-pick" type="button">Choisir un autre dossier</button>' : '<button class="btn btn-sm" id="ws-pick" type="button">Choisir mon dossier Drive</button>') + '<button class="btn btn-plain btn-sm" id="ws-local" type="button">Sans dossier : mes cours dans ce navigateur</button></div>';
  const open = $("#ws-open");
  if (open) open.onclick = async () => {
    const p = await permission(root, true);
    if (p !== "granted") { renderWorkspaceCard({ error: true, text: "Chrome n'a pas donné l'accès au dossier. Réessaie et choisis « Autoriser »." }); return; }
    await openAndRender(root);
  };
  $("#ws-pick").onclick = pickFolder;
  bindLocal();
}

function bindLocal() {
  const b = $("#ws-local");
  if (!b) return;
  b.onclick = async () => {
    try { await openLocal(); } catch (e) { renderWorkspaceCard({ error: true, text: "Impossible d'utiliser le stockage de ce navigateur : " + e.message }); return; }
    location.hash = app.M.length ? "#accueil" : "#importer";
  };
}

/** Téléphone (ou navigateur sans accès aux dossiers) : ouvrir une copie de structure.json. */
function renderCopyCard(body, msg, supported) {
  const w = app.workspace, isCopy = w.kind === "copy";
  if (isCopy && w.source === "local") {
    body.innerHTML = msg + '<p class="muted" style="margin:6px 0 14px">Tes cours sont enregistrés <b>dans ce navigateur</b> : le site les affiche directement, sans dossier ni Drive. Ta progression aussi reste ici ; pense à « Sauvegarder ma progression » de temps en temps.</p>' +
      '<div class="confirm" id="ws-actions"><a class="btn btn-sm" href="#importer">Importer mes cours</a><button class="btn btn-plain btn-sm" id="ws-demo" type="button">Passer en démonstration</button>' + (supported ? '<button class="btn btn-plain btn-sm" id="ws-pick" type="button">Utiliser plutôt un dossier Drive</button>' : "") + "</div>";
    $("#ws-demo").onclick = async () => { await switchToDemo(); app.render(); };
    const pick = $("#ws-pick"); if (pick) pick.onclick = pickFolder;
    return;
  }
  body.innerHTML = msg + (isCopy
    ? '<p class="muted" style="margin:6px 0 14px">Copie ouverte le ' + esc(fmtDate(w.importedAt)) + " (" + esc(w.fileName || "structure.json") + "). Les cours ne sont pas modifiés ici ; ta progression reste sur cet appareil.</p>"
    : '<p class="muted" style="margin:6px 0 14px">Sur téléphone, ouvre une <b>copie</b> de tes cours : choisis le fichier <code>structure.json</code> de ton dossier « IHECS STUDY OS » (depuis Google Drive dans le sélecteur de fichiers). Ta progression sera gardée sur ce téléphone, séparée de la démonstration.</p>' + (supported ? "" : '<p class="small muted">Pour importer de nouveaux cours ou modifier les examens, utilise Google Chrome ou Microsoft Edge sur ordinateur.</p>')) +
    '<div class="confirm" id="ws-actions"><label class="btn btn-sm" for="copy-file">' + (isCopy ? "Mettre à jour la copie" : "Ouvrir mes cours (structure.json)") + '</label><input id="copy-file" type="file" accept="application/json,.json" hidden>' +
    (isCopy ? '<button class="btn btn-plain btn-sm" id="ws-demo" type="button">Passer en démonstration</button>' + (supported ? '<button class="btn btn-plain btn-sm" id="ws-pick" type="button">Relier mon dossier Drive</button>' : "") : '<button class="btn btn-plain btn-sm" id="ws-local" type="button">Importer mes fichiers de cours ici</button>') + "</div>";
  $("#copy-file").onchange = (e) => {
    const f = e.target.files[0]; if (!f) return;
    const rd = new FileReader();
    rd.onerror = () => renderWorkspaceCard({ error: true, text: "Lecture du fichier impossible." });
    rd.onload = async () => {
      const r = parseCopy(String(rd.result));
      if (!r.ok) { renderWorkspaceCard({ error: true, text: "Fichier refusé : " + r.error }); return; }
      try { await saveCopy(r.structure, f.name); } catch (x) { renderWorkspaceCard({ error: true, text: "Enregistrement impossible sur cet appareil : " + x.message }); return; }
      app.render();
      renderWorkspaceCard({ text: r.structure.subjects.length + " matière(s) ouverte(s)." });
    };
    rd.readAsText(f);
  };
  const demo = $("#ws-demo"); if (demo) demo.onclick = async () => { await switchToDemo(); app.render(); };
  const pick = $("#ws-pick"); if (pick) pick.onclick = pickFolder;
  bindLocal();
}

async function pickFolder() {
  let root;
  try { root = await window.showDirectoryPicker({ id: "ihecs-study-os", mode: "readwrite" }); }
  catch (e) { if (e && e.name !== "AbortError") renderWorkspaceCard({ error: true, text: "Impossible d'ouvrir le sélecteur : " + e.message }); return; }
  let info;
  try { info = await inspectFolder(root); }
  catch (e) { renderWorkspaceCard({ error: true, text: "Lecture du dossier impossible : " + e.message }); return; }
  if (info.status === "existing") { await openAndRender(root); return; }
  if (info.status === "invalid") {
    renderWorkspaceCard({ error: true, text: "Le dossier « " + root.name + " » contient un fichier ihecs-study-os.json inutilisable. Rien n'a été modifié. " + info.errors.join(" ") });
    return;
  }
  const others = info.names.length ? '<p class="small muted">Le dossier contient déjà : ' + info.names.map(esc).join(", ") + ". Ces éléments ne seront ni modifiés ni supprimés.</p>" : "";
  $("#ws-body").innerHTML = '<p>Aucun espace dans « <b>' + esc(root.name) + '</b> ». Créer ton espace académique ici ?</p><p class="small muted">Seront créés : <code>ihecs-study-os.json</code>, <code>structure.json</code> et <code>appareils/</code> (la progression de cet ordinateur).</p>' + others +
    '<div class="confirm" style="margin-top:12px"><button class="btn btn-sm" id="ws-create" type="button">Créer mon espace</button><button class="btn btn-plain btn-sm" id="ws-cancel" type="button">Annuler</button></div>';
  $("#ws-cancel").onclick = () => renderWorkspaceCard();
  $("#ws-create").onclick = async () => {
    $("#ws-create").disabled = true;
    try { await createWorkspace(root, { deviceId: await deviceId(), now: new Date() }); }
    catch (e) { renderWorkspaceCard({ error: true, text: e.message }); return; }
    await openAndRender(root, "Ton espace a été créé dans « " + root.name + " ».");
  };
}

async function openAndRender(root, okText) {
  try { await activateReal(root); }
  catch (e) { renderWorkspaceCard({ error: true, text: "Impossible d'ouvrir l'espace : " + e.message }); return; }
  app.render();
  if (okText) renderWorkspaceCard({ text: okText });
}

function bindSettings() {
  const name = $("#set-name");
  name.oninput = () => { app.state.prenom = name.value.trim(); app.save(); };
  $$("[data-theme-set]").forEach((b) => (b.onclick = () => {
    app.state.theme = b.dataset.themeSet; app.save(); applyTheme(app.state.theme);
    $$("[data-theme-set]").forEach((x) => { x.classList.toggle("on", x === b); x.setAttribute("aria-pressed", String(x === b)); });
  }));
  const exported = () => Object.assign({ _workspace: app.workspace.kind }, app.state);
  $("#exp-copy").onclick = () => {
    const txt = encodeBackup(exported());
    const fallback = () => { $("#imp-text").value = txt; $("#imp-text").select(); toast("Sélectionne et copie le code"); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(() => toast("Code de sauvegarde copié"), fallback);
    else fallback();
  };
  $("#exp-dl").onclick = () => {
    try {
      const a = document.createElement("a");
      a.href = URL.createObjectURL(new Blob([JSON.stringify(exported())], { type: "application/json" }));
      a.download = "revisions-progression-" + dayKey(app.now()) + ".json";
      document.body.appendChild(a); a.click(); a.remove();
    } catch (e) { toast("Téléchargement impossible ici. Utilise Copier."); }
  };
  const restore = (txt) => {
    const raw = decodeBackup(txt);
    // D3 : une sauvegarde de la démonstration ne peut pas entrer dans l'espace réel, et inversement.
    const from = raw && typeof raw === "object" && raw._workspace ? raw._workspace : "demo";
    const family = (k) => (k === "demo" ? "demo" : "real"); // la copie et l'espace réel partagent les mêmes cours
    if (family(from) !== family(app.workspace.kind)) { toast(from === "demo" ? "Sauvegarde refusée : elle vient de la démonstration et ne peut pas entrer dans ton espace réel." : "Sauvegarde refusée : elle vient de ton espace réel et ne peut pas entrer dans la démonstration."); return; }
    const res = validateBackup(raw);
    if (!res.ok) { toast("Sauvegarde refusée : " + (res.error || "format invalide.")); return; }
    app.state = res.state; app.save(); applyTheme(app.state.theme); toast("Progression restaurée"); app.render();
  };
  $("#imp-go").onclick = () => restore($("#imp-text").value);
  $("#imp-file").onchange = (e) => { const f = e.target.files[0]; if (!f) return; const rd = new FileReader(); rd.onload = () => restore(String(rd.result)); rd.readAsText(f); };
  $("#reset").onclick = () => {
    $("#reset-zone").innerHTML = '<span>Tout effacer ?</span><button class="btn btn-danger btn-sm" id="reset-yes" type="button">Oui, effacer</button><button class="btn btn-plain btn-sm" id="reset-no" type="button">Annuler</button>';
    $("#reset-yes").onclick = () => { const keep = { prenom: app.state.prenom, theme: app.state.theme }; app.state = Object.assign(blankState(), keep); app.save(); toast("Progression effacée"); app.render(); };
    $("#reset-no").onclick = () => app.render();
    $("#reset-no").focus();
  };
}
