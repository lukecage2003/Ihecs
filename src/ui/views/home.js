// Tableau de bord.

import { cap, daysBetween, dayKey, examDate, fmt, fmtLong, fmtTime, startOfDay } from "../../core/dates.js";
import { esc, safeColor } from "../../core/html.js";
import { ic } from "../../core/icons.js";
import { lastWeek, streak } from "../../domain/activity.js";
import { buildPlan } from "../../domain/planner.js";
import { overall, subjectProgress } from "../../domain/progress.js";
import { dueCards } from "../../domain/srs.js";
import { app } from "../app.js";
import { renderTimer } from "../components/timer.js";
import { banner, bar, ring, statTile, taskRow, tile } from "../widgets.js";

export function homeView() {
  const st = app.state;
  const o = overall(app.content, st);
  const t0 = app.today();
  const upcoming = app.M.filter((m) => examDate(m) && startOfDay(examDate(m)) >= t0).sort((a, b) => examDate(a) - examDate(b));
  const next = upcoming[0];
  const hour = app.now().getHours();
  const hello = (hour < 5 ? "Bonne nuit" : hour < 18 ? "Bonjour" : "Bonsoir") + (st.prenom ? " " + esc(st.prenom) : "");
  const due = dueCards(app.content, st.cartes, t0).length;
  const plan = buildPlan(app.content, st, t0);
  const todayPlan = (plan.find((d) => d.k === dayKey(t0)) || { tasks: [] }).tasks.filter((x) => !x.exam);
  const str = streak(st.journal || {}, t0);

  let hero;
  if (next) {
    const ex = examDate(next), n = daysBetween(t0, ex);
    const ready = subjectProgress(st, next);
    const col = safeColor(next.couleur);
    hero = '<div class="hero-exam" style="--hero-a:' + col + ";--hero-b:color-mix(in srgb, " + col + ' 55%, #000)">' +
      '<div><div class="eyebrow">Prochain examen</div><h2 class="h-exam">' + esc(next.nom) + '</h2><div class="meta">' + cap(fmtLong(ex)) + " à " + fmtTime(ex) + " · " + esc(next.examen.type || "") + "</div></div>" +
      '<div class="countdown"><div><div class="num">' + (n === 0 ? "Auj." : n) + '</div><div class="unit">' + (n === 0 ? "c'est aujourd'hui" : n === 1 ? "jour restant" : "jours restants") + '</div></div><div><div class="num">' + Math.round(ready * 100) + '<span style="font-size:.45em">%</span></div><div class="unit">préparé</div></div>' +
      '<a class="btn" href="#m-' + next.id + '" style="margin-left:auto">Réviser ' + ic("chev", 16) + "</a></div></div>";
  } else {
    hero = '<div class="hero-exam"><div><div class="eyebrow">Examens</div><h2 class="h-exam">Aucun examen à venir</h2><div class="meta">Aucune date d\'examen n\'est enregistrée.</div></div></div>';
  }

  const subjects = app.M.map((m) => {
    const p = subjectProgress(st, m), ex = examDate(m), n = ex ? daysBetween(t0, ex) : null;
    const chip = n == null ? "" : n < 0 ? '<span class="pill pill-neutral">Passé</span>' : n <= 7 ? '<span class="pill pill-bad">J-' + n + "</span>" : n <= 21 ? '<span class="pill pill-warn">J-' + n + "</span>" : '<span class="pill pill-neutral">J-' + n + "</span>";
    const nch = (m.chapitres || []).length;
    return '<a class="card subject-card" href="#m-' + m.id + '"><div class="top">' + tile(m) + chip + '</div><div><div class="name">' + esc(m.nom) + '</div><div class="prof">' + esc(m.prof || "") + " · " + (m.credits || "?") + " ECTS</div></div>" + bar(p, m.couleur) +
      '<div class="foot"><span>' + (nch ? nch + " chapitre" + (nch > 1 ? "s" : "") : "Cours à ajouter") + '</span><span class="tnum">' + Math.round(p * 100) + " %</span></div></a>";
  }).join("");

  const week = lastWeek(st.journal || {}, t0);
  const max = Math.max(5, ...week.map((w) => w.v));
  const weekHtml = '<div class="week" role="img" aria-label="Activité des 7 derniers jours : ' + week.map((w) => w.v).join(", ") + '">' + week.map((w) => '<div class="col' + (w.today ? " today" : "") + '"><span class="v">' + (w.v || "") + '</span><div class="b' + (w.v ? "" : " zero") + '" style="height:' + Math.max(3, (w.v / max) * 82) + '%"></div><span class="lbl">' + cap(fmt(w.d, { weekday: "narrow" })) + "</span></div>").join("") + "</div>";

  const tasksHtml = todayPlan.length ? '<div class="task-list">' + todayPlan.slice(0, 6).map(taskRow).join("") + "</div>" + (todayPlan.length > 6 ? '<a href="#planning" class="small">+ ' + (todayPlan.length - 6) + " autres tâches</a>" : "")
    : '<p class="muted">Rien de prévu aujourd\'hui. Profite pour revoir tes fiches.</p>';

  const emptyReal = app.workspace.kind === "real" && !app.M.length
    ? '<div class="card empty" style="margin-bottom:16px"><div class="icon-tile" style="background:var(--good-soft);color:var(--good)">' + ic("check") + '</div><h2 class="h-sec">Ton espace est prêt</h2><p>Il est enregistré dans ton dossier Google Drive « ' + esc(app.workspace.folderName || "") + " ». Il est vide pour l'instant, sans aucun cours d'exemple. L'ajout de tes matières, cours et examens est la prochaine étape.</p></div>"
    : "";
  const html = banner() +
    '<header class="page-head"><div><div class="eyebrow">' + cap(fmtLong(app.now())) + '</div><h1 class="h-large">' + hello + "</h1></div></header>" + emptyReal +
    '<section class="hero">' + hero +
    '<div class="card overall"><div class="h-card">Progression globale</div><div class="overall-top">' + ring(o.p, 132, 14, "var(--accent)", '<div style="font-size:30px;font-weight:700;letter-spacing:-.03em">' + Math.round(o.p * 100) + '%</div><div class="small muted">global</div>') +
    '<div class="legend"><div><i style="background:var(--accent)"></i>' + o.lu + "/" + o.chapters + ' chapitres lus</div><div><i style="background:var(--good)"></i>' + o.mast + "/" + o.cards + ' fiches maîtrisées</div><div><i style="background:var(--warn)"></i>' + o.done + "/" + o.chapters + " chapitres maîtrisés</div></div></div>" +
    '<a class="btn btn-ghost" href="#revision">' + ic("cards", 16) + (due ? "Réviser " + due + " fiche" + (due > 1 ? "s" : "") : "Toutes les fiches sont à jour") + "</a></div></section>" +
    '<section class="grid g-4 section" style="margin-top:16px">' +
    statTile("cards", "var(--accent)", "Fiches du jour", due, "", '<a href="#revision">Commencer</a>') +
    statTile("flame", "#ff9f0a", "Série", str, str > 1 ? "jours" : "jour", '<span class="small muted">Révise chaque jour</span>') +
    statTile("target", "var(--good)", "Chapitres maîtrisés", o.done, "/ " + o.chapters, '<span class="small muted">Au moins 85 %</span>') +
    statTile("timer", "#bf5af2", "Temps de focus", Math.round(st.focus.min || 0), "min", '<span class="small muted">Au total</span>') +
    "</section>" +
    '<section class="section"><div class="section-head"><h2 class="h-sec">Mes matières</h2><a href="#examens">Voir les examens</a></div><div class="grid g-auto">' + subjects + "</div></section>" +
    '<section class="section grid g-3">' +
    '<div class="card" style="grid-column:span 2;min-width:0"><div class="section-head" style="margin-bottom:4px"><h2 class="h-card">Aujourd\'hui</h2><a href="#planning">Planning complet</a></div>' + tasksHtml + "</div>" +
    '<div class="card"><h2 class="h-card">Focus</h2><p class="small muted" style="margin:4px 0 14px">Sessions de travail de 25 minutes.</p><div id="focus-slot"></div></div>' +
    "</section>" +
    '<section class="section"><div class="card"><div class="section-head" style="margin-bottom:0"><h2 class="h-card">Activité des 7 derniers jours</h2><span class="small muted">Fiches et questions travaillées</span></div>' + weekHtml + "</div></section>";
  return { html, bind: renderTimer };
}
