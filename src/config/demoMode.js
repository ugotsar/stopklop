// ─────────────────────────────────────────────────────────────────────────────
// Mode démo : désactivé par défaut (aucun impact sur l'app réelle). Activé
// uniquement via EXPO_PUBLIC_DEMO_MODE=true dans le projet démo dédié
// (copie de ce repo destinée à être partagée telle quelle via Expo Go, sans
// connexion ni onboarding — un profil type réaliste est chargé directement).
// ─────────────────────────────────────────────────────────────────────────────
export const IS_DEMO_BUILD = process.env.EXPO_PUBLIC_DEMO_MODE === 'true';
