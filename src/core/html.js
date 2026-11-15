// Échappement HTML et validation de valeurs insérées dans le balisage.
// Pur : utilisable dans Node pour les tests.

const MAP = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };

export const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => MAP[c]);

const HEX = /^#(?:[0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;

/**
 * Couleur sûre pour un attribut style. Seules les couleurs hexadécimales sont
 * acceptées ; toute autre valeur (y compris une tentative d'injection CSS)
 * est remplacée par la couleur de repli.
 */
export const safeColor = (c, fallback = "#8e8e93") => (typeof c === "string" && HEX.test(c.trim()) ? c.trim() : fallback);
