import { test } from "node:test";
import assert from "node:assert/strict";
import { blankState, decodeBackup, encodeBackup, loadState, saveState, STORAGE_KEY, validateBackup } from "../../src/state/store.js";

class MemStorage {
  constructor(init = {}) { this.m = new Map(Object.entries(init)); }
  getItem(k) { return this.m.has(k) ? this.m.get(k) : null; }
  setItem(k, v) { this.m.set(k, String(v)); }
}
class BrokenStorage { getItem() { throw new Error("bloqué"); } setItem() { throw new Error("bloqué"); } }

test("stockage : clé historique inchangée (aucune migration en phase 1)", () => {
  assert.equal(STORAGE_KEY, "revisions-ihecs-v1");
});

test("stockage : aller-retour sauvegarde puis lecture", () => {
  const s = new MemStorage();
  const st = blankState();
  st.lu["x|c1"] = true;
  st.cartes["x|c1|0"] = { box: 2, due: "2026-11-17" };
  assert.equal(saveState(s, st), true);
  assert.deepEqual(loadState(s), st);
});

test("stockage : un état partiel est complété sans perdre les champs existants", () => {
  const s = new MemStorage({ [STORAGE_KEY]: JSON.stringify({ lu: { a: true }, champInconnu: 42 }) });
  const st = loadState(s);
  assert.deepEqual(st.lu, { a: true });
  assert.deepEqual(st.cartes, {});
  assert.equal(st.champInconnu, 42, "les champs inconnus sont conservés, pas supprimés");
});

test("stockage : JSON corrompu ou stockage bloqué → état vide en mémoire, sans exception ni écrasement", () => {
  const s = new MemStorage({ [STORAGE_KEY]: "{pas du json" });
  assert.deepEqual(loadState(s), blankState());
  assert.equal(s.getItem(STORAGE_KEY), "{pas du json", "les données illisibles ne sont pas écrasées à la lecture");
  assert.deepEqual(loadState(new BrokenStorage()), blankState());
  assert.deepEqual(loadState(null), blankState());
  assert.equal(saveState(new BrokenStorage(), blankState()), false);
});

test("sauvegarde : encodage et décodage, accents compris", () => {
  const st = blankState();
  st.prenom = "Zoé";
  st.cartes["a|b|0"] = { box: 1, due: "2026-11-16" };
  assert.deepEqual(decodeBackup(encodeBackup(st)), st);
  assert.deepEqual(decodeBackup(JSON.stringify(st)), st);
  assert.equal(decodeBackup("n'importe quoi"), null);
});

test("sauvegarde : compatible avec les codes produits par l'ancienne version", () => {
  const st = { lu: {}, quiz: {}, cartes: { "a|b|0": { box: 1, due: "2026-11-16" } }, plan: {}, journal: {}, prenom: "Zoé", theme: "auto", focus: { min: 0 } };
  // Ancienne implémentation : btoa(unescape(encodeURIComponent(json)))
  const legacy = Buffer.from(JSON.stringify(st), "utf8").toString("base64");
  assert.deepEqual(decodeBackup(legacy), st);
});

test("validation : sauvegarde valide acceptée, champs inconnus ignorés", () => {
  const r = validateBackup({ cartes: { k: { box: 2, due: "2026-11-20" } }, quiz: { q: { best: 0.5 } }, theme: "dark", inconnu: 1 });
  assert.equal(r.ok, true);
  assert.equal(r.state.theme, "dark");
  assert.equal("inconnu" in r.state, false);
});

test("validation : sauvegardes invalides refusées", () => {
  for (const bad of [null, 42, [], {}, { cartes: [] }, { cartes: { k: { box: 9 } } }, { cartes: { k: { box: 1, due: "demain" } } }, { cartes: {}, quiz: { q: { best: "x" } } }, { cartes: {}, journal: { d: "x" } }, { cartes: {}, lu: "x" }]) {
    assert.equal(validateBackup(bad).ok, false, JSON.stringify(bad));
  }
});
