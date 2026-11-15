// Planning automatique (comportement actuel, inchangé).
// Défaut connu M4 : recalculé chaque jour, sans capacité quotidienne ni
// modification manuelle ; prévu pour la phase « planificateur ».

import { addDays, dayKey, daysBetween, examDate, fmtTime, parseDay, startOfDay } from "../core/dates.js";
import { chapStats, MASTERED_THRESHOLD } from "./progress.js";

/**
 * @returns {{k: string, d: Date, tasks: object[]}[]} jours triés, chacun avec ses tâches.
 */
export function buildPlan(content, state, today) {
  const t0 = startOfDay(today);
  const days = {};
  const push = (d, task) => { const k = dayKey(d); (days[k] = days[k] || []).push(task); };
  (content.matieres || []).forEach((m) => {
    const ex = examDate(m);
    if (!ex) return;
    const exDay = startOfDay(ex);
    if (exDay < t0) return;
    push(exDay, { exam: true, m, key: m.id + "|exam", titre: "Examen : " + m.nom, sub: fmtTime(ex) + " · " + (m.examen.type || "") });
    const ch = m.chapitres || [];
    if (!ch.length) {
      push(t0, { m, key: m.id + "|ajout", titre: "Ajouter les cours de " + m.nom, sub: "Aucun chapitre enregistré pour cette matière", href: "#m-" + m.id });
      return;
    }
    const tasks = [];
    ch.forEach((c) => {
      const s = chapStats(state, m, c);
      if (s.p >= MASTERED_THRESHOLD) return;
      tasks.push({ m, key: m.id + "|etude|" + c.id, titre: "Étudier : " + c.titre, sub: m.nom + " · résumé et fiches", href: "#c-" + m.id + "-" + c.id + "-resume" });
      if ((c.quiz || []).length) tasks.push({ m, key: m.id + "|quiz|" + c.id, titre: "Quiz : " + c.titre, sub: m.nom + " · vise 80 % ou plus", href: "#c-" + m.id + "-" + c.id + "-quiz" });
    });
    const lastStudy = addDays(exDay, -3);
    const span = Math.max(1, daysBetween(t0, lastStudy) + 1);
    tasks.forEach((tk, idx) => {
      const off = daysBetween(t0, lastStudy) < 0 ? 0 : Math.floor((idx * span) / Math.max(1, tasks.length));
      push(addDays(t0, off), tk);
    });
    const d2 = addDays(exDay, -2), d1 = addDays(exDay, -1);
    if (d2 >= t0) push(d2, { m, key: m.id + "|fiches-final", titre: "Révision de toutes les fiches", sub: m.nom, href: "#revision" });
    if (d1 >= t0) push(d1, { m, key: m.id + "|blanc", titre: "Examen blanc", sub: m.nom + " · toutes les questions", href: "#blanc-" + m.id });
  });
  return Object.keys(days).sort().map((k) => ({ k, d: parseDay(k), tasks: days[k] }));
}
