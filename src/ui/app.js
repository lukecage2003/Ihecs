// Contexte partagé de l'interface : contenu, état, stockage et actions communes.

import { today } from "../core/dates.js";
import { addActivity } from "../domain/activity.js";
import { saveState } from "../state/store.js";

export const app = {
  workspace: null,
  /** Contenu de l'espace courant ({ matieres, session, ... }). */
  content: { matieres: [] },
  /** État de progression (format v1). */
  state: null,
  storage: null,
  /** Gestionnaire clavier de la vue courante (fiches ou quiz). */
  keyHandler: null,
  route: null,
  render: () => {},
  refreshChrome: () => {},
  now: () => new Date(),
  today() { return today(this.now()); },
  get M() { return this.content.matieres || []; },
  /** Enregistre l'état selon l'espace actif (localStorage pour la démo, dossier Drive pour l'espace réel). */
  persist: null,
  /** Espace réel ouvert : { root, manifest, deviceId, folderName }, sinon null. */
  real: null,
  /** Dossier mémorisé qui attend l'accord de Chrome : { root }, sinon null. */
  gate: null,
  /** Enregistre une révision dans le journal (espace réel uniquement). */
  recordReview: null,
  save() { return this.persist ? this.persist(this.state) : saveState(this.storage, this.state); },
  log(n = 1) { this.state.journal = addActivity(this.state.journal || {}, this.now(), n); this.save(); }
};

/** Accès protégé à localStorage (peut être bloqué : navigation privée, réglages). */
export function safeStorage() {
  try { const s = window.localStorage; s.getItem("__probe__"); return s; } catch (e) { return null; }
}
