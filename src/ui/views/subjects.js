// Liste des matières et page d'une matière.

import { cap, daysBetween, examDate, fmtLong, fmtTime } from "../../core/dates.js";
import { esc } from "../../core/html.js";
import { ic } from "../../core/icons.js";
import { chapStats, MASTERED_THRESHOLD, subjectProgress } from "../../domain/progress.js";
import { app } from "../app.js";
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
  const examCard = '<div class="card"><h2 class="h-card">Examen</h2>' + (ex ? '<div style="display:flex;align-items:baseline;gap:10px;margin-top:10px"><span class="stat-val">' + (n < 0 ? "Passé" : "J-" + n) + '</span><span class="muted small">' + cap(fmtLong(ex)) + ", " + fmtTime(ex) + "</span></div>" : "") +
    '<dl class="kv"><dt>Type</dt><dd>' + esc(e.type || "À préciser") + "</dd><dt>Durée</dt><dd>" + esc(e.duree || "À préciser") + "</dd><dt>Pondération</dt><dd>" + esc(e.poids || "À préciser") + "</dd><dt>Lieu</dt><dd>" + esc(e.lieu || "À préciser") + "</dd></dl>" +
    ((e.consignes || []).length ? '<div class="eyebrow" style="margin:20px 0 10px">Consignes</div><ul class="bullets">' + e.consignes.map((x) => "<li>" + ic("check", 16) + "<span>" + esc(x) + "</span></li>").join("") + "</ul>" : "") + "</div>";

  const files = (m.fichiers || []).length ? '<div class="files">' + m.fichiers.map((f) => { const ext = (String(f.chemin).split(".").pop() || "").toLowerCase().replace(/[^a-z0-9]/g, ""); return '<a class="file" href="' + esc(f.chemin) + '" target="_blank" rel="noopener"><span class="ext ' + ext + '">' + ext + '</span><span><b style="font-weight:500">' + esc(f.nom) + '</b><br><span class="small muted">' + esc(f.chemin) + "</span></span></a>"; }).join("") + "</div>"
    : '<p class="small muted" style="margin:6px 0 0">Aucun document enregistré pour cette matière.</p>';

  const html = '<nav class="crumbs" aria-label="Fil d\'Ariane"><a href="#accueil">Tableau de bord</a>' + ic("chev", 12) + "<span>" + esc(m.nom) + "</span></nav>" +
    '<header class="subject-hero">' + tile(m, true) + '<div class="info"><h1 class="h-large">' + esc(m.nom) + '</h1><div class="meta-row"><span>' + ic("people") + esc(m.prof || "") + "</span><span>" + ic("award") + (m.credits || "?") + " ECTS</span><span>" + ic("calendar") + esc(m.quadrimestre || "") + "</span></div></div>" +
    ring(p, 96, 10, m.couleur, '<div style="font-size:22px;font-weight:700">' + Math.round(p * 100) + "%</div>") + "</header>" +
    '<div class="split"><div style="min-width:0"><div class="section-head"><h2 class="h-sec">Chapitres</h2>' + (nQuiz ? '<a class="btn btn-ghost btn-sm" href="#blanc-' + m.id + '">' + ic("exam", 16) + "Examen blanc · " + nQuiz + " questions</a>" : "") + "</div>" + chapters + "</div>" +
    '<div class="grid" style="min-width:0">' + examCard + '<div class="card"><h2 class="h-card">Documents du cours</h2>' + files + "</div></div></div>";
  return { html };
}
