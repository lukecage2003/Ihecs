// Révision du jour, examens, planning.

import { addDays, cap, daysBetween, dayKey, examDate, fmt, fmtTime } from "../../core/dates.js";
import { esc } from "../../core/html.js";
import { ic } from "../../core/icons.js";
import { buildPlan } from "../../domain/planner.js";
import { subjectProgress } from "../../domain/progress.js";
import { allCards, dueCards, weakCards } from "../../domain/srs.js";
import { app } from "../app.js";
import { mountFlashcards } from "../components/flashcards.js";
import { $, $$, shuffle } from "../dom.js";
import { banner, bar, dot, ring, taskRow } from "../widgets.js";

let revFilter = "";
let revMode = "jour"; // "jour" : fiches dues · "faibles" : fiches vues mais encore fragiles

export function revisionView() {
  const t0 = app.today(), cartes = app.state.cartes;
  const count = (f) => (revMode === "faibles" ? weakCards(app.content, cartes, f) : dueCards(app.content, cartes, t0, f)).length;
  const btn = (id, label) => '<button type="button" aria-pressed="' + (revFilter === id) + '" class="' + (revFilter === id ? "on" : "") + '" data-filter="' + id + '">' + label + "</button>";
  const mbtn = (id, label) => '<button type="button" aria-pressed="' + (revMode === id) + '" class="' + (revMode === id ? "on" : "") + '" data-mode="' + id + '">' + label + "</button>";
  const modes = '<div class="seg" role="group" aria-label="Type de révision" style="margin-bottom:12px">' + mbtn("jour", "À réviser aujourd'hui · " + dueCards(app.content, cartes, t0).length) + mbtn("faibles", "Points faibles · " + weakCards(app.content, cartes).length) + "</div>";
  const chips = '<div class="seg" role="group" aria-label="Filtrer par matière" style="margin-bottom:22px">' + btn("", "Toutes · " + count("")) +
    app.M.filter((m) => (m.chapitres || []).length).map((m) => btn(m.id, esc(m.nom.split(" ")[0]) + " · " + count(m.id))).join("") + "</div>";
  const lead = revMode === "faibles"
    ? "Les fiches que tu as notées « À revoir » ou « Difficile » et pas encore consolidées, les plus fragiles d'abord. Tu peux les revoir maintenant, même si elles ne sont pas encore dues."
    : "Les fiches reviennent au bon moment : plus tu les connais, plus elles s'espacent (1, 2, 4, 8, 16 puis 32 jours).";
  const html = '<header class="page-head"><div><div class="eyebrow">Répétition espacée</div><h1 class="h-large">Révision du jour</h1><p class="lead">' + lead + "</p></div></header>" +
    modes + chips + '<div id="fc-slot"></div>';
  const bind = () => {
    $$("[data-filter]").forEach((b) => (b.onclick = () => { revFilter = b.dataset.filter; app.render(); }));
    $$("[data-mode]").forEach((b) => (b.onclick = () => { revMode = b.dataset.mode; app.render(); }));
    if (revMode === "faibles") mountFlashcards($("#fc-slot"), weakCards(app.content, app.state.cartes, revFilter), { emptyText: "Aucun point faible pour l'instant : les fiches notées « À revoir » ou « Difficile » apparaîtront ici." });
    else mountFlashcards($("#fc-slot"), shuffle(dueCards(app.content, app.state.cartes, app.today(), revFilter)), { allCards: allCards(app.content, revFilter), emptyText: "Aucune fiche à réviser aujourd'hui. Les prochaines reviendront automatiquement." });
  };
  return { html, bind };
}

export function examsView() {
  const t0 = app.today();
  const list = app.M.filter(examDate).sort((a, b) => examDate(a) - examDate(b));
  const html = '<header class="page-head"><div><div class="eyebrow">' + esc(app.content.session ? app.content.session.nom : "") + '</div><h1 class="h-large">Examens</h1><p class="lead">Dates, formats, pondérations et consignes de chaque examen.</p></div></header>' + banner() +
    (list.length ? "" : '<div class="card empty"><p>Aucune date d\'examen enregistrée pour l\'instant.</p></div>') +
    '<div class="timeline">' + list.map((m) => {
      const ex = examDate(m), n = daysBetween(t0, ex), p = subjectProgress(app.state, m), e = m.examen;
      const chip = n < 0 ? '<span class="pill pill-neutral">Passé</span>' : n === 0 ? '<span class="pill pill-bad">Aujourd\'hui</span>' : '<span class="pill ' + (n <= 7 ? "pill-bad" : n <= 21 ? "pill-warn" : "pill-neutral") + '">Dans ' + n + " jour" + (n > 1 ? "s" : "") + "</span>";
      return '<div class="card exam-row' + (n < 0 ? " past" : "") + '"><div class="datebox"><div class="m">' + fmt(ex, { month: "short" }) + '</div><div class="d">' + ex.getDate() + '</div><div class="w">' + fmt(ex, { weekday: "short" }) + " " + fmtTime(ex) + "</div></div>" +
        '<div style="min-width:0"><div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">' + dot(m) + '<a class="h-card" style="color:var(--fg)" href="#m-' + m.id + '">' + esc(m.nom) + "</a></div>" +
        '<div class="meta-row"><span>' + ic("exam") + esc(e.type || "") + "</span><span>" + ic("clock") + esc(e.duree || "") + "</span><span>" + ic("pin") + esc(e.lieu || "") + "</span></div>" +
        '<div class="small muted" style="margin-top:6px">Pondération : ' + esc(e.poids || "à préciser") + "</div>" +
        ((e.consignes || []).length ? "<details><summary>Consignes (" + e.consignes.length + ")</summary><ul>" + e.consignes.map((x) => "<li>" + esc(x) + "</li>").join("") + "</ul></details>" : "") + "</div>" +
        '<div class="er-right">' + chip + '<div style="width:140px;max-width:100%">' + bar(p, m.couleur) + '</div><span class="small muted tnum">Préparé à ' + Math.round(p * 100) + " %</span></div></div>";
    }).join("") + "</div>" + undatedExams();
  return { html };
}

// Matières dont l'examen est décrit mais pas encore daté : affichées à part,
// pour que leur format, leurs crédits et leurs consignes restent visibles.
function undatedExams() {
  const has = (e) => e && (e.type || e.duree || e.poids || e.lieu || (e.consignes || []).length);
  const list = app.M.filter((m) => !examDate(m) && has(m.examen));
  if (!list.length) return "";
  return '<h2 class="h-sec" style="margin:32px 0 12px">Date à confirmer</h2><div class="timeline">' + list.map((m) => {
    const e = m.examen, p = subjectProgress(app.state, m);
    const meta = [e.type ? "<span>" + ic("exam") + esc(e.type) + "</span>" : "", e.duree ? "<span>" + ic("clock") + esc(e.duree) + "</span>" : "", e.lieu ? "<span>" + ic("pin") + esc(e.lieu) + "</span>" : "", m.credits ? "<span>" + ic("award") + m.credits + " ECTS</span>" : ""].join("");
    return '<div class="card exam-row"><div class="datebox"><div class="m">date</div><div class="d">?</div><div class="w">' + esc(m.quadrimestre || "") + "</div></div>" +
      '<div style="min-width:0"><div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">' + dot(m) + '<a class="h-card" style="color:var(--fg)" href="#m-' + m.id + '">' + esc(m.nom) + "</a></div>" +
      (meta ? '<div class="meta-row">' + meta + "</div>" : "") +
      (e.poids ? '<div class="small muted" style="margin-top:6px">Pondération : ' + esc(e.poids) + "</div>" : "") +
      ((e.consignes || []).length ? "<details><summary>Consignes (" + e.consignes.length + ")</summary><ul>" + e.consignes.map((x) => "<li>" + esc(x) + "</li>").join("") + "</ul></details>" : "") + "</div>" +
      '<div class="er-right"><span class="pill pill-neutral">Date à confirmer</span><div style="width:140px;max-width:100%">' + bar(p, m.couleur) + '</div><span class="small muted tnum">Préparé à ' + Math.round(p * 100) + " %</span></div></div>";
  }).join("") + "</div>";
}

export function planningView() {
  const t0 = app.today();
  const plan = buildPlan(app.content, app.state, t0);
  const tk = dayKey(t0), tomorrow = dayKey(addDays(t0, 1));
  const total = plan.reduce((a, d) => a + d.tasks.filter((t) => !t.exam).length, 0);
  const done = plan.reduce((a, d) => a + d.tasks.filter((t) => !t.exam && app.state.plan[t.key]).length, 0);
  const html = '<header class="page-head"><div><div class="eyebrow">Généré automatiquement</div><h1 class="h-large">Planning de révision</h1><p class="lead">Les chapitres pas encore maîtrisés sont répartis jusqu\'à 3 jours avant chaque examen. Les deux derniers jours sont réservés aux fiches et à un examen blanc. Le planning se met à jour avec ta progression.</p></div>' +
    '<div class="card" style="padding:16px 20px;display:flex;align-items:center;gap:14px">' + ring(total ? done / total : 0, 52, 6, "var(--good)", '<span class="small" style="font-weight:600">' + (total ? Math.round((done / total) * 100) : 0) + "%</span>") + '<div><b class="tnum">' + done + " / " + total + '</b><div class="small muted">tâches faites</div></div></div></header>' +
    '<div class="card">' + (plan.length ? plan.map((d) => {
      const isT = d.k === tk;
      return '<div class="plan-day' + (isT ? " is-today" : "") + '"><div class="pd-date">' + (isT ? "Aujourd'hui" : d.k === tomorrow ? "Demain" : cap(fmt(d.d, { weekday: "long" }))) + "<small>" + fmt(d.d, { day: "numeric", month: "long" }) + '</small></div><div class="task-list" style="min-width:0">' +
        d.tasks.map((t) => t.exam ? '<div class="exam-flag">' + ic("exam", 18) + esc(t.titre) + '<span style="font-weight:400;margin-left:auto">' + esc(t.sub) + "</span></div>" : taskRow(t)).join("") + "</div></div>";
    }).join("") : '<div class="empty"><p>Aucun examen à venir.</p></div>') + "</div>";
  return { html };
}
