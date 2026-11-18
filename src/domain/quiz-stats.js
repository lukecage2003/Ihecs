// Bilan d'un examen blanc : score par chapitre et questions ratées. Fonctions pures.

/**
 * @param {Array<{_m?: string}>} questions  questions dans l'ordre posé
 * @param {Array<boolean|undefined>} results résultat de chaque question (undefined = sans réponse)
 * @returns {{ok, total, unanswered, byChapter: Array<{titre, ok, total}>, missed: Array}}
 */
export function quizReport(questions, results) {
  const groups = new Map();
  let ok = 0, unanswered = 0;
  const missed = [];
  questions.forEach((q, i) => {
    const t = q._m || "Questions";
    if (!groups.has(t)) groups.set(t, { titre: t, ok: 0, total: 0 });
    const g = groups.get(t);
    g.total++;
    if (results[i] === true) { g.ok++; ok++; }
    else { missed.push(q); if (results[i] === undefined) unanswered++; }
  });
  const byChapter = [...groups.values()].sort((a, b) => a.ok / a.total - b.ok / b.total || a.titre.localeCompare(b.titre, "fr"));
  return { ok, total: questions.length, unanswered, byChapter, missed };
}
