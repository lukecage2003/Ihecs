// Point d'entrée : charge l'espace de travail, l'état, puis gère la navigation.

import { esc } from "./core/html.js";
import { currentWorkspace } from "./content/workspaces.js";
import { parseRoute } from "./domain/router.js";
import { loadState } from "./state/store.js";
import { app, safeStorage } from "./ui/app.js";
import { closeSearch, isSearchOpen, openSearch } from "./ui/components/spotlight.js";
import { $, $$ } from "./ui/dom.js";
import { renderShell } from "./ui/shell.js";
import { applyTheme } from "./ui/theme.js";
import { chapterView, mockExamView } from "./ui/views/chapter.js";
import { homeView } from "./ui/views/home.js";
import { settingsView } from "./ui/views/settings.js";
import { examsView, planningView, revisionView } from "./ui/views/study.js";
import { subjectsView, subjectView } from "./ui/views/subjects.js";

function notFoundView(id) {
  return { html: '<div class="card empty"><h1 class="h-card">Page introuvable</h1><p>Le lien « ' + esc(id) + " » ne correspond à aucune page.</p><a class=\"btn\" href=\"#accueil\">Retour au tableau de bord</a></div>" };
}

function viewFor(r) {
  switch (r.name) {
    case "home": return homeView();
    case "subjects": return subjectsView();
    case "subject": return r.m ? subjectView(r.m) : notFoundView("m-…");
    case "chapter": return r.c ? chapterView(r.m, r.c, r.t) : notFoundView("chapitre");
    case "blanc": return r.m ? mockExamView(r.m) : notFoundView("examen blanc");
    case "revision": return revisionView();
    case "exams": return examsView();
    case "planning": return planningView();
    case "settings": return settingsView();
    default: return notFoundView(r.id);
  }
}

function render() {
  const r = parseRoute(location.hash, app.content);
  if (r.name === "unknown") {
    // Ancre interne (sommaire d'un résumé) : on défile sans changer de vue.
    const el = r.id && document.getElementById(r.id);
    if (el && $("#view").contains(el)) { el.scrollIntoView({ behavior: "smooth", block: "start" }); return; }
  }
  app.route = r;
  app.keyHandler = null;
  const v = viewFor(r);
  $("#view").innerHTML = '<div class="view">' + v.html + "</div>";
  renderShell(r.name === "unknown" ? { nav: "", tab: "" } : r);
  window.scrollTo(0, 0);
  bindCommon();
  if (v.bind) v.bind();
}

function bindCommon() {
  const v = $("#view");
  $$("[data-go]", v).forEach((b) => (b.onclick = () => (location.hash = b.dataset.go)));
  $$("[data-task]", v).forEach((b) => (b.onclick = () => {
    const k = b.dataset.task;
    app.state.plan[k] = !app.state.plan[k];
    app.save();
    b.classList.toggle("on", app.state.plan[k]);
    b.setAttribute("aria-pressed", String(app.state.plan[k]));
    b.closest(".task").classList.toggle("done", app.state.plan[k]);
    if (app.state.plan[k]) app.log(1);
  }));
  $$("[data-anchor]", v).forEach((a) => (a.onclick = (e) => {
    e.preventDefault();
    const el = document.getElementById(a.dataset.anchor);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }));
}

function boot() {
  app.workspace = currentWorkspace();
  app.content = app.workspace.content;
  app.storage = safeStorage();
  app.state = loadState(app.storage);
  app.render = render;
  app.refreshChrome = () => { if (app.route) renderShell(app.route.name === "unknown" ? { nav: "", tab: "" } : app.route); };
  document.documentElement.dataset.workspace = app.workspace.kind;

  document.addEventListener("keydown", (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); isSearchOpen() ? closeSearch() : openSearch(); return; }
    if (e.key === "/" && !e.target.closest("input, textarea") && !isSearchOpen()) { e.preventDefault(); openSearch(); return; }
    if (e.key === "Escape" && isSearchOpen()) { closeSearch(); return; }
    if (isSearchOpen()) return;
    if (app.keyHandler) app.keyHandler(e);
  });
  window.addEventListener("hashchange", render);
  applyTheme(app.state.theme);
  render();
}

boot();
