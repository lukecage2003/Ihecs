import { test } from "node:test";
import assert from "node:assert/strict";
import { resolveSafe } from "../../scripts/serve.mjs";

test("serveur local : sert l'application", () => {
  assert.ok(resolveSafe("/").endsWith("index.html"));
  assert.ok(resolveSafe("/src/main.js"));
  assert.ok(resolveSafe("/assets/css/style.css?v=1"));
});

test("serveur local : refuse les fichiers hors application et les traversées", () => {
  for (const p of ["/.git/config", "/package.json", "/node_modules/x", "/tests/unit/serve.test.js", "/../etc/passwd", "/%2e%2e/%2e%2e/etc/passwd", "/src/%00x", "/%E0%A4%A"]) {
    assert.equal(resolveSafe(p), null, p);
  }
});
