import i18n from '../i18n';
import { formatCurrency } from '../utils/currency';

// Clé et App Group partagés avec le widget iOS (targets/widget/index.swift)
// et le widget Android (widgetTaskHandler.js).
export const WIDGET_STORAGE_KEY = 'stopklopWidget';
export const WIDGET_APP_GROUP = 'group.com.stopklop.app';
export const WIDGET_DEEP_LINK = 'stopklop://jaifume';

function signedMoney(amount, currency, locale) {
  const text = formatCurrency(amount, currency, locale);
  return amount > 0 ? `+${text}` : text;
}

function signedLife(minutes) {
  const sign = minutes < 0 ? '−' : '+';
  const abs = Math.abs(Math.round(minutes));
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  const hLabel = i18n.t('common:hourShort');
  const mLabel = i18n.t('common:minuteShort');
  if (h === 0) return `${sign}${m} ${mLabel}`;
  return m === 0 ? `${sign}${h} ${hLabel}` : `${sign}${h} ${hLabel} ${m}`;
}

// Instantané sérialisable : le widget n'a accès ni à Firestore ni aux calculs
// de l'app, il affiche uniquement ce qui est écrit ici.
export function buildWidgetSnapshot(stats, profile) {
  const locale = i18n.language || 'fr';
  const currency = profile?.monnaie ?? 'EUR';
  const t = (key, options) => i18n.t(`widget:${key}`, options);

  return {
    version: 1,
    dateKey: stats.todayKey,
    cigarettesToday: stats.cigarettesToday,
    objectifJour: stats.objectifJour,
    todayLogged: stats.jourRenseigne,
    savedToday: signedMoney(stats.argentEcoAujourdhui, currency, locale),
    lifeToday: signedLife(stats.vieGagneeMinAujourdhui),
    savedWeek: signedMoney(stats.argentEcoSemaine, currency, locale),
    week: stats.weekLabels.map((label, i) => ({
      label: i === stats.weekLabels.length - 1 ? t('todayShort') : label.charAt(0).toUpperCase(),
      value: stats.weekRenseignes[i] ? stats.weekData[i] : null,
      goal: stats.weekObjectifs[i],
    })),
    labels: {
      today: t('today'),
      smoked: t('smoked'),
      cigarettes: t('cigarettes'),
      saved: t('saved'),
      life: t('life'),
      thisWeek: t('thisWeek'),
      goal: t('goal', { count: stats.objectifJour }),
    },
    deepLink: WIDGET_DEEP_LINK,
  };
}

// Vert sous l'objectif, orange pile dessus, rouge au-dessus. Un objectif de 0
// tenu à 0 cigarette reste une réussite, donc vert.
export function barTone(value, goal) {
  if (value == null) return 'empty';
  if (value > goal) return 'over';
  if (value === goal && value > 0) return 'at';
  return 'under';
}

export function isSnapshotStale(snapshot, now = new Date()) {
  const key = [now.getFullYear(), String(now.getMonth() + 1).padStart(2, '0'), String(now.getDate()).padStart(2, '0')].join('-');
  return snapshot?.dateKey !== key;
}
