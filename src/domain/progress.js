// Mesures de progression (comportement actuel, inchangé).
// Défaut connu M1 : le pourcentage unique pondéré 30/30/40 sera remplacé par
// des mesures séparées dans la phase « analytique ».

import { cardKey, cardState, MASTERED_BOX } from "./srs.js";

export const MASTERED_THRESHOLD = 0.85;
export const chapKey = (m, c) => m.id + "|" + c.id;

export function chapStats(state, m, c) {
  const k = chapKey(m, c);
  const fiches = c.fiches || [];
  const mastered = fiches.filter((f, i) => cardState(state.cartes, cardKey(m, c, i, f)).box >= MASTERED_BOX).length;
  const lu = !!(state.lu && state.lu[k]);
  const q = state.quiz && state.quiz[k];
  const parts = [[lu ? 1 : 0, 0.3]];
  if ((c.quiz || []).length) parts.push([q ? q.best : 0, 0.3]);
  if (fiches.length) parts.push([mastered / fiches.length, 0.4]);
  const w = parts.reduce((a, p) => a + p[1], 0);
  const p = parts.reduce((a, x) => a + x[0] * x[1], 0) / w;
  return { lu, quizBest: q ? q.best : null, mastered, total: fiches.length, p };
}

export function subjectProgress(state, m) {
  const ch = m.chapitres || [];
  if (!ch.length) return 0;
  return ch.reduce((a, c) => a + chapStats(state, m, c).p, 0) / ch.length;
}

export function overall(content, state) {
  let n = 0, sum = 0, lu = 0, mast = 0, cards = 0, chapters = 0, done = 0;
  (content.matieres || []).forEach((m) => (m.chapitres || []).forEach((c) => {
    const s = chapStats(state, m, c);
    n++; sum += s.p; if (s.lu) lu++; mast += s.mastered; cards += s.total; chapters++; if (s.p >= MASTERED_THRESHOLD) done++;
  }));
  return { p: n ? sum / n : 0, lu, mast, cards, chapters, done };
}
