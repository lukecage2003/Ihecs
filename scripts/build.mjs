// Assemble l'application en UN SEUL fichier HTML autonome : IHECS-STUDY-OS.html.
// Il s'ouvre d'un double-clic, sans serveur. Aucune dépendance.
//
// Chaque module ES de src/ devient une fonction isolée (pas de collision de noms) ;
// les imports deviennent des références aux exports des modules déjà évalués,
// dans l'ordre des dépendances. CSS et polices sont intégrés (data: URI).
// La CSP autorise uniquement CE script, identifié par son empreinte SHA-256.
//
// Usage : npm run build          (écrit IHECS-STUDY-OS.html)
//         npm run build -- --check  (échoue si le fichier versionné n'est pas à jour)

import { createHash } from "node:crypto";
import { readFileSync, readdirSync, writeFileSync, existsSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const ENTRY = resolve(ROOT, "src/main.js");
const OUT = resolve(ROOT, "IHECS-STUDY-OS.html");

const IMPORT_RE = /^import\s+(?:(\w+)|\{([^}]*)\})\s+from\s+"([^"]+)";\s*$/;
const EXPORT_DECL_RE = /^export\s+((?:async\s+)?function\*?|const|let|class)\s+([A-Za-z_$][\w$]*)/;
const EXPORT_DEFAULT_RE = /^export\s+default\s+([A-Za-z_$][\w$]*);\s*$/;

export function transformModule(source, file) {
  const imports = [], exports = [];
  let defaultName = null;
  const lines = source.split("\n").map((line) => {
    let m;
    if ((m = line.match(IMPORT_RE))) {
      imports.push({ def: m[1] || null, named: m[2] ? m[2].split(",").map((s) => s.trim()).filter(Boolean) : [], from: resolve(dirname(file), m[3]) });
      return "";
    }
    if (/^\s*import[\s{(]/.test(line) || /^\s*export\s*\{/.test(line) || /^\s*export\s*\*/.test(line)) {
      throw new Error("Syntaxe d'import/export non prise en charge dans " + relative(ROOT, file) + " : " + line.trim());
    }
    if ((m = line.match(EXPORT_DEFAULT_RE))) { defaultName = m[1]; return ""; }
    if ((m = line.match(EXPORT_DECL_RE))) { exports.push(m[2]); return line.replace(/^export\s+/, ""); }
    if (/^\s*export\s/.test(line)) throw new Error("Export non pris en charge dans " + relative(ROOT, file) + " : " + line.trim());
    return line;
  });
  return { imports, exports, defaultName, body: lines.join("\n") };
}

export function bundle(entry = ENTRY) {
  const mods = new Map(); // chemin -> { id, ...transform }
  const order = [];
  const visiting = new Set();
  const visit = (file) => {
    if (mods.has(file)) return;
    if (visiting.has(file)) throw new Error("Dépendance circulaire : " + relative(ROOT, file));
    if (!existsSync(file)) throw new Error("Module introuvable : " + relative(ROOT, file));
    visiting.add(file);
    const t = transformModule(readFileSync(file, "utf8"), file);
    t.imports.forEach((i) => visit(i.from));
    visiting.delete(file);
    mods.set(file, Object.assign({ id: "__m" + mods.size }, t));
    order.push(file);
  };
  visit(entry);
  let out = "";
  for (const file of order) {
    const m = mods.get(file);
    const head = m.imports.map((i) => {
      const src = mods.get(i.from);
      const parts = [];
      if (i.def) {
        if (!src.defaultName) throw new Error(relative(ROOT, i.from) + " n'a pas d'export par défaut");
        parts.push("const " + i.def + " = " + src.id + ".default;");
      }
      if (i.named.length) {
        i.named.forEach((n) => { const orig = n.split(/\s+as\s+/)[0]; if (!src.exports.includes(orig)) throw new Error(orig + " n'est pas exporté par " + relative(ROOT, i.from)); });
        parts.push("const { " + i.named.map((n) => n.replace(/\s+as\s+/, ": ")).join(", ") + " } = " + src.id + ";");
      }
      return parts.join(" ");
    }).join("\n");
    const ret = "return { " + m.exports.join(", ") + (m.defaultName ? (m.exports.length ? ", " : "") + "default: " + m.defaultName : "") + " };";
    out += "\n// ---- " + relative(ROOT, file) + "\nconst " + m.id + " = (() => {\n" + head + "\n" + m.body + "\n" + ret + "\n})();\n";
  }
  return '"use strict";\n(() => {' + out + "})();\n";
}

function inlineCss() {
  let css = readFileSync(resolve(ROOT, "assets/css/style.css"), "utf8");
  css = css.replace(/url\("\.\.\/fonts\/([\w.-]+\.woff2)"\)/g, (_, f) => 'url("data:font/woff2;base64,' + readFileSync(resolve(ROOT, "assets/fonts", f)).toString("base64") + '")');
  if (/url\("(?!data:)/.test(css)) throw new Error("Une ressource CSS externe n'a pas été intégrée.");
  return css;
}

// Cours intégrés au site (dossier cours/) : publiés avec le site, ouverts directement.
const COURS_DIR = resolve(ROOT, "cours");
const COURS_OUT = resolve(ROOT, "src/content/cours-integres.js");
export function coursModule() {
  const files = existsSync(COURS_DIR) ? readdirSync(COURS_DIR).filter((f) => f.endsWith(".json")).sort() : [];
  const packs = files.map((f) => ({ name: f, pack: JSON.parse(readFileSync(resolve(COURS_DIR, f), "utf8")) }));
  return "// Généré par scripts/build.mjs à partir de cours/*.json. Ne pas modifier à la main.\nconst COURS = " + JSON.stringify(packs) + ";\nexport default COURS;\n";
}

export function buildHtml() {
  const js = bundle().replace(/<\/(script)/gi, "<\\/$1");
  const hash = createHash("sha256").update(js, "utf8").digest("base64");
  const csp = "default-src 'none'; script-src 'sha256-" + hash + "'; style-src 'unsafe-inline'; font-src data:; img-src data: blob:; connect-src 'none'; base-uri 'none'; form-action 'none'; object-src 'none'";
  let html = readFileSync(resolve(ROOT, "index.html"), "utf8");
  const replaceOnce = (re, val, what) => { if (!re.test(html)) throw new Error("Gabarit index.html : " + what + " introuvable"); html = html.replace(re, () => val); };
  replaceOnce(/<meta http-equiv="Content-Security-Policy" content="[^"]*">/, '<meta http-equiv="Content-Security-Policy" content="' + csp + '">', "CSP");
  replaceOnce(/<link rel="stylesheet" href="assets\/css\/style\.css">/, "<style>\n" + inlineCss() + "\n</style>", "feuille de style");
  replaceOnce(/<script type="module" src="src\/main\.js"><\/script>/, "<script>" + js + "</script>", "script principal");
  return "<!-- Fichier généré par scripts/build.mjs à partir de src/. Ne pas modifier à la main. -->\n" + html;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const cours = coursModule();
  if (process.argv.includes("--check")) {
    if (!existsSync(COURS_OUT) || readFileSync(COURS_OUT, "utf8") !== cours) { console.error("src/content/cours-integres.js n'est pas à jour : lance « npm run build »."); process.exit(1); }
  } else writeFileSync(COURS_OUT, cours);
  const html = buildHtml();
  if (process.argv.includes("--check")) {
    const current = existsSync(OUT) ? readFileSync(OUT, "utf8") : "";
    if (current !== html) { console.error("IHECS-STUDY-OS.html n'est pas à jour : lance « npm run build » et versionne le résultat."); process.exit(1); }
    console.log("IHECS-STUDY-OS.html est à jour.");
  } else {
    writeFileSync(OUT, html);
    console.log("Écrit : IHECS-STUDY-OS.html (" + Math.round(html.length / 1024) + " Ko)");
  }
}
