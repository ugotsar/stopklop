import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ── Namespaces (un fichier par écran/domaine, pour éviter les conflits) ──────
const NAMESPACES = [
  'common', 'profil', 'userStats',
  'onboardingFlow', 'onboardingLegacy', 'paywallOnboarding',
  'dashboard', 'statistiques', 'plan', 'modifierObjectif',
  'jaifume', 'journalEnvies', 'notifications',
  'personnaliserHoraires', 'uniteMonnaie', 'paywall',
  'nousContacter', 'centreAide', 'authMain', 'mainTabNav',
];

// ── Imports statiques (Metro ne supporte pas les require() dynamiques) ───────
import fr_common from './locales/fr/common.json';
import fr_profil from './locales/fr/profil.json';
import fr_userStats from './locales/fr/userStats.json';
import fr_onboardingFlow from './locales/fr/onboardingFlow.json';
import fr_onboardingLegacy from './locales/fr/onboardingLegacy.json';
import fr_paywallOnboarding from './locales/fr/paywallOnboarding.json';
import fr_dashboard from './locales/fr/dashboard.json';
import fr_statistiques from './locales/fr/statistiques.json';
import fr_plan from './locales/fr/plan.json';
import fr_modifierObjectif from './locales/fr/modifierObjectif.json';
import fr_jaifume from './locales/fr/jaifume.json';
import fr_journalEnvies from './locales/fr/journalEnvies.json';
import fr_notifications from './locales/fr/notifications.json';
import fr_personnaliserHoraires from './locales/fr/personnaliserHoraires.json';
import fr_uniteMonnaie from './locales/fr/uniteMonnaie.json';
import fr_paywall from './locales/fr/paywall.json';
import fr_nousContacter from './locales/fr/nousContacter.json';
import fr_centreAide from './locales/fr/centreAide.json';
import fr_authMain from './locales/fr/authMain.json';
import fr_mainTabNav from './locales/fr/mainTabNav.json';

import en_common from './locales/en/common.json';
import en_profil from './locales/en/profil.json';
import en_userStats from './locales/en/userStats.json';
import en_onboardingFlow from './locales/en/onboardingFlow.json';
import en_onboardingLegacy from './locales/en/onboardingLegacy.json';
import en_paywallOnboarding from './locales/en/paywallOnboarding.json';
import en_dashboard from './locales/en/dashboard.json';
import en_statistiques from './locales/en/statistiques.json';
import en_plan from './locales/en/plan.json';
import en_modifierObjectif from './locales/en/modifierObjectif.json';
import en_jaifume from './locales/en/jaifume.json';
import en_journalEnvies from './locales/en/journalEnvies.json';
import en_notifications from './locales/en/notifications.json';
import en_personnaliserHoraires from './locales/en/personnaliserHoraires.json';
import en_uniteMonnaie from './locales/en/uniteMonnaie.json';
import en_paywall from './locales/en/paywall.json';
import en_nousContacter from './locales/en/nousContacter.json';
import en_centreAide from './locales/en/centreAide.json';
import en_authMain from './locales/en/authMain.json';
import en_mainTabNav from './locales/en/mainTabNav.json';

import de_common from './locales/de/common.json';
import de_profil from './locales/de/profil.json';
import de_userStats from './locales/de/userStats.json';
import de_onboardingFlow from './locales/de/onboardingFlow.json';
import de_onboardingLegacy from './locales/de/onboardingLegacy.json';
import de_paywallOnboarding from './locales/de/paywallOnboarding.json';
import de_dashboard from './locales/de/dashboard.json';
import de_statistiques from './locales/de/statistiques.json';
import de_plan from './locales/de/plan.json';
import de_modifierObjectif from './locales/de/modifierObjectif.json';
import de_jaifume from './locales/de/jaifume.json';
import de_journalEnvies from './locales/de/journalEnvies.json';
import de_notifications from './locales/de/notifications.json';
import de_personnaliserHoraires from './locales/de/personnaliserHoraires.json';
import de_uniteMonnaie from './locales/de/uniteMonnaie.json';
import de_paywall from './locales/de/paywall.json';
import de_nousContacter from './locales/de/nousContacter.json';
import de_centreAide from './locales/de/centreAide.json';
import de_authMain from './locales/de/authMain.json';
import de_mainTabNav from './locales/de/mainTabNav.json';

import es_common from './locales/es/common.json';
import es_profil from './locales/es/profil.json';
import es_userStats from './locales/es/userStats.json';
import es_onboardingFlow from './locales/es/onboardingFlow.json';
import es_onboardingLegacy from './locales/es/onboardingLegacy.json';
import es_paywallOnboarding from './locales/es/paywallOnboarding.json';
import es_dashboard from './locales/es/dashboard.json';
import es_statistiques from './locales/es/statistiques.json';
import es_plan from './locales/es/plan.json';
import es_modifierObjectif from './locales/es/modifierObjectif.json';
import es_jaifume from './locales/es/jaifume.json';
import es_journalEnvies from './locales/es/journalEnvies.json';
import es_notifications from './locales/es/notifications.json';
import es_personnaliserHoraires from './locales/es/personnaliserHoraires.json';
import es_uniteMonnaie from './locales/es/uniteMonnaie.json';
import es_paywall from './locales/es/paywall.json';
import es_nousContacter from './locales/es/nousContacter.json';
import es_centreAide from './locales/es/centreAide.json';
import es_authMain from './locales/es/authMain.json';
import es_mainTabNav from './locales/es/mainTabNav.json';

export const resources = {
  fr: {
    common: fr_common, profil: fr_profil, userStats: fr_userStats,
    onboardingFlow: fr_onboardingFlow, onboardingLegacy: fr_onboardingLegacy, paywallOnboarding: fr_paywallOnboarding,
    dashboard: fr_dashboard, statistiques: fr_statistiques, plan: fr_plan, modifierObjectif: fr_modifierObjectif,
    jaifume: fr_jaifume, journalEnvies: fr_journalEnvies, notifications: fr_notifications,
    personnaliserHoraires: fr_personnaliserHoraires, uniteMonnaie: fr_uniteMonnaie, paywall: fr_paywall,
    nousContacter: fr_nousContacter, centreAide: fr_centreAide, authMain: fr_authMain, mainTabNav: fr_mainTabNav,
  },
  en: {
    common: en_common, profil: en_profil, userStats: en_userStats,
    onboardingFlow: en_onboardingFlow, onboardingLegacy: en_onboardingLegacy, paywallOnboarding: en_paywallOnboarding,
    dashboard: en_dashboard, statistiques: en_statistiques, plan: en_plan, modifierObjectif: en_modifierObjectif,
    jaifume: en_jaifume, journalEnvies: en_journalEnvies, notifications: en_notifications,
    personnaliserHoraires: en_personnaliserHoraires, uniteMonnaie: en_uniteMonnaie, paywall: en_paywall,
    nousContacter: en_nousContacter, centreAide: en_centreAide, authMain: en_authMain, mainTabNav: en_mainTabNav,
  },
  de: {
    common: de_common, profil: de_profil, userStats: de_userStats,
    onboardingFlow: de_onboardingFlow, onboardingLegacy: de_onboardingLegacy, paywallOnboarding: de_paywallOnboarding,
    dashboard: de_dashboard, statistiques: de_statistiques, plan: de_plan, modifierObjectif: de_modifierObjectif,
    jaifume: de_jaifume, journalEnvies: de_journalEnvies, notifications: de_notifications,
    personnaliserHoraires: de_personnaliserHoraires, uniteMonnaie: de_uniteMonnaie, paywall: de_paywall,
    nousContacter: de_nousContacter, centreAide: de_centreAide, authMain: de_authMain, mainTabNav: de_mainTabNav,
  },
  es: {
    common: es_common, profil: es_profil, userStats: es_userStats,
    onboardingFlow: es_onboardingFlow, onboardingLegacy: es_onboardingLegacy, paywallOnboarding: es_paywallOnboarding,
    dashboard: es_dashboard, statistiques: es_statistiques, plan: es_plan, modifierObjectif: es_modifierObjectif,
    jaifume: es_jaifume, journalEnvies: es_journalEnvies, notifications: es_notifications,
    personnaliserHoraires: es_personnaliserHoraires, uniteMonnaie: es_uniteMonnaie, paywall: es_paywall,
    nousContacter: es_nousContacter, centreAide: es_centreAide, authMain: es_authMain, mainTabNav: es_mainTabNav,
  },
};

export const SUPPORTED_LANGUAGES = [
  { code: 'fr', label: 'Français',  flag: '🇫🇷' },
  { code: 'en', label: 'English',   flag: '🇬🇧' },
  { code: 'de', label: 'Deutsch',   flag: '🇩🇪' },
  { code: 'es', label: 'Español',   flag: '🇪🇸' },
];

const LANGUAGE_STORAGE_KEY = '@stopklop_language';

async function detectLanguage() {
  try {
    const saved = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (saved && resources[saved]) return saved;
  } catch (_) {}
  try {
    const deviceLang = Localization.getLocales?.()[0]?.languageCode;
    if (deviceLang && resources[deviceLang]) return deviceLang;
  } catch (_) {}
  return 'fr';
}

let initPromise = null;

export function initI18n() {
  if (initPromise) return initPromise;
  initPromise = (async () => {
    const lng = await detectLanguage();
    await i18next.use(initReactI18next).init({
      resources,
      lng,
      fallbackLng: 'fr',
      ns: NAMESPACES,
      defaultNS: 'common',
      interpolation: { escapeValue: false },
      returnEmptyString: false,
    });
    return i18next;
  })();
  return initPromise;
}

export async function changeLanguage(code) {
  if (!resources[code]) return;
  await i18next.changeLanguage(code);
  try { await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, code); } catch (_) {}
}

export function getCurrentLanguage() {
  return i18next.language || 'fr';
}

export default i18next;
