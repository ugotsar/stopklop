import { WIDGET_APP_GROUP, WIDGET_STORAGE_KEY } from './snapshot';

let ExtensionStorage = null;
try {
  // Absent d'Expo Go : le module natif n'existe que dans un build EAS / dev client.
  ({ ExtensionStorage } = require('@bacons/apple-targets'));
} catch (_) {
  ExtensionStorage = null;
}

export function syncWidget(snapshot) {
  if (!ExtensionStorage) return;
  try {
    new ExtensionStorage(WIDGET_APP_GROUP).set(WIDGET_STORAGE_KEY, JSON.stringify(snapshot));
    ExtensionStorage.reloadWidget();
  } catch (_) {
    // Le widget ne doit jamais faire planter l'app.
  }
}
