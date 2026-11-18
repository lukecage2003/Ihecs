// Import d'un fichier de cours dans l'espace réel, avec aperçu obligatoire.

import { esc } from "../../core/html.js";
import { ic, ICON_NAMES } from "../../core/icons.js";
import { LIMITS, mergePacks, planImport, validatePack } from "../../data/v2/course-pack.js";
import { contentFromStructure } from "../../data/v2/workspace.js";
import { applyImport, readStructure } from "../../storage/real-workspace.js";
import { app } from "../app.js";
import { resetSearchIndex } from "../components/spotlight.js";
import { $, $$, toast } from "../dom.js";

const head = '<header class="page-head"><div><div class="eyebrow">Mon espace académique</div><h1 class="h-large">Importer mes cours</h1><p class="lead">Choisis un ou plusieurs fichiers de cours (.json) préparés avec Claude. Tu verras un aperçu avant que quoi que ce soit soit ajouté à ton espace.</p></div></header>';

export function importView() {
  if (!app.real && app.workspace.kind === "copy") {
    return { html: head + '<div class="card empty"><div class="icon-tile">' + ic("folder") + '</div><h2 class="h-card">Import sur ordinateur</h2><p>Sur cet appareil, tes cours sont une copie en lecture. Importe les nouveaux fichiers de cours sur ordinateur (Chrome ou Edge), puis mets la copie à jour en rouvrant <code>structure.json</code>.</p><a class="btn" href="#parametres">Mettre à jour la copie</a></div>' };
  }
  if (!app.real) {
    return { html: head + '<div class="card empty"><div class="icon-tile">' + ic("folder") + '</div><h2 class="h-card">Ton espace réel n\'est pas ouvert</h2><p>L\'import ajoute des cours à ton espace académique enregistré dans Google Drive, jamais à la démonstration.</p><a class="btn" href="#parametres">Ouvrir mon espace dans les Réglages</a></div>' };
  }
  const html = head +
    '<div class="card"><div class="form-row" style="border:0;padding-top:0"><div class="fl"><b>Fichiers de cours</b><span>Tu peux en sélectionner plusieurs d\'un coup (Ctrl ou Maj + clic). 20 Mo maximum par fichier.</span></div><label class="btn" for="pack-file">' + ic("folder", 16) + 'Choisir des fichiers…</label><input id="pack-file" type="file" accept="application/json,.json" multiple hidden></div>' +
    '<ul class="bullets small" style="margin-top:6px"><li>' + ic("check", 16) + "<span>Une matière déjà présente n'est mise à jour que si le fichier en apporte une version différente, et tu peux décocher la mise à jour dans l'aperçu.</span></li><li>" + ic("check", 16) + "<span>Ce que tu as modifié toi-même dans le site (date d'examen, crédits, consignes) est conservé.</span></li><li>" + ic("check", 16) + "<span>Avant chaque import, une copie de ta structure actuelle est enregistrée dans <code>sauvegardes/</code>, et le fichier importé est archivé dans <code>imports/</code>.</span></li><li>" + ic("check", 16) + "<span>Ta progression suit les fiches grâce à leur identifiant, même si un cours est réimporté.</span></li></ul></div>" +
    '<div id="imp-preview" class="section" aria-live="polite"></div>';
  return { html, bind: bindImport };
}

function bindImport() {
  let files = [], merged = null, pack = null, fileName = null, structure = null, replace = new Set(), defaulted = false;
  const preview = $("#imp-preview");
  const fail = (title, items) => {
    preview.innerHTML = '<div class="card" role="alert"><h2 class="h-card" style="color:var(--bad)">' + esc(title) + '</h2><ul style="margin:10px 0 0;padding-left:1.2em">' + items.map((x) => "<li>" + esc(x) + "</li>").join("") + "</ul><p class=\"small muted\" style=\"margin-top:12px\">Rien n'a été modifié dans ton espace.</p></div>";
  };

  async function show() {
    let plan;
    try {
      structure = await readStructure(app.real.root, app.real.manifest.workspace.id);
      plan = planImport(structure.data, pack, { replace: [...replace], now: new Date(), sourceName: fileName, sourceOf: merged.sourceOf, iconNames: ICON_NAMES });
      // Premier aperçu : les matières dont le fichier apporte une nouvelle version sont mises à jour par défaut.
      if (plan.ok && !defaulted) {
        defaulted = true;
        if (plan.changed.length) { plan.changed.forEach((s) => replace.add(s.id.toLowerCase())); return show(); }
      }
    } catch (e) { fail("Lecture de ton espace impossible", [e.message]); return; }
    if (!plan.ok) { fail(files.length > 1 ? "Ces fichiers ne peuvent pas être importés" : "Ce fichier ne peut pas être importé", plan.errors); return; }
    const rows = pack.subjects.map((s) => {
      const exists = plan.skipped.includes(s) || plan.replaced.includes(s);
      const nf = s.chapitres.reduce((n, c) => n + (c.fiches || []).length, 0), nq = s.chapitres.reduce((n, c) => n + (c.quiz || []).length, 0);
      const isChanged = plan.changed.includes(s), on = replace.has(s.id.toLowerCase());
      const status = !exists ? '<span class="pill pill-good">Nouvelle</span>'
        : !isChanged ? '<span class="pill pill-neutral">Déjà à jour</span>'
        : '<label style="display:inline-flex;gap:6px;align-items:center"><input type="checkbox" data-replace="' + esc(s.id) + '"' + (on ? " checked" : "") + '> Mettre à jour</label>' + (on ? ' <span class="pill pill-warn">Nouvelle version</span>' : ' <span class="pill pill-neutral">Gardée telle quelle</span>');
      const from = files.length > 1 && merged.sourceOf.get(s.id.toLowerCase()) ? '<div class="small muted">' + esc(merged.sourceOf.get(s.id.toLowerCase())) + "</div>" : "";
      return "<tr><td><b>" + esc(s.nom) + '</b><div class="small muted">' + esc(s.id) + "</div>" + from + "</td><td class=\"tnum\">" + s.chapitres.length + '</td><td class="tnum">' + nf + '</td><td class="tnum">' + nq + "</td><td>" + (s.examen && s.examen.date ? esc(new Date(s.examen.date).toLocaleDateString("fr-BE")) : "—") + "</td><td>" + status + "</td></tr>";
    }).join("");
    const nothing = !plan.added.length && !plan.replaced.length;
    preview.innerHTML = '<div class="card"><div class="section-head" style="margin-bottom:6px"><h2 class="h-sec">Aperçu : ' + esc(pack.title) + '</h2><span class="small muted">' + esc(fileName) + "</span></div>" +
      (merged.duplicates.length ? '<p class="small muted">Matière présente dans plusieurs fichiers : la version la plus récente est gardée (' + merged.duplicates.map((d) => esc(d.id) + " : " + esc(d.kept)).join(" ; ") + ").</p>" : "") +
      '<p class="muted">' + plan.added.length + " matière(s) à ajouter · " + plan.replaced.length + " à mettre à jour · " + plan.skipped.length + " inchangée(s) · " + plan.counts.chapitres + " chapitres, " + plan.counts.fiches + " fiches, " + plan.counts.questions + " questions importés.</p>" +
      '<div class="table-wrap prose" style="max-width:none;font-size:14px"><table><thead><tr><th>Matière</th><th>Chapitres</th><th>Fiches</th><th>Questions</th><th>Examen</th><th>Dans ton espace</th></tr></thead><tbody>' + rows + "</tbody></table></div>" +
      (plan.replaced.length ? '<p class="small" style="color:var(--warn)">La mise à jour remplace le contenu de ces matières (une copie est gardée dans sauvegardes/). Ta progression est conservée pour les fiches qui gardent le même identifiant, et ce que tu as modifié dans le site est gardé.</p>' : "") +
      '<div class="confirm" style="margin-top:14px"><button class="btn" id="imp-go" type="button"' + (nothing ? " disabled" : "") + '>Importer</button><button class="btn btn-plain" id="imp-cancel" type="button">Annuler</button>' + (nothing ? '<span class="small muted">Tout est déjà à jour : rien à importer.</span>' : "") + "</div></div>";
    $$("[data-replace]", preview).forEach((cb) => (cb.onchange = () => { const k = cb.dataset.replace.toLowerCase(); cb.checked ? replace.add(k) : replace.delete(k); show(); }));
    $("#imp-cancel").onclick = () => { preview.innerHTML = ""; $("#pack-file").value = ""; };
    $("#imp-go").onclick = async () => {
      $("#imp-go").disabled = true;
      let res;
      try { res = await applyImport(app.real.root, { plan, expectedHash: structure.hash, files, now: new Date() }); }
      catch (e) { fail("L'import a échoué", [e.message]); return; }
      if (!res.ok) { fail("L'import n'a pas été fait", [res.error]); return; }
      $("#pack-file").value = ""; // permet de rechoisir le même fichier ensuite
      app.content = contentFromStructure(plan.nextStructure, app.real.manifest);
      resetSearchIndex();
      app.refreshChrome();
      toast(plan.added.length + plan.replaced.length + " matière(s) importée(s)");
      preview.innerHTML = '<div class="card"><h2 class="h-sec" style="color:var(--good)">Import terminé</h2><p class="muted">' + (res.archives.length > 1 ? "Fichiers archivés" : "Fichier archivé") + " : <code>" + esc(res.archived) + "</code> · Sauvegarde de la structure précédente : <code>" + esc(res.backup) + '</code></p><div class="confirm" style="margin-top:12px">' +
        [...plan.added, ...plan.replaced].map((s) => '<a class="btn btn-plain btn-sm" href="#m-' + esc(s.id) + '">' + esc(s.nom) + "</a>").join("") + "</div></div>";
    };
  }

  $("#pack-file").onchange = async (e) => {
    const chosen = [...e.target.files];
    if (!chosen.length) return;
    e.target.value = ""; // une nouvelle sélection des mêmes fichiers relancera l'aperçu
    replace = new Set(); defaulted = false; files = [];
    const errors = [];
    for (const f of chosen) {
      if (f.size > LIMITS.bytes) { errors.push(f.name + " : fichier trop volumineux (" + Math.round(f.size / 1048576) + " Mo, maximum 20 Mo). Découpe-le en plusieurs fichiers."); continue; }
      const text = await f.text();
      let p;
      try { p = JSON.parse(text); } catch (err) { errors.push(f.name + " : ce n'est pas du JSON valide (" + err.message + ")"); continue; }
      const v = validatePack(p, { iconNames: ICON_NAMES });
      if (v.length) { v.forEach((x) => errors.push(f.name + " — " + x)); continue; }
      files.push({ name: f.name, text, pack: p });
    }
    if (errors.length) { fail(chosen.length > 1 ? "Certains fichiers ne peuvent pas être importés" : "Ce fichier ne peut pas être importé", errors); return; }
    merged = mergePacks(files);
    pack = merged.pack;
    fileName = files.map((f) => f.name).join(", ");
    show();
  };
}
