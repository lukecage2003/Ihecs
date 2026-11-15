// État de progression (format v1, inchangé).
// Clé localStorage : "revisions-ihecs-v1". Le format n'est PAS modifié par la
// phase 1 : aucune migration n'est appliquée aux données existantes.
// La conception du format v2 et sa migration sont dans src/data/ (non branchées).

export const STORAGE_KEY = "revisions-ihecs-v1";

export const blankState = () => ({ lu: {}, quiz: {}, cartes: {}, plan: {}, journal: {}, prenom: "", theme: "auto", focus: { min: 0 } });

/** Lit l'état depuis un objet de type Storage. Ne lève jamais d'exception. */
export function loadState(storage) {
  try {
    const raw = storage && storage.getItem(STORAGE_KEY);
    if (raw) return Object.assign(blankState(), JSON.parse(raw));
  } catch (e) { /* stockage indisponible ou JSON corrompu : on repart d'un état vide en mémoire, sans écraser le stockage */ }
  return blankState();
}

/** Écrit l'état. Renvoie false si l'écriture a échoué (stockage bloqué ou plein). */
export function saveState(storage, state) {
  try { storage.setItem(STORAGE_KEY, JSON.stringify(state)); return true; } catch (e) { return false; }
}

const isObj = (v) => v !== null && typeof v === "object" && !Array.isArray(v);

/**
 * Valide une sauvegarde importée. Renvoie { ok, state } ou { ok: false, error }.
 * Seuls les champs connus sont repris, avec vérification de leur type ;
 * un fichier mal formé est refusé en entier (l'état courant n'est pas touché).
 */
export function validateBackup(obj) {
  if (!isObj(obj)) return { ok: false, error: "La sauvegarde n'est pas un objet." };
  for (const k of ["lu", "quiz", "cartes", "plan", "journal"]) {
    if (k in obj && !isObj(obj[k])) return { ok: false, error: "Champ « " + k + " » invalide." };
  }
  if (!isObj(obj.cartes)) return { ok: false, error: "Aucune donnée de fiches trouvée." };
  for (const [k, v] of Object.entries(obj.cartes)) {
    if (!isObj(v) || typeof v.box !== "number" || v.box < 0 || v.box > 6) return { ok: false, error: "Fiche « " + k + " » invalide." };
    if (v.due !== null && v.due !== undefined && !/^\d{4}-\d{2}-\d{2}$/.test(String(v.due))) return { ok: false, error: "Échéance invalide pour « " + k + " »." };
  }
  for (const [k, v] of Object.entries(obj.quiz || {})) {
    if (!isObj(v) || typeof v.best !== "number") return { ok: false, error: "Résultat de quiz « " + k + " » invalide." };
  }
  for (const v of Object.values(obj.journal || {})) if (typeof v !== "number") return { ok: false, error: "Journal d'activité invalide." };
  const s = blankState();
  for (const k of ["lu", "quiz", "cartes", "plan", "journal"]) if (k in obj) s[k] = obj[k];
  if (typeof obj.prenom === "string") s.prenom = obj.prenom.slice(0, 80);
  if (["auto", "light", "dark"].includes(obj.theme)) s.theme = obj.theme;
  if (isObj(obj.focus) && typeof obj.focus.min === "number") s.focus = { min: obj.focus.min };
  return { ok: true, state: s };
}

/** Décode un code de sauvegarde (JSON brut ou JSON encodé en base64). */
export function decodeBackup(text) {
  const t = String(text || "").trim();
  try { return JSON.parse(t); } catch (e) { /* essai base64 */ }
  try {
    const bin = typeof atob === "function" ? atob(t) : Buffer.from(t, "base64").toString("binary");
    const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch (e) { return null; }
}

/** Encode l'état en code de sauvegarde base64 (UTF-8). */
export function encodeBackup(state) {
  const bytes = new TextEncoder().encode(JSON.stringify(state));
  let bin = "";
  bytes.forEach((b) => { bin += String.fromCharCode(b); });
  return typeof btoa === "function" ? btoa(bin) : Buffer.from(bin, "binary").toString("base64");
}
