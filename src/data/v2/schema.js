// Modèle de données v2 — CONCEPTION, NON BRANCHÉE SUR L'APPLICATION.
// Voir docs/DATA_MODEL.md. Rien dans l'application n'importe ce module en phase 1.

export const FORMAT = "ihecs-study-os";
export const SCHEMA_VERSION = 2;
export const WORKSPACE_KINDS = ["demo", "real"];
export const ORIGINS = ["migrated-v1", "app"];

const isObj = (v) => v !== null && typeof v === "object" && !Array.isArray(v);
const isDay = (v) => typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v);
const isIso = (v) => typeof v === "string" && !Number.isNaN(Date.parse(v));

/**
 * Valide un document d'état v2. Renvoie la liste des erreurs (vide si valide).
 * Validation structurelle stricte des champs connus ; les sections "legacy" et
 * "orphans" sont conservées telles quelles et seulement vérifiées comme objets.
 */
export function validateStateV2(doc) {
  const e = [];
  const req = (cond, msg) => { if (!cond) e.push(msg); };
  if (!isObj(doc)) return ["Le document n'est pas un objet."];
  req(doc.format === FORMAT, "format attendu : " + FORMAT);
  req(doc.schemaVersion === SCHEMA_VERSION, "schemaVersion attendu : " + SCHEMA_VERSION);
  req(isObj(doc.workspace) && typeof doc.workspace.id === "string" && WORKSPACE_KINDS.includes(doc.workspace.kind), "workspace invalide");
  req(isIso(doc.createdAt) && isIso(doc.updatedAt), "dates de création ou de mise à jour invalides");
  req(isObj(doc.settings), "settings manquant");
  if (isObj(doc.settings)) {
    req(typeof doc.settings.firstName === "string", "settings.firstName doit être une chaîne");
    req(["auto", "light", "dark"].includes(doc.settings.theme), "settings.theme invalide");
  }
  const p = doc.progress;
  req(isObj(p), "progress manquant");
  if (isObj(p)) {
    req(isObj(p.cards), "progress.cards manquant");
    for (const [id, c] of Object.entries(p.cards || {})) {
      req(isObj(c) && c.scheduler === "leitner", "carte " + id + " : scheduler invalide");
      req(isObj(c) && Number.isInteger(c.box) && c.box >= 0 && c.box <= 6, "carte " + id + " : boîte invalide");
      req(isObj(c) && (c.due === null || isDay(c.due)), "carte " + id + " : échéance invalide");
      req(isObj(c) && ORIGINS.includes(c.origin), "carte " + id + " : origine invalide");
    }
    req(Array.isArray(p.reviewLog), "progress.reviewLog doit être un tableau");
    for (const r of p.reviewLog || []) {
      req(isObj(r) && typeof r.id === "string" && typeof r.cardId === "string" && isIso(r.at) && [1, 2, 3, 4].includes(r.rating), "entrée de journal invalide");
    }
    req(isObj(p.reading), "progress.reading manquant");
    req(isObj(p.quizSummaries), "progress.quizSummaries manquant");
    for (const [k, q] of Object.entries(p.quizSummaries || {})) req(isObj(q) && typeof q.best === "number" && ORIGINS.includes(q.origin), "quiz " + k + " invalide");
    req(isObj(p.planChecks), "progress.planChecks manquant");
    req(isObj(p.legacyDailyActivity), "progress.legacyDailyActivity manquant");
    for (const [d, n] of Object.entries(p.legacyDailyActivity || {})) req(isDay(d) && typeof n === "number", "activité " + d + " invalide");
    req(typeof p.focusMinutes === "number" && p.focusMinutes >= 0, "progress.focusMinutes invalide");
  }
  req(isObj(doc.idMap) && isObj(doc.idMap.cards), "idMap.cards manquant");
  req(isObj(doc.orphans) && isObj(doc.orphans.cards), "orphans.cards manquant");
  req(isObj(doc.legacy), "legacy manquant");
  return e;
}
