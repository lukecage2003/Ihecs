// Quiz à choix unique avec correction expliquée.
// Options : timeLimit (secondes, chrono pour tout le quiz), report (bilan par chapitre
// et « refaire les questions ratées »), after (HTML de boutons sous le résultat).

import { esc } from "../../core/html.js";
import { ic } from "../../core/icons.js";
import { inline } from "../../core/markdown.js";
import { quizReport } from "../../domain/quiz-stats.js";
import { app } from "../app.js";
import { $, $$, shuffle } from "../dom.js";
import { bar, ring } from "../widgets.js";

const mmss = (s) => Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0");

export function mountQuiz(slot, items, onDone, opts = {}) {
  let qs = shuffle(items.slice()), i = 0, answered = false, timer = null, left = 0, timeUp = false;
  const res = [];
  if (!qs.length) { slot.innerHTML = '<div class="card empty"><p>Pas encore de questions pour ce chapitre.</p></div>'; return; }

  const stopTimer = () => { if (timer) clearInterval(timer); timer = null; };
  function startTimer() {
    stopTimer();
    if (!opts.timeLimit) return;
    left = opts.timeLimit; timeUp = false;
    timer = setInterval(() => {
      if (!document.body.contains(slot)) { stopTimer(); return; } // vue quittée
      left--;
      const el = $("#q-clock", slot);
      if (el) { el.textContent = mmss(Math.max(0, left)); el.classList.toggle("low", left <= 30); }
      if (left <= 0) { stopTimer(); timeUp = true; i = qs.length; render(); }
    }, 1000);
  }
  const restart = (list) => { qs = shuffle(list.slice()); i = 0; res.length = 0; startTimer(); render(); };

  function result() {
    stopTimer();
    const rep = quizReport(qs, res), ratio = rep.ok / rep.total;
    if (onDone) onDone(ratio);
    const msg = timeUp ? "Temps écoulé." : ratio >= 0.85 ? "Excellent, c'est maîtrisé." : ratio >= 0.6 ? "Bien. Revois les points ratés et recommence." : "Relis le résumé, puis réessaie.";
    const sub = timeUp && rep.unanswered ? '<p class="muted" style="margin:0">' + rep.unanswered + " question(s) sans réponse, comptée(s) comme ratée(s).</p>" : "";
    const breakdown = opts.report && rep.byChapter.length > 1
      ? '<div class="card" style="margin-top:16px"><h3 class="h-card">Par chapitre</h3><div class="list" style="margin-top:8px">' + rep.byChapter.map((g) => {
        const p = g.ok / g.total;
        return '<div class="row" style="cursor:default"><div class="rx"><div class="rt">' + esc(g.titre) + '</div></div><div class="rbar">' + bar(p, p >= 0.85 ? "var(--good)" : p >= 0.6 ? "var(--accent)" : "var(--warn)") + '</div><span class="tnum small muted">' + g.ok + "/" + g.total + "</span></div>";
      }).join("") + "</div></div>"
      : "";
    const retry = opts.report && rep.missed.length ? '<button class="btn btn-ghost" id="q-missed" type="button">Refaire les ' + rep.missed.length + " question(s) ratée(s)</button>" : "";
    slot.innerHTML = '<div class="card result">' + ring(ratio, 140, 14, ratio >= 0.85 ? "var(--good)" : ratio >= 0.6 ? "var(--accent)" : "var(--warn)", '<div style="font-size:32px;font-weight:700">' + Math.round(ratio * 100) + '%</div><div class="small muted">' + rep.ok + "/" + rep.total + "</div>") +
      '<h3 class="h-sec">' + msg + "</h3>" + sub + '<div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:center"><button class="btn" id="q-again" type="button">' + ic("reset", 16) + "Recommencer</button>" + retry + (opts.after || "") + "</div></div>" + breakdown;
    $("#q-again", slot).onclick = () => restart(items);
    const m = $("#q-missed", slot);
    if (m) m.onclick = () => mountQuiz(slot, rep.missed, null, Object.assign({}, opts, { timeLimit: 0 }));
    app.refreshChrome();
  }

  function render() {
    if (i >= qs.length) { result(); return; }
    const q = qs[i];
    answered = false;
    const clock = timer ? '<span class="tnum q-clock" id="q-clock" role="timer" aria-label="Temps restant">' + ic("timer", 14) + " " + mmss(left) + "</span>" : "";
    slot.innerHTML = '<div class="quiz"><div class="fc-top"><span>' + (q._m ? esc(q._m) : "Question") + '</span><span style="display:flex;gap:12px;align-items:center">' + clock + '<span class="tnum">' + (i + 1) + " / " + qs.length + "</span></span></div>" +
      '<div class="qbar" aria-hidden="true">' + qs.map((_, j) => "<i" + (j < i ? ' class="' + (res[j] ? "ok" : "ko") + '"' : j === i ? ' class="cur"' : "") + "></i>").join("") + "</div>" +
      '<div class="card" style="display:flex;flex-direction:column;gap:18px"><h2 class="quiz-q">' + inline(q.q) + '</h2><div class="choices">' +
      q.choix.map((c, j) => '<button class="choice" type="button" data-j="' + j + '"><span class="letter">' + "ABCD"[j] + "</span><span>" + inline(c) + "</span></button>").join("") + '</div><div id="q-after" aria-live="polite"></div></div></div>';
    $$(".choice", slot).forEach((b) => (b.onclick = () => answer(+b.dataset.j)));
  }
  function answer(j) {
    if (answered || i >= qs.length) return;
    answered = true;
    const q = qs[i], good = j === q.bonne;
    res[i] = good;
    app.log(1);
    $$(".choice", slot).forEach((b, k) => { b.disabled = true; if (k === q.bonne) b.classList.add("right"); else if (k === j) b.classList.add("wrong"); });
    $("#q-after", slot).innerHTML = '<div class="explain"><b style="color:' + (good ? "var(--good)" : "var(--bad)") + '">' + (good ? "Correct" : "Incorrect") + "</b>" + inline(q.explication || "") + '</div><div style="display:flex;justify-content:flex-end;margin-top:14px"><button class="btn" id="q-next" type="button">' + (i + 1 < qs.length ? "Question suivante" : "Voir le résultat") + ic("chev", 16) + "</button></div>";
    $("#q-next", slot).onclick = next;
    $("#q-next", slot).focus({ preventScroll: true });
  }
  function next() { i++; render(); window.scrollTo({ top: 0, behavior: "smooth" }); }
  app.keyHandler = (e) => {
    if (!document.body.contains(slot) || !$(".quiz", slot)) return;
    if (e.target.closest("input, textarea")) return;
    const k = e.key.toLowerCase();
    if (!answered && k.length === 1 && "abcd".includes(k)) { const j = "abcd".indexOf(k); if (j < qs[i].choix.length) answer(j); }
    else if (answered && e.key === "Enter" && document.activeElement && document.activeElement.id !== "q-next") { e.preventDefault(); next(); }
  };
  startTimer();
  render();
}
