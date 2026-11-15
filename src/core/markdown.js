// Rendu Markdown minimal et sûr (sous-ensemble) : titres, listes, tableaux,
// citations, gras, italique, surlignage (==x==), code, liens restreints.
// Tout le texte est échappé avant transformation. Pur : aucun accès au DOM.
//
// Limite connue : ce rendu convient au contenu rédigé par l'utilisateur ou aux
// fixtures. Le contenu importé de documents non fiables devra passer par un
// assainisseur HTML éprouvé (prévu avec la bibliothèque de documents).

import { esc } from "./html.js";

const SAFE_HREF = /^(https?:|#|cours\/)/;

export function inline(s) {
  const keep = [];
  s = String(s).replace(/\\([*_=`\\|])/g, (_, ch) => { keep.push(ch); return "\u0000" + (keep.length - 1) + "\u0000"; });
  s = esc(s)
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/==([^=]+)==/g, "<mark>$1</mark>")
    .replace(/(^|[^*])\*([^*\s][^*]*)\*/g, "$1<em>$2</em>")
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, t, u) => '<a href="' + (SAFE_HREF.test(u) ? u : "#") + '" target="_blank" rel="noopener">' + t + "</a>");
  return s.replace(/\u0000(\d+)\u0000/g, (_, i) => esc(keep[+i]));
}

export const slug = (s) => String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const isBlockStart = (l) => /^(#{1,4}\s|>|\s*[-*]\s|\s*\d+\.\s|\||---\s*$)/.test(l);
const cells = (r) => r.replace(/^\||\|\s*$/g, "").split(/(?<!\\)\|/).map((x) => x.trim());

/** @returns {{html: string, toc: {id: string, t: string}[]}} */
export function md(src) {
  const lines = String(src || "").replace(/\r/g, "").trim().split("\n");
  let html = "", i = 0;
  const toc = [];
  while (i < lines.length) {
    const l = lines[i];
    if (!l.trim()) { i++; continue; }
    let mm;
    if ((mm = l.match(/^(#{1,4})\s+(.*)$/))) {
      const lvl = Math.max(2, mm[1].length), id = slug(mm[2]);
      if (lvl === 2) toc.push({ id, t: mm[2] });
      html += "<h" + lvl + ' id="' + id + '">' + inline(mm[2]) + "</h" + lvl + ">"; i++; continue;
    }
    if (/^---\s*$/.test(l)) { html += "<hr>"; i++; continue; }
    if (l.startsWith(">")) {
      const buf = [];
      while (i < lines.length && lines[i].startsWith(">")) { buf.push(lines[i].replace(/^>\s?/, "")); i++; }
      html += "<blockquote>" + md(buf.join("\n")).html + "</blockquote>"; continue;
    }
    if (l.startsWith("|")) {
      const rows = [];
      while (i < lines.length && lines[i].startsWith("|")) { rows.push(lines[i]); i++; }
      const head = cells(rows[0]);
      const body = rows.slice(/^\|[\s:|-]+\|?\s*$/.test(rows[1] || "") ? 2 : 1);
      html += '<div class="table-wrap"><table><thead><tr>' + head.map((h) => "<th>" + inline(h) + "</th>").join("") + "</tr></thead><tbody>" +
        body.map((r) => "<tr>" + cells(r).map((x) => "<td>" + inline(x) + "</td>").join("") + "</tr>").join("") + "</tbody></table></div>";
      continue;
    }
    if (/^\s*[-*]\s/.test(l) || /^\s*\d+\.\s/.test(l)) {
      const ordered = /^\s*\d+\.\s/.test(l);
      const re = ordered ? /^\s*\d+\.\s+/ : /^\s*[-*]\s+/;
      const items = [];
      while (i < lines.length && re.test(lines[i])) { items.push(lines[i].replace(re, "")); i++; }
      html += (ordered ? "<ol>" : "<ul>") + items.map((x) => "<li>" + inline(x) + "</li>").join("") + (ordered ? "</ol>" : "</ul>");
      continue;
    }
    const buf = [];
    while (i < lines.length && lines[i].trim() && !isBlockStart(lines[i])) { buf.push(lines[i]); i++; }
    html += "<p>" + inline(buf.join(" ")) + "</p>";
  }
  return { html, toc };
}
