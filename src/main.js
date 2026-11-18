// Point d'entrée : charge l'espace de travail, l'état, puis gère la navigation.

import { esc } from "./core/html.js";
import { parseRoute } from "./domain/router.js";
import { permission } from "./storage/folder.js";
import { app } from "./ui/app.js";
import { closeSearch, isSearchOpen, openSearch } from "./ui/components/spotlight.js";
import { $, $$ } from "./ui/dom.js";
import { renderShell } from "./ui/shell.js";
import { ic } from "./core/icons.js";
import { activateCopy, activateDemo, activateReal, activeWorkspacePref, storedRoot, switchToDemo } from "./ui/workspace.js";
import { chapterView, mockExamView } from "./ui/views/chapter.js";
import { homeView } from "./ui/views/home.js";
import { settingsView } from "./ui/views/settings.js";
import { importView } from "./ui/views/import.js";
import { examsView, planningView, revisionView } from "./ui/views/study.js";
import { subjectsView, subjectView } from "./ui/views/subjects.js";

function notFoundView(id) {
  return { html: '<div class="card empty"><h1 class="h-card">Page introuvable</h1><p>Le lien « ' + esc(id) + " » ne correspond à aucune page.</p><a class=\"btn\" href=\"#accueil\">Retour au tableau de bord</a></div>" };
}

/** Écran affiché quand ton espace réel attend l'accord de Chrome pour lire le dossier. */
function accessView() {
  const name = app.gate.root.name;
  return {
    html: '<div class="card empty" style="max-width:560px;margin:8vh auto 0"><div class="icon-tile" style="background:var(--accent-soft);color:var(--accent)">' + ic("folder") + '</div><h1 class="h-sec">Ouvrir ton espace académique</h1><p>Ton espace est dans le dossier Drive « <b>' + esc(name) + "</b> ». Chrome demande ton accord pour l'ouvrir.</p><div class=\"confirm\" style=\"justify-content:center\"><button class=\"btn\" id=\"gate-allow\" type=\"button\">Autoriser mon dossier Drive</button><button class=\"btn btn-plain\" id=\"gate-demo\" type=\"button\">Continuer en démonstration</button></div><p class=\"small\" id=\"gate-msg\" style=\"margin-top:14px\"></p></div>",
    bind: () => {
      $("#gate-allow").onclick = async () => {
        const root = app.gate.root;
        if ((await permission(root, true)) !== "granted") { $("#gate-msg").textContent = "Accès refusé par Chrome. Réessaie et choisis « Autoriser »."; return; }
        try { await activateReal(root); } catch (e) { $("#gate-msg").textContent = "Impossible d'ouvrir l'espace : " + e.message; return; }
        render();
      };
      $("#gate-demo").onclick = async () => { await switchToDemo(); render(); };
    }
  };
}

function viewFor(r) {
  if (app.gate) return accessView();
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
    case "import": return importView();
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
  document.documentElement.dataset.workspace = app.gate ? "pending" : app.workspace.kind;
  const v = viewFor(r);
  const notice = app.startupError ? '<div class="banner" role="alert" style="background:var(--bad-soft)"><div><b>Attention.</b> ' + esc(app.startupError) + "</div></div>" : "";
  $("#view").innerHTML = '<div class="view">' + notice + v.html + "</div>";
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

/** Choisit l'espace au démarrage : l'espace réel s'il était ouvert la dernière fois, sinon la démonstration. */
async function startWorkspace() {
  activateDemo();
  const pref = await activeWorkspacePref();
  if (pref === "copy") { await activateCopy(); return; }
  if (pref !== "real") return;
  const root = await storedRoot();
  if (!root) return;
  const p = await permission(root);
  if (p === "granted") {
    try { await activateReal(root); }
    catch (e) { app.startupError = "Impossible d'ouvrir ton espace dans « " + root.name + " » : " + e.message + " La démonstration est affichée en attendant."; }
  } else {
    // Espace réel attendu : on n'affiche pas la démonstration à sa place (D3).
    app.gate = { root };
    app.workspace = { id: "pending", kind: "real", label: "Mon espace", folderName: root.name, description: "" };
    app.content = { matieres: [] };
  }
}

async function boot() {
  app.render = render;
  app.refreshChrome = () => { if (app.route) renderShell(app.route.name === "unknown" ? { nav: "", tab: "" } : app.route); };

  document.addEventListener("keydown", (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); isSearchOpen() ? closeSearch() : openSearch(); return; }
    if (e.key === "/" && !e.target.closest("input, textarea") && !isSearchOpen()) { e.preventDefault(); openSearch(); return; }
    if (e.key === "Escape" && isSearchOpen()) { closeSearch(); return; }
    if (isSearchOpen()) return;
    if (app.keyHandler) app.keyHandler(e);
  });
  window.addEventListener("hashchange", render);
  $("#view").innerHTML = '<div class="card empty" style="margin-top:8vh"><p>Ouverture…</p></div>';
  try { await startWorkspace(); } catch (e) { activateDemo(); app.startupError = "Erreur au démarrage : " + e.message; }
  render();
  document.body.dataset.ready = "1";
}

boot();
