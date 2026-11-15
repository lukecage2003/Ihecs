// Utilitaires de dates. Toutes les fonctions sont pures : la date « du jour »
// est toujours passée en paramètre par l'appelant pour rester testable.

export const pad = (n) => String(n).padStart(2, "0");

/** Clé de jour locale AAAA-MM-JJ. */
export const dayKey = (d) => d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());

export const startOfDay = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };

export const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };

export const parseDay = (k) => { const [y, m, d] = k.split("-").map(Number); return new Date(y, m - 1, d); };

/** Nombre de jours calendaires de a à b (négatif si b est avant a). */
export const daysBetween = (a, b) => Math.round((startOfDay(b) - startOfDay(a)) / 86400000);

export const today = (now = new Date()) => startOfDay(now);

export const fmt = (d, o) => new Intl.DateTimeFormat("fr-BE", o).format(d);
export const fmtLong = (d) => fmt(d, { weekday: "long", day: "numeric", month: "long" });
export const fmtTime = (d) => fmt(d, { hour: "2-digit", minute: "2-digit" });
export const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

/** Date d'examen d'une matière, ou null. */
export const examDate = (m) => (m && m.examen && m.examen.date ? new Date(m.examen.date) : null);
