import Purchases, { LOG_LEVEL } from 'react-native-purchases';
import { Platform } from 'react-native';

// Les clés SDK RevenueCat sont publiques par nature (elles sont embarquées dans
// l'application native), mais elles ne doivent pas être figées dans le dépôt —
// et surtout jamais être des clés de test en production. Elles sont fournies à
// Expo/EAS sous forme de variables EXPO_PUBLIC_REVENUECAT_*.
export const STOPKLOP_PRO_ENTITLEMENT = 'stopklop Pro';

let configuredUserId = null;

function apiKeyForCurrentPlatform() {
  if (Platform.OS === 'ios') return process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY?.trim() ?? '';
  if (Platform.OS === 'android') return process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY?.trim() ?? '';
  return '';
}

// Autorise l'accès sans achat uniquement pour Expo Go / développement ou une
// build Preview explicitement marquée. Cette variable doit rester absente ou
// false dans le profil EAS de production.
export function isPaywallBypassEnabled() {
  return (typeof __DEV__ !== 'undefined' && __DEV__)
    || process.env.EXPO_PUBLIC_ALLOW_PAYWALL_BYPASS === 'true';
}

function unavailableStatus(code, error = null) {
  return {
    available: false,
    isPro: false,
    customerInfo: null,
    errorCode: code,
    error,
  };
}

export function isPro(customerInfo) {
  return customerInfo?.entitlements?.active?.[STOPKLOP_PRO_ENTITLEMENT] != null;
}

// Configure RevenueCat une seule fois, puis associe explicitement chaque
// identité Firebase à l'identité RevenueCat correspondante.
export async function configurePurchases(userId) {
  if (Platform.OS === 'web') return unavailableStatus('web-not-supported');
  if (!userId) return unavailableStatus('missing-user-id');

  const apiKey = apiKeyForCurrentPlatform();
  if (!apiKey) return unavailableStatus('missing-api-key');

  try {
    // Les journaux détaillés ne doivent pas être exposés dans une build store.
    Purchases.setLogLevel(__DEV__ ? LOG_LEVEL.WARN : LOG_LEVEL.ERROR);

    const alreadyConfigured = await Purchases.isConfigured();
    let customerInfo;

    if (!alreadyConfigured) {
      Purchases.configure({ apiKey, appUserID: userId });
      configuredUserId = userId;
      customerInfo = await Purchases.getCustomerInfo();
    } else if (configuredUserId !== userId) {
      const result = await Purchases.logIn(userId);
      configuredUserId = userId;
      customerInfo = result.customerInfo;
    } else {
      customerInfo = await Purchases.getCustomerInfo();
    }

    return { available: true, isPro: isPro(customerInfo), customerInfo, errorCode: null, error: null };
  } catch (error) {
    return unavailableStatus('configuration-failed', error);
  }
}

export async function getSubscriptionStatus() {
  if (Platform.OS === 'web') return unavailableStatus('web-not-supported');
  try {
    if (!(await Purchases.isConfigured())) return unavailableStatus('not-configured');
    const customerInfo = await Purchases.getCustomerInfo();
    return { available: true, isPro: isPro(customerInfo), customerInfo, errorCode: null, error: null };
  } catch (error) {
    return unavailableStatus('customer-info-failed', error);
  }
}

export async function getOfferings() {
  if (!(await Purchases.isConfigured())) throw new Error('purchases-not-configured');
  const offerings = await Purchases.getOfferings();
  return offerings.current ?? null;
}

export async function purchasePackage(pkg) {
  if (!(await Purchases.isConfigured())) throw new Error('purchases-not-configured');
  const { customerInfo } = await Purchases.purchasePackage(pkg);
  return customerInfo;
}

export async function restorePurchases() {
  if (!(await Purchases.isConfigured())) throw new Error('purchases-not-configured');
  return Purchases.restorePurchases();
}

export async function logoutPurchases() {
  if (Platform.OS === 'web') return;
  try {
    if (await Purchases.isConfigured()) await Purchases.logOut();
  } finally {
    configuredUserId = null;
  }
}
