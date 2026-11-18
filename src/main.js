// Point d'entrée : charge l'espace de travail, l'état, puis gère la navigation.

import { esc } from "./core/html.js";
import { parseRoute } from "./domain/router.js";
import { permission } from "./storage/folder.js";
import { app } from "./ui/app.js";
import { closeSearch, isSearchOpen, openSearch } from "./ui/components/spotlight.js";
import { $, $$ } from "./ui/dom.js";
import { renderShell } from "./ui/shell.js";
import { ic } from "./core/icons.js";
import { activateCopy, activateDemo, activateReal, hasBuiltin, openLocal, activeWorkspacePref, storedRoot, switchToDemo } from "./ui/workspace.js";
import { chapterView, mockExamView } from "./ui/views/chapter.js";
import { homeView } from "./ui/views/home.js";
import { settingsView } from "./ui/views/settings.js";
import { importView } from "./ui/views/import.js";
import { examsView, planningView, revisionView } from "./ui/views/study.js";
import { subjectsView, subjectView } from "./ui/views/subjects.js";

function notFoundView(id) {
  return { html: '<div class="card empty"><h1 class="h-card">Page introuvable</h1><p>Le lien « ' + esc(id) + " » ne correspond à aucune page.</p><a class=\"btn\" href=\"#accueil\">Retour au tableau de bord</a></div>" };
}

/** Écran d'accueil de ton espace réel : rien n'est lu dans le dossier avant ton clic. */
function accessView() {
  const name = app.gate.root.name;
  return {
    html: '<div class="card empty" style="max-width:560px;margin:8vh auto 0"><div class="icon-tile" style="background:var(--accent-soft);color:var(--accent)">' + ic("folder") + '</div><h1 class="h-sec">Ouvrir ton espace académique</h1><p>Ton espace est dans le dossier « <b>' + esc(name) + "</b> ». Il n'est ouvert que quand tu le demandes.</p><div class=\"confirm\" style=\"justify-content:center\"><button class=\"btn\" id=\"gate-allow\" type=\"button\">Ouvrir mon espace</button><button class=\"btn btn-plain\" id=\"gate-local\" type=\"button\">Sans dossier : mes cours dans ce navigateur</button><button class=\"btn btn-plain\" id=\"gate-demo\" type=\"button\">Continuer en démonstration</button></div><p class=\"small\" id=\"gate-msg\" style=\"margin-top:14px\" aria-live=\"polite\"></p></div>",
    bind: () => {
      const msg = $("#gate-msg"), allow = $("#gate-allow");
      let busy = false;
      allow.onclick = async () => {
        if (busy) return;
        const root = app.gate.root;
        if ((await permission(root, true)) !== "granted") { msg.textContent = "Accès refusé par le navigateur. Réessaie et choisis « Autoriser »."; return; }
        busy = true; allow.disabled = true;
        let step = "ouverture";
        msg.textContent = "Ouverture…";
        const slow = setTimeout(() => { msg.textContent = "Ça prend du temps (étape : " + step + "). Vérifie que Google Drive pour ordinateur est lancé et synchronisé, ou continue en démonstration."; }, 8000);
        try { await activateReal(root, (t) => { step = t; }); }
        catch (e) { clearTimeout(slow); busy = false; allow.disabled = false; msg.textContent = "Impossible d'ouvrir l'espace : " + e.message; return; }
        clearTimeout(slow);
        render();
      };
      $("#gate-local").onclick = async () => {
        try { await openLocal(); } catch (e) { msg.textContent = "Impossible d'utiliser le stockage de ce navigateur : " + e.message; return; }
        location.hash = app.M.length ? "#accueil" : "#importer";
        render();
      };
      // Rechargement : une ouverture en cours est abandonnée proprement.
      $("#gate-demo").onclick = async () => { try { await switchToDemo(); } catch (e) { /* préférence non enregistrée */ } location.reload(); };
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
  try { renderView(); }
  catch (e) {
    console.error(e);
    $("#view").innerHTML = '<div class="card empty" style="max-width:620px;margin:8vh auto 0" role="alert"><h1 class="h-sec">Cette page n\'a pas pu s\'afficher</h1><p>Erreur : <code>' + esc(e && e.message ? e.message : String(e)) + '</code></p><p class="small muted">Tes fichiers n\'ont pas été modifiés. Envoie une capture de ce message pour que le problème soit corrigé.</p><div class="confirm" style="justify-content:center"><a class="btn" href="#accueil">Tableau de bord</a><a class="btn btn-plain" href="#parametres">Réglages</a></div></div>';
  }
}

function renderView() {
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
let bootStep = "démarrage";
async function startWorkspace() {
  activateDemo();
  bootStep = "lecture des préférences de ce navigateur";
  const pref = await activeWorkspacePref();
  // Par défaut : tes cours (intégrés au site), ouverts directement, sans dossier.
  if (pref === "local" || (pref === undefined && hasBuiltin())) {
    bootStep = "ouverture de tes cours";
    try { await openLocal(); } catch (e) { if (!(await activateCopy())) activateDemo(); app.startupError = "Mise à jour des cours impossible : " + e.message; }
    return;
  }
  if (pref !== "real") return;
  const root = await storedRoot();
  if (!root) return;
  // Le dossier Drive n'est jamais lu tout seul au démarrage : le site s'ouvre tout de
  // suite et l'espace est ouvert d'un clic. Espace réel attendu : on n'affiche pas la
  // démonstration à sa place (D3).
  app.gate = { root };
  app.workspace = { id: "pending", kind: "real", label: "Mon espace", folderName: root.name, description: "" };
  app.content = { matieres: [] };
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
  // Le dossier Drive peut ne jamais répondre (fichier en cours de synchronisation,
  // Drive pour ordinateur arrêté…). Après un délai, on dit quelle étape bloque au
  // lieu de rester sur « Ouverture… ». Si l'ouverture finit ensuite, l'espace s'affiche.
  let decided = false;
  const finish = () => { if (decided) return; decided = true; render(); document.body.dataset.ready = "1"; };
  const slow = setTimeout(() => { if (!decided) stuckScreen(); }, 8000);
  try { await startWorkspace(); } catch (e) { activateDemo(); app.startupError = "Erreur au démarrage : " + e.message; }
  clearTimeout(slow);
  finish();

  function stuckScreen() {
    $("#view").innerHTML = '<div class="card empty" style="max-width:620px;margin:8vh auto 0" role="alert"><h1 class="h-sec">Ton espace met trop de temps à s\'ouvrir</h1><p>Étape en attente : <b>' + esc(bootStep) + '</b>.</p><p class="small muted">Vérifie que Google Drive pour ordinateur est lancé et connecté, et que la synchronisation est terminée. Rien n\'a été modifié dans tes fichiers.</p><div class="confirm" style="justify-content:center"><button class="btn" id="stuck-retry" type="button">Réessayer</button><button class="btn btn-plain" id="stuck-demo" type="button">Continuer en démonstration</button></div></div>';
    $("#stuck-retry").onclick = () => location.reload();
    // Rechargement : l'ouverture en cours est abandonnée proprement, le dossier n'est plus lu.
    $("#stuck-demo").onclick = async () => { decided = true; try { await switchToDemo(); } catch (e) { /* préférence non enregistrée */ } location.reload(); };
  }
}

boot();
