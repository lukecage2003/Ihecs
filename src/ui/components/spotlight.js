// Recherche globale (⌘K / Ctrl K / « / »).

import { esc } from "../../core/html.js";
import { ic } from "../../core/icons.js";
import { buildIndex, search } from "../../domain/search.js";
import { app } from "../app.js";
import { $, $$ } from "../dom.js";
import { dot } from "../widgets.js";

let index = null;
let lastFocus = null;

export const isSearchOpen = () => !$("#spotlight").hidden;

/** À appeler quand l'espace change : l'index sera reconstruit avec le nouveau contenu. */
export function resetSearchIndex() { index = null; }

export function openSearch() {
  index = index || buildIndex(app.content);
  lastFocus = document.activeElement;
  const host = $("#spotlight");
  host.hidden = false;
  host.innerHTML = '<div class="spot-backdrop" id="spot-bg"><div class="spot" role="dialog" aria-modal="true" aria-label="Recherche"><div class="spot-in">' + ic("search") + '<input id="spot-q" type="text" role="combobox" aria-expanded="true" aria-controls="spot-res" aria-label="Rechercher" placeholder="Rechercher un chapitre, une notion, un auteur…" autocomplete="off" spellcheck="false"><kbd>Échap</kbd></div><div class="spot-res" id="spot-res" role="listbox"></div></div></div>';
  const input = $("#spot-q"), resEl = $("#spot-res");
  let results = [], sel = 0;
  function run() { results = search(index, input.value); sel = 0; paint(); }
  function paint() {
    if (!results.length) { resEl.innerHTML = '<div class="spot-empty">Aucun résultat</div>'; return; }
    let g = "", html = "";
    results.forEach((x, j) => {
      if (x.g !== g) { g = x.g; html += '<div class="spot-group" role="presentation">' + g + "</div>"; }
      html += '<div class="spot-item' + (j === sel ? " sel" : "") + '" role="option" id="spot-' + j + '" aria-selected="' + (j === sel) + '" data-j="' + j + '">' + dot(x.m, x.g === "Fiches" ? "cards" : x.g === "Définitions" ? "book" : x.m.icone) + '<div class="si-x"><div class="si-t">' + esc(x.t) + '</div><div class="si-s">' + esc(x.s) + "</div></div></div>";
    });
    resEl.innerHTML = html;
    input.setAttribute("aria-activedescendant", "spot-" + sel);
    $$(".spot-item", resEl).forEach((el) => { el.onclick = () => go(+el.dataset.j); el.onmousemove = () => { if (sel !== +el.dataset.j) { sel = +el.dataset.j; paint(); } }; });
    const s = $(".spot-item.sel", resEl); if (s) s.scrollIntoView({ block: "nearest" });
  }
  function go(j) { const x = results[j]; closeSearch(); if (x) location.hash = x.href; }
  input.oninput = run;
  input.onkeydown = (e) => {
    if (e.key === "ArrowDown") { e.preventDefault(); sel = Math.min(results.length - 1, sel + 1); paint(); }
    else if (e.key === "ArrowUp") { e.preventDefault(); sel = Math.max(0, sel - 1); paint(); }
    else if (e.key === "Enter") { e.preventDefault(); go(sel); }
    else if (e.key === "Escape") closeSearch();
  };
  $("#spot-bg").onclick = (e) => { if (e.target.id === "spot-bg") closeSearch(); };
  run();
  setTimeout(() => input.focus(), 10);
}

export function closeSearch() {
  const h = $("#spotlight");
  h.hidden = true;
  h.innerHTML = "";
  if (lastFocus && document.body.contains(lastFocus)) lastFocus.focus({ preventScroll: true });
}
