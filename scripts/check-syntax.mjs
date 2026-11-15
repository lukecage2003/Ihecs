// Vérifie la syntaxe de tous les fichiers JavaScript du projet avec `node --check`.
import { execFileSync } from "node:child_process";
import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const DIRS = ["src", "fixtures", "scripts", "tests"];
const files = [];
const walk = (d) => { for (const f of readdirSync(d)) { const p = join(d, f); if (statSync(p).isDirectory()) walk(p); else if (/\.(m?js)$/.test(f)) files.push(p); } };
DIRS.forEach(walk);
files.push("playwright.config.js");
let failed = 0;
for (const f of files) {
  try { execFileSync(process.execPath, ["--check", f], { stdio: "pipe" }); }
  catch (e) { failed++; console.error("✗ " + f + "\n" + e.stderr.toString()); }
}
console.log(`${files.length - failed}/${files.length} fichiers sans erreur de syntaxe.`);
process.exit(failed ? 1 : 0);
