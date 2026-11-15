// Aides DOM (navigateur uniquement).

export const $ = (s, el) => (el || document).querySelector(s);
export const $$ = (s, el) => Array.from((el || document).querySelectorAll(s));

let toastTimer;
export function toast(msg) {
  const t = $("#toast");
  if (!t) return;
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), 2600);
}

export function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
