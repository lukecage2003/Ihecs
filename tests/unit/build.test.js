// Assemblage du fichier autonome IHECS-STUDY-OS.html.
import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { buildHtml, bundle, transformModule } from "../../scripts/build.mjs";

test("assemblage : imports et exports transformés", () => {
  const t = transformModule('import { a, b as c } from "./x.js";\nimport D from "./d.js";\nexport const k = 1;\nexport function f() {}\nexport default k;\n', "/p/m.js");
  assert.deepEqual(t.exports, ["k", "f"]);
  assert.equal(t.defaultName, "k");
  assert.deepEqual(t.imports.map((i) => [i.def, i.named]), [[null, ["a", "b as c"]], ["D", []]]);
  assert.match(t.body, /^\n\nconst k = 1;\nfunction f\(\) \{\}/);
});

test("assemblage : syntaxe non prise en charge refusée plutôt qu'ignorée", () => {
  for (const src of ['import "./x.js";', 'export { a };', 'export * from "./x.js";', 'export let\n']) {
    assert.throws(() => transformModule(src, "/p/m.js"), /non pris/);
  }
});

test("assemblage : le paquet s'évalue sans erreur de syntaxe", () => {
  const js = bundle();
  assert.doesNotThrow(() => new Function(js.replace(/\(\(\) => \{\n\/\/ ---- src\/main\.js[\s\S]*$/, "")));
  assert.ok(js.includes("// ---- src/main.js"));
  assert.ok(js.includes("// ---- fixtures/demo/cours.js"));
});

test("fichier autonome : déterministe, CSP par empreinte, aucune ressource externe", () => {
  const a = buildHtml(), b = buildHtml();
  assert.equal(a, b);
  const script = a.match(/<script>([\s\S]*)<\/script>/)[1];
  const hash = createHash("sha256").update(script, "utf8").digest("base64");
  assert.ok(a.includes("script-src 'sha256-" + hash + "'"), "la CSP autorise exactement ce script");
  assert.ok(a.includes("connect-src 'none'"));
  assert.ok(!/<(script|link)[^>]+(src|href)=/.test(a), "aucun script ou feuille externe");
  assert.ok(!/url\("(?!data:)/.test(a), "polices intégrées");
  assert.equal((a.match(/<script>/g) || []).length, 1);
});
