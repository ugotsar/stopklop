// ─────────────────────────────────────────────────────────────────────────────
// Mode « captures » : stockage local, séparé et parallèle au vrai profil.
//
// Le jeu de données de démonstration vit dans sa propre clé AsyncStorage. Il ne
// touche donc jamais au cache du profil réel (`@airpur_onboarding`) ni au
// cloud : entrer puis sortir du mode captures laisse les vraies données
// intactes, même si l'app est relancée entre-temps.
//
// Outil interne réservé aux captures d'écran des stores. Le bouton qui l'active
// n'existe que dans une build où le contournement du paywall est actif.
// ─────────────────────────────────────────────────────────────────────────────
import AsyncStorage from '@react-native-async-storage/async-storage';

const CAPTURE_KEY = '@stopklop_capture_profile';

function reviveDates(profile) {
  const revived = { ...profile };
  ['createdAt', 'startDate', 'dateArretSouhaitee', 'onboardingCompletedAt', 'planStartDate']
    .forEach(key => {
      if (typeof revived[key] === 'string') revived[key] = new Date(revived[key]);
    });
  return revived;
}

export async function loadCaptureProfile() {
  try {
    const raw = await AsyncStorage.getItem(CAPTURE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? reviveDates(parsed) : null;
  } catch (_) {
    return null;
  }
}

export async function saveCaptureProfile(profile) {
  try {
    await AsyncStorage.setItem(CAPTURE_KEY, JSON.stringify(profile));
    return true;
  } catch (_) {
    return false;
  }
}

export async function clearCaptureProfile() {
  try {
    await AsyncStorage.removeItem(CAPTURE_KEY);
  } catch (_) {}
}

export async function hasCaptureProfile() {
  try {
    return (await AsyncStorage.getItem(CAPTURE_KEY)) != null;
  } catch (_) {
    return false;
  }
}
