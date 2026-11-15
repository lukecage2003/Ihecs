// Accès aux fichiers du dossier choisi (API File System Access).
// Règles : jamais de suppression ; écriture atomique (createWritable écrit dans
// un fichier temporaire puis remplace l'original à la fermeture).

export async function sha256(text) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, "0")).join("");
}

export async function subdir(root, path, create = false) {
  let d = root;
  for (const p of path) d = await d.getDirectoryHandle(p, { create });
  return d;
}

/** Lit un fichier texte. Renvoie { exists:false } s'il n'existe pas. */
export async function readText(dir, name) {
  try {
    const f = await (await dir.getFileHandle(name)).getFile();
    const text = await f.text();
    return { exists: true, text, size: f.size, lastModified: f.lastModified, hash: await sha256(text) };
  } catch (e) {
    if (e && (e.name === "NotFoundError" || e.name === "TypeMismatchError")) return { exists: false };
    throw e;
  }
}

/** Lit et analyse un fichier JSON. { exists, data } ou { exists, error }. */
export async function readJson(dir, name) {
  const r = await readText(dir, name);
  if (!r.exists) return r;
  try { return Object.assign(r, { data: JSON.parse(r.text) }); }
  catch (e) { return Object.assign(r, { error: "Fichier JSON illisible : " + name }); }
}

export async function writeText(dir, name, text) {
  const w = await (await dir.getFileHandle(name, { create: true })).createWritable();
  await w.write(text);
  await w.close();
  return sha256(text);
}

export const writeJson = (dir, name, data) => writeText(dir, name, JSON.stringify(data, null, 2) + "\n");

/** N'écrit que si le fichier n'existe pas encore. Renvoie false sinon (rien n'est écrasé). */
export async function createJsonIfAbsent(dir, name, data) {
  const cur = await readText(dir, name);
  if (cur.exists) return false;
  await writeJson(dir, name, data);
  return true;
}

/** Ajoute une ligne à la fin d'un fichier, sans réécrire le contenu existant. */
export async function appendLine(dir, name, line) {
  const fh = await dir.getFileHandle(name, { create: true });
  const size = (await fh.getFile()).size;
  const w = await fh.createWritable({ keepExistingData: true });
  await w.write({ type: "write", position: size, data: line.replace(/\n/g, " ") + "\n" });
  await w.close();
}

/**
 * Écrit seulement si le contenu actuel a l'empreinte attendue (null = fichier absent).
 * Sinon n'écrit rien et renvoie { ok: false, conflict: true }.
 */
export async function writeIfUnchanged(dir, name, text, expectedHash) {
  const cur = await readText(dir, name);
  const curHash = cur.exists ? cur.hash : null;
  if (curHash !== expectedHash) return { ok: false, conflict: true };
  return { ok: true, hash: await writeText(dir, name, text) };
}

/** Écrit un fichier sous un nom libre : ajoute « (2) », « (3) »… si le nom est pris. Ne remplace jamais. */
export async function writeNewFile(dir, name, text) {
  const dot = name.lastIndexOf(".");
  const base = dot > 0 ? name.slice(0, dot) : name, ext = dot > 0 ? name.slice(dot) : "";
  for (let i = 1; i < 1000; i++) {
    const candidate = i === 1 ? name : base + " (" + i + ")" + ext;
    if (!(await readText(dir, candidate)).exists) { await writeText(dir, candidate, text); return candidate; }
  }
  throw new Error("Impossible de trouver un nom libre pour " + name);
}

/** Ouvre un fichier par chemin relatif (« cours/socio/ch1.pdf »). Renvoie un File ou null. */
export async function fileAt(root, relPath) {
  const parts = relPath.split("/");
  try {
    const dir = await subdir(root, parts.slice(0, -1));
    return await (await dir.getFileHandle(parts[parts.length - 1])).getFile();
  } catch (e) { return null; }
}

export async function listNames(dir) {
  const out = [];
  for await (const [name] of dir.entries()) out.push(name);
  return out.sort();
}

export async function permission(handle, request = false) {
  try {
    const opts = { mode: "readwrite" };
    return request ? await handle.requestPermission(opts) : await handle.queryPermission(opts);
  } catch (e) { return "error"; }
}
