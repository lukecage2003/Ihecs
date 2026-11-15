// Préférences locales de ce navigateur (IndexedDB) : identifiant d'appareil,
// dossier Drive mémorisé (poignée), espace actif. Ce ne sont PAS des données
// académiques : la source de vérité de l'espace réel est le dossier Drive.

const DB = "ihecs-study-os";
const STORE = "prefs";

function open() {
  return new Promise((ok, ko) => {
    const r = indexedDB.open(DB, 1);
    r.onupgradeneeded = () => r.result.createObjectStore(STORE);
    r.onsuccess = () => ok(r.result);
    r.onerror = () => ko(r.error);
  });
}

// Crochet réservé aux tests automatisés : Chromium headless plante en relisant une
// poignée de dossier depuis IndexedDB. Jamais défini en usage réel.
const testHook = (key) => key === "realRoot" && typeof window !== "undefined" && window.__IHECS_TEST_HANDLE_STORE__;

export async function getPref(key) {
  if (testHook(key)) return window.__IHECS_TEST_HANDLE_STORE__.get();
  try {
    const db = await open();
    return await new Promise((ok, ko) => { const t = db.transaction(STORE).objectStore(STORE).get(key); t.onsuccess = () => ok(t.result); t.onerror = () => ko(t.error); });
  } catch (e) { return undefined; }
}

export async function setPref(key, value) {
  if (testHook(key)) return window.__IHECS_TEST_HANDLE_STORE__.set(value);
  const db = await open();
  return new Promise((ok, ko) => { const tx = db.transaction(STORE, "readwrite"); tx.objectStore(STORE).put(value, key); tx.oncomplete = () => ok(); tx.onerror = () => ko(tx.error); });
}

export async function deletePref(key) {
  if (testHook(key)) return window.__IHECS_TEST_HANDLE_STORE__.clear();
  const db = await open();
  return new Promise((ok, ko) => { const tx = db.transaction(STORE, "readwrite"); tx.objectStore(STORE).delete(key); tx.oncomplete = () => ok(); tx.onerror = () => ko(tx.error); });
}

/** Identifiant stable de cet appareil (navigateur), créé une seule fois. */
export async function deviceId() {
  let id = await getPref("deviceId");
  if (!id) { id = crypto.randomUUID(); await setPref("deviceId", id); }
  return id;
}
