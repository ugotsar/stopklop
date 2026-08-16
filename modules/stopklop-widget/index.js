import { requireOptionalNativeModule } from 'expo';

// Module natif iOS (absent sur Android/web → null, appels ignorés).
const native = requireOptionalNativeModule('StopklopWidget');

/** Écrit l'instantané (JSON) dans l'App Group et rafraîchit le widget. */
export function setWidgetData(json) {
  if (native) native.setData(json);
}

/** Force le rafraîchissement du widget sans modifier les données. */
export function reloadWidget() {
  if (native) native.reload();
}

export const isWidgetSupported = native != null;
