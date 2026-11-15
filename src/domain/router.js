// Analyse du hash en route. Pur.
// Routes : #accueil #matieres #revision #examens #planning #parametres
//          #m-<matiere>  #c-<matiere>-<chapitre>-<onglet>  #blanc-<matiere>

export const CHAPTER_TABS = ["resume", "essentiel", "fiches", "quiz"];
const SIMPLE = { accueil: "home", revision: "revision", examens: "exams", planning: "planning", parametres: "settings", matieres: "subjects" };

export function parseRoute(hash, content) {
  const M = (content && content.matieres) || [];
  const h = String(hash || "").replace(/^#/, "") || "accueil";
  let mm;
  if ((mm = h.match(/^m-([a-z0-9]+)$/i))) return { name: "subject", m: M.find((x) => x.id === mm[1]), nav: "#m-" + mm[1], tab: "#matieres" };
  if ((mm = h.match(/^c-([a-z0-9]+)-([a-z0-9]+)-(resume|essentiel|fiches|quiz)$/i))) {
    const m = M.find((x) => x.id === mm[1]);
    return { name: "chapter", m, c: m && (m.chapitres || []).find((x) => x.id === mm[2]), t: mm[3], nav: "#m-" + mm[1], tab: "#matieres" };
  }
  if ((mm = h.match(/^blanc-([a-z0-9]+)$/i))) return { name: "blanc", m: M.find((x) => x.id === mm[1]), nav: "#m-" + mm[1], tab: "#matieres" };
  if (SIMPLE[h]) return { name: SIMPLE[h], nav: "#" + h, tab: "#" + h };
  return { name: "unknown", id: h };
}
