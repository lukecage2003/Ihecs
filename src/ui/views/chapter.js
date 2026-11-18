// Chapitre : onglets Résumé, L'essentiel, Fiches, Quiz (motif ARIA « tabs »).

import { esc, safeColor } from "../../core/html.js";
import { ic } from "../../core/icons.js";
import { inline, md } from "../../core/markdown.js";
import { chapKey, chapStats } from "../../domain/progress.js";
import { cardKey } from "../../domain/srs.js";
import { app } from "../app.js";
import { mountFlashcards } from "../components/flashcards.js";
import { mountQuiz } from "../components/quiz.js";
import { $, $$, shuffle, toast } from "../dom.js";
import { statusPill } from "../widgets.js";

export function chapterView(m, c, tab) {
  const s = chapStats(app.state, m, c);
  const ch = m.chapitres;
  const idx = ch.indexOf(c);
  const base = "#c-" + m.id + "-" + c.id + "-";
  const tabs = [["resume", "Résumé"], ["essentiel", "L'essentiel"], ["fiches", "Fiches · " + (c.fiches || []).length], ["quiz", "Quiz · " + (c.quiz || []).length]];
  const seg = '<div class="seg seg-lg" role="tablist" aria-label="Sections du chapitre">' + tabs.map((t) => {
    const on = t[0] === tab;
    return '<button type="button" role="tab" id="tab-' + t[0] + '" aria-controls="chap-panel" aria-selected="' + on + '" tabindex="' + (on ? 0 : -1) + '" class="' + (on ? "on" : "") + '" data-go="' + base + t[0] + '">' + t[1] + "</button>";
  }).join("") + "</div>";

  let body = "";
  if (tab === "resume") {
    const r = md(c.resume);
    body = '<div class="reader"><article class="card" style="padding:clamp(22px,4vw,44px);min-width:0"><div class="prose">' + r.html + "</div>" +
      '<div class="card-flat read-done"><div><b>' + (s.lu ? "Chapitre lu" : "Tu as fini de lire ?") + '</b><div class="small muted">' + (s.lu ? "Passe aux fiches pour mémoriser." : "Marque-le comme lu pour suivre ta progression.") + "</div></div>" +
      (s.lu ? '<a class="btn" href="' + base + 'fiches">Passer aux fiches</a>' : '<button class="btn" id="mark-read" type="button">' + ic("check", 16) + "Marquer comme lu</button>") + "</div></article>" +
      (r.toc.length ? '<nav class="toc" aria-label="Sommaire"><div class="eyebrow">Sommaire</div>' + r.toc.map((t) => '<a href="#' + t.id + '" data-anchor="' + t.id + '">' + inline(t.t) + "</a>").join("") + "</nav>" : "") + "</div>";
  } else if (tab === "essentiel") {
    body = '<div class="grid" style="gap:16px"><div class="card"><h2 class="h-card" style="margin-bottom:16px">Points clés</h2><div class="keypoints">' + (c.pointsCles || []).map((k) => '<div class="keypoint"><span class="kpi">' + ic("check", 14) + "</span><div>" + inline(k) + "</div></div>").join("") + "</div></div>" +
      ((c.definitions || []).length ? '<div class="card"><h2 class="h-card" style="margin-bottom:16px">Définitions</h2><dl class="defs">' + c.definitions.map((d) => '<div class="def"><dt>' + esc(d.terme) + "</dt><dd>" + inline(d.def) + "</dd></div>").join("") + "</dl></div>" : "") + "</div>";
  } else if (tab === "fiches") {
    body = '<div id="fc-slot"></div>';
  } else {
    body = '<div id="quiz-slot"></div>';
  }
  const prev = ch[idx - 1], nextC = ch[idx + 1];
  const nav = '<div style="display:flex;justify-content:space-between;gap:12px;margin-top:28px;flex-wrap:wrap">' +
    (prev ? '<a class="btn btn-plain" href="#c-' + m.id + "-" + prev.id + '-resume">' + ic("back", 16) + esc(prev.titre) + "</a>" : "<span></span>") +
    (nextC ? '<a class="btn btn-plain" href="#c-' + m.id + "-" + nextC.id + '-resume">' + esc(nextC.titre) + ic("chev", 16) + "</a>" : "") + "</div>";
  const html = '<nav class="crumbs" aria-label="Fil d\'Ariane"><a href="#accueil">Tableau de bord</a>' + ic("chev", 12) + '<a href="#m-' + m.id + '">' + esc(m.nom) + "</a>" + ic("chev", 12) + "<span>Chapitre " + (idx + 1) + "</span></nav>" +
    '<header class="chap-head"><div><div class="eyebrow" style="color:' + safeColor(m.couleur) + '">' + esc(m.nom) + " · Chapitre " + (idx + 1) + '</div><h1 class="h-large">' + esc(c.titre) + '</h1></div><div class="chap-tabs">' + seg + '<div style="display:flex;align-items:center;gap:10px">' + statusPill(s.p) + '<span class="small muted tnum">' + Math.round(s.p * 100) + " %</span></div></div></header>" +
    '<div role="tabpanel" id="chap-panel" aria-labelledby="tab-' + tab + '">' + body + "</div>" + nav;

  return { html, bind: () => bindChapter(m, c, tab) };
}

function bindChapter(m, c, tab) {
  const k = chapKey(m, c);
  // Navigation au clavier entre onglets (flèches, Début, Fin).
  const tabEls = $$('[role="tab"]');
  tabEls.forEach((el, i) => (el.onkeydown = (e) => {
    let j = null;
    if (e.key === "ArrowRight") j = (i + 1) % tabEls.length;
    else if (e.key === "ArrowLeft") j = (i - 1 + tabEls.length) % tabEls.length;
    else if (e.key === "Home") j = 0;
    else if (e.key === "End") j = tabEls.length - 1;
    if (j === null) return;
    e.preventDefault();
    location.hash = tabEls[j].dataset.go;
  }));
  const mr = $("#mark-read");
  if (mr) mr.onclick = () => { app.state.lu[k] = true; app.log(2); app.save(); toast("Chapitre marqué comme lu"); app.render(); };
  if (tab === "fiches") {
    const cards = (c.fiches || []).map((f, i) => ({ m, c, f, k: cardKey(m, c, i, f) }));
    if (!cards.length) $("#fc-slot").innerHTML = '<div class="card empty"><p>Pas encore de fiches pour ce chapitre.</p></div>';
    else mountFlashcards($("#fc-slot"), cards, { after: '<a class="btn btn-ghost" href="#c-' + m.id + "-" + c.id + '-quiz">Passer au quiz</a>' });
  }
  if (tab === "quiz") {
    mountQuiz($("#quiz-slot"), c.quiz || [], (ratio) => {
      const prev = app.state.quiz[k] || { best: 0, tries: 0 };
      app.state.quiz[k] = { best: Math.max(prev.best, ratio), last: ratio, tries: (prev.tries || 0) + 1 };
      app.save();
    }, { after: '<a class="btn btn-ghost" href="#m-' + m.id + '">Retour à la matière</a>' });
  }
}

export function mockExamView(m) {
  const items = [];
  (m.chapitres || []).forEach((c) => (c.quiz || []).forEach((q) => items.push(Object.assign({ _m: c.titre }, q))));
  const html = '<nav class="crumbs" aria-label="Fil d\'Ariane"><a href="#accueil">Tableau de bord</a>' + ic("chev", 12) + '<a href="#m-' + m.id + '">' + esc(m.nom) + "</a>" + ic("chev", 12) + '<span>Examen blanc</span></nav><header class="page-head"><div><div class="eyebrow" style="color:' + safeColor(m.couleur) + '">' + esc(m.nom) + '</div><h1 class="h-large">Examen blanc</h1><p class="lead">Questions de toute la matière, dans un ordre aléatoire. À la fin : ton score par chapitre et les questions ratées à refaire.</p></div></header><div id="quiz-slot"></div>';
  const bind = () => {
    const slot = $("#quiz-slot");
    if (!items.length) { mountQuiz(slot, items); return; }
    const seg = (name, label, opts, def) => '<div class="form-row"><div class="fl"><b id="mx-' + name + '">' + label + '</b></div><div class="seg" role="group" aria-labelledby="mx-' + name + '">' +
      opts.map((o) => '<button type="button" data-' + name + '="' + o[0] + '" aria-pressed="' + (o[0] === def) + '" class="' + (o[0] === def ? "on" : "") + '">' + o[1] + "</button>").join("") + "</div></div>";
    const counts = [10, 20].filter((n) => n < items.length).map((n) => [String(n), String(n)]).concat([["all", "Toutes (" + items.length + ")"]]);
    slot.innerHTML = '<div class="card">' + seg("n", "Nombre de questions", counts, counts.length > 1 ? counts[counts.length - 2][0] : "all") +
      seg("t", "Chronomètre", [["0", "Sans"], ["30", "30 s / question"], ["60", "1 min / question"]], "0") +
      '<div class="confirm" style="margin-top:14px"><button class="btn" id="mx-go" type="button">' + ic("play", 16) + "Commencer</button></div></div>";
    ["n", "t"].forEach((name) => $$("[data-" + name + "]", slot).forEach((b) => (b.onclick = () => {
      $$("[data-" + name + "]", slot).forEach((x) => { x.classList.toggle("on", x === b); x.setAttribute("aria-pressed", String(x === b)); });
    })));
    $("#mx-go", slot).onclick = () => {
      const n = $("[data-n].on", slot).dataset.n, per = +$("[data-t].on", slot).dataset.t;
      const chosen = n === "all" ? items : shuffle(items.slice()).slice(0, +n);
      mountQuiz(slot, chosen, null, { report: true, timeLimit: per * chosen.length, after: '<a class="btn btn-ghost" href="#m-' + m.id + '">Retour à la matière</a>' });
    };
  };
  return { html, bind };
}
