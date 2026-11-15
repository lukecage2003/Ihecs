// Journal d'activité quotidien et série de jours (comportement actuel).
// Défaut connu M3 : les unités sont hétérogènes (fiche, question, tâche, minuteur).

import { addDays, dayKey } from "../core/dates.js";

/** Renvoie un nouveau journal avec n unités ajoutées au jour `now`. */
export const addActivity = (journal, now, n = 1) => {
  const k = dayKey(now);
  return Object.assign({}, journal, { [k]: (journal[k] || 0) + n });
};

/** Nombre de jours consécutifs avec activité, en finissant aujourd'hui ou hier. */
export function streak(journal, today) {
  let d = today, n = 0;
  if (!journal[dayKey(d)]) d = addDays(d, -1);
  while (journal[dayKey(d)]) { n++; d = addDays(d, -1); }
  return n;
}

/** Activité des 7 derniers jours (le plus ancien d'abord). */
export function lastWeek(journal, today) {
  const out = [];
  for (let i = 6; i >= 0; i--) { const d = addDays(today, -i); out.push({ d, v: journal[dayKey(d)] || 0, today: i === 0 }); }
  return out;
}
