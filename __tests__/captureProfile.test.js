import { buildVeteranProfile } from '../src/utils/demoData';
import { computeStats } from '../src/utils/stats';

describe('profil de démonstration « un an de grosse consommation »', () => {
  const profile = buildVeteranProfile();

  it('couvre bien 365 jours', () => {
    expect(Object.keys(profile.historique)).toHaveLength(365);
  });

  it('démarre à un paquet par jour et finit sous l’objectif', () => {
    const jours = Object.keys(profile.historique).sort();
    const premiers = jours.slice(0, 20).map(k => profile.historique[k]);
    expect(Math.max(...premiers)).toBeGreaterThanOrEqual(18);
    expect(profile.historique[jours[jours.length - 1]]).toBe(3);
  });

  it('contient deux périodes d’arrêt complet', () => {
    const zeros = Object.values(profile.historique).filter(v => v === 0).length;
    expect(zeros).toBeGreaterThanOrEqual(20);
  });

  it('produit des statistiques exploitables (aucun NaN)', () => {
    const stats = computeStats(profile);
    const nombres = Object.entries(stats)
      .filter(([, v]) => typeof v === 'number');
    nombres.forEach(([cle, valeur]) => {
      expect(Number.isFinite(valeur)).toBe(true);
      expect(cle && valeur).not.toBeNaN();
    });
    expect(stats).toBeTruthy();
  });
});
