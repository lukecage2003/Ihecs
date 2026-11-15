// Petits composants d'affichage réutilisables (chaînes HTML).

import { esc, safeColor } from "../core/html.js";
import { ic } from "../core/icons.js";
import { app } from "./app.js";

export const statusPill = (p) => p >= 0.85 ? '<span class="pill pill-good">' + ic("check", 12) + "Maîtrisé</span>"
  : p >= 0.4 ? '<span class="pill pill-info">En cours</span>'
  : p > 0 ? '<span class="pill pill-warn">Commencé</span>'
  : '<span class="pill pill-neutral">À faire</span>';

export const bar = (p, color) => '<div class="bar"><i style="width:' + Math.round(p * 100) + "%" + (color ? ";background:" + safeColor(color) : "") + '"></i></div>';

export function ring(p, size, stroke, color, label) {
  const r = (size - stroke) / 2, c = 2 * Math.PI * r;
  const col = color && color.startsWith("var(") ? color : safeColor(color, "var(--accent)");
  return '<div class="ring" style="width:' + size + "px;height:" + size + 'px"><svg width="' + size + '" height="' + size + '" aria-hidden="true"><circle class="ring-track" cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + r + '" fill="none" stroke-width="' + stroke + '"/><circle class="ring-val" cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + r + '" fill="none" stroke="' + col + '" stroke-width="' + stroke + '" stroke-linecap="round" stroke-dasharray="' + c + '" stroke-dashoffset="' + c * (1 - Math.max(0, Math.min(1, p))) + '"/></svg><div class="ring-label">' + (label || "") + "</div></div>";
}

export const tile = (m, lg) => '<div class="icon-tile' + (lg ? " lg" : "") + '" style="background:' + safeColor(m.couleur) + '">' + ic(m.icone) + "</div>";

export const dot = (m, icon, size = 13, extraStyle = "") => '<span class="nav-dot" style="background:' + safeColor(m.couleur) + (extraStyle ? ";" + extraStyle : "") + '">' + ic(icon || m.icone, size) + "</span>";

export const banner = () => app.workspace && app.workspace.kind === "demo"
  ? '<div class="banner">' + ic("info", 18) + "<div><b>Mode démonstration.</b> Ces matières, examens et résumés sont fictifs. Ils servent à découvrir et tester l'application et ne feront jamais partie de ton véritable espace académique.</div></div>"
  : "";

export function statTile(icon, color, label, val, unit, foot) {
  return '<div class="card stat"><div class="stat-top"><span style="color:' + color + '">' + ic(icon, 18) + "</span>" + label + '</div><div class="stat-val">' + val + (unit ? " <small>" + unit + "</small>" : "") + "</div>" + foot + "</div>";
}

export function taskRow(t) {
  const on = !!app.state.plan[t.key];
  return '<div class="task' + (on ? " done" : "") + '"><button class="check' + (on ? " on" : "") + '" data-task="' + esc(t.key) + '" type="button" aria-label="Marquer comme fait" aria-pressed="' + on + '">' + ic("check", 13) + '</button><span class="dot" style="background:' + safeColor(t.m.couleur) + '"></span><div class="tx"><div class="tt">' + esc(t.titre) + '</div><div class="ts">' + esc(t.sub || "") + "</div></div>" + (t.href ? '<a class="btn btn-plain btn-sm" href="' + t.href + '">Ouvrir</a>' : "") + "</div>";
}
