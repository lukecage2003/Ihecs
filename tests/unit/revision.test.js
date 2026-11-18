import { test } from "node:test";
import assert from "node:assert/strict";
import { weakCards } from "../../src/domain/srs.js";
import { quizReport } from "../../src/domain/quiz-stats.js";

const content = { matieres: [{ id: "a", chapitres: [{ id: "c1", fiches: [{ id: "f-0001", q: "1" }, { id: "f-0002", q: "2" }, { id: "f-0003", q: "3" }, { id: "f-0004", q: "4" }] }] }, { id: "b", chapitres: [{ id: "c2", fiches: [{ id: "f-0005", q: "5" }] }] }] };

test("weakCards : fiches vues en boîte 0 ou 1, plus fragiles d'abord, filtre par matière", () => {
  const cartes = { "f-0001": { box: 1, due: "2026-11-20" }, "f-0002": { box: 0, due: "2026-11-18" }, "f-0003": { box: 4, due: "2026-12-01" }, "f-0005": { box: 0, due: "2026-11-18" } };
  assert.deepEqual(weakCards(content, cartes).map((x) => x.k), ["f-0002", "f-0005", "f-0001"]);
  assert.deepEqual(weakCards(content, cartes, "a").map((x) => x.k), ["f-0002", "f-0001"]);
  assert.deepEqual(weakCards(content, {}), []);
});

test("quizReport : score par chapitre (pire d'abord), ratées et sans réponse", () => {
  const qs = [{ _m: "Ch1" }, { _m: "Ch2" }, { _m: "Ch1" }, { _m: "Ch2" }, { _m: "Ch2" }];
  const r = quizReport(qs, [true, false, true, true]);
  assert.equal(r.ok, 3);
  assert.equal(r.total, 5);
  assert.equal(r.unanswered, 1);
  assert.deepEqual(r.byChapter, [{ titre: "Ch2", ok: 1, total: 3 }, { titre: "Ch1", ok: 2, total: 2 }]);
  assert.deepEqual(r.missed, [qs[1], qs[4]]);
});
