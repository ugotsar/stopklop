// Le SDK RevenueCat ne réalise pas d'achat web dans Stopklop. Ces stubs évitent
// qu'une prévisualisation navigateur simule ou contourne un abonnement natif.
export const STOPKLOP_PRO_ENTITLEMENT = 'stopklop Pro';
export const isPro = () => false;
export const isPaywallBypassEnabled = () => (typeof __DEV__ !== 'undefined' && __DEV__)
  || process.env.EXPO_PUBLIC_ALLOW_PAYWALL_BYPASS === 'true';
export const configurePurchases = async () => ({
  available: false, isPro: false, customerInfo: null, errorCode: 'web-not-supported', error: null,
});
export const getSubscriptionStatus = configurePurchases;
export const getOfferings = async () => { throw new Error('purchases-web-not-supported'); };
export const purchasePackage = async () => { throw new Error('purchases-web-not-supported'); };
export const restorePurchases = async () => { throw new Error('purchases-web-not-supported'); };
export const logoutPurchases = async () => {};
