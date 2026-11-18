// Fichiers de cours : validation et plan d'import (aucune écriture).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { applyUserEdits, editSubject, mergePacks, planImport, safeRelativePath, subjectChanged, validatePack } from "../../src/data/v2/course-pack.js";
import { newStructure, contentFromStructure, newManifest } from "../../src/data/v2/workspace.js";
import { ICON_NAMES } from "../../src/core/icons.js";

const PACK = JSON.parse(readFileSync(new URL("../../fixtures/packs/exemple-cours.json", import.meta.url), "utf8"));
const NOW = new Date("2026-11-16T10:00:00Z");
const WID = "6f1c9a52-3b7e-4d2a-9c11-2a4b5c6d7e8f";
const clone = (o) => JSON.parse(JSON.stringify(o));
const empty = () => newStructure({ workspaceId: WID, now: NOW });
const opts = (extra = {}) => Object.assign({ now: NOW, sourceName: "cours.json", iconNames: ICON_NAMES }, extra);

test("le fichier d'exemple est valide", () => {
  assert.deepEqual(validatePack(PACK, { iconNames: ICON_NAMES }), []);
});

test("validation : refus explicites et lisibles", () => {
  const cases = [
    [(p) => { p.kind = "autre"; }, /pas un fichier de cours/],
    [(p) => { p.schemaVersion = 9; }, /Version/],
    [(p) => { p.subjects = []; }, /aucune matière/],
    [(p) => { p.subjects[0].id = "a b"; }, /identifiant invalide/],
    [(p) => { p.subjects[1].id = p.subjects[0].id; }, /en double/],
    [(p) => { p.subjects[0].couleur = "red;x:y"; }, /couleur invalide/],
    [(p) => { p.subjects[0].icone = "licorne"; }, /icône inconnue/],
    [(p) => { delete p.subjects[0].chapitres[0].fiches[0].id; }, /identifiant stable manquant/],
    [(p) => { p.subjects[0].chapitres[0].fiches[1].id = p.subjects[0].chapitres[0].fiches[0].id; }, /en double/],
    [(p) => { p.subjects[0].chapitres[0].quiz[0].bonne = 7; }, /bonne réponse hors des choix/],
    [(p) => { p.subjects[0].documents = [{ nom: "x", chemin: "../../secret.pdf" }]; }, /document invalide/],
    [(p) => { p.subjects[0].examen.date = "demain"; }, /date d'examen illisible/]
  ];
  for (const [mutate, re] of cases) {
    const p = clone(PACK); mutate(p);
    const errors = validatePack(p, { iconNames: ICON_NAMES });
    assert.ok(errors.some((e) => re.test(e)), re + " → " + JSON.stringify(errors));
  }
  assert.deepEqual(validatePack(null), ["Le fichier n'est pas un objet JSON."]);
});

test("chemins de documents : seuls les chemins relatifs à l'intérieur du dossier", () => {
  assert.equal(safeRelativePath("cours/socio/ch1.pdf"), true);
  for (const bad of ["/etc/passwd", "../x.pdf", "cours/../../x", "C:/x.pdf", "cours\\x.pdf", "", "cours//x.pdf", "./x"]) assert.equal(safeRelativePath(bad), false, bad);
});

test("import dans un espace vide : tout est ajouté, avec traçabilité", () => {
  const plan = planImport(empty(), PACK, opts());
  assert.equal(plan.ok, true, JSON.stringify(plan.errors));
  assert.equal(plan.added.length, 5);
  assert.deepEqual(plan.counts, { chapitres: 6, fiches: 42, questions: 30 });
  const s = plan.nextStructure;
  assert.equal(s.subjects.length, 5);
  assert.equal(s.subjects[0].importedFrom.pack, PACK.title);
  assert.equal(s.imports.length, 1);
  assert.deepEqual(s.imports[0].added, PACK.subjects.map((x) => x.id));
  const content = contentFromStructure(s, newManifest({ workspaceId: WID, deviceId: "d", now: NOW }));
  assert.equal(content.matieres[0].nom, PACK.subjects[0].nom);
  assert.equal(content.matieres[0].chapitres[0].fiches[0].id, PACK.subjects[0].chapitres[0].fiches[0].id);
  assert.deepEqual(content.matieres[0].fichiers, [{ nom: "Slides du chapitre 1 (exemple)", chemin: "cours/socio/chapitre-1.pdf", local: true }]);
});

test("réimport : les matières existantes sont ignorées par défaut, rien n'est écrasé", () => {
  const first = planImport(empty(), PACK, opts()).nextStructure;
  const again = planImport(first, PACK, opts());
  assert.equal(again.ok, true);
  assert.equal(again.added.length, 0);
  assert.equal(again.skipped.length, 5);
  assert.deepEqual(again.nextStructure.subjects, first.subjects);
});

test("remplacement explicite : seule la matière demandée change, à sa place", () => {
  const first = planImport(empty(), PACK, opts()).nextStructure;
  const updated = clone(PACK);
  updated.subjects[1].chapitres[0].titre = "Titre corrigé";
  const plan = planImport(first, updated, opts({ replace: [updated.subjects[1].id] }));
  assert.equal(plan.replaced.length, 1);
  assert.equal(plan.skipped.length, 4);
  assert.equal(plan.nextStructure.subjects[1].chapitres[0].titre, "Titre corrigé");
  assert.deepEqual(plan.nextStructure.subjects[0], first.subjects[0]);
});

test("identifiants de fiches déjà utilisés par une autre matière : import refusé", () => {
  const first = planImport(empty(), PACK, opts()).nextStructure;
  const other = clone(PACK);
  other.subjects = [clone(PACK.subjects[0])];
  other.subjects[0].id = "autrematiere";
  const plan = planImport(first, other, opts());
  assert.equal(plan.ok, false);
  assert.match(plan.errors[0], /déjà utilisés/);
});

test("le plan ne modifie ni la structure ni le pack d'origine", () => {
  const st = empty(), p = clone(PACK);
  const before = JSON.stringify([st, p]);
  planImport(st, p, opts());
  assert.equal(JSON.stringify([st, p]), before);
});

test("matières modifiées : détectées, les identiques ne le sont pas", () => {
  const first = planImport(empty(), PACK, opts()).nextStructure;
  assert.equal(planImport(first, PACK, opts()).changed.length, 0);
  const updated = clone(PACK);
  updated.subjects[2].chapitres[0].fiches[0].r = "Réponse corrigée";
  const plan = planImport(first, updated, opts());
  assert.deepEqual(plan.changed.map((s) => s.id), [updated.subjects[2].id]);
  assert.equal(subjectChanged(first.subjects[0], PACK.subjects[0]), false);
});

test("plusieurs fichiers : réunis, la version la plus récente d'une matière l'emporte", () => {
  const a = clone(PACK); a.createdAt = "2026-11-01T00:00:00Z"; a.subjects = a.subjects.slice(0, 2);
  const b = clone(PACK); b.createdAt = "2026-11-10T00:00:00Z"; b.subjects = [clone(PACK.subjects[1]), clone(PACK.subjects[3])];
  b.subjects[0].nom = "Version récente";
  const m = mergePacks([{ name: "a.json", pack: a }, { name: "b.json", pack: b }]);
  assert.deepEqual(m.pack.subjects.map((s) => s.id), [PACK.subjects[0].id, PACK.subjects[1].id, PACK.subjects[3].id]);
  assert.equal(m.pack.subjects[1].nom, "Version récente");
  assert.equal(m.sourceOf.get(PACK.subjects[1].id.toLowerCase()), "b.json");
  assert.deepEqual(m.duplicates, [{ id: PACK.subjects[1].id, kept: "b.json", dropped: "a.json" }]);
  assert.deepEqual(validatePack(m.pack, { iconNames: ICON_NAMES }), []);
  const plan = planImport(empty(), m.pack, opts({ sourceOf: m.sourceOf }));
  assert.equal(plan.nextStructure.subjects[2].importedFrom.file, "b.json");
  assert.equal(mergePacks([{ name: "a.json", pack: a }]).pack, a);
});

test("mise à jour : les modifications faites dans le site sont conservées", () => {
  const first = planImport(empty(), PACK, opts()).nextStructure;
  const edits = { credits: 7, examen: { date: "2027-01-12T09:00", lieu: "Auditoire S102" } };
  first.subjects[0] = applyUserEdits(first.subjects[0], edits);
  const updated = clone(PACK);
  updated.subjects[0].chapitres[0].titre = "Nouveau titre";
  updated.subjects[0].credits = 3;
  updated.subjects[0].examen.date = "2027-06-01T09:00";
  const plan = planImport(first, updated, opts({ replace: [updated.subjects[0].id] }));
  const s = plan.nextStructure.subjects[0];
  assert.equal(s.chapitres[0].titre, "Nouveau titre");
  assert.equal(s.credits, 7);
  assert.equal(s.examen.date, "2027-01-12T09:00");
  assert.equal(s.examen.lieu, "Auditoire S102");
  assert.deepEqual(s.userEdits, edits);
  assert.equal(subjectChanged(first.subjects[0], PACK.subjects[0]), false, "un fichier identique reste « à jour » malgré les modifications");
});

test("editSubject : n'enregistre que les champs changés, valide et survit au réimport", () => {
  const st = planImport(empty(), PACK, opts()).nextStructure;
  const s0 = st.subjects[0];
  const r = editSubject(st, s0.id.toUpperCase(), { credits: "5", quadrimestre: s0.quadrimestre, examen: { date: "2027-01-12T09:00", type: (s0.examen || {}).type || "", lieu: "Salle 2", consignes: "Calculatrice\n\n Carte étudiant " } });
  assert.deepEqual(r.errors, []);
  const s = r.structure.subjects[0];
  assert.equal(s.credits, 5);
  assert.equal(s.examen.date, "2027-01-12T09:00");
  assert.equal(s.examen.lieu, "Salle 2");
  assert.deepEqual(s.examen.consignes, ["Calculatrice", "Carte étudiant"]);
  assert.ok(!("quadrimestre" in s.userEdits), "quadrimestre inchangé, non enregistré");
  assert.ok(!("type" in s.userEdits.examen), "type inchangé, non enregistré");
  assert.equal(st.subjects[0].credits, s0.credits, "structure d'origine intacte");
  // Effacer un champ
  const r2 = editSubject(r.structure, s0.id, { examen: { lieu: "" } });
  assert.ok(!("lieu" in r2.structure.subjects[0].examen));
  assert.equal(r2.structure.subjects[0].examen.date, "2027-01-12T09:00");
  // Réimport : les modifications restent
  const re = planImport(r2.structure, PACK, opts({ replace: [s0.id] })).nextStructure.subjects[0];
  assert.equal(re.credits, 5);
  assert.equal(re.examen.date, "2027-01-12T09:00");
  assert.ok(!("lieu" in re.examen));
  // Erreurs
  assert.ok(editSubject(st, s0.id, { credits: 99 }).errors.length);
  assert.ok(editSubject(st, s0.id, { examen: { date: "demain" } }).errors.length);
  assert.ok(editSubject(st, "inconnue", {}).errors.length);
});
