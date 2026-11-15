// Minuteur Focus (Pomodoro 25 / 5 / 15 minutes). Ne tourne que page ouverte.

import { pad } from "../../core/dates.js";
import { ic } from "../../core/icons.js";
import { app } from "../app.js";
import { $, $$, toast } from "../dom.js";
import { ring } from "../widgets.js";

const MODES = { focus: 25 * 60, pause: 5 * 60, longue: 15 * 60 };
const timer = { mode: "focus", total: MODES.focus, left: MODES.focus, running: false, id: null };
let baseTitle = typeof document !== "undefined" ? document.title : "";

export function renderTimer() {
  const slot = $("#focus-slot");
  if (!slot) return;
  const mm = Math.floor(timer.left / 60), ss = timer.left % 60;
  slot.innerHTML = '<div class="focus">' + ring(timer.left / timer.total, 120, 9, timer.mode === "focus" ? "#bf5af2" : "var(--good)", '<div style="font-size:26px;font-weight:600" class="tnum" role="timer">' + pad(mm) + ":" + pad(ss) + '</div><div class="small muted">' + (timer.mode === "focus" ? "Focus" : "Pause") + "</div>") +
    '<div class="controls"><div class="seg" role="group" aria-label="Durée">' + [["focus", "Focus"], ["pause", "Pause"], ["longue", "Longue"]].map((x) => '<button type="button" data-mode="' + x[0] + '" aria-pressed="' + (timer.mode === x[0]) + '" class="' + (timer.mode === x[0] ? "on" : "") + '">' + x[1] + "</button>").join("") + "</div>" +
    '<div style="display:flex;gap:8px"><button class="btn btn-sm" id="t-go" type="button">' + ic(timer.running ? "pause" : "play", 14) + (timer.running ? "Pause" : "Démarrer") + '</button><button class="btn btn-plain btn-sm" id="t-reset" type="button" aria-label="Réinitialiser le minuteur">' + ic("reset", 14) + "</button></div></div></div>";
  $("#t-go").onclick = () => { timer.running ? stop() : start(); renderTimer(); };
  $("#t-reset").onclick = () => { stop(); timer.left = timer.total; renderTimer(); };
  $$("[data-mode]", slot).forEach((b) => (b.onclick = () => { stop(); timer.mode = b.dataset.mode; timer.total = timer.left = MODES[timer.mode]; renderTimer(); }));
}

function start() {
  if (!timer.running) baseTitle = document.title;
  timer.running = true;
  timer.id = setInterval(tick, 1000);
}

function stop() {
  timer.running = false;
  clearInterval(timer.id);
  document.title = baseTitle;
}

function tick() {
  timer.left--;
  if (timer.mode === "focus" && timer.left % 60 === 0) { app.state.focus.min = (app.state.focus.min || 0) + 1; app.save(); }
  if (timer.left <= 0) {
    stop();
    if (timer.mode === "focus") { app.log(5); toast("Session terminée. Prends 5 minutes de pause."); timer.mode = "pause"; }
    else { toast("Pause terminée. On s'y remet ?"); timer.mode = "focus"; }
    timer.total = timer.left = MODES[timer.mode];
  }
  const slot = $("#focus-slot");
  if (slot) {
    const lab = $(".ring-label .tnum", slot), val = $(".ring-val", slot);
    if (lab && val && timer.running) {
      lab.textContent = pad(Math.floor(timer.left / 60)) + ":" + pad(timer.left % 60);
      val.setAttribute("stroke-dashoffset", +val.getAttribute("stroke-dasharray") * (1 - timer.left / timer.total));
    } else renderTimer();
  }
  document.title = timer.running ? pad(Math.floor(timer.left / 60)) + ":" + pad(timer.left % 60) + " · Révisions" : baseTitle;
}
