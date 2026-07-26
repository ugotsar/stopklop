# Checklist de mise en production — Stopklop v1

État au [26/07/2026]. Coche au fur et à mesure.

## ✅ Fait (en local)
- [x] `firestore.rules` sécurisées (chaque user n'accède qu'à ses données)
- [x] `restorePurchases()` disponible + bouton « Restaurer » sur le paywall principal
- [x] Paywall d'onboarding : ajout restauration + mentions d'abonnement + liens légaux
- [x] Brouillons `legal/privacy-policy.md` et `legal/terms-of-use.md`
- [x] Brouillon fiche store `store/listing-fr.md`
- [x] `.gitignore` : logs de dev ignorés

## 🔴 Bloquants — nécessitent tes comptes / décisions
- [ ] **Clés RevenueCat de PRODUCTION** dans `src/services/purchases.js`
      (actuellement des clés `test_…`). Une clé iOS + une clé Android distinctes.
- [ ] **Wiring de l'achat sur le paywall d'onboarding** : aujourd'hui « Commencer mon essai »
      va directement à `MainTabs` **sans déclencher d'achat**. Décider :
      (a) le brancher sur `purchasePackage()`, ou (b) assumer une v1 gratuite.
- [ ] **Créer les abonnements** (mensuel 9,99 € / annuel 49,99 €) dans App Store Connect
      **et** Google Play Console, puis les lier dans RevenueCat.
- [ ] **Héberger** la politique de confidentialité + les CGU (URLs publiques) et mettre à jour
      `PRIVACY_URL` / `TERMS_URL` dans `src/screens/onboarding/PaywallScreen.js`.
- [ ] **Firebase prod** : vérifier que la config pointe sur le projet de production
      et déployer les règles (`firebase deploy --only firestore:rules`).
- [ ] `eas.json` → bloc `submit` : renseigner `appleId`, `ascAppId`, `appleTeamId`,
      et le `serviceAccountKeyPath` Google.

## 🟡 Comptes & prérequis
- [ ] Compte Apple Developer (99 $/an)
- [ ] Compte Google Play Console (25 $ une fois)
- [ ] `eas login` fonctionnel

## 🟡 Assets & fiche store
- [ ] Icône 1024×1024 propre (`assets/icon.png`)
- [ ] Captures d'écran (iPhone 6.7" + 6.5", Android téléphone)
- [ ] Renseigner App Privacy (Apple) + Data Safety (Google)
- [ ] Classification d'âge

## 🟢 Technique (rapide)
- [ ] Aligner Expo : `npx expo install expo` (54.0.35 → 54.0.36)
- [ ] Tester un **build preview** réel (Expo Go ne supporte pas RevenueCat)

## Build & envoi (quand le reste est prêt)
```bash
eas build --profile production --platform android
eas build --profile production --platform ios
eas submit -p android
eas submit -p ios
```

## Notes review
- Compte invité anonyme : aucun login requis pour tester.
- Données de démo : Accueil → « 🎬 Charger la démo (5 semaines) ».
