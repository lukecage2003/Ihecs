// Fichiers de cours (« packs ») : format, validation et plan d'import. Fonctions pures.
// Spécification lisible : docs/COURSE_PACK.md.
//
// Un pack apporte des matières complètes (chapitres, résumés, fiches, quiz, examen,
// documents). Il est fusionné dans structure.json selon un plan affiché AVANT
// l'écriture : matières nouvelles ajoutées ; matières existantes ignorées, sauf si
// l'utilisateur demande explicitement de les remplacer. Le pack d'origine est
// conservé intégralement dans le dossier (imports/), rien n'est donc perdu.

import { FORMAT, SCHEMA_VERSION } from "./schema.js";
import { validateStructure } from "./workspace.js";

export const PACK_KIND = "course-pack";
export const LIMITS = { bytes: 20 * 1024 * 1024, subjects: 100, chapters: 200, cards: 2000, questions: 1000, text: 300000 };

const isObj = (v) => v !== null && typeof v === "object" && !Array.isArray(v);
const isStr = (v) => typeof v === "string";
const SUBJECT_ID = /^[a-z0-9]{1,32}$/i;            // utilisé dans les liens (#m-<id>)
const ITEM_ID = /^[A-Za-z0-9:._-]{4,80}$/;         // identifiant stable de fiche ou de question
const HEX = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;

/** Chemin relatif sûr à l'intérieur du dossier de l'espace (pas de « .. », pas d'absolu). */
export function safeRelativePath(p) {
  if (!isStr(p) || !p.trim() || p.length > 500) return false;
  if (p.startsWith("/") || p.startsWith("\\") || /^[a-z]:/i.test(p) || p.includes("\\")) return false;
  return p.split("/").every((seg) => seg && seg !== "." && seg !== "..");
}

/**
 * Valide un pack. Renvoie la liste des erreurs (vide si valide).
 * @param {object} pack
 * @param {{iconNames?: string[]}} opts
 */
export function validatePack(pack, opts = {}) {
  const e = [];
  const push = (where, msg) => { if (e.length < 50) e.push(where + " : " + msg); };
  if (!isObj(pack)) return ["Le fichier n'est pas un objet JSON."];
  if (pack.format !== FORMAT || pack.kind !== PACK_KIND) return ["Ce fichier n'est pas un fichier de cours IHECS STUDY OS (format ou type inattendu)."];
  if (pack.schemaVersion !== SCHEMA_VERSION) return ["Version de fichier de cours non prise en charge : " + pack.schemaVersion + " (attendu : " + SCHEMA_VERSION + ")."];
  if (!isStr(pack.title) || !pack.title.trim()) push("Fichier", "titre manquant");
  if (!Array.isArray(pack.subjects) || !pack.subjects.length) { push("Fichier", "aucune matière"); return e; }
  if (pack.subjects.length > LIMITS.subjects) push("Fichier", "trop de matières (" + pack.subjects.length + ")");
  const subjectIds = new Set(), itemIds = new Set();
  pack.subjects.forEach((s, si) => {
    const W = "Matière " + (si + 1) + (isObj(s) && isStr(s.nom) ? " (« " + s.nom + " »)" : "");
    if (!isObj(s)) { push(W, "n'est pas un objet"); return; }
    if (!isStr(s.id) || !SUBJECT_ID.test(s.id)) push(W, "identifiant invalide (lettres et chiffres uniquement, 32 au plus)");
    else if (subjectIds.has(s.id.toLowerCase())) push(W, "identifiant « " + s.id + " » en double");
    else subjectIds.add(s.id.toLowerCase());
    if (!isStr(s.nom) || !s.nom.trim()) push(W, "nom manquant");
    if (s.couleur !== undefined && !(isStr(s.couleur) && HEX.test(s.couleur))) push(W, "couleur invalide (format #rrggbb)");
    if (s.icone !== undefined && opts.iconNames && !opts.iconNames.includes(s.icone)) push(W, "icône inconnue « " + s.icone + " »");
    if (s.credits !== undefined && s.credits !== null && !(typeof s.credits === "number" && s.credits >= 0 && s.credits <= 60)) push(W, "crédits invalides");
    if (s.examen !== undefined && s.examen !== null) {
      if (!isObj(s.examen)) push(W, "examen invalide");
      else {
        if (s.examen.date !== undefined && !(isStr(s.examen.date) && !Number.isNaN(Date.parse(s.examen.date)))) push(W, "date d'examen illisible");
        if (s.examen.consignes !== undefined && !(Array.isArray(s.examen.consignes) && s.examen.consignes.every(isStr))) push(W, "consignes d'examen invalides");
      }
    }
    for (const d of s.documents || []) {
      if (!isObj(d) || !isStr(d.nom) || !safeRelativePath(d.chemin)) push(W, "document invalide (nom et chemin relatif dans ton dossier requis)");
    }
    if (!Array.isArray(s.chapitres)) { push(W, "liste de chapitres manquante"); return; }
    if (s.chapitres.length > LIMITS.chapters) push(W, "trop de chapitres");
    const chapIds = new Set();
    s.chapitres.forEach((c, ci) => {
      const C = W + ", chapitre " + (ci + 1);
      if (!isObj(c)) { push(C, "n'est pas un objet"); return; }
      if (!isStr(c.id) || !SUBJECT_ID.test(c.id)) push(C, "identifiant invalide");
      else if (chapIds.has(c.id.toLowerCase())) push(C, "identifiant « " + c.id + " » en double");
      else chapIds.add(c.id.toLowerCase());
      if (!isStr(c.titre) || !c.titre.trim()) push(C, "titre manquant");
      if (c.resume !== undefined && !(isStr(c.resume) && c.resume.length <= LIMITS.text)) push(C, "résumé invalide ou trop long");
      for (const k of ["pointsCles"]) if (c[k] !== undefined && !(Array.isArray(c[k]) && c[k].every(isStr))) push(C, "points clés invalides");
      for (const d of c.definitions || []) if (!isObj(d) || !isStr(d.terme) || !isStr(d.def)) push(C, "définition invalide");
      const fiches = c.fiches || [];
      if (!Array.isArray(fiches) || fiches.length > LIMITS.cards) push(C, "fiches invalides");
      else fiches.forEach((f, fi) => {
        if (!isObj(f) || !isStr(f.q) || !f.q.trim() || !isStr(f.r) || !f.r.trim()) push(C, "fiche " + (fi + 1) + " : question ou réponse manquante");
        else if (!isStr(f.id) || !ITEM_ID.test(f.id)) push(C, "fiche " + (fi + 1) + " : identifiant stable manquant ou invalide");
        else if (itemIds.has(f.id)) push(C, "fiche " + (fi + 1) + " : identifiant « " + f.id + " » en double");
        else itemIds.add(f.id);
      });
      const quiz = c.quiz || [];
      if (!Array.isArray(quiz) || quiz.length > LIMITS.questions) push(C, "quiz invalide");
      else quiz.forEach((q, qi) => {
        const Q = "question " + (qi + 1);
        if (!isObj(q) || !isStr(q.q) || !Array.isArray(q.choix) || q.choix.length < 2 || q.choix.length > 4 || !q.choix.every(isStr)) push(C, Q + " : énoncé ou choix invalides (2 à 4 choix)");
        else if (!Number.isInteger(q.bonne) || q.bonne < 0 || q.bonne >= q.choix.length) push(C, Q + " : bonne réponse hors des choix");
        else if (!isStr(q.id) || !ITEM_ID.test(q.id)) push(C, Q + " : identifiant stable manquant ou invalide");
        else if (itemIds.has(q.id)) push(C, Q + " : identifiant « " + q.id + " » en double");
        else itemIds.add(q.id);
      });
    });
  });
  return e;
}

/** Garde uniquement les champs connus d'une matière (le pack complet est archivé à part). */
function normalizeSubject(s, meta) {
  const pick = (o, keys) => Object.fromEntries(keys.filter((k) => o[k] !== undefined).map((k) => [k, o[k]]));
  return Object.assign(pick(s, ["id", "nom", "prof", "credits", "quadrimestre", "couleur", "icone", "examen", "documents"]), {
    chapitres: s.chapitres.map((c) => pick(c, ["id", "titre", "duree", "resume", "pointsCles", "definitions", "fiches", "quiz", "sources"])),
    importedFrom: meta
  });
}

/** Identifiants de fiches et de questions d'une matière (structure). */
const itemIdsOf = (s) => (s.chapitres || s.chapters || []).flatMap((c) => [...(c.fiches || []), ...(c.quiz || [])].map((x) => x && x.id).filter(Boolean));

/**
 * Calcule le résultat d'un import sans rien écrire.
 * @param {object} structure  structure.json actuelle (validée)
 * @param {object} pack       pack validé
 * @param {{replace?: string[], now: Date, sourceName?: string, iconNames?: string[]}} opts
 * @returns {{ok: true, added, replaced, skipped, counts, nextStructure} | {ok: false, errors}}
 */
export function planImport(structure, pack, opts) {
  const errors = validatePack(pack, { iconNames: opts.iconNames });
  if (errors.length) return { ok: false, errors };
  const replace = new Set((opts.replace || []).map((x) => x.toLowerCase()));
  const existing = new Map((structure.subjects || []).map((s) => [String(s.id).toLowerCase(), s]));
  const meta = { pack: pack.title, file: opts.sourceName || null, packCreatedAt: pack.createdAt || null, importedAt: opts.now.toISOString() };
  const added = [], replaced = [], skipped = [];
  for (const s of pack.subjects) {
    const k = s.id.toLowerCase();
    if (!existing.has(k)) added.push(s);
    else if (replace.has(k)) replaced.push(s);
    else skipped.push(s);
  }
  // Les identifiants de fiches doivent rester uniques dans tout l'espace.
  const kept = (structure.subjects || []).filter((s) => !replaced.some((r) => r.id.toLowerCase() === String(s.id).toLowerCase()));
  const taken = new Set(kept.flatMap(itemIdsOf));
  const clashes = [...added, ...replaced].flatMap((s) => s.chapitres.flatMap((c) => [...(c.fiches || []), ...(c.quiz || [])].map((x) => x.id))).filter((id) => taken.has(id));
  if (clashes.length) return { ok: false, errors: ["Identifiants déjà utilisés par une autre matière de ton espace : " + [...new Set(clashes)].slice(0, 10).join(", ")] };
  const replacedMap = new Map(replaced.map((s) => [s.id.toLowerCase(), normalizeSubject(s, meta)]));
  const subjects = (structure.subjects || []).map((s) => replacedMap.get(String(s.id).toLowerCase()) || s).concat(added.map((s) => normalizeSubject(s, meta)));
  const nextStructure = Object.assign({}, structure, {
    updatedAt: opts.now.toISOString(),
    subjects,
    imports: (structure.imports || []).concat([{ at: opts.now.toISOString(), pack: pack.title, file: opts.sourceName || null, added: added.map((s) => s.id), replaced: replaced.map((s) => s.id), skipped: skipped.map((s) => s.id) }])
  });
  const sErr = validateStructure(nextStructure, structure.workspaceId);
  if (sErr.length) return { ok: false, errors: sErr };
  const count = (list) => list.reduce((a, s) => ({ chapitres: a.chapitres + s.chapitres.length, fiches: a.fiches + s.chapitres.reduce((n, c) => n + (c.fiches || []).length, 0), questions: a.questions + s.chapitres.reduce((n, c) => n + (c.quiz || []).length, 0) }), { chapitres: 0, fiches: 0, questions: 0 });
  return { ok: true, added, replaced, skipped, counts: count([...added, ...replaced]), nextStructure };
}
