// Thème : "auto" suit le système, "light" ou "dark" forcent l'apparence.

export function applyTheme(theme) {
  const r = document.documentElement;
  if (theme === "light" || theme === "dark") r.setAttribute("data-theme", theme);
  else r.removeAttribute("data-theme");
}
