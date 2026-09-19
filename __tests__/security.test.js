// Isolement des données : chaque client ne voit que ses propres données,
// sur le téléphone comme dans le cloud.
import fs from 'fs';
import path from 'path';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { saveProfile, loadProfile, clearProfile, setProfileOwner, DRAFT_KEY } from '../src/store/onboardingStore';
import { buildWidgetSnapshot } from '../src/widget/snapshot';
import { computeStats } from '../src/utils/stats';
import { applyDailyConsumption } from '../src/utils/dailyConsumption';
import { initI18n } from '../src/i18n';

const read = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');

beforeEach(async () => {
  await AsyncStorage.clear();
  setProfileOwner(null);
});

describe('Cache local du téléphone', () => {
  test('le profil laissé par le compte A n’est jamais rechargé pour le compte B', async () => {
    setProfileOwner('uid-A');
    await saveProfile({ consoAvantApp: 12, motivationPerso: 'secret de A' });

    setProfileOwner('uid-B');
    expect(await loadProfile()).toBeNull();

    setProfileOwner('uid-A');
    const mine = await loadProfile();
    expect(mine.consoAvantApp).toBe(12);
    expect(mine._owner).toBeUndefined();          // jamais renvoyé vers Firestore
  });

  test('déconnexion : profil et brouillon d’onboarding sont effacés', async () => {
    setProfileOwner('uid-A');
    await saveProfile({ consoAvantApp: 12 });
    await AsyncStorage.setItem(DRAFT_KEY, JSON.stringify({ answers: { consoDeclaree: 12 } }));

    await clearProfile();

    expect(await loadProfile()).toBeNull();
    expect(await AsyncStorage.getItem(DRAFT_KEY)).toBeNull();
  });
});

describe('Règles Firestore', () => {
  const rules = read('firestore.rules');
  const allowLines = rules.split('\n').map(l => l.trim()).filter(l => l.startsWith('allow '));

  test('toute autorisation sur les données client exige d’être le propriétaire', () => {
    const userAllows = allowLines.filter(l => !l.endsWith('if false;'));
    expect(userAllows.length).toBeGreaterThan(0);
    userAllows.forEach(line => expect(line).toContain('owns(userId)'));
  });

  test('« propriétaire » = connecté ET même identifiant que le document', () => {
    expect(rules).toMatch(/request\.auth != null && request\.auth\.uid == userId/);
  });

  test('tout le reste de la base est interdit', () => {
    expect(rules).toMatch(/match \/\{document=\*\*\}\s*\{\s*allow read, write: if false;/);
    expect(rules).not.toMatch(/if true/);
  });

  test('aucun historique volumineux n’est stocké dans le profil', () => {
    ['historique', 'cigLog', 'envies'].forEach(field => {
      expect(rules).toContain(`!('${field}' in request.resource.data)`);
    });
  });
});

describe('Ce qui sort du téléphone', () => {
  test('le widget ne contient que des chiffres, jamais les notes ou motivations', async () => {
    await initI18n();
    const profile = applyDailyConsumption(
      { consoAvantApp: 12, prixPaquet: 12.5, cigarettesParPaquet: 20, objectifCigarettes: 8,
        motivationPerso: 'Pour mes enfants', envies: [{ trigger: 'stress', note: 'dispute avec maman' }] },
      { cigarettes: 3 },
    ).profile;
    const json = JSON.stringify(buildWidgetSnapshot(computeStats(profile), profile));
    expect(json).not.toContain('enfants');
    expect(json).not.toContain('maman');
    expect(json).not.toContain('stress');
  });

  test('RevenueCat ne reçoit que l’identifiant technique du compte', () => {
    const purchases = read('src/services/purchases.js');
    expect(purchases).not.toMatch(/setAttributes|setEmail|setDisplayName|setPhoneNumber/);
  });

  test('aucun outil d’analyse ou de suivi n’est intégré', () => {
    const pkg = JSON.parse(read('package.json'));
    const deps = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies }).join(' ');
    expect(deps).not.toMatch(/analytics|sentry|crashlytics|amplitude|mixpanel|segment|facebook/i);
  });
});
