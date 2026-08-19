import Purchases, { LOG_LEVEL } from 'react-native-purchases';
import { Platform } from 'react-native';

// TODO ship v1 : clé de test en attendant la création de l'app iOS dans
// RevenueCat (bloquée sur le compte Apple Developer — nécessite la clé P8
// depuis App Store Connect pour finaliser la config App Store).
const API_KEY_IOS     = 'test_wXtammSPguzAuLfzPmCYbOmCfJw';
const API_KEY_ANDROID = 'goog_KLhDWVJQndxRjxLZiNoohZQeARI';

export function configurePurchases(userId) {
  const apiKey = Platform.OS === 'ios' ? API_KEY_IOS : API_KEY_ANDROID;
  Purchases.setLogLevel(LOG_LEVEL.DEBUG);
  Purchases.configure({ apiKey, appUserID: userId });
}

export async function getOfferings() {
  try {
    const offerings = await Purchases.getOfferings();
    return offerings.current ?? null;
  } catch (e) {
    console.warn('[RevenueCat] getOfferings error:', e);
    return null;
  }
}

export async function purchasePackage(pkg) {
  const { customerInfo } = await Purchases.purchasePackage(pkg);
  return customerInfo;
}

export async function restorePurchases() {
  const customerInfo = await Purchases.restorePurchases();
  return customerInfo;
}

export async function getCustomerInfo() {
  try {
    return await Purchases.getCustomerInfo();
  } catch (e) {
    return null;
  }
}

export function isPro(customerInfo) {
  return customerInfo?.entitlements?.active?.['stopklop Pro'] != null;
}
