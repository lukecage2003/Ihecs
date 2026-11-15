// Quiz à choix unique avec correction expliquée.

import { esc } from "../../core/html.js";
import { ic } from "../../core/icons.js";
import { inline } from "../../core/markdown.js";
import { app } from "../app.js";
import { $, $$, shuffle } from "../dom.js";
import { ring } from "../widgets.js";

export function mountQuiz(slot, items, onDone, opts = {}) {
  let qs = shuffle(items.slice()), i = 0, answered = false;
  const res = [];
  if (!qs.length) { slot.innerHTML = '<div class="card empty"><p>Pas encore de questions pour ce chapitre.</p></div>'; return; }
  function render() {
    if (i >= qs.length) {
      const ok = res.filter(Boolean).length, ratio = ok / qs.length;
      if (onDone) onDone(ratio);
      const msg = ratio >= 0.85 ? "Excellent, c'est maîtrisé." : ratio >= 0.6 ? "Bien. Revois les points ratés et recommence." : "Relis le résumé, puis réessaie.";
      slot.innerHTML = '<div class="card result">' + ring(ratio, 140, 14, ratio >= 0.85 ? "var(--good)" : ratio >= 0.6 ? "var(--accent)" : "var(--warn)", '<div style="font-size:32px;font-weight:700">' + Math.round(ratio * 100) + '%</div><div class="small muted">' + ok + "/" + qs.length + "</div>") +
        '<h3 class="h-sec">' + msg + '</h3><div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:center"><button class="btn" id="q-again" type="button">' + ic("reset", 16) + "Recommencer</button>" + (opts.after || "") + "</div></div>";
      $("#q-again", slot).onclick = () => { qs = shuffle(items.slice()); i = 0; res.length = 0; render(); };
      app.refreshChrome();
      return;
    }
    const q = qs[i];
    answered = false;
    slot.innerHTML = '<div class="quiz"><div class="fc-top"><span>' + (q._m ? esc(q._m) : "Question") + '</span><span class="tnum">' + (i + 1) + " / " + qs.length + "</span></div>" +
      '<div class="qbar" aria-hidden="true">' + qs.map((_, j) => "<i" + (j < i ? ' class="' + (res[j] ? "ok" : "ko") + '"' : j === i ? ' class="cur"' : "") + "></i>").join("") + "</div>" +
      '<div class="card" style="display:flex;flex-direction:column;gap:18px"><h2 class="quiz-q">' + inline(q.q) + '</h2><div class="choices">' +
      q.choix.map((c, j) => '<button class="choice" type="button" data-j="' + j + '"><span class="letter">' + "ABCD"[j] + "</span><span>" + inline(c) + "</span></button>").join("") + '</div><div id="q-after" aria-live="polite"></div></div></div>';
    $$(".choice", slot).forEach((b) => (b.onclick = () => answer(+b.dataset.j)));
  }
  function answer(j) {
    if (answered) return;
    answered = true;
    const q = qs[i], good = j === q.bonne;
    res.push(good);
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
  render();
}
