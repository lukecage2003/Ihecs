// Espace académique réel au format v2 : fichiers du dossier Drive, validation
// et conversion avec l'état utilisé par l'interface. Fonctions pures.
//
// Organisation du dossier choisi (ex. « Mon Drive/IHECS STUDY OS ») :
//   ihecs-study-os.json                        manifeste de l'espace (écrit en dernier à la création)
//   structure.json                             structure académique (fichier partagé, écriture vérifiée)
//   appareils/<appareil>/etat.json             progression de CET appareil (un seul rédacteur)
//   appareils/<appareil>/revisions-AAAA-MM.jsonl  journal des révisions, ajout seul
//
// Chaque appareil n'écrit que dans son propre sous-dossier : Drive n'a jamais
// deux versions du même fichier à départager (décision « pire cas »).

import { FORMAT, SCHEMA_VERSION, validateStateV2 } from "./schema.js";

export const MANIFEST_FILE = "ihecs-study-os.json";
export const STRUCTURE_FILE = "structure.json";
export const DEVICES_DIR = "appareils";
export const STATE_FILE = "etat.json";
export const reviewLogFile = (date) => "revisions-" + date.toISOString().slice(0, 7) + ".jsonl";

const isObj = (v) => v !== null && typeof v === "object" && !Array.isArray(v);
const isIso = (v) => typeof v === "string" && !Number.isNaN(Date.parse(v));
const isId = (v) => typeof v === "string" && /^[A-Za-z0-9-]{8,64}$/.test(v);
const THEMES = ["auto", "light", "dark"];

/* ---------------- Manifeste ---------------- */

export function newManifest({ workspaceId, deviceId, now, name = "Mon espace académique" }) {
  return {
    format: FORMAT,
    kind: "workspace-manifest",
    schemaVersion: SCHEMA_VERSION,
    workspace: { id: workspaceId, kind: "real", name },
    createdAt: now.toISOString(),
    createdByDevice: deviceId,
    layout: { structure: STRUCTURE_FILE, devices: DEVICES_DIR + "/" }
  };
}

export function validateManifest(m) {
  const e = [];
  if (!isObj(m)) return ["Le manifeste n'est pas un objet."];
  if (m.format !== FORMAT || m.kind !== "workspace-manifest") e.push("Ce fichier n'est pas un manifeste IHECS STUDY OS.");
  if (m.schemaVersion !== SCHEMA_VERSION) e.push("Version de format non prise en charge : " + m.schemaVersion + " (attendu : " + SCHEMA_VERSION + ").");
  if (!isObj(m.workspace) || !isId(m.workspace.id) || m.workspace.kind !== "real" || typeof m.workspace.name !== "string") e.push("Description de l'espace invalide.");
  if (!isIso(m.createdAt)) e.push("Date de création invalide.");
  return e;
}

/* ---------------- Structure académique ---------------- */

export function newStructure({ workspaceId, now }) {
  return { format: FORMAT, kind: "academic-structure", schemaVersion: SCHEMA_VERSION, workspaceId, updatedAt: now.toISOString(), years: [], subjects: [] };
}

export function validateStructure(s, workspaceId) {
  const e = [];
  if (!isObj(s)) return ["La structure n'est pas un objet."];
  if (s.format !== FORMAT || s.kind !== "academic-structure") e.push("Ce fichier n'est pas une structure académique IHECS STUDY OS.");
  if (s.schemaVersion !== SCHEMA_VERSION) e.push("Version de structure non prise en charge : " + s.schemaVersion + ".");
  if (workspaceId && s.workspaceId !== workspaceId) e.push("Cette structure appartient à un autre espace.");
  if (!Array.isArray(s.years)) e.push("Liste des années invalide.");
  if (!Array.isArray(s.subjects)) e.push("Liste des matières invalide.");
  for (const sub of Array.isArray(s.subjects) ? s.subjects : []) {
    if (!isObj(sub) || typeof sub.id !== "string" || (typeof sub.nom !== "string" && typeof sub.name !== "string")) e.push("Matière invalide.");
  }
  return e;
}

/**
 * Contenu affichable par l'interface à partir de la structure.
 * Les matières importées utilisent les noms de champs français (voir COURSE_PACK.md) ;
 * les noms anglais (name, color…) restent acceptés.
 */
export function contentFromStructure(structure, manifest) {
  return {
    exemple: false,
    ecole: "IHECS",
    annee: manifest.workspace.name,
    session: null,
    matieres: (structure.subjects || []).map((s) => ({
      id: s.id, nom: s.nom || s.name, prof: s.prof || s.teacher || "", credits: s.credits == null ? null : s.credits,
      quadrimestre: s.quadrimestre || s.semester || "", couleur: s.couleur || s.color || "#8e8e93", icone: s.icone || s.icon || "book",
      examen: s.examen || s.exam || null,
      fichiers: (s.documents || []).map((d) => ({ nom: d.nom, chemin: d.chemin, local: true })),
      chapitres: s.chapitres || s.chapters || []
    }))
  };
}

/* ---------------- État de progression (par appareil) ---------------- */

export function emptyUiState() {
  return { lu: {}, quiz: {}, cartes: {}, plan: {}, journal: {}, prenom: "", theme: "auto", focus: { min: 0 } };
}

/**
 * Convertit l'état de l'interface en document v2 valide.
 * Les sections de conservation du document précédent (idMap, orphans, legacy)
 * sont reprises telles quelles : rien n'est jamais abandonné.
 */
export function uiStateToV2(ui, { workspace, now, prevDoc = null }) {
  const iso = now.toISOString();
  const wrap = (o) => Object.fromEntries(Object.entries(o || {}).map(([k, v]) => [k, { value: v, origin: "app" }]));
  const cards = {};
  for (const [id, c] of Object.entries(ui.cartes || {})) cards[id] = { scheduler: "leitner", box: c.box, due: c.due == null ? null : c.due, origin: "app" };
  const quizSummaries = {};
  for (const [k, q] of Object.entries(ui.quiz || {})) quizSummaries[k] = Object.assign({}, q, { origin: "app" });
  return {
    format: FORMAT,
    schemaVersion: SCHEMA_VERSION,
    workspace: { id: workspace.id, kind: "real" },
    createdAt: prevDoc && prevDoc.createdAt ? prevDoc.createdAt : iso,
    updatedAt: iso,
    settings: { firstName: typeof ui.prenom === "string" ? ui.prenom : "", theme: THEMES.includes(ui.theme) ? ui.theme : "auto" },
    progress: {
      cards,
      reviewLog: [], // le journal des révisions vit dans les fichiers mensuels .jsonl
      reading: wrap(ui.lu),
      quizSummaries,
      planChecks: wrap(ui.plan),
      legacyDailyActivity: Object.assign({}, ui.journal || {}),
      focusMinutes: ui.focus && typeof ui.focus.min === "number" ? ui.focus.min : 0
    },
    idMap: prevDoc && prevDoc.idMap ? prevDoc.idMap : { cards: {} },
    orphans: prevDoc && prevDoc.orphans ? prevDoc.orphans : { cards: {}, quiz: {} },
    legacy: prevDoc && prevDoc.legacy ? prevDoc.legacy : {}
  };
}

/** Convertit un document v2 en état utilisable par l'interface. */
export function v2ToUiState(doc) {
  const p = doc.progress;
  const unwrap = (o) => Object.fromEntries(Object.entries(o || {}).map(([k, v]) => [k, v.value]));
  const cartes = {};
  for (const [id, c] of Object.entries(p.cards || {})) cartes[id] = { box: c.box, due: c.due };
  const quiz = Object.fromEntries(Object.entries(p.quizSummaries || {}).map(([k, v]) => { const c = Object.assign({}, v); delete c.origin; return [k, c]; }));
  return {
    lu: unwrap(p.reading), quiz, cartes, plan: unwrap(p.planChecks), journal: Object.assign({}, p.legacyDailyActivity || {}),
    prenom: doc.settings.firstName, theme: doc.settings.theme, focus: { min: p.focusMinutes }
  };
}

export function validateDeviceState(doc, workspaceId) {
  const e = validateStateV2(doc);
  if (!e.length && doc.workspace.id !== workspaceId) e.push("Cet état appartient à un autre espace.");
  if (!e.length && doc.workspace.kind !== "real") e.push("Cet état n'appartient pas à un espace réel.");
  return e;
}

/* ---------------- Journal des révisions (ajout seul) ---------------- */

export function reviewEntry({ id, cardId, rating, before, after, now, deviceId }) {
  return { id, cardId, at: now.toISOString(), rating, scheduler: "leitner", before: { box: before.box, due: before.due == null ? null : before.due }, after: { box: after.box, due: after.due }, deviceId };
}

/** Une ligne JSON par révision. Toute ligne illisible est signalée, jamais supprimée. */
export function parseReviewLog(text) {
  const entries = [], invalidLines = [];
  String(text || "").split("\n").forEach((line, i) => {
    if (!line.trim()) return;
    try { const o = JSON.parse(line); if (isObj(o) && typeof o.cardId === "string" && [1, 2, 3, 4].includes(o.rating)) entries.push(o); else invalidLines.push(i + 1); }
    catch (e) { invalidLines.push(i + 1); }
  });
  return { entries, invalidLines };
}
