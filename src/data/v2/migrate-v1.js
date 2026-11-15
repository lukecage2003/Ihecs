// Migration v1 → v2 — CONCEPTION, NON BRANCHÉE SUR L'APPLICATION.
// Fonctions pures, sans effet de bord : elles ne lisent ni n'écrivent aucun stockage.
// Règles R1 à R12 : voir docs/DATA_MODEL.md.

import { FORMAT, SCHEMA_VERSION, validateStateV2 } from "./schema.js";

const V1_KNOWN = ["lu", "quiz", "cartes", "plan", "journal", "prenom", "theme", "focus"];
const isObj = (v) => v !== null && typeof v === "object" && !Array.isArray(v);
const clone = (v) => (v === undefined ? undefined : JSON.parse(JSON.stringify(v)));

/** Identifiant stable d'une fiche, figé au moment de la migration (R5). */
export const cardIdFor = (subjectId, chapterId, index) => "card:" + subjectId + ":" + chapterId + ":" + String(index).padStart(3, "0");

/** Clé de chapitre v2 (les identifiants de matière et de chapitre sont déjà stables en v1). */
export const chapterRef = (subjectId, chapterId) => subjectId + "/" + chapterId;

/**
 * Ajoute des identifiants stables au contenu v1 (fiches et questions), sans
 * rien retirer ni modifier d'autre. Un identifiant déjà présent est conservé.
 * Renvoie une copie ; l'entrée n'est jamais modifiée (R1).
 */
export function assignContentIds(contentV1) {
  const c = clone(contentV1);
  for (const m of c.matieres || []) {
    for (const ch of m.chapitres || []) {
      (ch.fiches || []).forEach((f, i) => { if (!f.id) f.id = cardIdFor(m.id, ch.id, i); });
      (ch.quiz || []).forEach((q, i) => { if (!q.id) q.id = "question:" + m.id + ":" + ch.id + ":" + String(i).padStart(3, "0"); });
    }
  }
  return c;
}

/** Retire les identifiants ajoutés par assignContentIds (preuve d'absence de perte). */
export function stripContentIds(contentV2, originalHadIds = () => false) {
  const c = clone(contentV2);
  for (const m of c.matieres || []) for (const ch of m.chapitres || []) {
    (ch.fiches || []).forEach((f) => { if (!originalHadIds(f)) delete f.id; });
    (ch.quiz || []).forEach((q) => { if (!originalHadIds(q)) delete q.id; });
  }
  return c;
}

/** Index « clé v1 de fiche » → identifiant v2, construit depuis le contenu au moment de la migration. */
function buildCardIndex(contentV2) {
  const idx = {};
  for (const m of contentV2.matieres || []) for (const ch of m.chapitres || []) {
    (ch.fiches || []).forEach((f, i) => { idx[m.id + "|" + ch.id + "|" + i] = f.id; });
  }
  return idx;
}

/**
 * Migre un état v1 vers v2.
 * @param {object} stateV1   état lu dans localStorage ("revisions-ihecs-v1")
 * @param {object} contentV1 contenu auquel cet état se rapporte (pour relier les fiches)
 * @param {{workspaceId: string, workspaceKind: "demo"|"real", now: Date}} opts
 * @returns {{ok: true, doc: object, report: object} | {ok: false, error: string}}
 */
export function migrateStateV1toV2(stateV1, contentV1, opts) {
  try {
    if (isObj(stateV1) && stateV1.format === FORMAT && stateV1.schemaVersion === SCHEMA_VERSION) {
      return { ok: true, doc: clone(stateV1), report: { alreadyV2: true } }; // R10
    }
    if (!isObj(stateV1)) return { ok: false, error: "L'état v1 n'est pas un objet." };
    if (!opts || !opts.workspaceId || !["demo", "real"].includes(opts.workspaceKind) || !(opts.now instanceof Date)) {
      return { ok: false, error: "Options de migration incomplètes (workspaceId, workspaceKind, now)." };
    }
    for (const k of ["lu", "quiz", "cartes", "plan", "journal"]) {
      if (k in stateV1 && !isObj(stateV1[k])) return { ok: false, error: "Champ v1 « " + k + " » invalide." }; // R9
    }
    const v1 = clone(stateV1); // R1
    const content = assignContentIds(contentV1 || { matieres: [] });
    const cardIndex = buildCardIndex(content);
    const iso = opts.now.toISOString();

    const cards = {}, idMap = {}, orphans = {};
    for (const [key, st] of Object.entries(v1.cartes || {})) {
      const id = cardIndex[key];
      const valid = isObj(st) && Number.isInteger(st.box) && st.box >= 0 && st.box <= 6 && (st.due == null || /^\d{4}-\d{2}-\d{2}$/.test(st.due));
      if (id && valid) {
        idMap[key] = id;
        cards[id] = { scheduler: "leitner", box: st.box, due: st.due == null ? null : st.due, origin: "migrated-v1" };
        if (st.due === undefined) cards[id].dueWasUndefined = true;
        const extra = Object.keys(st).filter((k) => k !== "box" && k !== "due");
        if (extra.length) cards[id].legacyExtra = Object.fromEntries(extra.map((k) => [k, st[k]]));
      } else {
        orphans[key] = st; // R3 : jamais supprimé, conservé à part
      }
    }

    const reading = {};
    for (const [k, v] of Object.entries(v1.lu || {})) reading[k] = { value: v, origin: "migrated-v1" };
    const quizSummaries = {}, orphanQuiz = {};
    for (const [k, v] of Object.entries(v1.quiz || {})) {
      if (isObj(v) && typeof v.best === "number") quizSummaries[k] = Object.assign({}, v, { origin: "migrated-v1" }); // R6
      else orphanQuiz[k] = v; // R3
    }
    const planChecks = {};
    for (const [k, v] of Object.entries(v1.plan || {})) planChecks[k] = { value: v, origin: "migrated-v1" };

    const unknownFields = {};
    for (const k of Object.keys(v1)) if (!V1_KNOWN.includes(k)) unknownFields[k] = v1[k]; // R7
    // Valeurs v1 non représentables dans les champs structurés : conservées à part.
    const invalidFields = {};
    if ("prenom" in v1 && typeof v1.prenom !== "string") invalidFields.prenom = v1.prenom;
    if ("theme" in v1 && !["auto", "light", "dark"].includes(v1.theme)) invalidFields.theme = v1.theme;
    const focusOk = isObj(v1.focus) && typeof v1.focus.min === "number" && v1.focus.min >= 0;
    if ("focus" in v1 && !focusOk) invalidFields.focus = v1.focus;
    const focusExtra = focusOk ? Object.fromEntries(Object.entries(v1.focus).filter(([k]) => k !== "min")) : {};

    const doc = {
      format: FORMAT,
      schemaVersion: SCHEMA_VERSION,
      workspace: { id: opts.workspaceId, kind: opts.workspaceKind }, // R11
      createdAt: iso,
      updatedAt: iso,
      migratedFrom: { schemaVersion: 1, at: iso },
      settings: {
        firstName: typeof v1.prenom === "string" ? v1.prenom : "",
        theme: ["auto", "light", "dark"].includes(v1.theme) ? v1.theme : "auto"
      },
      progress: {
        cards,
        reviewLog: [], // R4 : aucune histoire inventée
        reading,
        quizSummaries,
        planChecks,
        legacyDailyActivity: clone(v1.journal || {}), // R5 : unités hétérogènes v1, pas des révisions
        focusMinutes: focusOk ? v1.focus.min : 0
      },
      idMap: { cards: idMap },
      orphans: { cards: orphans, quiz: orphanQuiz },
      legacy: {
        v1: clone(stateV1), // R8 : copie intégrale de sécurité (jamais lue par la projection)
        v1Keys: Object.keys(v1),
        unknownFields,
        invalidFields,
        focusExtra
      }
    };
    const errors = validateStateV2(doc);
    if (errors.length) return { ok: false, error: "Document v2 invalide : " + errors.join(" ; ") };
    const total = Object.keys(v1.cartes || {}).length;
    return {
      ok: true,
      doc,
      report: { // R12
        cardsTotal: total,
        cardsMapped: Object.keys(idMap).length,
        cardsOrphaned: Object.keys(orphans).length,
        chaptersRead: Object.keys(reading).length,
        quizSummaries: Object.keys(quizSummaries).length,
        quizOrphaned: Object.keys(orphanQuiz).length,
        planChecks: Object.keys(planChecks).length,
        activityDays: Object.keys(doc.progress.legacyDailyActivity).length,
        unknownFields: Object.keys(unknownFields)
      }
    };
  } catch (err) {
    return { ok: false, error: "Échec inattendu de la migration : " + (err && err.message) };
  }
}

/**
 * Reconstruit un état v1 UNIQUEMENT À PARTIR DES CHAMPS STRUCTURÉS v2 et des
 * sections de conservation (orphans, unknownFields, invalidFields), sans jamais
 * lire la copie intégrale legacy.v1. Sert à prouver qu'aucune information n'est
 * perdue : projectV2toV1(migrate(x)) est strictement égal à x.
 */
export function projectV2toV1(doc) {
  const p = doc.progress, L = doc.legacy;
  const back = {};
  for (const [key, id] of Object.entries(doc.idMap.cards)) back[id] = key;
  const cartes = {};
  for (const [id, c] of Object.entries(p.cards)) {
    const key = back[id];
    if (!key) continue;
    const st = { box: c.box };
    if (!c.dueWasUndefined) st.due = c.due;
    Object.assign(st, c.legacyExtra || {});
    cartes[key] = st;
  }
  Object.assign(cartes, clone(doc.orphans.cards));
  const unwrap = (o) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, v.value]));
  const quiz = Object.fromEntries(Object.entries(p.quizSummaries).map(([k, v]) => { const c = Object.assign({}, v); delete c.origin; return [k, c]; }));
  Object.assign(quiz, clone(doc.orphans.quiz || {}));
  const inv = L.invalidFields || {};
  const has = (k) => Object.prototype.hasOwnProperty.call(inv, k);
  const out = {
    lu: unwrap(p.reading),
    quiz,
    cartes,
    plan: unwrap(p.planChecks),
    journal: clone(p.legacyDailyActivity),
    prenom: has("prenom") ? inv.prenom : doc.settings.firstName,
    theme: has("theme") ? inv.theme : doc.settings.theme,
    focus: has("focus") ? inv.focus : Object.assign({ min: p.focusMinutes }, L.focusExtra || {})
  };
  Object.assign(out, clone(L.unknownFields));
  // Seuls les champs présents dans l'original, dans le même ordre.
  return Object.fromEntries(L.v1Keys.map((k) => [k, out[k]]));
}
