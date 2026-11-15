// Répétition espacée — système de Leitner (comportement actuel, inchangé).
// Le remplacement par FSRS est prévu à une phase ultérieure.
// Fonctions pures : la date du jour est fournie par l'appelant.

import { addDays, dayKey } from "../core/dates.js";

export const INTERVALS = [0, 1, 2, 4, 8, 16, 32];
export const MAX_BOX = 6;
export const MASTERED_BOX = 3;

/**
 * Identifiant d'une fiche : son identifiant stable s'il existe (espace réel, v2),
 * sinon la clé v1 fondée sur la position (fixtures de démonstration, défaut C1).
 */
export const cardKey = (m, c, i, f) => (f && f.id ? f.id : m.id + "|" + c.id + "|" + i);

export const cardState = (cartes, k) => (cartes && cartes[k]) || { box: 0, due: null };

export const isDue = (cartes, k, today) => { const s = cardState(cartes, k); return !s.due || s.due <= dayKey(today); };

/**
 * Nouvel état d'une fiche après une note.
 * 1 = à revoir (boîte 0, aujourd'hui) · 2 = difficile (boîte ≥ 1, demain)
 * 3 = bien (boîte + 1) · 4 = facile (boîte + 2)
 */
export function rate(prev, r, today) {
  const s = { box: prev ? prev.box : 0, due: prev ? prev.due : null };
  if (r === 1) s.box = 0;
  else if (r === 2) s.box = Math.max(1, s.box);
  else if (r === 3) s.box = Math.min(MAX_BOX, s.box + 1);
  else if (r === 4) s.box = Math.min(MAX_BOX, s.box + 2);
  else throw new RangeError("Note invalide : " + r);
  const delay = r === 1 ? 0 : r === 2 ? 1 : INTERVALS[s.box];
  s.due = dayKey(addDays(today, delay));
  return s;
}

/** Délai affiché sur le bouton de note (3 ou 4), en jours. */
export const nextDelay = (prev, r) => INTERVALS[Math.min(MAX_BOX, (prev ? prev.box : 0) + (r === 3 ? 1 : 2))];

export function allCards(content, filter) {
  const out = [];
  (content.matieres || []).forEach((m) => {
    if (filter && filter !== m.id) return;
    (m.chapitres || []).forEach((c) => (c.fiches || []).forEach((f, i) => out.push({ m, c, f, k: cardKey(m, c, i, f) })));
  });
  return out;
}

export const dueCards = (content, cartes, today, filter) => allCards(content, filter).filter((x) => isDue(cartes, x.k, today));
