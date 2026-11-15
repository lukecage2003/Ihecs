// Migration v1 → v2 : preuves d'absence de perte de données.
// La migration est une CONCEPTION non branchée sur l'application (phase 1).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import DEMO from "../../fixtures/demo/cours.js";
import { assignContentIds, cardIdFor, migrateStateV1toV2, projectV2toV1, stripContentIds } from "../../src/data/v2/migrate-v1.js";
import { SCHEMA_VERSION, validateStateV2 } from "../../src/data/v2/schema.js";

const DIR = new URL("../fixtures/v1/", import.meta.url);
const FIXTURES = readdirSync(DIR).filter((f) => f.endsWith(".json")).map((f) => [f, JSON.parse(readFileSync(new URL(f, DIR), "utf8"))]);
const OPTS = { workspaceId: "demo", workspaceKind: "demo", now: new Date("2026-11-15T20:00:00Z") };

test("il y a des fixtures v1 à migrer", () => assert.ok(FIXTURES.length >= 5));

for (const [name, v1] of FIXTURES) {
  test(`${name} : migration valide et sans perte (aller-retour exact)`, () => {
    const res = migrateStateV1toV2(v1, DEMO, OPTS);
    assert.equal(res.ok, true, res.error);
    assert.deepEqual(validateStateV2(res.doc), []);
    assert.equal(res.doc.schemaVersion, SCHEMA_VERSION);
    assert.deepEqual(projectV2toV1(res.doc), v1, "la projection inverse doit redonner exactement l'état v1");
  });

  test(`${name} : chaque fiche est soit reliée, soit conservée comme orpheline`, () => {
    const { doc, report } = migrateStateV1toV2(v1, DEMO, OPTS);
    const keys = Object.keys(v1.cartes || {});
    assert.equal(report.cardsMapped + report.cardsOrphaned, keys.length);
    for (const k of keys) assert.ok(k in doc.idMap.cards || k in doc.orphans.cards, k);
  });

  test(`${name} : l'entrée n'est pas modifiée et le résultat est déterministe`, () => {
    const before = JSON.stringify(v1);
    const a = migrateStateV1toV2(v1, DEMO, OPTS);
    const b = migrateStateV1toV2(v1, DEMO, OPTS);
    assert.equal(JSON.stringify(v1), before);
    assert.deepEqual(a, b);
  });

  test(`${name} : aucune histoire de révision n'est inventée`, () => {
    const { doc } = migrateStateV1toV2(v1, DEMO, OPTS);
    assert.deepEqual(doc.progress.reviewLog, []);
    for (const c of Object.values(doc.progress.cards)) assert.equal(c.origin, "migrated-v1");
  });
}

test("typical.json : identifiants stables et contenu des enregistrements", () => {
  const v1 = FIXTURES.find(([n]) => n === "typical.json")[1];
  const { doc, report } = migrateStateV1toV2(v1, DEMO, OPTS);
  assert.equal(doc.idMap.cards["socio|c1|0"], "card:socio:c1:000");
  assert.deepEqual(doc.progress.cards["card:socio:c1:000"], { scheduler: "leitner", box: 3, due: "2026-11-19", origin: "migrated-v1" });
  assert.deepEqual(doc.progress.quizSummaries["socio|c1"], { best: 0.8333333333333334, last: 0.6666666666666666, tries: 3, origin: "migrated-v1" });
  assert.equal(doc.settings.firstName, "Zoé");
  assert.equal(doc.settings.theme, "dark");
  assert.equal(doc.progress.focusMinutes, 75);
  assert.deepEqual(doc.progress.legacyDailyActivity, v1.journal);
  assert.equal(report.cardsOrphaned, 0);
  assert.equal(doc.workspace.kind, "demo");
});

test("orphans-and-unknown.json : rien n'est jeté", () => {
  const v1 = FIXTURES.find(([n]) => n === "orphans-and-unknown.json")[1];
  const { doc, report } = migrateStateV1toV2(v1, DEMO, OPTS);
  assert.ok("socio|c1|99" in doc.orphans.cards, "index hors contenu");
  assert.ok("matiere-supprimee|c1|0" in doc.orphans.cards, "matière disparue");
  assert.ok("socio|c1|1" in doc.orphans.cards, "boîte invalide");
  assert.ok("format-inattendu" in doc.orphans.cards, "valeur non objet");
  assert.ok("cassé|c1" in doc.orphans.quiz, "quiz invalide");
  assert.deepEqual(doc.legacy.unknownFields, { champFutur: { a: [1, 2, 3] }, autre: null });
  assert.deepEqual(doc.legacy.invalidFields, { prenom: 42, theme: "violet" });
  assert.deepEqual(doc.legacy.focusExtra, { sessions: 2 });
  assert.deepEqual(doc.progress.cards[doc.idMap.cards["socio|c1|3"]].legacyExtra, { note: "champ en plus" });
  assert.deepEqual(report.unknownFields, ["champFutur", "autre"]);
});

test("la copie de sécurité legacy.v1 est intégrale, mais la projection ne s'en sert pas", () => {
  const v1 = FIXTURES.find(([n]) => n === "typical.json")[1];
  const { doc } = migrateStateV1toV2(v1, DEMO, OPTS);
  assert.deepEqual(doc.legacy.v1, v1);
  const altered = JSON.parse(JSON.stringify(doc));
  altered.legacy.v1 = { trafiqué: true };
  assert.deepEqual(projectV2toV1(altered), v1);
});

test("idempotence : un document déjà v2 est renvoyé inchangé", () => {
  const v1 = FIXTURES.find(([n]) => n === "typical.json")[1];
  const once = migrateStateV1toV2(v1, DEMO, OPTS).doc;
  const twice = migrateStateV1toV2(once, DEMO, OPTS);
  assert.equal(twice.ok, true);
  assert.equal(twice.report.alreadyV2, true);
  assert.deepEqual(twice.doc, once);
});

test("entrées invalides : refus explicite, sans exception", () => {
  for (const bad of [null, 42, "texte", [], { cartes: [] }, { lu: "x" }]) {
    const r = migrateStateV1toV2(bad, DEMO, OPTS);
    assert.equal(r.ok, false, JSON.stringify(bad));
    assert.equal(typeof r.error, "string");
  }
  assert.equal(migrateStateV1toV2({}, DEMO, { workspaceId: "x" }).ok, false, "options incomplètes");
  assert.equal(migrateStateV1toV2({}, DEMO, { ...OPTS, workspaceKind: "autre" }).ok, false);
});

test("espaces séparés (D3) : le type d'espace est conservé tel quel", () => {
  const r = migrateStateV1toV2({}, { matieres: [] }, { ...OPTS, workspaceId: "mon-espace", workspaceKind: "real" });
  assert.deepEqual(r.doc.workspace, { id: "mon-espace", kind: "real" });
});

test("contenu : identifiants ajoutés sans rien perdre, entrée non modifiée, identifiants existants conservés", () => {
  const before = JSON.stringify(DEMO);
  const withIds = assignContentIds(DEMO);
  assert.equal(JSON.stringify(DEMO), before);
  const f = withIds.matieres[0].chapitres[0].fiches[0];
  assert.equal(f.id, cardIdFor("socio", "c1", 0));
  const all = withIds.matieres.flatMap((m) => (m.chapitres || []).flatMap((c) => [...(c.fiches || []), ...(c.quiz || [])].map((x) => x.id)));
  assert.equal(new Set(all).size, all.length, "identifiants uniques");
  assert.deepEqual(stripContentIds(withIds), DEMO);
  const again = assignContentIds(withIds);
  assert.deepEqual(again, withIds, "réappliquer ne change pas les identifiants");
});

test("identifiant stable : réordonner les fiches après migration ne change plus leur identifiant", () => {
  const withIds = assignContentIds(DEMO);
  const ch = withIds.matieres[0].chapitres[0];
  const firstId = ch.fiches[0].id;
  ch.fiches.reverse();
  const reassigned = assignContentIds(withIds);
  const moved = reassigned.matieres[0].chapitres[0].fiches.find((x) => x.id === firstId);
  assert.ok(moved, "la fiche garde son identifiant après réordonnancement");
  assert.equal(moved.q, DEMO.matieres[0].chapitres[0].fiches[0].q);
});
