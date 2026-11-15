import { test } from "node:test";
import assert from "node:assert/strict";
import { addDays, dayKey, daysBetween, examDate, parseDay, startOfDay } from "../../src/core/dates.js";
import { esc, safeColor } from "../../src/core/html.js";
import { ic, ICON_NAMES } from "../../src/core/icons.js";
import { inline, md, slug } from "../../src/core/markdown.js";

test("dates : dayKey, parseDay et addDays sont cohérents", () => {
  const d = new Date(2027, 0, 31, 15, 30);
  assert.equal(dayKey(d), "2027-01-31");
  assert.equal(dayKey(addDays(d, 1)), "2027-02-01");
  assert.equal(dayKey(parseDay("2027-02-28")), "2027-02-28");
  assert.equal(startOfDay(d).getHours(), 0);
});

test("dates : daysBetween compte des jours calendaires, y compris autour du changement d'heure", () => {
  assert.equal(daysBetween(new Date(2026, 9, 24, 23, 0), new Date(2026, 9, 26, 1, 0)), 2);
  assert.equal(daysBetween(new Date(2027, 0, 10), new Date(2027, 0, 8)), -2);
  assert.equal(daysBetween(new Date(2027, 2, 27), new Date(2027, 2, 29)), 2);
});

test("dates : examDate renvoie null sans date", () => {
  assert.equal(examDate({}), null);
  assert.equal(examDate(null), null);
  assert.ok(examDate({ examen: { date: "2027-01-08T09:00" } }) instanceof Date);
});

test("html : esc échappe les cinq caractères dangereux", () => {
  assert.equal(esc(`<a href="x" onclick='y'>&</a>`), "&lt;a href=&quot;x&quot; onclick=&#39;y&#39;&gt;&amp;&lt;/a&gt;");
  assert.equal(esc(null), "");
});

test("html : safeColor n'accepte que des couleurs hexadécimales", () => {
  assert.equal(safeColor("#0a84ff"), "#0a84ff");
  assert.equal(safeColor("#FFF"), "#FFF");
  assert.equal(safeColor("red;background:url(https://evil)"), "#8e8e93");
  assert.equal(safeColor("#0a84ff;x:y"), "#8e8e93");
  assert.equal(safeColor(undefined, "#000"), "#000");
});

test("icônes : une icône inconnue retombe sur « book » sans erreur", () => {
  assert.ok(ICON_NAMES.includes("book"));
  assert.match(ic("inexistante"), /<svg/);
});

test("markdown : le HTML brut est échappé (pas d'injection)", () => {
  const { html } = md("Salut <script>alert(1)</script> <img src=x onerror=alert(1)>");
  assert.ok(!html.includes("<script>"));
  assert.ok(!html.includes("<img"));
  assert.ok(html.includes("&lt;script&gt;"));
});

test("markdown : liens restreints aux protocoles sûrs", () => {
  assert.match(inline("[ok](https://example.org)"), /href="https:\/\/example.org"/);
  assert.match(inline("[ko](javascript:alert(1))"), /href="#"/);
  assert.match(inline("[ko](data:text/html,x)"), /href="#"/);
});

test("markdown : mise en forme inline et échappement par barre oblique", () => {
  assert.equal(inline("**gras** *ital* ==mark== `code`"), "<strong>gras</strong> <em>ital</em> <mark>mark</mark> <code>code</code>");
  assert.equal(inline("P\\* = 20"), "P* = 20");
});

test("markdown : titres, sommaire, listes, tableaux et encadrés", () => {
  const { html, toc } = md("## Premier titre\nTexte.\n\n- a\n- b\n\n1. un\n2. deux\n\n| A | B |\n|---|---|\n| 1 | 2 |\n\n> **Note** encadré");
  assert.deepEqual(toc, [{ id: "premier-titre", t: "Premier titre" }]);
  assert.match(html, /<h2 id="premier-titre">/);
  assert.match(html, /<ul><li>a<\/li><li>b<\/li><\/ul>/);
  assert.match(html, /<ol><li>un<\/li><li>deux<\/li><\/ol>/);
  assert.match(html, /<th>A<\/th><th>B<\/th>.*<td>1<\/td><td>2<\/td>/);
  assert.match(html, /<blockquote><p><strong>Note<\/strong> encadré<\/p><\/blockquote>/);
});

test("markdown : slug supprime accents et ponctuation", () => {
  assert.equal(slug("L'école de Palo Alto (1967) !"), "l-ecole-de-palo-alto-1967");
});
