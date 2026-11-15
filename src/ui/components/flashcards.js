// Session de fiches recto verso avec notation Leitner.

import { esc } from "../../core/html.js";
import { ic } from "../../core/icons.js";
import { inline } from "../../core/markdown.js";
import { cardState, nextDelay, rate as rateCard } from "../../domain/srs.js";
import { app } from "../app.js";
import { $, $$, shuffle } from "../dom.js";
import { dot, ring } from "../widgets.js";

export function mountFlashcards(slot, cards, opts = {}) {
  let queue = cards.slice();
  let i = 0, flipped = false, seen = 0;
  const counts = { 1: 0, 2: 0, 3: 0, 4: 0 };
  const label = (k, r) => { const d = nextDelay(cardState(app.state.cartes, k), r); return d === 1 ? "1 jour" : d + " jours"; };

  function render() {
    if (!queue.length) {
      slot.innerHTML = '<div class="card empty"><div class="icon-tile" style="background:var(--good-soft);color:var(--good)">' + ic("check") + '</div><h3 class="h-card">Tout est à jour</h3><p>' + (opts.emptyText || "Aucune fiche à réviser maintenant. Reviens demain.") + "</p>" + (opts.allCards && opts.allCards.length ? '<button class="btn btn-ghost" id="fc-all" type="button">' + ic("shuffle", 16) + "Réviser quand même les " + opts.allCards.length + " fiches</button>" : "") + "</div>";
      const b = $("#fc-all", slot); if (b) b.onclick = () => { queue = shuffle(opts.allCards.slice()); i = 0; render(); };
      return;
    }
    if (i >= queue.length) {
      const ok = counts[3] + counts[4];
      slot.innerHTML = '<div class="card result">' + ring(seen ? ok / seen : 0, 120, 12, "var(--good)", '<div style="font-size:26px;font-weight:700">' + ok + "/" + seen + "</div>") + '<h3 class="h-sec">Session terminée</h3><p class="muted" style="margin:0">' + counts[1] + " à revoir · " + counts[2] + " difficiles · " + counts[3] + " bien · " + counts[4] + ' faciles</p><div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:center"><button class="btn" id="fc-again" type="button">' + ic("reset", 16) + "Recommencer</button>" + (opts.after || "") + "</div></div>";
      $("#fc-again", slot).onclick = () => { queue = shuffle(cards.slice()); i = 0; seen = 0; counts[1] = counts[2] = counts[3] = counts[4] = 0; render(); };
      app.refreshChrome();
      return;
    }
    const x = queue[i];
    flipped = false;
    slot.innerHTML = '<div class="fc-wrap"><div class="fc-top"><span>' + dot(x.m, null, 13, "display:inline-grid;vertical-align:middle;margin-right:6px") + esc(x.c.titre) + '</span><span class="tnum">' + (i + 1) + " / " + queue.length + "</span></div>" +
      '<div class="qbar" aria-hidden="true">' + queue.map((_, j) => "<i" + (j < i ? ' class="ok"' : j === i ? ' class="cur"' : "") + "></i>").join("") + "</div>" +
      '<div class="fc" id="fc" tabindex="0" role="button" aria-label="Retourner la fiche" aria-pressed="false"><div class="fc-inner"><div class="fc-face"><span class="fc-tag">Question</span><div class="fc-q">' + inline(x.f.q) + '</div><div class="fc-hint">Clique ou appuie sur Espace pour voir la réponse</div></div>' +
      '<div class="fc-face fc-back" aria-live="polite"><span class="fc-tag">Réponse</span><div class="fc-a">' + inline(x.f.r) + "</div></div></div></div>" +
      '<div class="rate" id="rate" hidden><button class="r1" type="button" data-r="1">À revoir<small>aujourd\'hui</small></button><button class="r2" type="button" data-r="2">Difficile<small>demain</small></button><button class="r3" type="button" data-r="3">Bien<small>' + label(x.k, 3) + '</small></button><button class="r4" type="button" data-r="4">Facile<small>' + label(x.k, 4) + "</small></button></div>" +
      '<div class="kbd-hint"><kbd>Espace</kbd> retourner · <kbd>1</kbd>–<kbd>4</kbd> noter</div></div>';
    $("#fc", slot).onclick = flip;
    $$("#rate button", slot).forEach((b) => (b.onclick = () => rate(+b.dataset.r)));
  }
  function flip() {
    flipped = !flipped;
    const fc = $("#fc", slot);
    fc.classList.toggle("flip", flipped);
    fc.setAttribute("aria-pressed", String(flipped));
    if (flipped) $("#rate", slot).hidden = false;
  }
  function rate(r) {
    if (!flipped) return;
    const x = queue[i];
    app.state.cartes[x.k] = rateCard(cardState(app.state.cartes, x.k), r, app.today());
    app.log(1);
    counts[r]++; seen++;
    if (r === 1) queue.push(x);
    i++;
    render();
  }
  app.keyHandler = (e) => {
    if (!document.body.contains(slot) || !$("#fc", slot)) return;
    if (e.target.closest("input, textarea")) return;
    if (e.code === "Space" || e.key === "Enter") { e.preventDefault(); flip(); }
    else if (/^[1-4]$/.test(e.key)) rate(+e.key);
  };
  render();
}
