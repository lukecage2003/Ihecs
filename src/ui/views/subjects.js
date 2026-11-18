// Liste des matières et page d'une matière.

import { cap, daysBetween, examDate, fmtLong, fmtTime } from "../../core/dates.js";
import { esc } from "../../core/html.js";
import { ic } from "../../core/icons.js";
import { chapStats, MASTERED_THRESHOLD, subjectProgress } from "../../domain/progress.js";
import { app } from "../app.js";
import { $, $$, toast } from "../dom.js";
import { editSubject } from "../../data/v2/course-pack.js";
import { contentFromStructure } from "../../data/v2/workspace.js";
import { readStructure, saveStructure } from "../../storage/real-workspace.js";
import { fileAt } from "../../storage/folder.js";
import { banner, bar, ring, statusPill, tile } from "../widgets.js";

export function subjectsView() {
  const html = banner() + '<header class="page-head"><div><div class="eyebrow">' + esc(app.content.annee || "") + '</div><h1 class="h-large">Matières</h1></div></header><div class="list">' +
    app.M.map((m) => { const p = subjectProgress(app.state, m); return '<a class="row" href="#m-' + m.id + '">' + tile(m) + '<div class="rx"><div class="rt">' + esc(m.nom) + '</div><div class="rs">' + (m.chapitres || []).length + " chapitres · " + (m.credits || "?") + ' ECTS</div></div><div class="rbar">' + bar(p, m.couleur) + '</div><span class="tnum small muted">' + Math.round(p * 100) + '%</span><span class="chev">' + ic("chev", 16) + "</span></a>"; }).join("") + "</div>";
  return { html };
}

export function subjectView(m) {
  const p = subjectProgress(app.state, m);
  const ex = examDate(m);
  const n = ex ? daysBetween(app.today(), ex) : null;
  const ch = m.chapitres || [];
  const nQuiz = ch.reduce((a, c) => a + (c.quiz || []).length, 0);
  const chapters = ch.length ? '<div class="list">' + ch.map((c, i) => {
    const s = chapStats(app.state, m, c);
    const ok = s.p >= MASTERED_THRESHOLD;
    return '<a class="row" href="#c-' + m.id + "-" + c.id + '-resume"><span class="num' + (ok ? " ok" : "") + '">' + (ok ? ic("check", 16) : i + 1) + '</span><div class="rx"><div class="rt">' + esc(c.titre) + '</div><div class="rs">' + (c.duree ? c.duree + " min · " : "") + (c.fiches || []).length + " fiches · " + (c.quiz || []).length + " questions" + (s.quizBest != null ? " · meilleur quiz " + Math.round(s.quizBest * 100) + " %" : "") + "</div></div>" + statusPill(s.p) + '<span class="chev">' + ic("chev", 16) + "</span></a>";
  }).join("") + "</div>"
    : '<div class="card empty"><div class="icon-tile">' + ic("folder") + '</div><h3 class="h-card">Pas encore de cours</h3><p>Aucun chapitre n\'est enregistré pour cette matière.</p></div>';

  const e = m.examen || {};
  const editBtn = app.real ? '<button type="button" class="btn btn-plain btn-sm" id="exam-edit">' + ic("pen", 16) + "Modifier</button>" : "";
  const examCard = '<div class="card" id="exam-card"><div style="display:flex;align-items:center;justify-content:space-between;gap:10px"><h2 class="h-card">Examen</h2>' + editBtn + "</div>" + (ex ? '<div style="display:flex;align-items:baseline;gap:10px;margin-top:10px"><span class="stat-val">' + (n < 0 ? "Passé" : "J-" + n) + '</span><span class="muted small">' + cap(fmtLong(ex)) + ", " + fmtTime(ex) + "</span></div>" : "") +
    '<dl class="kv"><dt>Type</dt><dd>' + esc(e.type || "À préciser") + "</dd><dt>Durée</dt><dd>" + esc(e.duree || "À préciser") + "</dd><dt>Pondération</dt><dd>" + esc(e.poids || "À préciser") + "</dd><dt>Lieu</dt><dd>" + esc(e.lieu || "À préciser") + "</dd></dl>" +
    ((e.consignes || []).length ? '<div class="eyebrow" style="margin:20px 0 10px">Consignes</div><ul class="bullets">' + e.consignes.map((x) => "<li>" + ic("check", 16) + "<span>" + esc(x) + "</span></li>").join("") + "</ul>" : "") + "</div>";

  const files = (m.fichiers || []).length ? '<div class="files">' + m.fichiers.map((f, i) => {
    const ext = (String(f.chemin).split(".").pop() || "").toLowerCase().replace(/[^a-z0-9]/g, "");
    const inner = '<span class="ext ' + ext + '">' + ext + '</span><span><b style="font-weight:500">' + esc(f.nom) + '</b><br><span class="small muted">' + esc(f.chemin) + "</span></span>";
    // Documents de l'espace réel : lus dans le dossier Drive, jamais téléchargés depuis Internet.
    return f.local ? '<button type="button" class="file" data-doc="' + i + '" style="border:0;background:none;text-align:left;width:100%;font:inherit;cursor:pointer">' + inner + "</button>" : '<a class="file" href="' + esc(f.chemin) + '" target="_blank" rel="noopener">' + inner + "</a>";
  }).join("") + "</div>"
    : '<p class="small muted" style="margin:6px 0 0">Aucun document enregistré pour cette matière.</p>';

  const html = '<nav class="crumbs" aria-label="Fil d\'Ariane"><a href="#accueil">Tableau de bord</a>' + ic("chev", 12) + "<span>" + esc(m.nom) + "</span></nav>" +
    '<header class="subject-hero">' + tile(m, true) + '<div class="info"><h1 class="h-large">' + esc(m.nom) + '</h1><div class="meta-row"><span>' + ic("people") + esc(m.prof || "") + "</span><span>" + ic("award") + (m.credits || "?") + " ECTS</span><span>" + ic("calendar") + esc(m.quadrimestre || "") + "</span></div></div>" +
    ring(p, 96, 10, m.couleur, '<div style="font-size:22px;font-weight:700">' + Math.round(p * 100) + "%</div>") + "</header>" +
    '<div class="split"><div style="min-width:0"><div class="section-head"><h2 class="h-sec">Chapitres</h2>' + (nQuiz ? '<a class="btn btn-ghost btn-sm" href="#blanc-' + m.id + '">' + ic("exam", 16) + "Examen blanc · " + nQuiz + " questions</a>" : "") + "</div>" + chapters + "</div>" +
    '<div class="grid" style="min-width:0">' + examCard + '<div class="card"><h2 class="h-card">Documents du cours</h2>' + files + "</div></div></div>";
  return { html, bind: () => { bindDocuments(m); bindEdit(m); } };
}

function bindDocuments(m) {
  $$("[data-doc]").forEach((b) => (b.onclick = async () => {
    const f = m.fichiers[+b.dataset.doc];
    if (!app.real) { toast("Ouvre ce document depuis Google Drive : " + f.chemin); return; }
    const file = await fileAt(app.real.root, f.chemin);
    if (!file) { toast("Fichier introuvable dans ton dossier : " + f.chemin); return; }
    const url = URL.createObjectURL(file);
    const a = document.createElement("a");
    a.href = url; a.target = "_blank"; a.rel = "noopener";
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  }));
}

// Modification des infos d'examen et de la matière (espace réel uniquement).
// Écrit dans structure.json après une copie dans sauvegardes/ ; les champs modifiés
// sont gardés lors des imports suivants (userEdits).
function bindEdit(m) {
  const btn = $("#exam-edit");
  if (!btn || !app.real) return;
  btn.onclick = () => {
    const e = m.examen || {};
    const val = (v) => esc(v == null ? "" : String(v));
    const dt = e.date ? String(e.date).slice(0, 16) : "";
    const row = (id, label, input) => '<div class="form-row" style="display:block"><div class="fl" style="margin-bottom:6px"><label for="' + id + '"><b>' + label + "</b></label></div>" + input.replace('class="input"', 'class="input" style="width:100%;box-sizing:border-box"') + "</div>";
    const inp = (id, v, extra) => '<input class="input" id="' + id + '" value="' + val(v) + '" ' + (extra || 'type="text" maxlength="200"') + ">";
    $("#exam-card").innerHTML = '<form id="exam-form" novalidate><h2 class="h-card">Modifier l\'examen</h2><p class="small muted">Laisse un champ vide pour l\'effacer. Tes modifications sont gardées si tu réimportes le cours.</p>' +
      row("ed-date", "Date et heure", inp("ed-date", dt, 'type="datetime-local"')) +
      row("ed-type", "Type", inp("ed-type", e.type)) +
      row("ed-duree", "Durée", inp("ed-duree", e.duree)) +
      row("ed-poids", "Pondération", inp("ed-poids", e.poids)) +
      row("ed-lieu", "Lieu", inp("ed-lieu", e.lieu)) +
      row("ed-consignes", "Consignes (une par ligne)", '<textarea class="input" id="ed-consignes" rows="5">' + val((e.consignes || []).join("\n")) + "</textarea>") +
      row("ed-credits", "Crédits ECTS", inp("ed-credits", m.credits, 'type="number" min="0" max="60" step="1" inputmode="numeric"')) +
      row("ed-quadri", "Quadrimestre", inp("ed-quadri", m.quadrimestre, 'type="text" maxlength="40"')) +
      '<div id="ed-err" role="alert" class="small" style="color:var(--bad)"></div><div class="confirm" style="margin-top:12px"><button class="btn" type="submit" id="ed-save">Enregistrer</button><button class="btn btn-plain" type="button" id="ed-cancel">Annuler</button></div></form>';
    $("#ed-cancel").onclick = () => app.render();
    $("#exam-form").onsubmit = async (ev) => {
      ev.preventDefault();
      const err = $("#ed-err"), save = $("#ed-save");
      save.disabled = true; err.textContent = "";
      const patch = { credits: $("#ed-credits").value, quadrimestre: $("#ed-quadri").value,
        examen: { date: $("#ed-date").value, type: $("#ed-type").value, duree: $("#ed-duree").value, poids: $("#ed-poids").value, lieu: $("#ed-lieu").value, consignes: $("#ed-consignes").value } };
      try {
        const cur = await readStructure(app.real.root, app.real.manifest.workspace.id);
        const r = editSubject(cur.data, m.id, patch);
        if (r.errors.length) { err.textContent = r.errors.join(" "); save.disabled = false; return; }
        const res = await saveStructure(app.real.root, { next: r.structure, expectedHash: cur.hash, now: new Date() });
        if (!res.ok) { err.textContent = res.error; save.disabled = false; return; }
        app.content = contentFromStructure(r.structure, app.real.manifest);
        app.refreshChrome();
        app.render();
        toast("Modifications enregistrées");
      } catch (x) { err.textContent = "L'enregistrement a échoué : " + x.message; save.disabled = false; }
    };
    $("#ed-date").focus();
  };
}
