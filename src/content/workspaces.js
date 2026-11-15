// Espaces de travail.
//
// D3 : les cours fictifs sont des fixtures de démonstration et de test. Ils ne
// sont chargés que dans l'espace « demo », qui a son propre stockage. Le
// véritable espace académique (kind "real") arrivera avec le modèle de données
// v2 et le stockage ; il ne lira jamais les fixtures.
//
// L'espace de démonstration réutilise la clé de stockage historique (aucune
// migration). L'espace réel vit dans le dossier Drive choisi (src/storage/).

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

export const realWorkspaceAvailable = true;

/** Descripteur de l'espace réel (contenu lu dans le dossier Drive, jamais les fixtures). */
export function realWorkspace(manifest, folderName) {
  return Object.freeze({
    id: manifest.workspace.id,
    kind: "real",
    label: "Mon espace",
    description: "Ton espace académique, enregistré dans ton dossier Google Drive « " + folderName + " ».",
    folderName
  });
}

export function currentWorkspace() {
  return WORKSPACES.demo;
}
