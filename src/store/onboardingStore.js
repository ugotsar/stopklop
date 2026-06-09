import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@airpur_onboarding';

export const defaultProfile = {
  // UserProfile
  prenom: '',
  email: '',
  createdAt: null,
  startDate: null,

  // SmokingProfile
  consoAvantApp: 10,          // étape 1
  prixPaquet: 10,             // étape 2
  cigarettesParPaquet: 20,    // étape 3
  ancienneteTabac: '',        // étape 4
  dateArretSouhaitee: null,   // étape 5
  motivations: [],            // étape 6
  niveauMotivation: 5,        // étape 7

  // Calculé
  get prixCigarette() {
    return this.cigarettesParPaquet > 0
      ? this.prixPaquet / this.cigarettesParPaquet
      : 0;
  },

  monnaie: 'EUR',
  onboardingComplete: false,
};

export async function saveProfile(profile) {
  try {
    const toSave = { ...profile, createdAt: profile.createdAt?.toISOString(), startDate: profile.startDate?.toISOString(), dateArretSouhaitee: profile.dateArretSouhaitee?.toISOString() };
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  } catch (e) {
    console.error('saveProfile error', e);
  }
}

export async function loadProfile() {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw);
    if (p.createdAt) p.createdAt = new Date(p.createdAt);
    if (p.startDate) p.startDate = new Date(p.startDate);
    if (p.dateArretSouhaitee) p.dateArretSouhaitee = new Date(p.dateArretSouhaitee);
    return p;
  } catch (e) {
    return null;
  }
}

export async function clearProfile() {
  await AsyncStorage.removeItem(STORAGE_KEY);
}
