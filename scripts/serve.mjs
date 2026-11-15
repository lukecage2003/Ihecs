// Serveur statique local, sans dépendance. Écoute uniquement sur 127.0.0.1.
// Usage : npm run serve  (PORT=8080 npm run serve pour changer le port)
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(fileURLToPath(new URL("..", import.meta.url)));
const PORT = Number(process.env.PORT) || 8080;
const HOST = "127.0.0.1";
const TYPES = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8", ".json": "application/json; charset=utf-8", ".svg": "image/svg+xml",
  ".png": "image/png", ".jpg": "image/jpeg", ".woff2": "font/woff2", ".txt": "text/plain; charset=utf-8", ".md": "text/plain; charset=utf-8"
};
// Seuls ces dossiers et fichiers sont servis (pas .git, node_modules, tests…).
const ALLOWED = ["index.html", "assets" + sep, "src" + sep, "fixtures" + sep];

export function resolveSafe(urlPath) {
  let p;
  try { p = decodeURIComponent(urlPath.split("?")[0].split("#")[0]); } catch { return null; }
  if (p.includes("\0")) return null;
  if (p === "/" || p === "") p = "/index.html";
  const full = normalize(join(ROOT, p));
  if (!full.startsWith(ROOT + sep)) return null;
  const rel = full.slice(ROOT.length + 1);
  return ALLOWED.some((a) => rel === a || rel.startsWith(a)) ? full : null;
}

export function startServer(port = PORT) {
  const server = createServer(async (req, res) => {
    const file = resolveSafe(req.url || "/");
    if (!file || (req.method !== "GET" && req.method !== "HEAD")) { res.writeHead(file ? 405 : 404).end(); return; }
    try {
      const st = await stat(file);
      if (!st.isFile()) { res.writeHead(404).end(); return; }
      const body = await readFile(file);
      res.writeHead(200, { "Content-Type": TYPES[extname(file)] || "application/octet-stream", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" });
      res.end(req.method === "HEAD" ? undefined : body);
    } catch { res.writeHead(404).end(); }
  });
  return new Promise((ok) => server.listen(port, HOST, () => ok(server)));
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  startServer().then(() => console.log(`IHECS STUDY OS : http://${HOST}:${PORT}/`));
}
