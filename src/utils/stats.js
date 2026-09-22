import i18n from '../i18n';
import { addLocalDays, localDateKey } from './dateKeys';

// ─── Source unique de vérité pour toutes les stats ───────────────────────────
export function computeStats(profile) {
  const {
    dateArretSouhaitee,
    consoAvantApp   = 10,
    consoAvantDeclaree,
    consoDeclaree,
    prixPaquet      = 10,
    cigarettesParPaquet = 20,
    createdAt,
    objectifCigarettes,
    historique      = {},
    lastSavedDate,
    typeObjectif,
    reductionParSemaine,
    planStartDate,
    envies          = [],
    cigLog          = [],
  } = profile;

  const now      = new Date();
  const todayKey = localDateKey(now);
  const prixCig  = cigarettesParPaquet > 0 ? prixPaquet / cigarettesParPaquet : 0;

  // ── Résolution consoAvant / objectifJour cohérents ──────────────────────────
  // Règle : objectifJour doit toujours être INFÉRIEUR à consoAvant.
  // Si ce n'est pas le cas (données incomplètes ou compte test), on infère.
  // Les anciens comptes pouvaient hériter du 10 par défaut sans que la
  // personne l'ait réellement renseigné. On ne le présente pas comme une
  // référence certaine : l'onboarding moderne pose explicitement ce flag.
  // Les comptes créés avant l'ajout du marqueur n'ont ni consoAvantDeclaree ni
  // consoDeclaree, mais ont bien une consommation saisie dans consoAvantApp :
  // un onboarding terminé avec une valeur réelle vaut déclaration.
  const consoAvantBrute = Number(profile.consoAvantApp);
  const baselineHeritee = profile.onboardingComplete === true
    && Number.isFinite(consoAvantBrute) && consoAvantBrute > 0;
  const baselineDeclared = consoAvantDeclaree === true
    || (consoDeclaree !== null && consoDeclaree !== undefined && Number.isFinite(Number(consoDeclaree)))
    || baselineHeritee;
  let objectifJour, consoAvant, consoEstimee = !baselineDeclared;
  if (objectifCigarettes != null) {
    objectifJour = objectifCigarettes;
    // consoAvantApp non renseigné ou incohérent → on l'infère : objectif ≈ 80% de l'ancienne conso.
    // Le flag consoEstimee permet aux écrans d'afficher que la référence est une estimation.
    if (consoAvantApp > objectifJour) {
      consoAvant = consoAvantApp;
    } else {
      consoAvant   = Math.ceil(Math.max(objectifJour, 1) / 0.8);
      consoEstimee = true;
    }
  } else {
    consoAvant   = Math.max(consoAvantApp, 1);
    objectifJour = Math.max(1, Math.floor(consoAvant * 0.8));
  }

  // ── Plan de réduction progressive ────────────────────────────────────────────
  // L'utilisateur choisit un rythme (ex : −2 cig / semaine). L'objectif quotidien
  // diminue automatiquement chaque semaine écoulée depuis le début du plan.
  const objectifBase = objectifJour; // objectif au démarrage du plan
  let reductionSem = 0, semainesEcoulees = 0, joursAvantPalier = null;
  let dateZeroStr = null, semainesRestantes = null;
  if (typeObjectif === 'reduce' && reductionParSemaine > 0 && planStartDate) {
    reductionSem = reductionParSemaine;
    const planStart  = new Date(planStartDate);
    const joursPlan  = Math.max(0, Math.floor((now - planStart) / 86400000));
    semainesEcoulees = Math.floor(joursPlan / 7);
    objectifJour     = Math.max(0, objectifBase - reductionSem * semainesEcoulees);
    joursAvantPalier = objectifJour > 0 ? 7 - (joursPlan % 7) : null;
    const semainesTotal = Math.ceil(objectifBase / reductionSem);
    semainesRestantes   = Math.max(0, semainesTotal - semainesEcoulees);
    const dateZero = new Date(planStart.getTime() + semainesTotal * 7 * 86400000);
    dateZeroStr = dateZero.toLocaleDateString(i18n.language, { day: 'numeric', month: 'long', year: 'numeric' });
  }

  // ── Analyse des habitudes (envies de fumer enregistrées) ───────────────────
  const enviesList = Array.isArray(envies) ? envies : [];
  let habitudes = null;
  if (enviesList.length > 0) {
    const hCount = {}, dCount = {}, tCount = {};
    enviesList.forEach(e => {
      const d = new Date(e.ts);
      if (isNaN(d)) return;
      const h0 = Math.floor(d.getHours() / 3) * 3;
      const bucket = `${h0}h – ${h0 + 3}h`;
      hCount[bucket]    = (hCount[bucket] || 0) + 1;
      const day = d.toLocaleDateString(i18n.language, { weekday: 'long' });
      dCount[day]       = (dCount[day] || 0) + 1;
      tCount[e.trigger] = (tCount[e.trigger] || 0) + 1;
    });
    const top = o => Object.entries(o).sort((a, b) => b[1] - a[1])[0] ?? ['—', 0];
    const [heurePic, nHeure] = top(hCount);
    const [jourPicRaw, nJour] = top(dCount);
    const [declencheur, nTrig] = top(tCount);
    habitudes = {
      heurePic,
      jourPic: jourPicRaw.charAt(0).toUpperCase() + jourPicRaw.slice(1),
      declencheur,
      pctHeure: Math.round((nHeure / enviesList.length) * 100),
      pctJour:  Math.round((nJour  / enviesList.length) * 100),
      pctTrig:  Math.round((nTrig  / enviesList.length) * 100),
      total: enviesList.length,
      parDeclencheur: tCount,                       // { stress: 4, cafe: 2, ... }
      nbResistees: enviesList.filter(e => !e.fume).length,
      nbFumees:    enviesList.filter(e =>  e.fume).length,
    };
  }
  const enviesRecentes = [...enviesList].slice(-5).reverse();

  // cigarettesToday : valide seulement si enregistré aujourd'hui
  const cigarettesToday = lastSavedDate === todayKey ? (profile.cigarettesToday ?? 0) : 0;

  // Historique complet incluant aujourd'hui
  const hist = { ...historique, ...(lastSavedDate === todayKey ? { [todayKey]: cigarettesToday } : {}) };
  const jourRenseigne = hist[todayKey] !== undefined;

  // ── Temps sans fumer ────────────────────────────────────────────────────────
  const startDate  = dateArretSouhaitee ? new Date(dateArretSouhaitee)
    : createdAt ? new Date(createdAt) : now;
  const diffMs      = Math.max(0, now - startDate);
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHeures  = Math.floor(diffMinutes / 60);
  const diffJours   = Math.floor(diffHeures / 24);
  const dJ = i18n.t('common:dayShort'), dH = i18n.t('common:hourShort'), dM = i18n.t('common:minuteShort');
  const dureeStr    = diffJours > 0
    ? `${diffJours}${dJ} ${String(diffHeures % 24).padStart(2,'0')}${dH} ${String(diffMinutes % 60).padStart(2,'0')}${dM}`
    : `${String(diffHeures % 24).padStart(2,'0')}${dH} ${String(diffMinutes % 60).padStart(2,'0')}${dM}`;

  // ── Temps depuis la DERNIÈRE cigarette (remis à zéro à chaque cigarette) ────
  // Basé sur cigLog (horodatage de chaque cigarette). Fallback : début de l'app.
  const cigDates = (Array.isArray(cigLog) ? cigLog : [])
    .map(ts => new Date(ts)).filter(d => !isNaN(d) && d <= now);
  const lastCig  = cigDates.length ? new Date(Math.max(...cigDates)) : null;
  const sansCigDepuis = lastCig ?? startDate;
  const sansCigMs     = Math.max(0, now - sansCigDepuis);
  const sansCigMin    = Math.floor(sansCigMs / 60000);
  const sansCigH      = Math.floor(sansCigMin / 60);
  const sansCigJ      = Math.floor(sansCigH / 24);
  const dureeSansCigStr = sansCigJ > 0
    ? `${sansCigJ}${dJ} ${String(sansCigH % 24).padStart(2,'0')}${dH} ${String(sansCigMin % 60).padStart(2,'0')}${dM}`
    : `${String(sansCigH % 24).padStart(2,'0')}${dH} ${String(sansCigMin % 60).padStart(2,'0')}${dM}`;

  // ── Stats aujourd'hui ───────────────────────────────────────────────────────
  // "vs avant l'app" : peut être NÉGATIF si on fume plus qu'avant (on ne masque plus).
  const cigEviteesAujourdhu    = consoAvant - cigarettesToday;
  const argentEcoAujourdhui    = cigEviteesAujourdhu * prixCig;
  const vieGagneeMinAujourdhui = cigEviteesAujourdhu * 5;
  const progressionJour = consoAvant > 0
    ? Math.max(-100, Math.min(100, Math.round(((consoAvant - cigarettesToday) / consoAvant) * 100)))
    : 0;
  const isDepasse = cigarettesToday > objectifJour;

  // "vs le plan" : écart au vrai objectif du jour — la métrique principale.
  const ecartPlanJour    = cigarettesToday - objectifJour;          // +4 = 4 de trop
  const argentVsPlanJour = (objectifJour - cigarettesToday) * prixCig; // négatif si dépassé
  const vieVsPlanJour    = (objectifJour - cigarettesToday) * 5;       // minutes, négatif si dépassé

  // ── 7 derniers jours ────────────────────────────────────────────────────────
  // Les économies/vie de la semaine ne comptent que les jours RÉELLEMENT
  // enregistrés (comme le cumul depuis le début) — un jour non renseigné
  // n'est ni une bonne ni une mauvaise journée, il ne doit rien ajouter.
  const week7 = Array.from({ length: 7 }, (_, i) => addLocalDays(now, -(6 - i)));
  const weekKeys   = week7.map(localDateKey);
  const weekData   = weekKeys.map(k => hist[k] ?? 0);
  const weekLabels = week7.map(d => d.toLocaleDateString(i18n.language, { weekday: 'short' }).slice(0,3));
  const weekSum    = weekData.reduce((s,v) => s+v, 0);
  const weekEnregistres = weekKeys.filter(k => hist[k] !== undefined).length;
  const progressionSemaine = consoAvant > 0 && weekEnregistres > 0
    ? Math.max(-100, Math.min(100, Math.round(((consoAvant*weekEnregistres - weekSum) / (consoAvant*weekEnregistres)) * 100)))
    : 0;

  // ── 30 derniers jours ───────────────────────────────────────────────────────
  const month30   = Array.from({ length: 30 }, (_, i) => addLocalDays(now, -(29 - i)));
  const monthKeys  = month30.map(localDateKey);
  const monthData  = monthKeys.map(k => hist[k] ?? 0);
  const monthLabels = month30.map((d,i) => i % 5 === 0 ? String(d.getDate()) : '');
  const monthSum   = monthData.reduce((s,v) => s+v, 0);
  const monthEnregistres = monthKeys.filter(k => hist[k] !== undefined).length;
  const progressionMois = consoAvant > 0 && monthEnregistres > 0
    ? Math.max(-100, Math.min(100, Math.round(((consoAvant*monthEnregistres - monthSum) / (consoAvant*monthEnregistres)) * 100)))
    : 0;

  // ── Depuis le début ─────────────────────────────────────────────────────────
  const allKeys   = Object.keys(hist).sort();
  const allValues = allKeys.map(k => hist[k]);
  const totalFume = allValues.reduce((s,v) => s+v, 0);

  // nbJours = jours depuis le début de l'app (pas juste les jours enregistrés)
  const nbJoursAppMs = Math.max(0, now - startDate);
  const nbJours      = Math.max(Math.floor(nbJoursAppMs / (1000*60*60*24)) + 1, allKeys.length, 1);

  // Pour les jours non enregistrés on suppose consoAvant (conservateur)
  const nbJoursEnregistres = allKeys.length;
  const nbJoursManquants   = Math.max(0, nbJours - nbJoursEnregistres);
  const totalEstime        = totalFume + nbJoursManquants * consoAvant;

  const progressionTotal = consoAvant > 0
    ? Math.max(-100, Math.min(100, Math.round(((consoAvant*nbJours - totalEstime) / (consoAvant*nbJours)) * 100)))
    : 0;

  // ── Argent & vie cumulés (basés sur les jours réellement enregistrés) ───────
  const argentEcoCumul    = Math.max(0, (consoAvant*nbJoursEnregistres - totalFume) * prixCig);
  const vieGagneeMinCumul = Math.max(0, (consoAvant*nbJoursEnregistres - totalFume) * 5);

  // ── Consommation réelle récente (moyenne des 7 derniers jours enregistrés) ──
  // Sert de trajectoire réelle dans la projection annuelle.
  const derniers7 = allValues.slice(-7);
  const consoRecente = derniers7.length > 0
    ? derniers7.reduce((s, v) => s + v, 0) / derniers7.length
    : consoAvant;

  // ── Série de jours sous l'objectif ─────────────────────────────────────────
  // Chaque jour est comparé à l'objectif EN VIGUEUR CE JOUR-LÀ, pas à
  // l'objectif actuel — sinon un plan de réduction progressif (objectif qui
  // baisse chaque semaine) casse artificiellement le streak des jours passés
  // qui respectaient pourtant leur propre objectif, plus élevé à l'époque.
  function objectifPourJour(d) {
    if (reductionSem > 0 && planStartDate) {
      const planStart = new Date(planStartDate);
      if (d < planStart) return objectifBase;
      const joursDepuisDebutPlan = Math.floor((d - planStart) / 86400000);
      return Math.max(0, objectifBase - reductionSem * Math.floor(joursDepuisDebutPlan / 7));
    }
    return objectifBase;
  }
  let serie = 0;
  for (let i = 0; i < 30; i++) {
    const d = addLocalDays(now, -i);
    const k = localDateKey(d);
    if (hist[k] === undefined) { if (i === 0) continue; break; }
    if (hist[k] <= objectifPourJour(d)) serie++; else break;
  }

  // ── Plan progressif ─────────────────────────────────────────────────────────
  // Si un rythme de réduction est défini → paliers réels semaine par semaine.
  // Sinon → dégressif indicatif en 5 étapes.
  const step = reductionSem > 0 ? reductionSem : Math.max(1, Math.ceil(objectifJour / 4));
  const planData = [
    objectifJour,
    Math.max(0, objectifJour - step),
    Math.max(0, objectifJour - step*2),
    Math.max(0, objectifJour - step*3),
    Math.max(0, objectifJour - step*4),
    Math.max(0, objectifJour - step*5),
  ];

  // ── Projections mois / an / 10 ans — une SEULE méthode (simulerPlan),
  // utilisée pour les trois horizons afin qu'ils restent cohérents entre eux
  // quand un plan de réduction progressif est actif (l'objectif continue de
  // baisser chaque semaine à l'intérieur de chaque fenêtre simulée).
  const planMois  = simulerPlan(consoAvant, objectifJour, reductionSem, prixCig, 30);
  const planAn    = simulerPlan(consoAvant, objectifJour, reductionSem, prixCig, 365);
  const plan10Ans = simulerPlan(consoAvant, objectifJour, reductionSem, prixCig, 3650);
  // Courbes cumulées mensuelles (12 points) pour le graphique "Projection annuelle"
  const projChart = simulerCourbeAnnuelle(consoAvant, objectifJour, reductionSem, prixCig);

  // ── Résumés textuels ─────────────────────────────────────────────────────────
  function fmtVie(mins) {
    const neg = mins < 0; const m = Math.abs(mins); const signe = neg ? '-' : '+';
    const h = Math.floor(m/60); const j = Math.floor(h/24);
    if (j>0) return `${signe}${j}${dJ} ${h%24}${dH}`; if (h>0) return `${signe}${h}${dH} ${m%60}${dM}`; return `${signe}${m}${dM}`;
  }
  return {
    // Bases
    objectifJour, consoAvant, consoEstimee, consoRecente, prixCig, todayKey, jourRenseigne,

    // Temps depuis la dernière cigarette (se remet à zéro à chaque cigarette)
    dureeSansCigStr, sansCigMs, sansCigJ, sansCigH, aDejaFume: !!lastCig,

    // Aujourd'hui — vs le plan (métrique principale, peut être négative)
    ecartPlanJour, argentVsPlanJour, vieVsPlanJour,

    // Aujourd'hui — vs avant l'app
    cigarettesToday, isDepasse,
    cigEviteesAujourdhu, argentEcoAujourdhui, vieGagneeMinAujourdhui,
    progressionJour,
    vieGagneeStrAujourdhui: fmtVie(vieGagneeMinAujourdhui),

    // Semaine
    weekData, weekLabels, weekSum, progressionSemaine,
    weekObjectifs: week7.map(objectifPourJour),
    weekRenseignes: weekKeys.map(k => hist[k] !== undefined),
    argentEcoSemaine: Math.max(0, (consoAvant*weekEnregistres - weekSum) * prixCig),
    vieGagneeMinSemaine: Math.max(0, (consoAvant*weekEnregistres - weekSum) * 5),
    vieGagneeStrSemaine: fmtVie(Math.max(0, (consoAvant*weekEnregistres - weekSum)*5)),

    // Mois
    monthData, monthLabels, monthSum, progressionMois,
    argentEcoMois: Math.max(0, (consoAvant*monthEnregistres - monthSum) * prixCig),
    vieGagneeMinMois: Math.max(0, (consoAvant*monthEnregistres - monthSum) * 5),
    vieGagneeStrMois: fmtVie(Math.max(0, (consoAvant*monthEnregistres - monthSum)*5)),

    // Depuis le début
    allKeys, allValues, totalFume, nbJours, nbJoursEnregistres, progressionTotal,
    argentEcoCumul, vieGagneeMinCumul,
    vieGagneeStrCumul: fmtVie(vieGagneeMinCumul),

    // Série & plan
    serie, planData, prochainPalier: planData[1],
    typeObjectif, objectifBase,
    reductionSem, semainesEcoulees, joursAvantPalier, semainesRestantes, dateZeroStr,

    // Habitudes (envies de fumer)
    habitudes, nbEnvies: enviesList.length, enviesRecentes,

    // Plan projection (vs objectif) — toutes dérivées de simulerPlan() pour
    // garantir des chiffres cohérents entre eux (mois / an / 10 ans), y
    // compris quand un plan de réduction progressif est actif : l'objectif
    // continue alors de baisser chaque semaine dans CHACUNE de ces fenêtres,
    // au lieu de rester figé à sa valeur actuelle.
    argentEcoPlanMois: planMois.argentEco,
    vieGagneeHPlanMois: Math.round(planMois.vieGagneeMin / 60),
    vieGagneeJPlanAn: Math.round(planAn.vieGagneeMin / 60 / 24),
    coutAnSiContinue: planAn.coutSiContinue,
    ecoAnSiReduit: planAn.argentEco,
    argentEco10Ans: plan10Ans.argentEco,
    vieGagneeJ10Ans: Math.round(plan10Ans.vieGagneeMin / 60 / 24),
    projAnnuelle: {
      cout: planAn.coutSiContinue,
      coutPlan: planAn.depensePlan,
      gain: planAn.gain,
      coutReel: Math.round(consoRecente * prixCig * 365),
      badSerie: projChart.badSerie,
      planSerie: projChart.planSerie,
      consoRecente: Math.round(consoRecente * 10) / 10,
      planActif: reductionSem > 0,
    },

    // Temps sans fumer
    diffMs, diffSeconds, diffMinutes, diffHeures, diffJours, dureeStr,

    // Santé
    beneficesSante: getBeneficesSante(diffHeures),

    // Rétrocompatibilité
    prixCigarette: Math.round(prixCig * 100) / 100,
    argentEconomise: argentEcoCumul,
    cigarettesNonFumees: Math.floor((consoAvant/24/60)*diffMinutes),
  };
}

// ── Simulation du plan sur N jours — MÉTHODE UNIQUE réutilisée pour toutes
// les projections (mois / an / 10 ans) et pour la carte "Votre impact" du
// Plan, afin qu'elles ne divergent jamais entre elles. En mode "réduction
// progressive" l'objectif baisse chaque semaine jusqu'à 0 à l'intérieur même
// de la fenêtre simulée, donc les économies s'accélèrent avec le temps —
// contrairement à un calcul plat qui figerait l'objectif à sa valeur actuelle.
function simulerPlan(consoAvant, objectifJour, reductionSem, prixCig, jours) {
  let cigEvitees = 0;
  let depensePlan = 0;
  for (let d = 0; d < jours; d++) {
    const objDuJour = reductionSem > 0
      ? Math.max(0, objectifJour - reductionSem * Math.floor(d / 7))
      : objectifJour;
    cigEvitees += Math.max(0, consoAvant - objDuJour);
    depensePlan += objDuJour * prixCig;
  }
  const coutSiContinue = consoAvant * prixCig * jours;
  return {
    cigEvitees,
    argentEco: Math.round(cigEvitees * prixCig),
    vieGagneeMin: cigEvitees * 5,
    depensePlan: Math.round(depensePlan),
    coutSiContinue: Math.round(coutSiContinue),
    gain: Math.max(0, Math.round(coutSiContinue - depensePlan)),
  };
}

// ── Courbe cumulée sur 12 points (un par mois) pour le graphique "Projection
// annuelle" — mêmes objDuJour que simulerPlan, juste échantillonnés pour le tracé.
// Rouge = si vous continuez comme avant. Verte = en suivant le plan (elle
// s'aplatit quand l'objectif atteint 0 : plus aucune dépense).
function simulerCourbeAnnuelle(consoAvant, objectifJour, reductionSem, prixCig) {
  let depensePlan = 0;
  const badSerie  = [0];
  const planSerie = [0];
  for (let d = 1; d <= 360; d++) {
    const objDuJour = reductionSem > 0
      ? Math.max(0, objectifJour - reductionSem * Math.floor(d / 7))
      : objectifJour;
    depensePlan += objDuJour * prixCig;
    if (d % 30 === 0) {
      badSerie.push(-Math.round(consoAvant * prixCig * d));
      planSerie.push(-Math.round(depensePlan));
    }
  }
  return { badSerie, planSerie };
}

function getBeneficesSante(heures) {
  return [
    { heures: 0.33,   key: 'bloodPressure' },
    { heures: 8,      key: 'oxygen' },
    { heures: 24,     key: 'heart' },
    { heures: 48,     key: 'senses' },
    { heures: 72,     key: 'breathing' },
    { heures: 24*14,  key: 'circulation' },
    { heures: 24*30,  key: 'lungs' },
    { heures: 24*365, key: 'strokeRisk' },
  ].map(b => ({
    ...b,
    label: i18n.t(`userStats:benefits.${b.key}.label`),
    description: i18n.t(`userStats:benefits.${b.key}.description`),
    done: heures >= b.heures,
  }));
}
