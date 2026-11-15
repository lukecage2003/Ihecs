/* Révisions — application (aucune dépendance).
   Routes (hash) : #accueil, #revision, #examens, #planning, #parametres,
   #m-<matiere>, #c-<matiere>-<chapitre>-<onglet>, #blanc-<matiere> */
(function () {
  "use strict";

  const D = window.REVISION || { matieres: [] };
  const M = D.matieres || [];
  const $ = (s, el) => (el || document).querySelector(s);
  const $$ = (s, el) => Array.from((el || document).querySelectorAll(s));
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  /* ================================================================
     Icônes (style SF Symbols, trait 1.8)
     ================================================================ */
  const P = {
    home: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9.5"/>',
    cards: '<rect x="3" y="6" width="14" height="14" rx="2.5"/><path d="M7 3h11.5A2.5 2.5 0 0 1 21 5.5V17"/>',
    calendar: '<rect x="3" y="4.5" width="18" height="16.5" rx="2.5"/><path d="M3 9.5h18M8 2.5v4M16 2.5v4"/>',
    plan: '<path d="M9 6h11M9 12h11M9 18h11"/><path d="m3.5 6 1.2 1.2L7 5M3.5 12l1.2 1.2L7 11M3.5 18l1.2 1.2L7 17"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68 1.65 1.65 0 0 0 10 3.17V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9c.14.34.45.6.82.67H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20.5 20.5-4.5-4.5"/>',
    people: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.6-3.6 3.3-5.5 6.5-5.5s5.9 1.9 6.5 5.5"/><circle cx="17" cy="9" r="2.6"/><path d="M17 14.5c2.4 0 4.1 1.5 4.6 4"/>',
    scale: '<path d="M12 3v18M7 21h10M4 7h16"/><path d="m4 7-2.5 6a3 3 0 0 0 5 0L4 7zM20 7l-2.5 6a3 3 0 0 0 5 0L20 7z"/>',
    chart: '<path d="M3 3v18h18"/><path d="m7 15 4-4 3 3 6-7"/>',
    eye: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z"/>',
    book: '<path d="M4 4.5A1.5 1.5 0 0 1 5.5 3H20v15H5.5A1.5 1.5 0 0 0 4 19.5z"/><path d="M4 19.5A1.5 1.5 0 0 0 5.5 21H20"/>',
    mic: '<rect x="9" y="2.5" width="6" height="12" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3.5"/>',
    pen: '<path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
    camera: '<path d="M3 8a2 2 0 0 1 2-2h2.5l1.5-2h6l1.5 2H19a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><circle cx="12" cy="13" r="3.5"/>',
    brain: '<path d="M9 4a3 3 0 0 0-3 3 3 3 0 0 0-2 5 3 3 0 0 0 2 5 3 3 0 0 0 3 3 3 3 0 0 0 3-3V7a3 3 0 0 0-3-3zM15 4a3 3 0 0 1 3 3 3 3 0 0 1 2 5 3 3 0 0 1-2 5 3 3 0 0 1-3 3 3 3 0 0 1-3-3"/>',
    check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
    chev: '<path d="m9 5 7 7-7 7"/>',
    back: '<path d="m15 5-7 7 7 7"/>',
    flame: '<path d="M12 21c4 0 7-2.7 7-6.8 0-3.2-2-5.5-3.7-7.4-.4 2-1.4 3.3-2.8 3.8.3-3.4-1-6.4-3.5-7.6.2 3.3-2.3 5.6-3.6 7.6A8 8 0 0 0 5 14.2C5 18.3 8 21 12 21z"/>',
    target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
    timer: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2.5M9.5 2.5h5"/>',
    play: '<path d="M7 4.5v15l12.5-7.5z" fill="currentColor"/>',
    pause: '<path d="M7 4.5h3.5v15H7zM13.5 4.5H17v15h-3.5z" fill="currentColor"/>',
    reset: '<path d="M3.5 12a8.5 8.5 0 1 0 2.6-6.1M3.5 3.5v5h5"/>',
    doc: '<path d="M6 2.5h8l4.5 4.5V21a.5.5 0 0 1-.5.5H6a.5.5 0 0 1-.5-.5V3a.5.5 0 0 1 .5-.5z"/><path d="M14 2.5V7h4.5M9 12h6M9 16h6"/>',
    spark: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5.5M12 7.5v.5"/>',
    shuffle: '<path d="M3 7h3.5c4 0 5 10 9 10H21M3 17h3.5c1.6 0 2.7-1.6 3.6-3.6M14.5 10.6C15.4 8.6 16.5 7 18 7h3M18 4l3 3-3 3M18 14l3 3-3 3"/>',
    pin: '<path d="M12 21s7-6.2 7-11.5a7 7 0 1 0-14 0C5 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    award: '<circle cx="12" cy="9" r="6"/><path d="m8.5 14-1.5 7.5 5-2.5 5 2.5-1.5-7.5"/>',
    exam: '<path d="M8 3.5h8M9 2.5h6a1 1 0 0 1 1 1V5H8V3.5a1 1 0 0 1 1-1z"/><path d="M8 4H6a1.5 1.5 0 0 0-1.5 1.5v14A1.5 1.5 0 0 0 6 21h12a1.5 1.5 0 0 0 1.5-1.5v-14A1.5 1.5 0 0 0 18 4h-2"/><path d="m8.5 13 2.5 2.5 4.5-5"/>',
    folder: '<path d="M3 6.5A1.5 1.5 0 0 1 4.5 5h4.6l2 2.2h8.4A1.5 1.5 0 0 1 21 8.7v9.8a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 18.5z"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>'
  };
  const ic = (name, size, extra) => '<svg width="' + (size || 20) + '" height="' + (size || 20) + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"' + (extra || "") + ">" + (P[name] || P.book) + "</svg>";

  /* ================================================================
     Dates
     ================================================================ */
  const pad = (n) => String(n).padStart(2, "0");
  const dayKey = (d) => d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
  const startOfDay = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
  const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
  const parseDay = (k) => { const [y, m, d] = k.split("-").map(Number); return new Date(y, m - 1, d); };
  const today = () => startOfDay(new Date());
  const daysBetween = (a, b) => Math.round((startOfDay(b) - startOfDay(a)) / 86400000);
  const fmt = (d, o) => new Intl.DateTimeFormat("fr-BE", o).format(d);
  const fmtLong = (d) => fmt(d, { weekday: "long", day: "numeric", month: "long" });
  const fmtShort = (d) => fmt(d, { day: "numeric", month: "short" });
  const fmtTime = (d) => fmt(d, { hour: "2-digit", minute: "2-digit" });
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  const examDate = (m) => (m.examen && m.examen.date ? new Date(m.examen.date) : null);

  /* ================================================================
     État local (progression)
     ================================================================ */
  const KEY = "revisions-ihecs-v1";
  const blank = () => ({ lu: {}, quiz: {}, cartes: {}, plan: {}, journal: {}, prenom: "", theme: "auto", focus: { min: 0 } });
  let S = blank();
  try { const raw = localStorage.getItem(KEY); if (raw) S = Object.assign(blank(), JSON.parse(raw)); } catch (e) { /* stockage indisponible */ }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* ignore */ } };

  function logActivity(n) {
    const k = dayKey(new Date());
    S.journal[k] = (S.journal[k] || 0) + (n || 1);
    save();
  }
  function streak() {
    let d = today(), n = 0;
    if (!S.journal[dayKey(d)]) d = addDays(d, -1);
    while (S.journal[dayKey(d)]) { n++; d = addDays(d, -1); }
    return n;
  }

  /* ================================================================
     Répétition espacée (système de Leitner)
     ================================================================ */
  const INTERVALS = [0, 1, 2, 4, 8, 16, 32];
  const cardKey = (m, c, i) => m.id + "|" + c.id + "|" + i;
  const cardState = (k) => S.cartes[k] || { box: 0, due: null };
  const isDue = (k) => { const s = cardState(k); return !s.due || s.due <= dayKey(new Date()); };
  function rateCard(k, r) {
    const s = Object.assign({}, cardState(k));
    if (r === 1) s.box = 0;
    else if (r === 2) s.box = Math.max(1, s.box);
    else if (r === 3) s.box = Math.min(6, s.box + 1);
    else s.box = Math.min(6, s.box + 2);
    const delay = r === 1 ? 0 : r === 2 ? 1 : INTERVALS[s.box];
    s.due = dayKey(addDays(today(), delay));
    S.cartes[k] = s;
    logActivity(1);
  }
  function allCards(filter) {
    const out = [];
    M.forEach((m) => {
      if (filter && filter !== m.id) return;
      (m.chapitres || []).forEach((c) => (c.fiches || []).forEach((f, i) => out.push({ m, c, f, k: cardKey(m, c, i) })));
    });
    return out;
  }
  const dueCards = (filter) => allCards(filter).filter((x) => isDue(x.k));

  /* ================================================================
     Progression
     ================================================================ */
  const chapKey = (m, c) => m.id + "|" + c.id;
  function chapStats(m, c) {
    const k = chapKey(m, c);
    const fiches = c.fiches || [];
    const mastered = fiches.filter((f, i) => cardState(cardKey(m, c, i)).box >= 3).length;
    const lu = !!S.lu[k];
    const q = S.quiz[k];
    const parts = [[lu ? 1 : 0, 0.3]];
    if ((c.quiz || []).length) parts.push([q ? q.best : 0, 0.3]);
    if (fiches.length) parts.push([mastered / fiches.length, 0.4]);
    const w = parts.reduce((a, p) => a + p[1], 0);
    const p = parts.reduce((a, x) => a + x[0] * x[1], 0) / w;
    return { lu, quizBest: q ? q.best : null, mastered, total: fiches.length, p };
  }
  function subjectProgress(m) {
    const ch = m.chapitres || [];
    if (!ch.length) return 0;
    return ch.reduce((a, c) => a + chapStats(m, c).p, 0) / ch.length;
  }
  function overall() {
    let n = 0, sum = 0, lu = 0, mast = 0, cards = 0, chapters = 0, done = 0;
    M.forEach((m) => (m.chapitres || []).forEach((c) => {
      const s = chapStats(m, c);
      n++; sum += s.p; if (s.lu) lu++; mast += s.mastered; cards += s.total; chapters++; if (s.p >= 0.85) done++;
    }));
    return { p: n ? sum / n : 0, lu, mast, cards, chapters, done };
  }
  const statusPill = (p) => p >= 0.85 ? '<span class="pill pill-good">' + ic("check", 12) + "Maîtrisé</span>"
    : p >= 0.4 ? '<span class="pill pill-info">En cours</span>'
    : p > 0 ? '<span class="pill pill-warn">Commencé</span>'
    : '<span class="pill pill-neutral">À faire</span>';
  const bar = (p, color) => '<div class="bar"><i style="width:' + Math.round(p * 100) + "%" + (color ? ";background:" + color : "") + '"></i></div>';
  function ring(p, size, stroke, color, label) {
    const r = (size - stroke) / 2, c = 2 * Math.PI * r;
    return '<div class="ring" style="width:' + size + "px;height:" + size + 'px"><svg width="' + size + '" height="' + size + '"><circle class="ring-track" cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + r + '" fill="none" stroke-width="' + stroke + '"/><circle class="ring-val" cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + r + '" fill="none" stroke="' + (color || "var(--accent)") + '" stroke-width="' + stroke + '" stroke-linecap="round" stroke-dasharray="' + c + '" stroke-dashoffset="' + c * (1 - Math.max(0, Math.min(1, p))) + '"/></svg><div class="ring-label">' + (label || "") + "</div></div>";
  }
  const tile = (m, lg) => '<div class="icon-tile' + (lg ? " lg" : "") + '" style="background:' + esc(m.couleur) + '">' + ic(m.icone) + "</div>";

  /* ================================================================
     Markdown minimal
     ================================================================ */
  function inline(s) {
    const keep = [];
    s = s.replace(/\\([*_=`\\|])/g, (_, ch) => { keep.push(ch); return "\u0000" + (keep.length - 1) + "\u0000"; });
    s = esc(s)
      .replace(/`([^`]+)`/g, "<code>$1</code>")
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/==([^=]+)==/g, "<mark>$1</mark>")
      .replace(/(^|[^*])\*([^*\s][^*]*)\*/g, "$1<em>$2</em>")
      .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, t, u) => '<a href="' + (/^(https?:|#|cours\/)/.test(u) ? u : "#") + '" target="_blank" rel="noopener">' + t + "</a>");
    return s.replace(/\u0000(\d+)\u0000/g, (_, i) => esc(keep[+i]));
  }
  const slug = (s) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  function md(src) {
    const lines = String(src || "").replace(/\r/g, "").trim().split("\n");
    let html = "", i = 0;
    const toc = [];
    const isBlockStart = (l) => /^(#{1,4}\s|>|\s*[-*]\s|\s*\d+\.\s|\||---\s*$)/.test(l);
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
        const cells = (r) => r.replace(/^\||\|\s*$/g, "").split(/(?<!\\)\|/).map((x) => x.trim());
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

  /* ================================================================
     Planning automatique
     ================================================================ */
  function buildPlan() {
    const t0 = today();
    const days = {};
    const push = (d, task) => { const k = dayKey(d); (days[k] = days[k] || []).push(task); };
    M.forEach((m) => {
      const ex = examDate(m);
      if (!ex) return;
      const exDay = startOfDay(ex);
      if (exDay < t0) return;
      push(exDay, { exam: true, m, key: m.id + "|exam", titre: "Examen : " + m.nom, sub: fmtTime(ex) + " · " + (m.examen.type || "") });
      const ch = m.chapitres || [];
      if (!ch.length) {
        push(t0, { m, key: m.id + "|ajout", titre: "Ajouter les cours de " + m.nom, sub: "Dépose les fichiers dans cours/" + m.id + "/", href: "#m-" + m.id });
        return;
      }
      const tasks = [];
      ch.forEach((c) => {
        const s = chapStats(m, c);
        if (s.p >= 0.85) return;
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

  /* ================================================================
     Coquille : barre latérale, onglets, en-tête mobile
     ================================================================ */
  function shell(route) {
    const due = dueCards().length;
    const a = (href, label, icon, badge) => '<a href="' + href + '"' + (route.nav === href ? ' class="active" aria-current="page"' : "") + '><span class="nav-ico">' + ic(icon, 18) + '</span><span class="t">' + label + "</span>" + (badge ? '<span class="badge">' + badge + "</span>" : "") + "</a>";
    $("#sidebar").innerHTML =
      '<div class="brand"><div class="brand-mark">' + ic("book", 18) + '</div><div><div class="brand-name">Révisions</div><div class="brand-sub">' + esc(D.ecole || "") + " · " + esc((D.annee || "").split("—")[0].trim()) + "</div></div></div>" +
      '<button class="search-btn" id="open-search" type="button">' + ic("search", 16) + "Rechercher<kbd>⌘K</kbd></button>" +
      '<nav class="nav">' + a("#accueil", "Tableau de bord", "home") + a("#revision", "Révision du jour", "cards", due || "") + a("#examens", "Examens", "exam") + a("#planning", "Planning", "plan") + "</nav>" +
      '<div class="nav-label">Matières</div><nav class="nav">' +
      M.map((m) => '<a href="#m-' + m.id + '"' + (route.nav === "#m-" + m.id ? ' class="active" aria-current="page"' : "") + '><span class="nav-dot" style="background:' + esc(m.couleur) + '">' + ic(m.icone, 13) + '</span><span class="t">' + esc(m.nom) + '</span><span class="badge">' + Math.round(subjectProgress(m) * 100) + "%</span></a>").join("") +
      "</nav>" +
      '<nav class="nav" style="margin-top:14px">' + a("#parametres", "Réglages", "gear") + "</nav>" +
      '<div class="sidebar-foot">' + esc(D.session ? D.session.nom : "") + "</div>";
    const t = (href, label, icon) => '<a href="' + href + '"' + (route.tab === href ? ' class="active"' : "") + ">" + ic(icon, 24) + label + "</a>";
    $("#tabbar").innerHTML = t("#accueil", "Accueil", "home") + t("#matieres", "Matières", "book") + t("#revision", "Révision", "cards") + t("#examens", "Examens", "exam") + t("#planning", "Planning", "plan");
    $("#mobile-top").innerHTML = '<div class="brand"><div class="brand-mark">' + ic("book", 18) + '</div><div class="brand-name">Révisions</div></div><div style="display:flex;gap:8px"><button class="icon-btn" id="open-search-m" type="button" aria-label="Rechercher">' + ic("search", 18) + '</button><a class="icon-btn" href="#parametres" aria-label="Réglages">' + ic("gear", 18) + "</a></div>";
    $("#open-search").onclick = openSearch;
    $("#open-search-m").onclick = openSearch;
  }

  /* ================================================================
     Vues
     ================================================================ */
  const banner = () => D.exemple ? '<div class="banner">' + ic("info", 18) + "<div><b>Contenu d'exemple.</b> Les matières, examens et résumés affichés sont des exemples pour montrer le site. Ils seront remplacés par tes vrais cours.</div></div>" : "";

  function viewHome() {
    const o = overall();
    const t0 = today();
    const upcoming = M.filter((m) => examDate(m) && startOfDay(examDate(m)) >= t0).sort((a, b) => examDate(a) - examDate(b));
    const next = upcoming[0];
    const hour = new Date().getHours();
    const hello = (hour < 5 ? "Bonne nuit" : hour < 18 ? "Bonjour" : "Bonsoir") + (S.prenom ? " " + esc(S.prenom) : "");
    const due = dueCards().length;
    const plan = buildPlan();
    const todayPlan = (plan.find((d) => d.k === dayKey(t0)) || { tasks: [] }).tasks.filter((x) => !x.exam);

    let hero;
    if (next) {
      const ex = examDate(next), n = daysBetween(t0, ex);
      const ready = subjectProgress(next);
      hero = '<div class="hero-exam" style="--hero-a:' + esc(next.couleur) + ';--hero-b:color-mix(in srgb, ' + esc(next.couleur) + ' 55%, #000)">' +
        '<div><div class="eyebrow">Prochain examen</div><h2 class="h-exam">' + esc(next.nom) + '</h2><div class="meta">' + cap(fmtLong(ex)) + " à " + fmtTime(ex) + " · " + esc(next.examen.type || "") + "</div></div>" +
        '<div class="countdown"><div><div class="num">' + (n === 0 ? "Auj." : n) + '</div><div class="unit">' + (n === 0 ? "c'est aujourd'hui" : n === 1 ? "jour restant" : "jours restants") + '</div></div><div><div class="num">' + Math.round(ready * 100) + '<span style="font-size:.45em">%</span></div><div class="unit">préparé</div></div>' +
        '<a class="btn" href="#m-' + next.id + '" style="margin-left:auto">Réviser ' + ic("chev", 16) + "</a></div></div>";
    } else {
      hero = '<div class="hero-exam"><div><div class="eyebrow">Examens</div><h2 class="h-exam">Aucun examen à venir</h2><div class="meta">Ajoute les dates dans le fichier des cours.</div></div></div>';
    }

    const subjects = M.map((m) => {
      const p = subjectProgress(m), ex = examDate(m), n = ex ? daysBetween(t0, ex) : null;
      const chip = n == null ? "" : n < 0 ? '<span class="pill pill-neutral">Passé</span>' : n <= 7 ? '<span class="pill pill-bad">J-' + n + "</span>" : n <= 21 ? '<span class="pill pill-warn">J-' + n + "</span>" : '<span class="pill pill-neutral">J-' + n + "</span>";
      const nch = (m.chapitres || []).length;
      return '<a class="card subject-card" href="#m-' + m.id + '"><div class="top">' + tile(m) + chip + '</div><div><div class="name">' + esc(m.nom) + '</div><div class="prof">' + esc(m.prof || "") + " · " + (m.credits || "?") + " ECTS</div></div>" + bar(p, m.couleur) +
        '<div class="foot"><span>' + (nch ? nch + " chapitre" + (nch > 1 ? "s" : "") : "Cours à ajouter") + '</span><span class="tnum">' + Math.round(p * 100) + " %</span></div></a>";
    }).join("");

    const week = [];
    for (let i = 6; i >= 0; i--) { const d = addDays(t0, -i); week.push({ d, v: S.journal[dayKey(d)] || 0, today: i === 0 }); }
    const max = Math.max(5, ...week.map((w) => w.v));
    const weekHtml = '<div class="week">' + week.map((w) => '<div class="col' + (w.today ? " today" : "") + '"><span class="v">' + (w.v || "") + '</span><div class="b' + (w.v ? "" : " zero") + '" style="height:' + Math.max(3, (w.v / max) * 82) + '%"></div><span class="lbl">' + cap(fmt(w.d, { weekday: "narrow" })) + "</span></div>").join("") + "</div>";

    const tasksHtml = todayPlan.length ? '<div class="task-list">' + todayPlan.slice(0, 6).map(taskRow).join("") + "</div>" + (todayPlan.length > 6 ? '<a href="#planning" class="small">+ ' + (todayPlan.length - 6) + " autres tâches</a>" : "")
      : '<p class="muted">Rien de prévu aujourd\'hui. Profite pour revoir tes fiches.</p>';

    return banner() +
      '<header class="page-head"><div><div class="eyebrow">' + cap(fmtLong(new Date())) + '</div><h1 class="h-large">' + hello + "</h1></div></header>" +
      '<section class="hero">' + hero +
      '<div class="card overall"><div class="h-card">Progression globale</div><div class="overall-top">' + ring(o.p, 132, 14, "var(--accent)", '<div style="font-size:30px;font-weight:700;letter-spacing:-.03em">' + Math.round(o.p * 100) + '%</div><div class="small muted">global</div>') +
      '<div class="legend"><div><i style="background:var(--accent)"></i>' + o.lu + "/" + o.chapters + " chapitres lus</div><div><i style=\"background:var(--good)\"></i>" + o.mast + "/" + o.cards + " fiches maîtrisées</div><div><i style=\"background:var(--warn)\"></i>" + o.done + "/" + o.chapters + " chapitres maîtrisés</div></div></div>" +
      '<a class="btn btn-ghost" href="#revision">' + ic("cards", 16) + (due ? "Réviser " + due + " fiche" + (due > 1 ? "s" : "") : "Toutes les fiches sont à jour") + "</a></div></section>" +

      '<section class="grid g-4 section" style="margin-top:16px">' +
      statTile("cards", "var(--accent)", "Fiches du jour", due, "", '<a href="#revision">Commencer</a>') +
      statTile("flame", "#ff9f0a", "Série", streak(), streak() > 1 ? "jours" : "jour", '<span class="small muted">Révise chaque jour</span>') +
      statTile("target", "var(--good)", "Chapitres maîtrisés", o.done, "/ " + o.chapters, '<span class="small muted">Au moins 85 %</span>') +
      statTile("timer", "#bf5af2", "Temps de focus", Math.round(S.focus.min || 0), "min", '<span class="small muted">Au total</span>') +
      "</section>" +

      '<section class="section"><div class="section-head"><h2 class="h-sec">Mes matières</h2><a href="#examens">Voir les examens</a></div><div class="grid g-auto">' + subjects + "</div></section>" +

      '<section class="section grid g-3">' +
      '<div class="card" style="grid-column:span 2;min-width:0"><div class="section-head" style="margin-bottom:4px"><h2 class="h-card">Aujourd\'hui</h2><a href="#planning">Planning complet</a></div>' + tasksHtml + "</div>" +
      '<div class="card"><div class="h-card">Focus</div><p class="small muted" style="margin:4px 0 14px">Sessions de travail de 25 minutes.</p><div id="focus-slot"></div></div>' +
      "</section>" +

      '<section class="section"><div class="card"><div class="section-head" style="margin-bottom:0"><h2 class="h-card">Activité des 7 derniers jours</h2><span class="small muted">Fiches et questions travaillées</span></div>' + weekHtml + "</div></section>";
  }
  function statTile(icon, color, label, val, unit, foot) {
    return '<div class="card stat"><div class="stat-top"><span style="color:' + color + '">' + ic(icon, 18) + "</span>" + label + '</div><div class="stat-val">' + val + (unit ? " <small>" + unit + "</small>" : "") + "</div>" + foot + "</div>";
  }
  function taskRow(t) {
    const on = !!S.plan[t.key];
    return '<div class="task' + (on ? " done" : "") + '"><button class="check' + (on ? " on" : "") + '" data-task="' + esc(t.key) + '" type="button" aria-label="Marquer comme fait" aria-pressed="' + on + '">' + ic("check", 13) + '</button><span class="dot" style="background:' + esc(t.m.couleur) + '"></span><div class="tx"><div class="tt">' + esc(t.titre) + '</div><div class="ts">' + esc(t.sub || "") + "</div></div>" + (t.href ? '<a class="btn btn-plain btn-sm" href="' + t.href + '">Ouvrir</a>' : "") + "</div>";
  }

  function viewSubjects() {
    return banner() + '<header class="page-head"><div><div class="eyebrow">' + esc(D.annee || "") + '</div><h1 class="h-large">Matières</h1></div></header><div class="list">' +
      M.map((m) => { const p = subjectProgress(m); return '<a class="row" href="#m-' + m.id + '">' + tile(m) + '<div class="rx"><div class="rt">' + esc(m.nom) + '</div><div class="rs">' + (m.chapitres || []).length + " chapitres · " + (m.credits || "?") + ' ECTS</div></div><div class="rbar">' + bar(p, m.couleur) + '</div><span class="tnum small muted">' + Math.round(p * 100) + '%</span><span class="chev">' + ic("chev", 16) + "</span></a>"; }).join("") + "</div>";
  }

  function viewSubject(m) {
    const p = subjectProgress(m);
    const ex = examDate(m);
    const n = ex ? daysBetween(today(), ex) : null;
    const ch = m.chapitres || [];
    const nQuiz = ch.reduce((a, c) => a + (c.quiz || []).length, 0);
    const chapters = ch.length ? '<div class="list">' + ch.map((c, i) => {
      const s = chapStats(m, c);
      return '<a class="row" href="#c-' + m.id + "-" + c.id + '-resume"><span class="num' + (s.p >= 0.85 ? " ok" : "") + '">' + (s.p >= 0.85 ? ic("check", 16) : i + 1) + '</span><div class="rx"><div class="rt">' + esc(c.titre) + '</div><div class="rs">' + (c.duree ? c.duree + " min · " : "") + (c.fiches || []).length + " fiches · " + (c.quiz || []).length + " questions" + (s.quizBest != null ? " · meilleur quiz " + Math.round(s.quizBest * 100) + " %" : "") + "</div></div>" + statusPill(s.p) + '<span class="chev">' + ic("chev", 16) + "</span></a>";
    }).join("") + "</div>"
      : '<div class="card empty"><div class="icon-tile">' + ic("folder") + '</div><h3 class="h-card">Pas encore de cours</h3><p>Dépose les fichiers de ce cours (PDF, slides, notes) dans le dossier <code>cours/' + esc(m.id) + "/</code> du dépôt GitHub. Les résumés, fiches et quiz seront générés à partir de ces fichiers.</p></div>";

    const e = m.examen || {};
    const examCard = '<div class="card"><div class="h-card">Examen</div>' + (ex ? '<div style="display:flex;align-items:baseline;gap:10px;margin-top:10px"><span class="stat-val">' + (n < 0 ? "Passé" : "J-" + n) + '</span><span class="muted small">' + cap(fmtLong(ex)) + ", " + fmtTime(ex) + "</span></div>" : "") +
      '<dl class="kv"><dt>Type</dt><dd>' + esc(e.type || "À préciser") + "</dd><dt>Durée</dt><dd>" + esc(e.duree || "À préciser") + "</dd><dt>Pondération</dt><dd>" + esc(e.poids || "À préciser") + "</dd><dt>Lieu</dt><dd>" + esc(e.lieu || "À préciser") + "</dd></dl>" +
      ((e.consignes || []).length ? '<div class="eyebrow" style="margin:20px 0 10px">Consignes</div><ul class="bullets">' + e.consignes.map((x) => "<li>" + ic("check", 16) + "<span>" + esc(x) + "</span></li>").join("") + "</ul>" : "") + "</div>";

    const files = (m.fichiers || []).length ? '<div class="files">' + m.fichiers.map((f) => { const ext = (f.chemin.split(".").pop() || "").toLowerCase(); return '<a class="file" href="' + esc(f.chemin) + '" target="_blank" rel="noopener"><span class="ext ' + esc(ext) + '">' + esc(ext) + '</span><span><b style="font-weight:500">' + esc(f.nom) + '</b><br><span class="small muted">' + esc(f.chemin) + "</span></span></a>"; }).join("") + "</div>"
      : '<p class="small muted" style="margin:6px 0 0">Aucun fichier pour l\'instant. Ils apparaîtront ici une fois ajoutés dans <code>cours/' + esc(m.id) + "/</code>.</p>";

    return '<nav class="crumbs"><a href="#accueil">Tableau de bord</a>' + ic("chev", 12) + "<span>" + esc(m.nom) + "</span></nav>" +
      '<header class="subject-hero">' + tile(m, true) + '<div class="info"><h1 class="h-large">' + esc(m.nom) + '</h1><div class="meta-row"><span>' + ic("people") + esc(m.prof || "") + "</span><span>" + ic("award") + (m.credits || "?") + " ECTS</span><span>" + ic("calendar") + esc(m.quadrimestre || "") + "</span></div></div>" +
      ring(p, 96, 10, m.couleur, '<div style="font-size:22px;font-weight:700">' + Math.round(p * 100) + "%</div>") + "</header>" +
      '<div class="split"><div style="min-width:0"><div class="section-head"><h2 class="h-sec">Chapitres</h2>' + (nQuiz ? '<a class="btn btn-ghost btn-sm" href="#blanc-' + m.id + '">' + ic("exam", 16) + "Examen blanc · " + nQuiz + " questions</a>" : "") + "</div>" + chapters + "</div>" +
      '<div class="grid" style="min-width:0">' + examCard + '<div class="card"><div class="h-card">Documents du cours</div>' + files + "</div></div></div>";
  }

  function viewChapter(m, c, tab) {
    const s = chapStats(m, c);
    const ch = m.chapitres;
    const idx = ch.indexOf(c);
    const tabs = [["resume", "Résumé"], ["essentiel", "L'essentiel"], ["fiches", "Fiches · " + (c.fiches || []).length], ["quiz", "Quiz · " + (c.quiz || []).length]];
    const seg = '<div class="seg seg-lg" role="tablist">' + tabs.map((t) => '<button type="button" role="tab" aria-selected="' + (t[0] === tab) + '" class="' + (t[0] === tab ? "on" : "") + '" data-go="#c-' + m.id + "-" + c.id + "-" + t[0] + '">' + t[1] + "</button>").join("") + "</div>";
    let body = "";
    if (tab === "resume") {
      const r = md(c.resume);
      body = '<div class="reader"><article class="card" style="padding:clamp(22px,4vw,44px);min-width:0"><div class="prose">' + r.html + "</div>" +
        '<div class="card-flat read-done"><div><b>' + (s.lu ? "Chapitre lu" : "Tu as fini de lire ?") + '</b><div class="small muted">' + (s.lu ? "Passe aux fiches pour mémoriser." : "Marque-le comme lu pour suivre ta progression.") + "</div></div>" +
        (s.lu ? '<a class="btn" href="#c-' + m.id + "-" + c.id + '-fiches">Passer aux fiches</a>' : '<button class="btn" id="mark-read" type="button">' + ic("check", 16) + "Marquer comme lu</button>") + "</div></article>" +
        (r.toc.length ? '<nav class="toc" aria-label="Sommaire"><div class="eyebrow">Sommaire</div>' + r.toc.map((t) => '<a href="#' + t.id + '" data-anchor="' + t.id + '">' + inline(t.t) + "</a>").join("") + "</nav>" : "") + "</div>";
    } else if (tab === "essentiel") {
      body = '<div class="grid" style="gap:16px"><div class="card"><h2 class="h-card" style="margin-bottom:16px">Points clés</h2><div class="keypoints">' + (c.pointsCles || []).map((k) => '<div class="keypoint"><span class="kpi">' + ic("check", 14) + "</span><div>" + inline(k) + "</div></div>").join("") + "</div></div>" +
        ((c.definitions || []).length ? '<div class="card"><h2 class="h-card" style="margin-bottom:16px">Définitions</h2><dl class="defs">' + c.definitions.map((d) => '<div class="def"><dt>' + esc(d.terme) + "</dt><dd>" + inline(d.def) + "</dd></div>").join("") + "</dl></div>" : "") + "</div>";
    } else if (tab === "fiches") {
      body = '<div id="fc-slot"></div>';
    } else {
      body = '<div id="quiz-slot"></div>';
    }
    const prev = ch[idx - 1], nextC = ch[idx + 1];
    const nav = '<div style="display:flex;justify-content:space-between;gap:12px;margin-top:28px;flex-wrap:wrap">' +
      (prev ? '<a class="btn btn-plain" href="#c-' + m.id + "-" + prev.id + '-resume">' + ic("back", 16) + esc(prev.titre) + "</a>" : "<span></span>") +
      (nextC ? '<a class="btn btn-plain" href="#c-' + m.id + "-" + nextC.id + '-resume">' + esc(nextC.titre) + ic("chev", 16) + "</a>" : "") + "</div>";
    return '<nav class="crumbs"><a href="#accueil">Tableau de bord</a>' + ic("chev", 12) + '<a href="#m-' + m.id + '">' + esc(m.nom) + "</a>" + ic("chev", 12) + "<span>Chapitre " + (idx + 1) + "</span></nav>" +
      '<header class="chap-head"><div><div class="eyebrow" style="color:' + esc(m.couleur) + '">' + esc(m.nom) + " · Chapitre " + (idx + 1) + '</div><h1 class="h-large">' + esc(c.titre) + '</h1></div><div class="chap-tabs">' + seg + '<div style="display:flex;align-items:center;gap:10px">' + statusPill(s.p) + '<span class="small muted tnum">' + Math.round(s.p * 100) + " %</span></div></div></header>" +
      body + nav;
  }

  function viewRevision(filter) {
    const chips = '<div class="seg" style="margin-bottom:22px"><button type="button" class="' + (!filter ? "on" : "") + '" data-filter="">Toutes · ' + dueCards().length + "</button>" +
      M.filter((m) => (m.chapitres || []).length).map((m) => '<button type="button" class="' + (filter === m.id ? "on" : "") + '" data-filter="' + m.id + '">' + esc(m.nom.split(" ")[0]) + " · " + dueCards(m.id).length + "</button>").join("") + "</div>";
    return '<header class="page-head"><div><div class="eyebrow">Répétition espacée</div><h1 class="h-large">Révision du jour</h1><p class="lead">Les fiches reviennent au bon moment : plus tu les connais, plus elles s\'espacent (1, 2, 4, 8, 16 puis 32 jours).</p></div></header>' +
      chips + '<div id="fc-slot"></div>';
  }

  function viewExams() {
    const t0 = today();
    const list = M.filter(examDate).sort((a, b) => examDate(a) - examDate(b));
    return '<header class="page-head"><div><div class="eyebrow">' + esc(D.session ? D.session.nom : "") + '</div><h1 class="h-large">Examens</h1><p class="lead">Dates, formats, pondérations et consignes de chaque examen.</p></div></header>' + banner() +
      '<div class="timeline">' + list.map((m) => {
        const ex = examDate(m), n = daysBetween(t0, ex), p = subjectProgress(m), e = m.examen;
        const chip = n < 0 ? '<span class="pill pill-neutral">Passé</span>' : n === 0 ? '<span class="pill pill-bad">Aujourd\'hui</span>' : '<span class="pill ' + (n <= 7 ? "pill-bad" : n <= 21 ? "pill-warn" : "pill-neutral") + '">Dans ' + n + " jour" + (n > 1 ? "s" : "") + "</span>";
        return '<div class="card exam-row' + (n < 0 ? " past" : "") + '"><div class="datebox"><div class="m">' + fmt(ex, { month: "short" }) + '</div><div class="d">' + ex.getDate() + '</div><div class="w">' + fmt(ex, { weekday: "short" }) + " " + fmtTime(ex) + "</div></div>" +
          '<div style="min-width:0"><div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap"><span class="nav-dot" style="background:' + esc(m.couleur) + '">' + ic(m.icone, 13) + '</span><a class="h-card" style="color:var(--fg)" href="#m-' + m.id + '">' + esc(m.nom) + "</a></div>" +
          '<div class="meta-row"><span>' + ic("exam") + esc(e.type || "") + "</span><span>" + ic("clock") + esc(e.duree || "") + "</span><span>" + ic("pin") + esc(e.lieu || "") + "</span></div>" +
          '<div class="small muted" style="margin-top:6px">Pondération : ' + esc(e.poids || "à préciser") + "</div>" +
          ((e.consignes || []).length ? "<details><summary>Consignes (" + e.consignes.length + ")</summary><ul>" + e.consignes.map((x) => "<li>" + esc(x) + "</li>").join("") + "</ul></details>" : "") + "</div>" +
          '<div class="er-right">' + chip + '<div style="width:140px;max-width:100%">' + bar(p, m.couleur) + '</div><span class="small muted tnum">Préparé à ' + Math.round(p * 100) + " %</span></div></div>";
      }).join("") + "</div>";
  }

  function viewPlanning() {
    const plan = buildPlan();
    const tk = dayKey(today());
    const total = plan.reduce((a, d) => a + d.tasks.filter((t) => !t.exam).length, 0);
    const done = plan.reduce((a, d) => a + d.tasks.filter((t) => !t.exam && S.plan[t.key]).length, 0);
    return '<header class="page-head"><div><div class="eyebrow">Généré automatiquement</div><h1 class="h-large">Planning de révision</h1><p class="lead">Les chapitres pas encore maîtrisés sont répartis jusqu\'à 3 jours avant chaque examen. Les deux derniers jours sont réservés aux fiches et à un examen blanc. Le planning se met à jour avec ta progression.</p></div>' +
      '<div class="card" style="padding:16px 20px;display:flex;align-items:center;gap:14px">' + ring(total ? done / total : 0, 52, 6, "var(--good)", '<span class="small" style="font-weight:600">' + (total ? Math.round((done / total) * 100) : 0) + "%</span>") + '<div><b class="tnum">' + done + " / " + total + '</b><div class="small muted">tâches faites</div></div></div></header>' +
      '<div class="card">' + (plan.length ? plan.map((d) => {
        const isT = d.k === tk;
        return '<div class="plan-day' + (isT ? " is-today" : "") + '"><div class="pd-date">' + (isT ? "Aujourd'hui" : d.k === dayKey(addDays(today(), 1)) ? "Demain" : cap(fmt(d.d, { weekday: "long" }))) + "<small>" + fmt(d.d, { day: "numeric", month: "long" }) + '</small></div><div class="task-list" style="min-width:0">' +
          d.tasks.map((t) => t.exam ? '<div class="exam-flag">' + ic("exam", 18) + esc(t.titre) + '<span style="font-weight:400;margin-left:auto">' + esc(t.sub) + "</span></div>" : taskRow(t)).join("") + "</div></div>";
      }).join("") : '<div class="empty"><p>Aucun examen à venir.</p></div>') + "</div>";
  }

  function viewSettings() {
    return '<header class="page-head"><div><h1 class="h-large">Réglages</h1><p class="lead">Ta progression est enregistrée dans ce navigateur.</p></div></header>' +
      '<div class="card"><div class="form-row"><div class="fl"><b>Prénom</b><span>Affiché sur le tableau de bord.</span></div><input class="input" id="set-name" type="text" autocomplete="given-name" value="' + esc(S.prenom) + '" placeholder="Ton prénom"></div>' +
      '<div class="form-row"><div class="fl"><b>Apparence</b><span>Automatique suit le réglage de ton appareil.</span></div><div class="seg" id="set-theme">' + [["auto", "Automatique"], ["light", "Clair"], ["dark", "Sombre"]].map((t) => '<button type="button" data-theme-set="' + t[0] + '" class="' + (S.theme === t[0] ? "on" : "") + '">' + t[1] + "</button>").join("") + "</div></div>" +
      '<div class="form-row"><div class="fl"><b>Sauvegarder ma progression</b><span>Copie un code à garder, ou télécharge un fichier, pour la retrouver sur un autre appareil.</span></div><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn btn-plain btn-sm" id="exp-copy" type="button">Copier</button><button class="btn btn-plain btn-sm" id="exp-dl" type="button">Télécharger</button></div></div>' +
      '<div class="form-row"><div class="fl"><b>Restaurer une sauvegarde</b><span>Colle le code copié ou choisis le fichier.</span></div><div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center"><input class="input" id="imp-text" type="text" placeholder="Colle le code ici"><button class="btn btn-plain btn-sm" id="imp-go" type="button">Restaurer</button><label class="btn btn-plain btn-sm" for="imp-file">Fichier…</label><input id="imp-file" type="file" accept="application/json,.json" hidden></div></div>' +
      '<div class="form-row"><div class="fl"><b>Réinitialiser</b><span>Efface toute la progression (fiches, quiz, planning).</span></div><div class="confirm" id="reset-zone"><button class="btn btn-danger btn-sm" id="reset" type="button">Réinitialiser</button></div></div></div>' +
      '<div class="card section"><div class="h-card">Raccourcis clavier</div><dl class="kv"><dt><kbd>⌘</kbd> <kbd>K</kbd></dt><dd>Rechercher partout</dd><dt><kbd>Espace</kbd></dt><dd>Retourner une fiche</dd><dt><kbd>1</kbd> à <kbd>4</kbd></dt><dd>Noter une fiche (à revoir, difficile, bien, facile)</dd><dt><kbd>A</kbd> à <kbd>D</kbd></dt><dd>Répondre à une question de quiz</dd><dt><kbd>Entrée</kbd></dt><dd>Question suivante</dd></dl></div>';
  }

  /* ================================================================
     Composant : fiches
     ================================================================ */
  function mountFlashcards(slot, cards, opts) {
    opts = opts || {};
    let queue = cards.slice();
    let i = 0, flipped = false, seen = 0;
    const counts = { 1: 0, 2: 0, 3: 0, 4: 0 };
    function render() {
      if (!queue.length) {
        slot.innerHTML = '<div class="card empty"><div class="icon-tile" style="background:var(--good-soft);color:var(--good)">' + ic("check") + '</div><h3 class="h-card">Tout est à jour</h3><p>' + (opts.emptyText || "Aucune fiche à réviser maintenant. Reviens demain.") + "</p>" + (opts.allCards && opts.allCards.length ? '<button class="btn btn-ghost" id="fc-all" type="button">' + ic("shuffle", 16) + "Réviser quand même les " + opts.allCards.length + " fiches</button>" : "") + "</div>";
        const b = $("#fc-all", slot); if (b) b.onclick = () => { queue = shuffle(opts.allCards.slice()); i = 0; render(); };
        return;
      }
      if (i >= queue.length) {
        const ok = counts[3] + counts[4];
        slot.innerHTML = '<div class="card result">' + ring(seen ? ok / seen : 0, 120, 12, "var(--good)", '<div style="font-size:26px;font-weight:700">' + ok + "/" + seen + "</div>") + '<h3 class="h-sec">Session terminée</h3><p class="muted" style="margin:0">' + counts[1] + " à revoir · " + counts[2] + " difficiles · " + counts[3] + " bien · " + counts[4] + ' faciles</p><div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:center"><button class="btn" id="fc-again" type="button">' + ic("reset", 16) + "Recommencer</button>" + (opts.after || "") + "</div></div>";
        $("#fc-again", slot).onclick = () => { queue = shuffle(cards.slice()); i = 0; seen = 0; counts[1] = counts[2] = counts[3] = counts[4] = 0; render(); };
        refreshChrome();
        return;
      }
      const x = queue[i];
      flipped = false;
      slot.innerHTML = '<div class="fc-wrap"><div class="fc-top"><span><span class="nav-dot" style="background:' + esc(x.m.couleur) + ';display:inline-grid;vertical-align:middle;margin-right:6px">' + ic(x.m.icone, 13) + "</span>" + esc(x.c.titre) + '</span><span class="tnum">' + (i + 1) + " / " + queue.length + "</span></div>" +
        '<div class="qbar">' + queue.map((_, j) => "<i" + (j < i ? ' class="ok"' : j === i ? ' class="cur"' : "") + "></i>").join("") + "</div>" +
        '<div class="fc" id="fc" tabindex="0" role="button" aria-label="Retourner la fiche"><div class="fc-inner"><div class="fc-face"><span class="fc-tag">Question</span><div class="fc-q">' + inline(x.f.q) + '</div><div class="fc-hint">Clique ou appuie sur Espace pour voir la réponse</div></div>' +
        '<div class="fc-face fc-back"><span class="fc-tag">Réponse</span><div class="fc-a">' + inline(x.f.r) + "</div></div></div></div>" +
        '<div class="rate" id="rate" hidden><button class="r1" type="button" data-r="1">À revoir<small>aujourd\'hui</small></button><button class="r2" type="button" data-r="2">Difficile<small>demain</small></button><button class="r3" type="button" data-r="3">Bien<small>' + nextLabel(x.k, 3) + '</small></button><button class="r4" type="button" data-r="4">Facile<small>' + nextLabel(x.k, 4) + "</small></button></div>" +
        '<div class="kbd-hint"><kbd>Espace</kbd> retourner · <kbd>1</kbd>–<kbd>4</kbd> noter</div></div>';
      const fc = $("#fc", slot);
      fc.onclick = flip;
      $$("#rate button", slot).forEach((b) => (b.onclick = () => rate(+b.dataset.r)));
    }
    function flip() { flipped = !flipped; $("#fc", slot).classList.toggle("flip", flipped); if (flipped) $("#rate", slot).hidden = false; }
    function rate(r) {
      if (!flipped) return;
      const x = queue[i];
      rateCard(x.k, r);
      counts[r]++; seen++;
      if (r === 1) queue.push(x);
      i++;
      render();
    }
    function nextLabel(k, r) {
      const b = Math.min(6, cardState(k).box + (r === 3 ? 1 : 2));
      const d = INTERVALS[b];
      return d === 1 ? "1 jour" : d + " jours";
    }
    keyHandler = (e) => {
      if (!document.body.contains(slot) || !$("#fc", slot)) return;
      if (e.target.closest("input, textarea")) return;
      if (e.code === "Space" || e.key === "Enter") { e.preventDefault(); flip(); }
      else if (/^[1-4]$/.test(e.key)) rate(+e.key);
    };
    render();
  }
  function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

  /* ================================================================
     Composant : quiz
     ================================================================ */
  function mountQuiz(slot, items, onDone, opts) {
    opts = opts || {};
    let qs = shuffle(items.slice()), i = 0, answered = false;
    const res = [];
    if (!qs.length) { slot.innerHTML = '<div class="card empty"><p>Pas encore de questions pour ce chapitre.</p></div>'; return; }
    function render() {
      if (i >= qs.length) {
        const ok = res.filter(Boolean).length, ratio = ok / qs.length;
        if (onDone) onDone(ratio);
        const msg = ratio >= 0.85 ? "Excellent, c'est maîtrisé." : ratio >= 0.6 ? "Bien. Revois les points ratés et recommence." : "Relis le résumé, puis réessaie.";
        slot.innerHTML = '<div class="card result">' + ring(ratio, 140, 14, ratio >= 0.85 ? "var(--good)" : ratio >= 0.6 ? "var(--accent)" : "var(--warn)", '<div style="font-size:32px;font-weight:700">' + Math.round(ratio * 100) + '%</div><div class="small muted">' + ok + "/" + qs.length + "</div>") +
          '<h3 class="h-sec">' + msg + '</h3><div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:center"><button class="btn" id="q-again" type="button">' + ic("reset", 16) + "Recommencer</button>" + (opts.after || "") + "</div></div>";
        $("#q-again", slot).onclick = () => { qs = shuffle(items.slice()); i = 0; res.length = 0; render(); };
        refreshChrome();
        return;
      }
      const q = qs[i];
      answered = false;
      slot.innerHTML = '<div class="quiz"><div class="fc-top"><span>' + (q._m ? esc(q._m) : "Question") + '</span><span class="tnum">' + (i + 1) + " / " + qs.length + "</span></div>" +
        '<div class="qbar">' + qs.map((_, j) => "<i" + (j < i ? ' class="' + (res[j] ? "ok" : "ko") + '"' : j === i ? ' class="cur"' : "") + "></i>").join("") + "</div>" +
        '<div class="card" style="display:flex;flex-direction:column;gap:18px"><h2 class="quiz-q">' + inline(q.q) + '</h2><div class="choices">' +
        q.choix.map((c, j) => '<button class="choice" type="button" data-j="' + j + '"><span class="letter">' + "ABCD"[j] + "</span><span>" + inline(c) + "</span></button>").join("") + '</div><div id="q-after"></div></div></div>';
      $$(".choice", slot).forEach((b) => (b.onclick = () => answer(+b.dataset.j)));
    }
    function answer(j) {
      if (answered) return;
      answered = true;
      const q = qs[i], good = j === q.bonne;
      res.push(good);
      logActivity(1);
      $$(".choice", slot).forEach((b, k) => { b.disabled = true; if (k === q.bonne) b.classList.add("right"); else if (k === j) b.classList.add("wrong"); });
      $("#q-after", slot).innerHTML = '<div class="explain"><b style="color:' + (good ? "var(--good)" : "var(--bad)") + '">' + (good ? "Correct" : "Incorrect") + "</b>" + inline(q.explication || "") + '</div><div style="display:flex;justify-content:flex-end;margin-top:14px"><button class="btn" id="q-next" type="button">' + (i + 1 < qs.length ? "Question suivante" : "Voir le résultat") + ic("chev", 16) + "</button></div>";
      $("#q-next", slot).onclick = next;
      $("#q-next", slot).focus({ preventScroll: true });
    }
    function next() { i++; render(); window.scrollTo({ top: 0, behavior: "smooth" }); }
    keyHandler = (e) => {
      if (!document.body.contains(slot) || !$(".quiz", slot)) return;
      if (e.target.closest("input, textarea")) return;
      const k = e.key.toLowerCase();
      if (!answered && "abcd".includes(k) && k.length === 1) { const j = "abcd".indexOf(k); if (j < qs[i].choix.length) answer(j); }
      else if (answered && e.key === "Enter" && document.activeElement && document.activeElement.id !== "q-next") { e.preventDefault(); next(); }
    };
    render();
  }

  /* ================================================================
     Composant : minuteur Focus (Pomodoro)
     ================================================================ */
  const timer = { mode: "focus", total: 25 * 60, left: 25 * 60, running: false, id: null };
  const MODES = { focus: 25 * 60, pause: 5 * 60, longue: 15 * 60 };
  function renderTimer() {
    const slot = $("#focus-slot");
    if (!slot) return;
    const mm = Math.floor(timer.left / 60), ss = timer.left % 60;
    slot.innerHTML = '<div class="focus">' + ring(timer.left / timer.total, 120, 9, timer.mode === "focus" ? "#bf5af2" : "var(--good)", '<div style="font-size:26px;font-weight:600" class="tnum">' + pad(mm) + ":" + pad(ss) + '</div><div class="small muted">' + (timer.mode === "focus" ? "Focus" : "Pause") + "</div>") +
      '<div class="controls"><div class="seg">' + [["focus", "Focus"], ["pause", "Pause"], ["longue", "Longue"]].map((x) => '<button type="button" data-mode="' + x[0] + '" class="' + (timer.mode === x[0] ? "on" : "") + '">' + x[1] + "</button>").join("") + "</div>" +
      '<div style="display:flex;gap:8px"><button class="btn btn-sm" id="t-go" type="button">' + ic(timer.running ? "pause" : "play", 14) + (timer.running ? "Pause" : "Démarrer") + '</button><button class="btn btn-plain btn-sm" id="t-reset" type="button" aria-label="Réinitialiser">' + ic("reset", 14) + "</button></div></div></div>";
    $("#t-go").onclick = () => { timer.running ? stopTimer() : startTimer(); renderTimer(); };
    $("#t-reset").onclick = () => { stopTimer(); timer.left = timer.total; renderTimer(); };
    $$("[data-mode]", slot).forEach((b) => (b.onclick = () => { stopTimer(); timer.mode = b.dataset.mode; timer.total = timer.left = MODES[timer.mode]; renderTimer(); }));
  }
  function startTimer() {
    timer.running = true;
    timer.id = setInterval(() => {
      timer.left--;
      if (timer.mode === "focus" && timer.left % 60 === 0) { S.focus.min = (S.focus.min || 0) + 1; save(); }
      if (timer.left <= 0) {
        stopTimer();
        if (timer.mode === "focus") { logActivity(5); toast("Session terminée. Prends 5 minutes de pause."); timer.mode = "pause"; }
        else { toast("Pause terminée. On s'y remet ?"); timer.mode = "focus"; }
        timer.total = timer.left = MODES[timer.mode];
      }
      const slot = $("#focus-slot");
      if (slot) {
        const lab = $(".ring-label .tnum", slot), val = $(".ring-val", slot);
        if (lab && val && timer.running) {
          lab.textContent = pad(Math.floor(timer.left / 60)) + ":" + pad(timer.left % 60);
          const c = +val.getAttribute("stroke-dasharray");
          val.setAttribute("stroke-dashoffset", c * (1 - timer.left / timer.total));
        } else renderTimer();
      }
      document.title = timer.running ? pad(Math.floor(timer.left / 60)) + ":" + pad(timer.left % 60) + " · Révisions" : baseTitle;
    }, 1000);
  }
  function stopTimer() { timer.running = false; clearInterval(timer.id); document.title = baseTitle; }
  const baseTitle = document.title;

  /* ================================================================
     Recherche (Spotlight)
     ================================================================ */
  let index = null;
  function buildIndex() {
    const out = [];
    const strip = (s) => String(s).replace(/[*=`>#|]/g, "");
    M.forEach((m) => {
      out.push({ g: "Matières", t: m.nom, s: (m.chapitres || []).length + " chapitres", href: "#m-" + m.id, m });
      (m.chapitres || []).forEach((c) => {
        out.push({ g: "Chapitres", t: c.titre, s: m.nom, href: "#c-" + m.id + "-" + c.id + "-resume", m, body: strip(c.resume || "") });
        (c.definitions || []).forEach((d) => out.push({ g: "Définitions", t: d.terme, s: d.def, href: "#c-" + m.id + "-" + c.id + "-essentiel", m }));
        (c.fiches || []).forEach((f) => out.push({ g: "Fiches", t: strip(f.q), s: strip(f.r), href: "#c-" + m.id + "-" + c.id + "-fiches", m }));
      });
    });
    return out;
  }
  const norm = (s) => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  function openSearch() {
    index = index || buildIndex();
    const host = $("#spotlight");
    host.hidden = false;
    host.innerHTML = '<div class="spot-backdrop" id="spot-bg"><div class="spot" role="dialog" aria-modal="true" aria-label="Recherche"><div class="spot-in">' + ic("search") + '<input id="spot-q" type="text" placeholder="Rechercher un chapitre, une notion, un auteur…" autocomplete="off" spellcheck="false"><kbd>Échap</kbd></div><div class="spot-res" id="spot-res"></div></div></div>';
    const input = $("#spot-q"), resEl = $("#spot-res");
    let results = [], sel = 0;
    function run() {
      const q = norm(input.value.trim());
      if (!q) results = index.filter((x) => x.g === "Matières" || x.g === "Chapitres");
      else {
        const words = q.split(/\s+/);
        results = index.map((x) => {
          const t = norm(x.t), s = norm(x.s), b = norm(x.body);
          if (!words.every((w) => t.includes(w) || s.includes(w) || b.includes(w))) return null;
          let score = 0;
          words.forEach((w) => { if (t.startsWith(w)) score += 6; if (t.includes(w)) score += 4; if (s.includes(w)) score += 1; });
          return { x, score };
        }).filter(Boolean).sort((a, b) => b.score - a.score).slice(0, 40).map((r) => r.x);
      }
      sel = 0;
      paint();
    }
    function paint() {
      if (!results.length) { resEl.innerHTML = '<div class="spot-empty">Aucun résultat</div>'; return; }
      let g = "", html = "";
      results.forEach((x, j) => {
        if (x.g !== g) { g = x.g; html += '<div class="spot-group">' + g + "</div>"; }
        html += '<div class="spot-item' + (j === sel ? " sel" : "") + '" data-j="' + j + '"><span class="nav-dot" style="background:' + esc(x.m.couleur) + '">' + ic(x.g === "Fiches" ? "cards" : x.g === "Définitions" ? "book" : x.m.icone, 13) + '</span><div class="si-x"><div class="si-t">' + esc(x.t) + '</div><div class="si-s">' + esc(x.s) + "</div></div></div>";
      });
      resEl.innerHTML = html;
      $$(".spot-item", resEl).forEach((el) => { el.onclick = () => go(+el.dataset.j); el.onmousemove = () => { if (sel !== +el.dataset.j) { sel = +el.dataset.j; paint(); } }; });
      const s = $(".spot-item.sel", resEl); if (s) s.scrollIntoView({ block: "nearest" });
    }
    function go(j) { const x = results[j]; closeSearch(); if (x) location.hash = x.href; }
    input.oninput = run;
    input.onkeydown = (e) => {
      if (e.key === "ArrowDown") { e.preventDefault(); sel = Math.min(results.length - 1, sel + 1); paint(); }
      else if (e.key === "ArrowUp") { e.preventDefault(); sel = Math.max(0, sel - 1); paint(); }
      else if (e.key === "Enter") { e.preventDefault(); go(sel); }
      else if (e.key === "Escape") closeSearch();
    };
    $("#spot-bg").onclick = (e) => { if (e.target.id === "spot-bg") closeSearch(); };
    run();
    setTimeout(() => input.focus(), 10);
  }
  function closeSearch() { const h = $("#spotlight"); h.hidden = true; h.innerHTML = ""; }

  /* ================================================================
     Divers
     ================================================================ */
  let toastT;
  function toast(msg) { const t = $("#toast"); t.textContent = msg; t.classList.add("show"); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove("show"), 2600); }
  function applyTheme() {
    const r = document.documentElement;
    if (S.theme === "light" || S.theme === "dark") r.setAttribute("data-theme", S.theme); else r.removeAttribute("data-theme");
  }
  let currentRoute = null;
  function refreshChrome() { if (currentRoute) shell(currentRoute); }
  let keyHandler = null;

  /* ================================================================
     Routeur
     ================================================================ */
  function parse() {
    const h = (location.hash || "#accueil").slice(1);
    let mm;
    if ((mm = h.match(/^m-([a-z0-9]+)$/i))) return { name: "subject", m: M.find((x) => x.id === mm[1]), nav: "#m-" + mm[1], tab: "#matieres" };
    if ((mm = h.match(/^c-([a-z0-9]+)-([a-z0-9]+)-(resume|essentiel|fiches|quiz)$/i))) {
      const m = M.find((x) => x.id === mm[1]);
      return { name: "chapter", m, c: m && (m.chapitres || []).find((x) => x.id === mm[2]), t: mm[3], nav: "#m-" + mm[1], tab: "#matieres" };
    }
    if ((mm = h.match(/^blanc-([a-z0-9]+)$/i))) return { name: "blanc", m: M.find((x) => x.id === mm[1]), nav: "#m-" + mm[1], tab: "#matieres" };
    const simple = { accueil: "home", revision: "revision", examens: "exams", planning: "planning", parametres: "settings", matieres: "subjects" };
    if (simple[h]) return { name: simple[h], nav: "#" + h, tab: "#" + h };
    return { name: "anchor", id: h };
  }

  let revFilter = "";
  function render() {
    const r = parse();
    if (r.name === "anchor") { const el = document.getElementById(r.id); if (el) { el.scrollIntoView({ behavior: "smooth", block: "start" }); return; } location.replace("#accueil"); return; }
    currentRoute = r;
    keyHandler = null;
    const v = $("#view");
    let html = "";
    if (r.name === "home") html = viewHome();
    else if (r.name === "subjects") html = viewSubjects();
    else if (r.name === "subject" && r.m) html = viewSubject(r.m);
    else if (r.name === "chapter" && r.c) html = viewChapter(r.m, r.c, r.t);
    else if (r.name === "blanc" && r.m) html = '<nav class="crumbs"><a href="#accueil">Tableau de bord</a>' + ic("chev", 12) + '<a href="#m-' + r.m.id + '">' + esc(r.m.nom) + "</a>" + ic("chev", 12) + '<span>Examen blanc</span></nav><header class="page-head"><div><div class="eyebrow" style="color:' + esc(r.m.couleur) + '">' + esc(r.m.nom) + '</div><h1 class="h-large">Examen blanc</h1><p class="lead">Toutes les questions de la matière, dans un ordre aléatoire.</p></div></header><div id="quiz-slot"></div>';
    else if (r.name === "revision") html = viewRevision(revFilter);
    else if (r.name === "exams") html = viewExams();
    else if (r.name === "planning") html = viewPlanning();
    else if (r.name === "settings") html = viewSettings();
    else html = '<div class="card empty"><h3 class="h-card">Page introuvable</h3><p>Ce contenu n\'existe pas ou a été déplacé.</p><a class="btn" href="#accueil">Retour au tableau de bord</a></div>';
    v.innerHTML = '<div class="view">' + html + "</div>";
    shell(r);
    window.scrollTo(0, 0);
    bind(r);
  }

  function bind(r) {
    const v = $("#view");
    $$("[data-go]", v).forEach((b) => (b.onclick = () => (location.hash = b.dataset.go)));
    $$("[data-task]", v).forEach((b) => (b.onclick = () => {
      const k = b.dataset.task; S.plan[k] = !S.plan[k]; save();
      b.classList.toggle("on", S.plan[k]); b.setAttribute("aria-pressed", S.plan[k]); b.closest(".task").classList.toggle("done", S.plan[k]);
      if (S.plan[k]) logActivity(1);
    }));
    $$("[data-anchor]", v).forEach((a) => (a.onclick = (e) => { e.preventDefault(); const el = document.getElementById(a.dataset.anchor); if (el) el.scrollIntoView({ behavior: "smooth", block: "start" }); }));
    if (r.name === "home") renderTimer();
    if (r.name === "chapter" && r.c) {
      const k = chapKey(r.m, r.c);
      const mr = $("#mark-read"); if (mr) mr.onclick = () => { S.lu[k] = true; logActivity(2); save(); toast("Chapitre marqué comme lu"); render(); };
      if (r.t === "fiches") {
        const cards = (r.c.fiches || []).map((f, i) => ({ m: r.m, c: r.c, f, k: cardKey(r.m, r.c, i) }));
        if (!cards.length) $("#fc-slot").innerHTML = '<div class="card empty"><p>Pas encore de fiches pour ce chapitre.</p></div>';
        else mountFlashcards($("#fc-slot"), cards, { after: '<a class="btn btn-ghost" href="#c-' + r.m.id + "-" + r.c.id + '-quiz">Passer au quiz</a>' });
      }
      if (r.t === "quiz") mountQuiz($("#quiz-slot"), r.c.quiz || [], (ratio) => {
        const prev = S.quiz[k] || { best: 0, tries: 0 };
        S.quiz[k] = { best: Math.max(prev.best, ratio), last: ratio, tries: prev.tries + 1 }; save();
      }, { after: '<a class="btn btn-ghost" href="#m-' + r.m.id + '">Retour à la matière</a>' });
    }
    if (r.name === "blanc" && r.m) {
      const items = [];
      (r.m.chapitres || []).forEach((c) => (c.quiz || []).forEach((q) => items.push(Object.assign({ _m: c.titre }, q))));
      mountQuiz($("#quiz-slot"), items, null, { after: '<a class="btn btn-ghost" href="#m-' + r.m.id + '">Retour à la matière</a>' });
    }
    if (r.name === "revision") {
      $$("[data-filter]", v).forEach((b) => (b.onclick = () => { revFilter = b.dataset.filter; render(); }));
      mountFlashcards($("#fc-slot"), shuffle(dueCards(revFilter)), { allCards: allCards(revFilter), emptyText: "Aucune fiche à réviser aujourd'hui. Les prochaines reviendront automatiquement." });
    }
    if (r.name === "settings") bindSettings();
  }

  function bindSettings() {
    const name = $("#set-name");
    name.oninput = () => { S.prenom = name.value.trim(); save(); };
    $$("[data-theme-set]").forEach((b) => (b.onclick = () => { S.theme = b.dataset.themeSet; save(); applyTheme(); $$("[data-theme-set]").forEach((x) => x.classList.toggle("on", x === b)); }));
    const data = () => JSON.stringify(S);
    $("#exp-copy").onclick = () => {
      const txt = btoa(unescape(encodeURIComponent(data())));
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(() => toast("Code de sauvegarde copié"), () => { $("#imp-text").value = txt; $("#imp-text").select(); toast("Sélectionne et copie le code"); });
      else { $("#imp-text").value = txt; $("#imp-text").select(); toast("Sélectionne et copie le code"); }
    };
    $("#exp-dl").onclick = () => {
      try {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(new Blob([data()], { type: "application/json" }));
        a.download = "revisions-progression-" + dayKey(new Date()) + ".json";
        document.body.appendChild(a); a.click(); a.remove();
      } catch (e) { toast("Téléchargement impossible ici. Utilise Copier."); }
    };
    const restore = (txt) => {
      try {
        let obj;
        try { obj = JSON.parse(txt); } catch (e) { obj = JSON.parse(decodeURIComponent(escape(atob(txt.trim())))); }
        if (!obj || typeof obj !== "object" || !obj.cartes) throw new Error();
        S = Object.assign(blank(), obj); save(); applyTheme(); toast("Progression restaurée"); render();
      } catch (e) { toast("Ce code n'est pas une sauvegarde valide."); }
    };
    $("#imp-go").onclick = () => restore($("#imp-text").value);
    $("#imp-file").onchange = (e) => { const f = e.target.files[0]; if (!f) return; const rd = new FileReader(); rd.onload = () => restore(String(rd.result)); rd.readAsText(f); };
    $("#reset").onclick = () => {
      $("#reset-zone").innerHTML = '<span>Tout effacer ?</span><button class="btn btn-danger btn-sm" id="reset-yes" type="button">Oui, effacer</button><button class="btn btn-plain btn-sm" id="reset-no" type="button">Annuler</button>';
      $("#reset-yes").onclick = () => { const keep = { prenom: S.prenom, theme: S.theme }; S = Object.assign(blank(), keep); save(); toast("Progression effacée"); render(); };
      $("#reset-no").onclick = () => render();
    };
  }

  /* ================================================================
     Démarrage
     ================================================================ */
  document.addEventListener("keydown", (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); $("#spotlight").hidden ? openSearch() : closeSearch(); return; }
    if (e.key === "/" && !e.target.closest("input, textarea") && $("#spotlight").hidden) { e.preventDefault(); openSearch(); return; }
    if (e.key === "Escape" && !$("#spotlight").hidden) { closeSearch(); return; }
    if (!$("#spotlight").hidden) return;
    if (keyHandler) keyHandler(e);
  });
  window.addEventListener("hashchange", render);
  applyTheme();
  render();
})();
