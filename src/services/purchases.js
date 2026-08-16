import { Platform } from 'react-native';

const API_KEY_IOS     = 'test_wXtammSPguzAuLfzPmCYbOmCfJw';
const API_KEY_ANDROID = 'test_wXtammSPguzAuLfzPmCYbOmCfJw'; // à remplacer par clé Android

// Chargement défensif : react-native-purchases est un module natif absent
// d'Expo Go et du web. On le charge de façon protégée pour ne jamais faire
// planter l'app quand il n'est pas disponible (les fonctions deviennent no-op).
let Purchases = null;
let LOG_LEVEL = null;
try {
  // eslint-disable-next-line global-require
  const mod = require('react-native-purchases');
  Purchases = mod.default ?? mod;
  LOG_LEVEL = mod.LOG_LEVEL;
} catch (_) {
  // module natif indisponible
}

export function configurePurchases(userId) {
  if (!Purchases) return;
  try {
    const apiKey = Platform.OS === 'ios' ? API_KEY_IOS : API_KEY_ANDROID;
    if (LOG_LEVEL) Purchases.setLogLevel(LOG_LEVEL.DEBUG);
    Purchases.configure({ apiKey, appUserID: userId });
  } catch (e) {
    console.warn('[RevenueCat] configuration ignorée:', e?.message);
  }
}

export async function getOfferings() {
  if (!Purchases) return null;
  try {
    const offerings = await Purchases.getOfferings();
    return offerings.current ?? null;
  } catch (e) {
    console.warn('[RevenueCat] getOfferings error:', e?.message);
    return null;
  }
}

export async function purchasePackage(pkg) {
  if (!Purchases) return null;
  const { customerInfo } = await Purchases.purchasePackage(pkg);
  return customerInfo;
}

export async function restorePurchases() {
  if (!Purchases) return null;
  const customerInfo = await Purchases.restorePurchases();
  return customerInfo;
}

export async function getCustomerInfo() {
  if (!Purchases) return null;
  try {
    return await Purchases.getCustomerInfo();
  } catch (e) {
    return null;
  }
}

export function isPro(customerInfo) {
  return customerInfo?.entitlements?.active?.['stopklop Pro'] != null;
}
