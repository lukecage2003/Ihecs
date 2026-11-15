// Espace réel au format v2 : manifeste, structure, état par appareil, journal des révisions.
import { test } from "node:test";
import assert from "node:assert/strict";
import { contentFromStructure, emptyUiState, newManifest, newStructure, parseReviewLog, reviewEntry, reviewLogFile, uiStateToV2, v2ToUiState, validateDeviceState, validateManifest, validateStructure } from "../../src/data/v2/workspace.js";
import { validateStateV2 } from "../../src/data/v2/schema.js";
import { cardKey } from "../../src/domain/srs.js";

const NOW = new Date("2026-11-15T22:00:00Z");
const WID = "6f1c9a52-3b7e-4d2a-9c11-2a4b5c6d7e8f";
const DEV = "e04d8c30-e87e-4b0f-af1d-395dd1abc2f2";
const manifest = newManifest({ workspaceId: WID, deviceId: DEV, now: NOW });

test("manifeste : valide à la création, refusé s'il est d'un autre format ou d'une autre version", () => {
  assert.deepEqual(validateManifest(manifest), []);
  assert.equal(manifest.workspace.kind, "real");
  assert.ok(validateManifest({ ...manifest, schemaVersion: 3 }).length);
  assert.ok(validateManifest({ ...manifest, format: "autre" }).length);
  assert.ok(validateManifest({ ...manifest, workspace: { ...manifest.workspace, kind: "demo" } }).length, "un manifeste ne peut pas déclarer un espace démo");
  assert.ok(validateManifest(null).length);
});

test("structure : vide à la création, rattachée à son espace", () => {
  const s = newStructure({ workspaceId: WID, now: NOW });
  assert.deepEqual(validateStructure(s, WID), []);
  assert.deepEqual(s.subjects, []);
  assert.ok(validateStructure(s, "autre-espace-0000").length, "structure d'un autre espace refusée");
  assert.ok(validateStructure({ ...s, subjects: [{ nom: "sans id" }] }, WID).length);
});

test("contenu : un espace neuf n'a aucune matière et n'est pas marqué comme exemple", () => {
  const c = contentFromStructure(newStructure({ workspaceId: WID, now: NOW }), manifest);
  assert.equal(c.exemple, false);
  assert.deepEqual(c.matieres, []);
});

test("état : un état vide produit un document v2 valide", () => {
  const doc = uiStateToV2(emptyUiState(), { workspace: manifest.workspace, now: NOW });
  assert.deepEqual(validateStateV2(doc), []);
  assert.deepEqual(validateDeviceState(doc, WID), []);
  assert.ok(validateDeviceState(doc, "autre-espace-0000").length);
});

test("état : aller-retour interface → v2 → interface sans perte", () => {
  const ui = {
    lu: { "s1|c1": true }, quiz: { "s1|c1": { best: 0.8, last: 0.6, tries: 2 } },
    cartes: { "card-0001-abcd": { box: 3, due: "2026-11-19" }, "card-0002-abcd": { box: 0, due: null } },
    plan: { "s1|etude|c1": true }, journal: { "2026-11-15": 4 }, prenom: "Zoé", theme: "dark", focus: { min: 50 }
  };
  const doc = uiStateToV2(ui, { workspace: manifest.workspace, now: NOW });
  assert.deepEqual(validateStateV2(doc), []);
  assert.deepEqual(v2ToUiState(doc), ui);
  for (const c of Object.values(doc.progress.cards)) assert.equal(c.origin, "app");
});

test("état : les sections de conservation du document précédent ne sont jamais abandonnées", () => {
  const prev = uiStateToV2(emptyUiState(), { workspace: manifest.workspace, now: NOW });
  prev.orphans.cards["ancienne|clé|0"] = { box: 2 };
  prev.legacy = { note: "conservé" };
  prev.idMap.cards["x|y|0"] = "card-x";
  const next = uiStateToV2({ ...emptyUiState(), prenom: "A" }, { workspace: manifest.workspace, now: new Date(NOW.getTime() + 1000), prevDoc: prev });
  assert.deepEqual(next.orphans, prev.orphans);
  assert.deepEqual(next.legacy, prev.legacy);
  assert.deepEqual(next.idMap, prev.idMap);
  assert.equal(next.createdAt, prev.createdAt, "date de création conservée");
  assert.notEqual(next.updatedAt, prev.updatedAt);
});

test("journal des révisions : une ligne par révision, fichier mensuel, lignes illisibles signalées", () => {
  const e = reviewEntry({ id: "r1", cardId: "card-0001-abcd", rating: 3, before: { box: 0, due: null }, after: { box: 1, due: "2026-11-16" }, now: NOW, deviceId: DEV });
  assert.equal(e.at, NOW.toISOString());
  assert.equal(reviewLogFile(NOW), "revisions-2026-11.jsonl");
  const text = JSON.stringify(e) + "\n{cassé\n" + JSON.stringify({ ...e, id: "r2", rating: 9 }) + "\n";
  const { entries, invalidLines } = parseReviewLog(text);
  assert.equal(entries.length, 1);
  assert.deepEqual(invalidLines, [2, 3]);
});

test("identifiants stables : une fiche avec un id l'utilise, une fiche démo garde sa clé v1", () => {
  const m = { id: "s1" }, c = { id: "c1" };
  assert.equal(cardKey(m, c, 0, { id: "card-0001-abcd", q: "?", r: "!" }), "card-0001-abcd");
  assert.equal(cardKey(m, c, 0, { q: "?", r: "!" }), "s1|c1|0");
  assert.equal(cardKey(m, c, 0), "s1|c1|0");
});
