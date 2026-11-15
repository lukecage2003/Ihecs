// Intégrité des fixtures de démonstration et séparation des espaces (D3).
import { test } from "node:test";
import assert from "node:assert/strict";
import DEMO from "../../fixtures/demo/cours.js";
import { WORKSPACES, currentWorkspace, realWorkspace, realWorkspaceAvailable } from "../../src/content/workspaces.js";
import { ICON_NAMES } from "../../src/core/icons.js";
import { safeColor } from "../../src/core/html.js";

test("fixtures : marquées comme exemple et chargées uniquement dans l'espace démo", () => {
  assert.equal(DEMO.exemple, true);
  assert.equal(WORKSPACES.demo.kind, "demo");
  assert.equal(WORKSPACES.demo.content, DEMO);
  const others = Object.values(WORKSPACES).filter((w) => w.kind !== "demo");
  assert.ok(others.every((w) => w.content !== DEMO), "aucun autre espace ne référence les fixtures");
  assert.equal(realWorkspaceAvailable, true);
  assert.equal(currentWorkspace().kind, "demo");
  const real = realWorkspace({ workspace: { id: "0d3f2c1a-aaaa-bbbb-cccc-000000000001", kind: "real", name: "Mon espace" } }, "IHECS STUDY OS");
  assert.equal(real.kind, "real");
  assert.equal("content" in real, false, "l'espace réel ne transporte aucun contenu, encore moins les fixtures");
});

test("fixtures : identifiants uniques et compatibles avec le routeur", () => {
  const ids = DEMO.matieres.map((m) => m.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const m of DEMO.matieres) {
    assert.match(m.id, /^[a-z0-9]+$/i);
    const cids = (m.chapitres || []).map((c) => c.id);
    assert.equal(new Set(cids).size, cids.length, m.id);
    cids.forEach((c) => assert.match(c, /^[a-z0-9]+$/i));
  }
});

test("fixtures : couleurs, icônes, dates et quiz valides", () => {
  for (const m of DEMO.matieres) {
    assert.equal(safeColor(m.couleur, null), m.couleur, "couleur " + m.id);
    assert.ok(ICON_NAMES.includes(m.icone), "icône " + m.icone);
    assert.ok(!Number.isNaN(new Date(m.examen.date).getTime()), "date " + m.id);
    for (const c of m.chapitres || []) {
      for (const q of c.quiz || []) {
        assert.ok(Array.isArray(q.choix) && q.choix.length >= 2 && q.choix.length <= 4, q.q);
        assert.ok(Number.isInteger(q.bonne) && q.bonne >= 0 && q.bonne < q.choix.length, q.q);
      }
      for (const f of c.fiches || []) assert.ok(f.q && f.r, "fiche incomplète dans " + c.id);
    }
  }
});
