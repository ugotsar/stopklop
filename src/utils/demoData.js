// ─────────────────────────────────────────────────────────────────────────────
// Générateur de données de démonstration : simule 5 semaines d'utilisation
// réaliste — réduction progressive AVEC des rechutes, envies traquées,
// habitudes personnalisées. À charger via le bouton dev du Dashboard.
// ─────────────────────────────────────────────────────────────────────────────

const DAY_MS = 86400000;
const iso = d => d.toISOString();
const key = d => {
  const x = new Date(d);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
};

// Générateur pseudo-aléatoire déterministe (mêmes données à chaque chargement)
function mulberry32(seed) {
  return function () {
    let t = (seed += 0x6D2B79F5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function buildDemoProfile() {
  const rnd = mulberry32(42);
  const now = new Date();
  const NB_JOURS = 35;
  const debut = new Date(now.getTime() - (NB_JOURS - 1) * DAY_MS);

  const CONSO_AVANT   = 15;
  const OBJECTIF_BASE = 12;
  const REDUCTION_SEM = 2;

  const persoKey1 = 'perso_demo_maman';
  const persoKey2 = 'perso_demo_voiture';

  const historique = {};
  const cigLog = [];
  const envies = [];

  // Heures typiques d'une cigarette (pondérées : matin, midi, soirée ++)
  const HEURES = [8, 8, 9, 10, 11, 12, 12, 13, 14, 16, 17, 18, 18, 19, 19, 20, 20, 21, 22];
  const TRIGGERS_JOUR  = ['cafe', 'stress', 'repas', 'habitude', 'stress', persoKey1];
  const TRIGGERS_SOIR  = ['stress', 'social', 'alcool', 'habitude', persoKey2];

  for (let j = 0; j < NB_JOURS; j++) {
    const date = new Date(debut.getTime() + j * DAY_MS);
    const semaine = Math.floor(j / 7);
    const objectifDuJour = Math.max(0, OBJECTIF_BASE - REDUCTION_SEM * semaine);
    const estWeekend = [0, 6].includes(date.getDay());

    // Consommation : autour de l'objectif, avec du bruit et des rechutes
    let cig = objectifDuJour + Math.round((rnd() - 0.55) * 4);
    if (estWeekend && rnd() < 0.55) cig = objectifDuJour + 2 + Math.round(rnd() * 3); // rechute WE
    if (j === 16) cig = objectifDuJour + 6; // grosse rechute (soirée)
    if (rnd() < 0.12) cig = Math.max(0, objectifDuJour - 3); // très bonne journée
    cig = Math.max(0, Math.min(cig, CONSO_AVANT + 2));

    historique[key(date)] = cig;

    // Horodatage de chaque cigarette + raison (traquées surtout à partir de la sem. 2)
    for (let c = 0; c < cig; c++) {
      const h = HEURES[Math.floor(rnd() * HEURES.length)];
      const m = Math.floor(rnd() * 60);
      const ts = new Date(date); ts.setHours(h, m, 0, 0);
      cigLog.push(iso(ts));
      if (j >= 5 && rnd() < 0.8) {
        const pool = h >= 17 ? TRIGGERS_SOIR : TRIGGERS_JOUR;
        envies.push({ ts: iso(ts), trigger: pool[Math.floor(rnd() * pool.length)], fume: true });
      }
    }

    // Envies RÉSISTÉES (le vrai progrès : de plus en plus au fil des semaines)
    const nbResistees = Math.round(2 + semaine * 1.5 + rnd() * 3);
    for (let e = 0; e < nbResistees; e++) {
      const h = HEURES[Math.floor(rnd() * HEURES.length)];
      const ts = new Date(date); ts.setHours(h, Math.floor(rnd() * 60), 0, 0);
      const pool = h >= 17 ? TRIGGERS_SOIR : TRIGGERS_JOUR;
      const trigger = pool[Math.floor(rnd() * pool.length)];
      const envie = { ts: iso(ts), trigger, fume: false };
      if (trigger === 'stress' && rnd() < 0.2) envie.note = 'Grosse journée au travail';
      envies.push(envie);
    }
  }

  envies.sort((a, b) => new Date(a.ts) - new Date(b.ts));
  cigLog.sort();

  const todayKey = key(now);

  return {
    // Identité & onboarding
    prenom: 'Démo',
    createdAt: iso(debut),
    startDate: iso(debut),
    dateArretSouhaitee: iso(debut),
    onboardingComplete: true,
    onboardingCompletedAt: iso(debut),
    identification: { echecPasse: true, automatisme: true, perduMethode: false },

    // Consommation & plan
    typeObjectif: 'reduce',
    consoDeclaree: CONSO_AVANT,
    consoUnite: 'jour',
    consoAvantApp: CONSO_AVANT,
    objectifCigarettes: OBJECTIF_BASE,
    reductionParSemaine: REDUCTION_SEM,
    planStartDate: iso(debut),
    prixPaquet: 12.5,
    cigarettesParPaquet: 20,
    monnaie: 'EUR',

    // Motivations
    motivations: ['health', 'family'],
    motivationPerso: 'Pour mes enfants',
    niveauMotivation: 8,

    // Données d'usage
    historique,
    cigarettesToday: historique[todayKey] ?? 0,
    lastSavedDate: todayKey,
    cigLog,
    envies,
    declencheursPerso: [
      { key: persoKey1, label: "Maman m'a énervé" },
      { key: persoKey2, label: 'Trajet en voiture' },
    ],
  };
}


// ─────────────────────────────────────────────────────────────────────────────
// Profil « ancien gros fumeur » : un an d'historique. Un paquet par jour au
// départ, une réduction longue et irrégulière, deux périodes d'arrêt complet
// suivies de rechutes, et aujourd'hui 5 cigarettes par jour.
// Sert uniquement à peupler l'app pour les captures de l'App Store : le bouton
// qui l'appelle n'apparaît que lorsque le contournement du paywall est actif.
// ─────────────────────────────────────────────────────────────────────────────

// Cible théorique du jour `j` (0 = il y a un an, 364 = aujourd'hui).
function cibleVeteran(j) {
  if (j < 60)  return 20;                               // un paquet par jour
  if (j < 120) return 20 - (j - 60)  * (5 / 60);        // 20 -> 15
  if (j < 180) return 15 - (j - 120) * (4 / 60);        // 15 -> 11
  if (j < 194) return 0;                                // premier arrêt, 14 jours
  if (j < 212) return 9 + (j - 194) * (2 / 18);         // rechute : 9 -> 11
  if (j < 301) return 11 - (j - 212) * (4 / 89);        // 11 -> 7
  if (j < 310) return 0;                                // second arrêt, 9 jours
  if (j < 335) return 7 - (j - 310) * (1 / 25);         // rechute douce : 7 -> 6
  return 6 - (j - 335) * (1 / 30);                      // 6 -> 5
}

export function buildVeteranProfile() {
  const rnd = mulberry32(2026);
  const now = new Date();
  const NB_JOURS = 365;
  const debut = new Date(now.getTime() - (NB_JOURS - 1) * DAY_MS);

  const CONSO_AVANT = 20;          // un paquet par jour
  const OBJECTIF_BASE = 9;         // objectif au démarrage du plan actuel
  const REDUCTION_SEM = 1;
  const SEMAINES_PLAN = 4;         // => objectif du jour = 9 - 4 = 5
  const planStart = new Date(now.getTime() - SEMAINES_PLAN * 7 * DAY_MS);

  const persoKey1 = 'perso_vet_apero';
  const persoKey2 = 'perso_vet_pause';

  const historique = {};
  const cigLog = [];
  const envies = [];

  const HEURES = [7, 8, 8, 9, 10, 11, 12, 12, 13, 14, 15, 16, 17, 18, 18, 19, 20, 20, 21, 22];
  const TRIGGERS_JOUR = ['cafe', 'stress', 'repas', 'habitude', 'stress', persoKey2];
  const TRIGGERS_SOIR = ['stress', 'social', 'alcool', 'habitude', persoKey1];

  const JOURS_CIGLOG = 45;   // horodatage fin seulement sur la période récente
  const JOURS_ENVIES = 60;

  for (let j = 0; j < NB_JOURS; j++) {
    const date = new Date(debut.getTime() + j * DAY_MS);
    const cible = cibleVeteran(j);
    const estWeekend = [0, 6].includes(date.getDay());

    let cig;
    if (cible === 0) {
      cig = 0;                                              // période d'arrêt
    } else {
      cig = Math.round(cible + (rnd() - 0.5) * 3);
      if (estWeekend && rnd() < 0.5) cig += 1 + Math.round(rnd() * 2);
      if (rnd() < 0.08) cig = Math.max(0, Math.round(cible) - 3);   // très bon jour
      cig = Math.max(0, Math.min(cig, CONSO_AVANT + 3));
    }

    // Aujourd'hui : journée en cours, on est en dessous de l'objectif de 5.
    if (j === NB_JOURS - 1) cig = 3;

    historique[key(date)] = cig;

    const resteCigLog = j >= NB_JOURS - JOURS_CIGLOG;
    const resteEnvies = j >= NB_JOURS - JOURS_ENVIES;

    if (resteCigLog) {
      for (let c = 0; c < cig; c++) {
        const h = HEURES[Math.floor(rnd() * HEURES.length)];
        const ts = new Date(date);
        ts.setHours(h, Math.floor(rnd() * 60), 0, 0);
        if (ts > now) ts.setHours(Math.max(7, now.getHours() - 1), 15, 0, 0);
        cigLog.push(iso(ts));
        if (resteEnvies && rnd() < 0.75) {
          const pool = h >= 17 ? TRIGGERS_SOIR : TRIGGERS_JOUR;
          envies.push({ ts: iso(ts), trigger: pool[Math.floor(rnd() * pool.length)], fume: true });
        }
      }
    }

    // Les envies surmontées : de plus en plus nombreuses avec le temps.
    if (resteEnvies) {
      const nb = Math.round(2 + rnd() * 4);
      for (let e = 0; e < nb; e++) {
        const h = HEURES[Math.floor(rnd() * HEURES.length)];
        const ts = new Date(date);
        ts.setHours(h, Math.floor(rnd() * 60), 0, 0);
        if (ts > now) continue;
        const pool = h >= 17 ? TRIGGERS_SOIR : TRIGGERS_JOUR;
        const trigger = pool[Math.floor(rnd() * pool.length)];
        const envie = { ts: iso(ts), trigger, fume: false };
        if (trigger === 'stress' && rnd() < 0.18) envie.note = 'Journée tendue, j\'ai tenu';
        if (trigger === persoKey1 && rnd() < 0.25) envie.note = 'Apéro entre amis';
        envies.push(envie);
      }
    }
  }

  envies.sort((a, b) => new Date(a.ts) - new Date(b.ts));
  cigLog.sort();

  const todayKey = key(now);

  return {
    prenom: 'Ugo',
    createdAt: iso(debut),
    startDate: iso(debut),
    dateArretSouhaitee: iso(new Date(now.getTime() + 35 * DAY_MS)),
    onboardingComplete: true,
    onboardingCompletedAt: iso(debut),
    identification: { echecPasse: true, automatisme: true, perduMethode: true },

    typeObjectif: 'reduce',
    consoDeclaree: CONSO_AVANT,
    consoAvantDeclaree: true,
    consoUnite: 'jour',
    consoAvantApp: CONSO_AVANT,
    objectifCigarettes: OBJECTIF_BASE,
    reductionParSemaine: REDUCTION_SEM,
    planStartDate: iso(planStart),
    prixPaquet: 12.5,
    cigarettesParPaquet: 20,
    monnaie: 'EUR',

    motivations: ['health', 'money', 'breathing'],
    motivationPerso: 'Courir 10 km sans m\'arrêter',
    niveauMotivation: 9,

    historique,
    cigarettesToday: historique[todayKey] ?? 0,
    lastSavedDate: todayKey,
    cigLog,
    envies,
    declencheursPerso: [
      { key: persoKey1, label: 'Apéro' },
      { key: persoKey2, label: 'Pause au boulot' },
    ],
  };
}
