// Coquille : barre latérale, barre d'onglets mobile, en-tête mobile.

import { esc } from "../core/html.js";
import { ic } from "../core/icons.js";
import { subjectProgress } from "../domain/progress.js";
import { dueCards } from "../domain/srs.js";
import { app } from "./app.js";
import { $ } from "./dom.js";
import { openSearch } from "./components/spotlight.js";
import { sync } from "./workspace.js";
import { dot } from "./widgets.js";

export function renderShell(route) {
  const D = app.content;
  const due = dueCards(D, app.state.cartes, app.today()).length;
  const cur = (href) => (route.nav === href ? ' class="active" aria-current="page"' : "");
  const a = (href, label, icon, badge) => '<a href="' + href + '"' + cur(href) + '><span class="nav-ico">' + ic(icon, 18) + '</span><span class="t">' + label + "</span>" + (badge ? '<span class="badge">' + badge + "</span>" : "") + "</a>";
  const demo = app.workspace && app.workspace.kind === "demo" ? '<span class="pill pill-warn" title="Cours fictifs">Démo</span>' : app.workspace && app.workspace.kind === "copy" && app.workspace.source !== "local" ? '<span class="pill pill-info" title="Copie de tes cours sur cet appareil">Copie</span>' : '<span class="pill pill-good" title="Ton espace académique">Mon espace</span>';
  const syncLine = app.real ? (sync.state === "error" ? '<a href="#parametres" style="color:var(--bad)">Échec de l\'enregistrement</a>' : sync.state === "saving" ? "Enregistrement dans Drive…" : "Enregistré dans Drive" + (sync.at ? " à " + sync.at.toLocaleTimeString("fr-BE", { hour: "2-digit", minute: "2-digit" }) : "")) : "";
  $("#sidebar").innerHTML =
    '<div class="brand"><div class="brand-mark">' + ic("book", 18) + '</div><div><div class="brand-name">Révisions ' + demo + '</div><div class="brand-sub">' + esc(D.ecole || "") + " · " + esc((D.annee || "").split("—")[0].trim()) + "</div></div></div>" +
    '<button class="search-btn" id="open-search" type="button">' + ic("search", 16) + "Rechercher<kbd>⌘K</kbd></button>" +
    '<nav class="nav" aria-label="Principal">' + a("#accueil", "Tableau de bord", "home") + a("#revision", "Révision du jour", "cards", due || "") + a("#examens", "Examens", "exam") + a("#planning", "Planning", "plan") + "</nav>" +
    '<div class="nav-label" id="nav-subjects">Matières</div><nav class="nav" aria-labelledby="nav-subjects">' +
    app.M.map((m) => '<a href="#m-' + m.id + '"' + cur("#m-" + m.id) + ">" + dot(m) + '<span class="t">' + esc(m.nom) + '</span><span class="badge">' + Math.round(subjectProgress(app.state, m) * 100) + "%</span></a>").join("") +
    "</nav>" +
    '<nav class="nav" style="margin-top:14px" aria-label="Réglages">' + a("#parametres", "Réglages", "gear") + "</nav>" +
    '<div class="sidebar-foot" id="sync-status" role="status">' + (syncLine || esc(D.session ? D.session.nom : "")) + "</div>";
  const t = (href, label, icon) => '<a href="' + href + '"' + (route.tab === href ? ' class="active" aria-current="page"' : "") + ">" + ic(icon, 24) + label + "</a>";
  $("#tabbar").innerHTML = t("#accueil", "Accueil", "home") + t("#matieres", "Matières", "book") + t("#revision", "Révision", "cards") + t("#examens", "Examens", "exam") + t("#planning", "Planning", "plan");
  $("#mobile-top").innerHTML = '<div class="brand"><div class="brand-mark">' + ic("book", 18) + '</div><div class="brand-name">Révisions ' + demo + '</div></div><div style="display:flex;gap:8px"><button class="icon-btn" id="open-search-m" type="button" aria-label="Rechercher">' + ic("search", 18) + '</button><a class="icon-btn" href="#parametres" aria-label="Réglages">' + ic("gear", 18) + "</a></div>";
  $("#open-search").onclick = openSearch;
  $("#open-search-m").onclick = openSearch;
}
