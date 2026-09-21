import { WIDGET_APP_GROUP, WIDGET_STORAGE_KEY } from './snapshot';

let ExtensionStorage = null;
try {
  // Absent d'Expo Go : le module natif n'existe que dans un build EAS / dev client.
  ({ ExtensionStorage } = require('@bacons/apple-targets'));
} catch (_) {
  ExtensionStorage = null;
}

// ⚠️ La classe JS existe toujours : quand le module natif n'est pas lié, elle
// appelle des fonctions vides et l'écriture échoue en silence. On teste donc
// la présence du module natif lui-même.
const natifPresent = () => Boolean(globalThis?.expo?.modules?.ExtensionStorage);

// Dernier résultat d'écriture, affiché dans les outils de test de l'accueil
// pour diagnostiquer un widget qui reste vide. À retirer avant la sortie.
let dernierStatut = natifPresent() ? 'en attente' : 'module natif absent';
export function widgetDebugStatus() {
  return dernierStatut;
}

export function syncWidget(snapshot) {
  if (!ExtensionStorage) { dernierStatut = 'module JS absent'; return; }
  if (!natifPresent()) { dernierStatut = 'module natif absent'; return; }
  try {
    const store = new ExtensionStorage(WIDGET_APP_GROUP);
    const json = JSON.stringify(snapshot);
    store.set(WIDGET_STORAGE_KEY, json);
    ExtensionStorage.reloadWidget();
    // Relecture immédiate : confirme que l'App Group est bien partagé.
    const relu = store.get(WIDGET_STORAGE_KEY);
    const heure = new Date().toLocaleTimeString();
    dernierStatut = typeof relu === 'string' && relu.length > 0
      ? `écrit et relu (${json.length} car.) à ${heure}`
      : `écrit mais relecture vide à ${heure}`;
  } catch (error) {
    dernierStatut = `erreur : ${error?.message ?? error}`;
    // Le widget ne doit jamais faire planter l'app.
  }
}

// Déconnexion / suppression du compte : le widget ne garde aucun chiffre.
export function clearWidget() {
  if (!ExtensionStorage || !natifPresent()) return;
  try {
    new ExtensionStorage(WIDGET_APP_GROUP).remove(WIDGET_STORAGE_KEY);
    ExtensionStorage.reloadWidget();
    dernierStatut = 'effacé';
  } catch (_) {
    // Le widget ne doit jamais faire planter l'app.
  }
}
