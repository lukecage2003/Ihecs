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

/** Champs d'une matière que l'utilisateur peut modifier dans le site (préservés lors d'un réimport). */
export const EDITABLE_FIELDS = ["credits", "quadrimestre"];
export const EDITABLE_EXAM_FIELDS = ["date", "type", "duree", "poids", "lieu", "consignes"];

/**
 * Réapplique les modifications faites dans le site (s.userEdits) sur une matière.
 * Un champ modifié par l'utilisateur l'emporte sur la valeur du fichier de cours.
 */
export function applyUserEdits(subject, edits) {
  if (!isObj(edits)) return subject;
  const out = Object.assign({}, subject);
  for (const k of EDITABLE_FIELDS) if (k in edits) out[k] = edits[k];
  if (isObj(edits.examen)) {
    const ex = Object.assign({}, isObj(out.examen) ? out.examen : {});
    for (const k of EDITABLE_EXAM_FIELDS) if (k in edits.examen) { if (edits.examen[k] === null) delete ex[k]; else ex[k] = edits.examen[k]; }
    out.examen = ex;
  }
  out.userEdits = edits;
  return out;
}

/** JSON à clés triées, pour comparer deux contenus indépendamment de l'ordre des champs. */
const canon = (v) => Array.isArray(v) ? "[" + v.map(canon).join(",") + "]"
  : isObj(v) ? "{" + Object.keys(v).sort().filter((k) => v[k] !== undefined).map((k) => JSON.stringify(k) + ":" + canon(v[k])).join(",") + "}"
  : JSON.stringify(v);
const withoutMeta = (s) => { const c = Object.assign({}, s); delete c.importedFrom; return c; };

/** Vrai si la matière du fichier diffère de celle déjà présente (provenance ignorée). */
export function subjectChanged(existing, incoming) {
  const next = applyUserEdits(normalizeSubject(incoming, null), existing && existing.userEdits);
  return canon(withoutMeta(next)) !== canon(withoutMeta(existing || {}));
}

/**
 * Réunit plusieurs fichiers de cours en un seul. Si une matière apparaît dans
 * plusieurs fichiers, la version du fichier le plus récent (createdAt) est gardée.
 * @param {{name: string, pack: object}[]} files  fichiers déjà validés un par un
 * @returns {{pack: object, sourceOf: Map<string, string>, duplicates: {id: string, kept: string, dropped: string}[]}}
 */
export function mergePacks(files) {
  const time = (p) => { const t = Date.parse(p && p.createdAt); return Number.isNaN(t) ? 0 : t; };
  const byId = new Map(), duplicates = [];
  files.forEach((f, order) => {
    for (const s of f.pack.subjects) {
      const k = s.id.toLowerCase(), cur = byId.get(k);
      const cand = { s, file: f.name, t: time(f.pack), order };
      if (!cur) { byId.set(k, cand); continue; }
      const newer = cand.t > cur.t || (cand.t === cur.t && cand.order > cur.order);
      duplicates.push({ id: s.id, kept: newer ? cand.file : cur.file, dropped: newer ? cur.file : cand.file });
      if (newer) byId.set(k, cand);
    }
  });
  const kept = [...byId.values()].sort((a, b) => a.order - b.order);
  const first = files[0] ? files[0].pack : {};
  const pack = files.length === 1 ? first : {
    format: first.format, kind: first.kind, schemaVersion: first.schemaVersion,
    title: files.length + " fichiers de cours", createdAt: new Date(Math.max(...files.map((f) => time(f.pack)))).toISOString(),
    subjects: kept.map((x) => x.s)
  };
  return { pack, sourceOf: new Map(kept.map((x) => [x.s.id.toLowerCase(), x.file])), duplicates };
}

/** Identifiants de fiches et de questions d'une matière (structure). */
const itemIdsOf = (s) => (s.chapitres || s.chapters || []).flatMap((c) => [...(c.fiches || []), ...(c.quiz || [])].map((x) => x && x.id).filter(Boolean));

/**
 * Calcule le résultat d'un import sans rien écrire.
 * @param {object} structure  structure.json actuelle (validée)
 * @param {object} pack       pack validé
 * @param {{replace?: string[], now: Date, sourceName?: string, sourceOf?: Map<string, string>, iconNames?: string[]}} opts
 * @returns {{ok: true, added, replaced, skipped, changed, counts, nextStructure} | {ok: false, errors}}
 *   changed : matières déjà présentes dont le fichier apporte une version différente.
 */
export function planImport(structure, pack, opts) {
  const errors = validatePack(pack, { iconNames: opts.iconNames });
  if (errors.length) return { ok: false, errors };
  const replace = new Set((opts.replace || []).map((x) => x.toLowerCase()));
  const existing = new Map((structure.subjects || []).map((s) => [String(s.id).toLowerCase(), s]));
  const meta = { pack: pack.title, file: opts.sourceName || null, packCreatedAt: pack.createdAt || null, importedAt: opts.now.toISOString() };
  const metaOf = (s) => (opts.sourceOf && opts.sourceOf.get(s.id.toLowerCase()) ? Object.assign({}, meta, { file: opts.sourceOf.get(s.id.toLowerCase()) }) : meta);
  const added = [], replaced = [], skipped = [], changed = [];
  for (const s of pack.subjects) {
    const k = s.id.toLowerCase();
    if (!existing.has(k)) { added.push(s); continue; }
    if (subjectChanged(existing.get(k), s)) changed.push(s);
    if (replace.has(k)) replaced.push(s);
    else skipped.push(s);
  }
  // Les identifiants de fiches doivent rester uniques dans tout l'espace.
  const kept = (structure.subjects || []).filter((s) => !replaced.some((r) => r.id.toLowerCase() === String(s.id).toLowerCase()));
  const taken = new Set(kept.flatMap(itemIdsOf));
  const clashes = [...added, ...replaced].flatMap((s) => s.chapitres.flatMap((c) => [...(c.fiches || []), ...(c.quiz || [])].map((x) => x.id))).filter((id) => taken.has(id));
  if (clashes.length) return { ok: false, errors: ["Identifiants déjà utilisés par une autre matière de ton espace : " + [...new Set(clashes)].slice(0, 10).join(", ")] };
  // Les modifications faites dans le site (date d'examen, crédits…) survivent au remplacement.
  const replacedMap = new Map(replaced.map((s) => [s.id.toLowerCase(), applyUserEdits(normalizeSubject(s, metaOf(s)), existing.get(s.id.toLowerCase()).userEdits)]));
  const subjects = (structure.subjects || []).map((s) => replacedMap.get(String(s.id).toLowerCase()) || s).concat(added.map((s) => normalizeSubject(s, metaOf(s))));
  const nextStructure = Object.assign({}, structure, {
    updatedAt: opts.now.toISOString(),
    subjects,
    imports: (structure.imports || []).concat([{ at: opts.now.toISOString(), pack: pack.title, file: opts.sourceName || null, added: added.map((s) => s.id), replaced: replaced.map((s) => s.id), skipped: skipped.map((s) => s.id) }])
  });
  const sErr = validateStructure(nextStructure, structure.workspaceId);
  if (sErr.length) return { ok: false, errors: sErr };
  const count = (list) => list.reduce((a, s) => ({ chapitres: a.chapitres + s.chapitres.length, fiches: a.fiches + s.chapitres.reduce((n, c) => n + (c.fiches || []).length, 0), questions: a.questions + s.chapitres.reduce((n, c) => n + (c.quiz || []).length, 0) }), { chapitres: 0, fiches: 0, questions: 0 });
  return { ok: true, added, replaced, skipped, changed, counts: count([...added, ...replaced]), nextStructure };
}

/* ---------------- Modification d'une matière dans le site ---------------- */

const DATE_RE = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2})?)?$/;
const same = (a, b) => canon(a === undefined ? null : a) === canon(b === undefined ? null : b);

/**
 * Applique une modification faite dans le site à une matière de structure.json.
 * `patch` : { credits, quadrimestre, examen: { date, type, duree, poids, lieu, consignes } }.
 * Seuls les champs réellement changés sont enregistrés dans userEdits (pour qu'un
 * futur fichier de cours puisse encore mettre à jour les autres). Une valeur vide efface.
 * Retourne { structure, errors } ; structure est null si erreur. Fonction pure.
 */
export function editSubject(structure, id, patch) {
  const errors = [];
  const subs = structure && Array.isArray(structure.subjects) ? structure.subjects : [];
  const i = subs.findIndex((s) => isObj(s) && String(s.id).toLowerCase() === String(id).toLowerCase());
  if (i < 0) return { structure: null, errors: ["Matière introuvable : " + id + "."] };
  const cur = subs[i], curEx = isObj(cur.examen) ? cur.examen : {};
  const txt = (v, max, label) => {
    if (v == null) return null;
    const t = String(v).trim();
    if (t.length > max) errors.push(label + " : " + max + " caractères au maximum.");
    return t || null;
  };
  const edits = isObj(cur.userEdits) ? JSON.parse(JSON.stringify(cur.userEdits)) : {};
  const exEdits = isObj(edits.examen) ? edits.examen : {};
  const p = isObj(patch) ? patch : {};
  if ("credits" in p) {
    let c = p.credits === "" || p.credits == null ? null : Number(p.credits);
    if (c !== null && !(Number.isFinite(c) && c >= 0 && c <= 60)) { errors.push("Crédits : un nombre entre 0 et 60."); c = null; }
    if (!same(c, cur.credits)) edits.credits = c;
  }
  if ("quadrimestre" in p) { const q = txt(p.quadrimestre, 40, "Quadrimestre"); if (!same(q || "", cur.quadrimestre || "")) edits.quadrimestre = q || ""; }
  const pe = isObj(p.examen) ? p.examen : {};
  for (const k of EDITABLE_EXAM_FIELDS) {
    if (!(k in pe)) continue;
    let v;
    if (k === "consignes") {
      const list = (Array.isArray(pe.consignes) ? pe.consignes : String(pe.consignes || "").split("\n")).map((x) => String(x).trim()).filter(Boolean);
      if (list.length > 40) errors.push("Consignes : 40 au maximum.");
      if (list.some((x) => x.length > 500)) errors.push("Consignes : 500 caractères au maximum par ligne.");
      v = list.length ? list : null;
    } else if (k === "date") {
      v = txt(pe.date, 25, "Date");
      if (v && !(DATE_RE.test(v) && !isNaN(new Date(v)))) { errors.push("Date d'examen invalide."); v = null; }
    } else v = txt(pe[k], 200, k);
    if (!same(v, curEx[k])) exEdits[k] = v;
  }
  if (errors.length) return { structure: null, errors };
  if (Object.keys(exEdits).length) edits.examen = exEdits;
  const next = applyUserEdits(Object.assign({}, cur), edits);
  const subjects = subs.slice(); subjects[i] = next;
  return { structure: Object.assign({}, structure, { subjects }), errors: [] };
}
