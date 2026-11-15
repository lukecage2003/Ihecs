// Index de recherche et classement des résultats. Pur.

const strip = (s) => String(s).replace(/[*=`>#|]/g, "");
export const norm = (s) => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

export function buildIndex(content) {
  const out = [];
  (content.matieres || []).forEach((m) => {
    out.push({ g: "Matières", t: m.nom, s: (m.chapitres || []).length + " chapitres", href: "#m-" + m.id, m });
    (m.chapitres || []).forEach((c) => {
      out.push({ g: "Chapitres", t: c.titre, s: m.nom, href: "#c-" + m.id + "-" + c.id + "-resume", m, body: strip(c.resume || "") });
      (c.definitions || []).forEach((d) => out.push({ g: "Définitions", t: d.terme, s: d.def, href: "#c-" + m.id + "-" + c.id + "-essentiel", m }));
      (c.fiches || []).forEach((f) => out.push({ g: "Fiches", t: strip(f.q), s: strip(f.r), href: "#c-" + m.id + "-" + c.id + "-fiches", m }));
    });
  });
  return out;
}

/** Tous les mots doivent apparaître (titre, sous-titre ou corps), sans tenir compte des accents. */
export function search(index, query, limit = 40) {
  const q = norm(String(query || "").trim());
  if (!q) return index.filter((x) => x.g === "Matières" || x.g === "Chapitres");
  const words = q.split(/\s+/);
  return index.map((x) => {
    const t = norm(x.t), s = norm(x.s), b = norm(x.body);
    if (!words.every((w) => t.includes(w) || s.includes(w) || b.includes(w))) return null;
    let score = 0;
    words.forEach((w) => { if (t.startsWith(w)) score += 6; if (t.includes(w)) score += 4; if (s.includes(w)) score += 1; });
    return { x, score };
  }).filter(Boolean).sort((a, b) => b.score - a.score).slice(0, limit).map((r) => r.x);
}
