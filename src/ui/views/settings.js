// Réglages : prénom, thème, espace de travail, sauvegarde, restauration, réinitialisation.

import { dayKey } from "../../core/dates.js";
import { esc } from "../../core/html.js";
import { blankState, decodeBackup, encodeBackup, validateBackup } from "../../state/store.js";
import { app } from "../app.js";
import { $, $$, toast } from "../dom.js";
import { applyTheme } from "../theme.js";

export function settingsView() {
  const S = app.state, w = app.workspace;
  const html = '<header class="page-head"><div><h1 class="h-large">Réglages</h1><p class="lead">Ta progression est enregistrée dans ce navigateur.</p></div></header>' +
    '<div class="card"><div class="form-row"><div class="fl"><b>Espace de travail</b><span>' + esc(w.description) + ' Ton espace académique réel arrivera avec le stockage des données ; les cours fictifs n\'y apparaîtront pas.</span></div><span class="pill pill-warn">' + esc(w.label) + "</span></div>" +
    '<div class="form-row"><div class="fl"><label for="set-name"><b>Prénom</b></label><span>Affiché sur le tableau de bord.</span></div><input class="input" id="set-name" type="text" autocomplete="given-name" maxlength="80" value="' + esc(S.prenom) + '" placeholder="Ton prénom"></div>' +
    '<div class="form-row"><div class="fl"><b id="theme-label">Apparence</b><span>Automatique suit le réglage de ton appareil.</span></div><div class="seg" id="set-theme" role="group" aria-labelledby="theme-label">' + [["auto", "Automatique"], ["light", "Clair"], ["dark", "Sombre"]].map((t) => '<button type="button" data-theme-set="' + t[0] + '" aria-pressed="' + (S.theme === t[0]) + '" class="' + (S.theme === t[0] ? "on" : "") + '">' + t[1] + "</button>").join("") + "</div></div>" +
    '<div class="form-row"><div class="fl"><b>Sauvegarder ma progression</b><span>Copie un code à garder, ou télécharge un fichier, pour la retrouver sur un autre appareil.</span></div><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn btn-plain btn-sm" id="exp-copy" type="button">Copier</button><button class="btn btn-plain btn-sm" id="exp-dl" type="button">Télécharger</button></div></div>' +
    '<div class="form-row"><div class="fl"><label for="imp-text"><b>Restaurer une sauvegarde</b></label><span>Colle le code copié ou choisis le fichier. Une sauvegarde invalide est refusée sans toucher à ta progression.</span></div><div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center"><input class="input" id="imp-text" type="text" placeholder="Colle le code ici"><button class="btn btn-plain btn-sm" id="imp-go" type="button">Restaurer</button><label class="btn btn-plain btn-sm" for="imp-file">Fichier…</label><input id="imp-file" type="file" accept="application/json,.json" hidden></div></div>' +
    '<div class="form-row"><div class="fl"><b>Réinitialiser</b><span>Efface toute la progression (fiches, quiz, planning).</span></div><div class="confirm" id="reset-zone"><button class="btn btn-danger btn-sm" id="reset" type="button">Réinitialiser</button></div></div></div>' +
    '<div class="card section"><h2 class="h-card">Raccourcis clavier</h2><dl class="kv"><dt><kbd>⌘</kbd> <kbd>K</kbd></dt><dd>Rechercher partout</dd><dt><kbd>Espace</kbd></dt><dd>Retourner une fiche</dd><dt><kbd>1</kbd> à <kbd>4</kbd></dt><dd>Noter une fiche (à revoir, difficile, bien, facile)</dd><dt><kbd>A</kbd> à <kbd>D</kbd></dt><dd>Répondre à une question de quiz</dd><dt><kbd>Entrée</kbd></dt><dd>Question suivante</dd><dt><kbd>←</kbd> <kbd>→</kbd></dt><dd>Changer d\'onglet dans un chapitre</dd></dl></div>';
  return { html, bind: bindSettings };
}

function bindSettings() {
  const name = $("#set-name");
  name.oninput = () => { app.state.prenom = name.value.trim(); app.save(); };
  $$("[data-theme-set]").forEach((b) => (b.onclick = () => {
    app.state.theme = b.dataset.themeSet; app.save(); applyTheme(app.state.theme);
    $$("[data-theme-set]").forEach((x) => { x.classList.toggle("on", x === b); x.setAttribute("aria-pressed", String(x === b)); });
  }));
  $("#exp-copy").onclick = () => {
    const txt = encodeBackup(app.state);
    const fallback = () => { $("#imp-text").value = txt; $("#imp-text").select(); toast("Sélectionne et copie le code"); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(() => toast("Code de sauvegarde copié"), fallback);
    else fallback();
  };
  $("#exp-dl").onclick = () => {
    try {
      const a = document.createElement("a");
      a.href = URL.createObjectURL(new Blob([JSON.stringify(app.state)], { type: "application/json" }));
      a.download = "revisions-progression-" + dayKey(app.now()) + ".json";
      document.body.appendChild(a); a.click(); a.remove();
    } catch (e) { toast("Téléchargement impossible ici. Utilise Copier."); }
  };
  const restore = (txt) => {
    const res = validateBackup(decodeBackup(txt));
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
