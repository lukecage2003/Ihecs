// Espaces de travail.
//
// D3 : les cours fictifs sont des fixtures de démonstration et de test. Ils ne
// sont chargés que dans l'espace « demo », qui a son propre stockage. Le
// véritable espace académique (kind "real") arrivera avec le modèle de données
// v2 et le stockage ; il ne lira jamais les fixtures.
//
// Pour l'instant, seul l'espace de démonstration existe. Il réutilise la clé
// de stockage historique pour ne perdre aucune progression existante (aucune
// migration en phase 1).

import DEMO_COURSES from "../../fixtures/demo/cours.js";
import { STORAGE_KEY } from "../state/store.js";

export const WORKSPACES = Object.freeze({
  demo: Object.freeze({
    id: "demo",
    kind: "demo",
    label: "Démonstration",
    description: "Cours fictifs pour découvrir et tester l'application.",
    content: DEMO_COURSES,
    storageKey: STORAGE_KEY
  })
});

export const realWorkspaceAvailable = false;

export function currentWorkspace() {
  return WORKSPACES.demo;
}
