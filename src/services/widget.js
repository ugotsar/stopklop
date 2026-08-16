import { Platform } from 'react-native';

// Le module natif n'existe que sur iOS (build EAS avec le widget-target).
// require protégé : sur Android/web/Expo Go, on ne fait rien.
let setWidgetData = () => {};
if (Platform.OS === 'ios') {
  try {
    // eslint-disable-next-line global-require
    ({ setWidgetData } = require('../../modules/stopklop-widget'));
  } catch (_) {
    // module non linké (Expo Go) → no-op
  }
}

const SYMBOLES = { EUR: '€', USD: '$', GBP: '£', CHF: 'CHF', CAD: 'C$', AUD: 'A$' };

function symbole(monnaie) {
  return SYMBOLES[monnaie] || monnaie || '€';
}

function cap(s) {
  return typeof s === 'string' && s.length ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

/**
 * Construit l'instantané des données de l'utilisateur et l'envoie au widget.
 * À appeler dès que le profil / les stats changent.
 */
export function syncWidget(stats, profile) {
  if (Platform.OS !== 'ios' || !stats) return;

  const labels = stats.weekLabels || [];
  const values = stats.weekData || [];
  const week = labels.map((label, i) => ({
    label: cap(label),
    value: Math.max(0, Math.round(values[i] ?? 0)),
  }));

  const payload = {
    savingsTotal: Math.round((stats.argentEcoCumul ?? 0) * 100) / 100,
    currency: symbole(profile?.monnaie),
    cigsToday: Math.max(0, Math.round(stats.cigarettesToday ?? 0)),
    objectifJour: Math.max(0, Math.round(stats.objectifJour ?? 0)),
    week,
    updatedAt: Date.now(),
  };

  try {
    setWidgetData(JSON.stringify(payload));
  } catch (_) {
    // ne jamais faire planter l'app pour le widget
  }
}
