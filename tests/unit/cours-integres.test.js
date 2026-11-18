import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { mergePacks, planImport, validatePack } from "../../src/data/v2/course-pack.js";
import { newStructure } from "../../src/data/v2/workspace.js";
import { ICON_NAMES } from "../../src/core/icons.js";

const dir = new URL("../../cours/", import.meta.url);
const files = readdirSync(dir).filter((f) => f.endsWith(".json")).map((f) => ({ name: f, pack: JSON.parse(readFileSync(new URL(f, dir), "utf8")) }));

test("cours intégrés : chaque fichier est valide et l'ensemble s'importe sans doublon", () => {
  assert.ok(files.length > 0);
  for (const f of files) assert.deepEqual(validatePack(f.pack, { iconNames: ICON_NAMES }), [], f.name);
  const m = mergePacks(files);
  assert.deepEqual(m.duplicates, []);
  const plan = planImport(newStructure({ workspaceId: "6f1c9a52-3b7e-4d2a-9c11-2a4b5c6d7e8f", now: new Date() }), m.pack, { now: new Date(), sourceOf: m.sourceOf, iconNames: ICON_NAMES });
  assert.ok(plan.ok, plan.errors && plan.errors.join(" "));
});

test("cours intégrés : aucune adresse e-mail publiée", () => {
  for (const f of files) assert.ok(!/[\w.+-]+@[\w-]+\.[a-z]{2,}/i.test(JSON.stringify(f.pack)), f.name);
});
