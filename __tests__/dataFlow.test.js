// Batterie de tests du parcours des données : ce que l'utilisateur saisit
// (onboarding, « J'ai fumé », « Valider ma journée ») doit arriver intact dans
// le profil, les statistiques de chaque écran et le widget.
import i18n, { initI18n } from '../src/i18n';
import { buildOnboardingProfile, normalizeConsumption, parsePackPrice } from '../src/screens/onboarding/onboardingProfile';
import { applyDailyConsumption, buildDayEntries, validateDayPayload } from '../src/utils/dailyConsumption';
import { computeStats } from '../src/utils/stats';
import { localDateKey, addLocalDays } from '../src/utils/dateKeys';
import { buildWidgetSnapshot, barTone, isSnapshotStale } from '../src/widget/snapshot';

const TODAY = new Date('2026-09-19T12:00:00');
const TODAY_KEY = '2026-09-19';

const ANSWERS = {
  identification: [true, false, true],
  typeObjectif: 'reduce',
  consoDeclaree: 12,
  consoUnite: 'jour',
  cigarettesParPaquet: 20,
  prixPaquet: '12,50',
  dateDebut: TODAY_KEY,
  objectifQuotidien: 8,
  monnaie: 'EUR',
  motivations: ['health'],
  motivationPerso: '  Pour mes enfants  ',
  niveauMotivation: 7,
};

const onboard = (overrides = {}) => buildOnboardingProfile({ ...ANSWERS, ...overrides }, null, TODAY);

// Reproduit l'écran « J'ai fumé » : total saisi + heures des cigarettes.
function smoke(profile, count, { dateKey = TODAY_KEY, addedTimes = [] } = {}) {
  const entries = buildDayEntries({ cigLog: profile.cigLog, addedTimes, count, todayKey: dateKey, nowIso: () => `${dateKey}T10:00:00.000Z` });
  return applyDailyConsumption(profile, { dateKey, cigarettes: count, entries }, { todayKey: localDateKey(), now: 1 }).profile;
}

// Reproduit le bouton « Valider ma journée » de l'accueil.
function validateDay(profile) {
  const payload = validateDayPayload(computeStats(profile).jourRenseigne, localDateKey());
  return payload ? applyDailyConsumption(profile, payload, { todayKey: localDateKey(), now: 1 }).profile : profile;
}

const plainNumber = text => text.replace(/[  ]/g, ' ');

beforeAll(async () => {
  await initI18n();
  await i18n.changeLanguage('fr');
});

beforeEach(() => {
  jest.useFakeTimers({ now: TODAY, doNotFake: ['nextTick', 'setImmediate'] });
});

afterEach(() => {
  jest.useRealTimers();
});

describe('Onboarding → profil', () => {
  test('12 cigarettes par jour, paquet de 20 à 12,50 € : tout est repris tel quel', () => {
    const p = onboard();
    expect(p.consoAvantApp).toBe(12);
    expect(p.consoAvantDeclaree).toBe(true);
    expect(p.cigarettesParPaquet).toBe(20);
    expect(p.prixPaquet).toBe(12.5);
    expect(p.monnaie).toBe('EUR');
    expect(p.objectifCigarettes).toBe(8);
    expect(p.typeObjectif).toBe('reduce');
    expect(p.reductionParSemaine).toBe(2);
    expect(p.planStartDate).toBe(new Date(`${TODAY_KEY}T00:00:00`).toISOString());
    expect(p.motivationPerso).toBe('Pour mes enfants');
    expect(p.onboardingComplete).toBe(true);
  });

  test('une consommation par semaine est ramenée à une moyenne par jour', () => {
    expect(onboard({ consoDeclaree: 70, consoUnite: 'semaine' }).consoAvantApp).toBe(10);
    expect(normalizeConsumption(20, 'semaine')).toBe(2.9);
  });

  test('le prix du paquet accepte la virgule comme le point', () => {
    expect(parsePackPrice('12,50')).toBe(12.5);
    expect(parsePackPrice('12.50')).toBe(12.5);
    expect(onboard({ prixPaquet: '7' }).prixPaquet).toBe(7);
  });

  test('« Arrêter complètement » donne un objectif de 0 sans plan de réduction', () => {
    const p = onboard({ typeObjectif: 'stop' });
    expect(p.objectifCigarettes).toBe(0);
    expect(p.reductionParSemaine).toBeNull();
    expect(p.planStartDate).toBeNull();
  });

  test('le profil respecte les règles Firestore (types et bornes)', () => {
    const p = onboard();
    expect(Number.isInteger(p.objectifCigarettes)).toBe(true);
    expect(Number.isInteger(p.cigarettesParPaquet)).toBe(true);
    expect(p.prixPaquet).toBeGreaterThanOrEqual(0);
    expect(p.prixPaquet).toBeLessThanOrEqual(1000);
    expect(Object.keys(p).length).toBeLessThanOrEqual(60);
  });
});

describe('Profil → statistiques, avant toute saisie', () => {
  test('les stats partent des réponses de l’onboarding', () => {
    const s = computeStats(onboard());
    expect(s.consoAvant).toBe(12);
    expect(s.consoEstimee).toBe(false);
    expect(s.prixCig).toBeCloseTo(0.625);
    expect(s.objectifJour).toBe(8);
  });

  test('aucune journée saisie : rien n’est compté comme économisé', () => {
    const s = computeStats(onboard());
    expect(s.jourRenseigne).toBe(false);
    expect(s.cigarettesToday).toBe(0);
    expect(s.nbJoursEnregistres).toBe(0);
    expect(s.argentEcoCumul).toBe(0);
    expect(s.argentEcoSemaine).toBe(0);
    expect(s.weekRenseignes.every(v => v === false)).toBe(true);
  });

  test('une conso déclarée en semaine se retrouve en référence quotidienne', () => {
    expect(computeStats(onboard({ consoDeclaree: 70, consoUnite: 'semaine' })).consoAvant).toBe(10);
  });

  test('un compte ancien garde sa consommation : elle n’est pas dite estimée', () => {
    // Profil d'avant le marqueur consoAvantDeclaree : la valeur saisie existe.
    const ancien = { ...onboard() };
    delete ancien.consoAvantDeclaree;
    delete ancien.consoDeclaree;
    ancien.consoAvantApp = 15;
    const s = computeStats(ancien);
    expect(s.consoAvant).toBe(15);
    expect(s.consoEstimee).toBe(false);
  });

  test('sans aucune consommation saisie, la référence est annoncée comme estimée', () => {
    const sansRien = { ...onboard() };
    delete sansRien.consoAvantDeclaree;
    delete sansRien.consoDeclaree;
    delete sansRien.consoAvantApp;
    sansRien.onboardingComplete = false;
    const s = computeStats(sansRien);
    expect(s.consoEstimee).toBe(true);
  });
});

describe('« J’ai fumé » : saisie de 6 cigarettes', () => {
  const addedTimes = ['08:10', '10:30', '12:45', '15:00', '18:20', '21:05'].map(h => `${TODAY_KEY}T${h}:00.000Z`);
  let profile;
  beforeEach(() => { profile = smoke(onboard(), 6, { addedTimes }); });

  test('le profil enregistre le total du jour et les heures', () => {
    expect(profile.historique[TODAY_KEY]).toBe(6);
    expect(profile.cigarettesToday).toBe(6);
    expect(profile.lastSavedDate).toBe(TODAY_KEY);
    expect(profile.cigLog).toHaveLength(6);
  });

  test('accueil et statistiques reflètent les 6 cigarettes', () => {
    const s = computeStats(profile);
    expect(s.cigarettesToday).toBe(6);
    expect(s.jourRenseigne).toBe(true);
    expect(s.cigEviteesAujourdhu).toBe(6);            // 12 avant l'app − 6
    expect(s.argentEcoAujourdhui).toBeCloseTo(3.75);  // 6 × 0,625 €
    expect(s.vieGagneeMinAujourdhui).toBe(30);        // 6 × 5 min
    expect(s.isDepasse).toBe(false);                  // 6 ≤ objectif 8
    expect(s.ecartPlanJour).toBe(-2);
    expect(s.weekData[6]).toBe(6);
    expect(s.argentEcoSemaine).toBeCloseTo(3.75);
    expect(s.argentEcoCumul).toBeCloseTo(3.75);
    expect(s.nbJoursEnregistres).toBe(1);
    expect(s.serie).toBe(1);
  });

  test('le widget affiche les mêmes chiffres', () => {
    const w = buildWidgetSnapshot(computeStats(profile), profile);
    expect(w.dateKey).toBe(TODAY_KEY);
    expect(w.cigarettesToday).toBe(6);
    expect(w.objectifJour).toBe(8);
    expect(w.todayLogged).toBe(true);
    expect(plainNumber(w.savedToday)).toBe('+3,75 €');
    expect(w.lifeToday).toBe('+30 min');
    expect(w.week[6]).toEqual({ label: 'Auj.', value: 6, goal: 8 });
    expect(barTone(6, 8)).toBe('under');
  });

  test('rouvrir « J’ai fumé » repart du total déjà saisi', () => {
    // L'écran initialise son compteur ainsi (JaiFumeScreen)
    const initial = profile.lastSavedDate === localDateKey() ? profile.cigarettesToday : 0;
    expect(initial).toBe(6);
  });

  test('corriger à la baisse (6 → 4) remplace le total et garde 4 heures', () => {
    const corrected = smoke(profile, 4);
    expect(corrected.historique[TODAY_KEY]).toBe(4);
    expect(corrected.cigLog).toHaveLength(4);
    expect(computeStats(corrected).argentEcoAujourdhui).toBeCloseTo(5);   // 8 × 0,625 €
  });

  test('en ajouter 2 de plus (6 → 8) additionne les heures de la session', () => {
    const more = smoke(profile, 8, { addedTimes: [`${TODAY_KEY}T22:00:00.000Z`, `${TODAY_KEY}T23:00:00.000Z`] });
    expect(more.historique[TODAY_KEY]).toBe(8);
    expect(more.cigLog).toHaveLength(8);
  });
});

describe('Dépassement de l’objectif', () => {
  test('10 cigarettes pour un objectif de 8 : dépassé, série cassée, barre rouge', () => {
    const p = smoke(onboard(), 10);
    const s = computeStats(p);
    expect(s.isDepasse).toBe(true);
    expect(s.ecartPlanJour).toBe(2);
    expect(s.serie).toBe(0);
    expect(barTone(10, 8)).toBe('over');
  });

  test('pile à l’objectif : barre orange ; objectif 0 tenu : barre verte', () => {
    expect(barTone(8, 8)).toBe('at');
    expect(barTone(0, 0)).toBe('under');
    expect(barTone(null, 8)).toBe('empty');
  });
});

describe('« Valider ma journée »', () => {
  test('sans saisie : la journée est enregistrée à 0 cigarette', () => {
    const p = validateDay(onboard());
    const s = computeStats(p);
    expect(p.historique[TODAY_KEY]).toBe(0);
    expect(s.jourRenseigne).toBe(true);
    expect(s.cigarettesToday).toBe(0);
    expect(s.argentEcoAujourdhui).toBeCloseTo(7.5);   // 12 × 0,625 €
    expect(s.vieGagneeMinAujourdhui).toBe(60);
    expect(s.serie).toBe(1);
  });

  test('valider puis dire « finalement 5 » : le 5 remplace le 0', () => {
    const p = smoke(validateDay(onboard()), 5);
    const s = computeStats(p);
    expect(p.historique[TODAY_KEY]).toBe(5);
    expect(s.cigarettesToday).toBe(5);
    expect(s.nbJoursEnregistres).toBe(1);             // pas de journée en double
    expect(s.argentEcoCumul).toBeCloseTo(4.375);      // (12 − 5) × 0,625 €
    expect(s.weekData[6]).toBe(5);
  });

  test('valider après avoir saisi 3 cigarettes ne remet pas le compteur à 0', () => {
    const before = smoke(onboard(), 3);
    const after = validateDay(before);
    expect(after).toBe(before);
    expect(computeStats(after).cigarettesToday).toBe(3);
  });

  test('valider deux fois de suite ne change rien', () => {
    const once = validateDay(onboard());
    expect(validateDay(once)).toBe(once);
  });
});

describe('Changement de jour', () => {
  test('le lendemain, le compteur du jour repart à 0 et hier reste dans l’historique', () => {
    const p = smoke(onboard(), 6);
    jest.setSystemTime(new Date('2026-09-20T09:00:00'));
    const s = computeStats(p);
    expect(s.cigarettesToday).toBe(0);
    expect(s.jourRenseigne).toBe(false);
    expect(s.weekData[5]).toBe(6);
    expect(s.weekRenseignes[5]).toBe(true);
    expect(s.argentEcoCumul).toBeCloseTo(3.75);
  });

  test('un widget non rafraîchi depuis la veille est reconnu comme périmé', () => {
    const p = smoke(onboard(), 6);
    const w = buildWidgetSnapshot(computeStats(p), p);
    expect(isSnapshotStale(w, new Date('2026-09-19T23:59:00'))).toBe(false);
    expect(isSnapshotStale(w, new Date('2026-09-20T00:01:00'))).toBe(true);
  });

  test('saisir un jour passé ne touche pas au compteur d’aujourd’hui', () => {
    const today = smoke(onboard(), 2);
    const yesterdayKey = localDateKey(addLocalDays(TODAY, -1));
    const p = applyDailyConsumption(today, { dateKey: yesterdayKey, cigarettes: 9 }, { todayKey: TODAY_KEY }).profile;
    expect(p.cigarettesToday).toBe(2);
    expect(p.historique[yesterdayKey]).toBe(9);
    expect(computeStats(p).nbJoursEnregistres).toBe(2);
  });
});

describe('Plan de réduction progressive', () => {
  test('l’objectif baisse de 2 chaque semaine depuis la date de début', () => {
    const p = onboard();
    expect(computeStats(p).objectifJour).toBe(8);
    jest.setSystemTime(new Date('2026-09-26T12:00:00'));
    expect(computeStats(p).objectifJour).toBe(6);
    jest.setSystemTime(new Date('2026-10-03T12:00:00'));
    expect(computeStats(p).objectifJour).toBe(4);
  });

  test('un jour de la semaine passée est jugé sur l’objectif de cette semaine-là', () => {
    let p = smoke(onboard(), 8);                      // jour 0 : 8 = objectif d'alors
    jest.setSystemTime(new Date('2026-09-26T12:00:00'));
    p = smoke(p, 5, { dateKey: '2026-09-26' });
    const s = computeStats(p);
    expect(s.weekObjectifs[0]).toBe(8);               // 20 sept. : première semaine
    expect(s.weekObjectifs[6]).toBe(6);               // 26 sept. : deuxième semaine
  });
});

describe('Cas limites', () => {
  test('avant toute saisie, le widget n’affiche ni économies ni temps de vie du jour', () => {
    const p = onboard();
    const w = buildWidgetSnapshot(computeStats(p), p);
    expect(w.todayLogged).toBe(false);
    expect(w.savedToday).toBe('—');
    expect(w.lifeToday).toBe('—');
    expect(w.week[6].value).toBeNull();
  });

  test('fumer plus qu’avant l’app : le jour est négatif, le cumul ne descend pas sous 0', () => {
    const p = smoke(onboard(), 15);                   // 15 > 12 avant l'app
    const s = computeStats(p);
    expect(s.argentEcoAujourdhui).toBeCloseTo(-1.875);
    expect(s.vieGagneeMinAujourdhui).toBe(-15);
    expect(s.argentEcoCumul).toBe(0);
    const w = buildWidgetSnapshot(s, p);
    expect(plainNumber(w.savedToday)).toBe('-1,88 €');
    expect(w.lifeToday).toBe('−15 min');
  });
});

describe('Devise', () => {
  test('les montants du widget suivent la devise choisie', () => {
    const p = smoke(onboard({ monnaie: 'CHF' }), 6);
    const w = buildWidgetSnapshot(computeStats(p), p);
    expect(w.savedToday).toContain('CHF');
  });
});
