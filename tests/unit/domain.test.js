import { test } from "node:test";
import assert from "node:assert/strict";
import { dayKey } from "../../src/core/dates.js";
import { addActivity, lastWeek, streak } from "../../src/domain/activity.js";
import { buildPlan } from "../../src/domain/planner.js";
import { chapStats, overall, subjectProgress } from "../../src/domain/progress.js";
import { parseRoute } from "../../src/domain/router.js";
import { buildIndex, search } from "../../src/domain/search.js";
import { allCards, cardKey, dueCards, INTERVALS, isDue, nextDelay, rate } from "../../src/domain/srs.js";
import { blankState } from "../../src/state/store.js";

const TODAY = new Date(2026, 10, 15);
const mk = () => ({
  matieres: [
    { id: "a", nom: "Alpha", couleur: "#000000", icone: "book", examen: { date: "2026-12-01T09:00", type: "Écrit" },
      chapitres: [
        { id: "c1", titre: "Un", resume: "## Titre\nTexte sur Lazarsfeld.", fiches: [{ q: "Q1", r: "R1" }, { q: "Q2", r: "R2" }], quiz: [{ q: "?", choix: ["x", "y"], bonne: 0 }], definitions: [{ terme: "Bruit", def: "Perturbation" }] },
        { id: "c2", titre: "Deux", resume: "", fiches: [], quiz: [] }
      ] },
    { id: "b", nom: "Bêta", couleur: "#111111", icone: "book", examen: { date: "2026-11-10T09:00" }, chapitres: [] },
    { id: "z", nom: "Zêta", couleur: "#222222", icone: "book", examen: { date: "2026-12-20T09:00" }, chapitres: [] }
  ]
});

test("srs : séquence de notes et échéances (Leitner)", () => {
  let s = rate(null, 3, TODAY);
  assert.deepEqual(s, { box: 1, due: "2026-11-16" });
  s = rate(s, 4, TODAY);
  assert.deepEqual(s, { box: 3, due: dayKey(new Date(2026, 10, 15 + INTERVALS[3])) });
  s = rate(s, 2, TODAY);
  assert.deepEqual(s, { box: 3, due: "2026-11-16" });
  s = rate(s, 1, TODAY);
  assert.deepEqual(s, { box: 0, due: "2026-11-15" });
});

test("srs : la boîte est plafonnée à 6", () => {
  assert.equal(rate({ box: 6, due: null }, 4, TODAY).box, 6);
  assert.equal(nextDelay({ box: 5 }, 4), INTERVALS[6]);
});

test("srs : note invalide refusée, état précédent non modifié", () => {
  const prev = { box: 2, due: "2026-11-20" };
  assert.throws(() => rate(prev, 7, TODAY), RangeError);
  assert.deepEqual(prev, { box: 2, due: "2026-11-20" });
});

test("srs : fiches dues", () => {
  const c = mk();
  const k0 = cardKey(c.matieres[0], c.matieres[0].chapitres[0], 0);
  const cartes = { [k0]: { box: 2, due: "2026-11-20" } };
  assert.equal(isDue(cartes, k0, TODAY), false);
  assert.equal(isDue(cartes, k0, new Date(2026, 10, 20)), true);
  assert.equal(allCards(c).length, 2);
  assert.equal(dueCards(c, cartes, TODAY).length, 1);
  assert.equal(dueCards(c, cartes, TODAY, "b").length, 0);
});

test("progression : pondération actuelle 30/30/40 (comportement conservé)", () => {
  const c = mk(), m = c.matieres[0], ch = m.chapitres[0];
  const st = blankState();
  assert.equal(chapStats(st, m, ch).p, 0);
  st.lu["a|c1"] = true;
  assert.ok(Math.abs(chapStats(st, m, ch).p - 0.3) < 1e-9);
  st.quiz["a|c1"] = { best: 1 };
  st.cartes["a|c1|0"] = { box: 3, due: null };
  assert.ok(Math.abs(chapStats(st, m, ch).p - (0.3 + 0.3 + 0.4 * 0.5)) < 1e-9);
  // Chapitre sans fiches ni quiz : seule la lecture compte.
  st.lu["a|c2"] = true;
  assert.equal(chapStats(st, m, m.chapitres[1]).p, 1);
  assert.equal(subjectProgress(st, c.matieres[1]), 0);
  const o = overall(c, st);
  assert.equal(o.chapters, 2);
  assert.equal(o.lu, 2);
});

test("planning : examens passés ignorés, tâches avant l'examen, examen blanc la veille", () => {
  const c = mk();
  const plan = buildPlan(c, blankState(), TODAY);
  const all = plan.flatMap((d) => d.tasks.map((t) => ({ k: d.k, ...t })));
  assert.ok(!all.some((t) => t.m.id === "b"), "examen passé ignoré");
  const examA = all.find((t) => t.key === "a|exam");
  assert.equal(examA.k, "2026-12-01");
  const study = all.filter((t) => t.key.startsWith("a|etude") || t.key.startsWith("a|quiz"));
  assert.ok(study.every((t) => t.k <= "2026-11-28"), "étude au plus tard 3 jours avant");
  assert.equal(all.find((t) => t.key === "a|blanc").k, "2026-11-30");
  assert.equal(all.find((t) => t.key === "a|fiches-final").k, "2026-11-29");
  assert.equal(all.find((t) => t.key === "z|ajout").k, "2026-11-15");
  assert.deepEqual(plan.map((d) => d.k), plan.map((d) => d.k).slice().sort(), "jours triés");
});

test("planning : un chapitre maîtrisé ne génère plus de tâche", () => {
  const c = mk();
  const st = blankState();
  st.lu["a|c2"] = true;
  const keys = buildPlan(c, st, TODAY).flatMap((d) => d.tasks.map((t) => t.key));
  assert.ok(!keys.includes("a|etude|c2"));
  assert.ok(keys.includes("a|etude|c1"));
});

test("activité : série de jours et semaine", () => {
  let j = {};
  j = addActivity(j, new Date(2026, 10, 13), 1);
  j = addActivity(j, new Date(2026, 10, 14), 2);
  assert.equal(streak(j, TODAY), 2, "série jusqu'à hier si rien aujourd'hui");
  j = addActivity(j, TODAY, 3);
  assert.equal(streak(j, TODAY), 3);
  assert.equal(streak({}, TODAY), 0);
  const w = lastWeek(j, TODAY);
  assert.equal(w.length, 7);
  assert.deepEqual(w.slice(-3).map((x) => x.v), [1, 2, 3]);
  assert.equal(w[6].today, true);
});

test("recherche : insensible aux accents et à la casse, tous les mots requis", () => {
  const idx = buildIndex(mk());
  assert.ok(search(idx, "beta").some((x) => x.t === "Bêta"));
  assert.ok(search(idx, "lazarsfeld").some((x) => x.g === "Chapitres"));
  assert.equal(search(idx, "bruit inexistant").length, 0);
  assert.ok(search(idx, "").every((x) => x.g === "Matières" || x.g === "Chapitres"));
});

test("routeur : toutes les routes connues et la route inconnue", () => {
  const c = mk();
  assert.equal(parseRoute("", c).name, "home");
  assert.equal(parseRoute("#accueil", c).name, "home");
  assert.equal(parseRoute("#m-a", c).m.id, "a");
  const r = parseRoute("#c-a-c1-quiz", c);
  assert.equal(r.name, "chapter"); assert.equal(r.c.id, "c1"); assert.equal(r.t, "quiz");
  assert.equal(parseRoute("#c-a-c9-quiz", c).c, undefined);
  assert.equal(parseRoute("#blanc-a", c).name, "blanc");
  assert.equal(parseRoute("#parametres", c).name, "settings");
  assert.deepEqual(parseRoute("#nimporte-quoi", c), { name: "unknown", id: "nimporte-quoi" });
});
