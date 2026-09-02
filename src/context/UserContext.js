import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { loadProfile, saveProfile, clearProfile } from '../store/onboardingStore';
import {
  deleteCurrentUser,
  subscribeToAuth,
  signOut as firebaseSignOut,
} from '../services/authService';
import {
  deleteUserData,
  getUserData,
  migrateLegacyActivity,
  restoreUserData,
  saveDailyActivity,
  saveProfile as saveFirestore,
  saveCravings,
  subscribeToUserData,
} from '../services/firestore';
import {
  configurePurchases,
  getSubscriptionStatus,
  isPro,
  logoutPurchases,
} from '../services/purchases';
import i18n from '../i18n';
import { addLocalDays, localDateKey } from '../utils/dateKeys';
import { IS_DEMO_BUILD } from '../config/demoMode';
import { buildDemoProfile } from '../utils/demoData';

// ─── Contexte ────────────────────────────────────────────────────────────────
const UserContext = createContext(null);

// ─── Provider ────────────────────────────────────────────────────────────────
export function UserProvider({ children }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  // undefined = pas encore connu. En mode démo il n'y a jamais de compte réel :
  // on part directement de `null` pour ne jamais afficher l'écran de connexion
  // (voir AppNavigator) et ne jamais tenter d'appel Firebase.
  const [firebaseUser, setFirebaseUser] = useState(IS_DEMO_BUILD ? null : undefined);
  const [syncError, setSyncError] = useState(null);
  const [subscription, setSubscription] = useState({
    loading: true,
    available: false,
    isPro: false,
    customerInfo: null,
    errorCode: null,
    error: null,
  });
  // Miroir synchrone de `profile`, lu par updateProfile() pour fusionner sur
  // l'état le plus frais plutôt que sur le `profile` capturé par la closure
  // du render en cours — évite qu'un appel écrase le résultat d'un appel
  // précédent très rapproché (avant que le re-render n'ait eu lieu).
  const profileRef = useRef(null);
  useEffect(() => { profileRef.current = profile; }, [profile]);

  // `computeStats()` lit `new Date()` à chaque appel, mais ne se ré-exécute
  // que lorsque `profile` change. Si l'app reste ouverte sans aucune action
  // pendant qu'on passe minuit, "aujourd'hui" reste figé sur la veille —
  // et avec lui l'argent économisé, les cigarettes du jour, les totaux
  // semaine/mois — jusqu'à ce qu'une action quelconque touche le profil.
  // Ce timer vérifie régulièrement le jour calendrier et force un nouveau
  // rendu (donc un nouveau computeStats) dès qu'il a changé.
  const [, forceDayRefresh] = useState(0);
  const lastDayKeyRef = useRef(localDateKey());
  useEffect(() => {
    const id = setInterval(() => {
      const current = localDateKey();
      if (current !== lastDayKeyRef.current) {
        lastDayKeyRef.current = current;
        forceDayRefresh(v => v + 1);
      }
    }, 30000); // vérification toutes les 30s : largement assez précis pour un changement de jour
    return () => clearInterval(id);
  }, []);

  // Écoute l'état Firebase auth (jamais en mode démo : aucun compte réel).
  useEffect(() => {
    if (IS_DEMO_BUILD) return undefined;
    const unsub = subscribeToAuth((user) => {
      setFirebaseUser(user ?? null);
    });
    return unsub;
  }, []);

  // RevenueCat suit strictement l'identité Firebase active. Le statut est
  // conservé ici afin que la navigation ne dépende jamais d'un simple écran
  // de paywall ou d'une valeur locale modifiable.
  useEffect(() => {
    let active = true;

    if (firebaseUser === undefined) return () => { active = false; };

    if (!firebaseUser) {
      setSubscription({
        loading: false,
        available: false,
        isPro: false,
        customerInfo: null,
        errorCode: null,
        error: null,
      });
      logoutPurchases().catch(() => {});
      return () => { active = false; };
    }

    setSubscription(previous => ({ ...previous, loading: true, error: null }));
    configurePurchases(firebaseUser.uid).then(status => {
      if (active) setSubscription({ loading: false, ...status });
    });

    return () => { active = false; };
  }, [firebaseUser]);

  async function refreshSubscription(customerInfo = null) {
    if (!firebaseUser) {
      const status = {
        loading: false,
        available: false,
        isPro: false,
        customerInfo: null,
        errorCode: 'missing-user-id',
        error: null,
      };
      setSubscription(status);
      return status;
    }

    setSubscription(previous => ({ ...previous, loading: true, error: null }));
    const status = customerInfo
      ? { available: true, isPro: isPro(customerInfo), customerInfo, errorCode: null, error: null }
      : await getSubscriptionStatus();
    const next = { loading: false, ...status };
    setSubscription(next);
    return next;
  }

  // Charge le profil quand l'auth est connue
  useEffect(() => {
    if (firebaseUser === undefined) return;
    setLoading(true);
    (async () => {
      try {
        let loaded = null;

        if (firebaseUser) {
          // 1. Essayer Firestore (timeout 5s pour ne pas bloquer)
          let cloudProfile = null;
          try {
            const firestorePromise = getUserData(firebaseUser.uid);
            const timeout = new Promise(r => setTimeout(() => r(null), 5000));
            cloudProfile = await Promise.race([firestorePromise, timeout]);
          } catch (_) {}

          // 2. Charger aussi le local (peut contenir des changements plus
          // récents faits hors-ligne sur cet appareil, jamais synchronisés).
          const localProfile = await loadProfile();

          let shouldSyncStaticProfile = false;
          if (cloudProfile && localProfile) {
            // Fusion : la source la plus récente (`updatedAt`) l'emporte sur
            // les champs en conflit, mais aucun champ présent dans une seule
            // des deux sources n'est perdu.
            const cloudTime = cloudProfile.updatedAt instanceof Date ? cloudProfile.updatedAt.getTime() : 0;
            const localTime = localProfile.updatedAt ? new Date(localProfile.updatedAt).getTime() : 0;
            loaded = localTime > cloudTime
              ? { ...cloudProfile, ...localProfile }
              : { ...localProfile, ...cloudProfile };
            shouldSyncStaticProfile = true;
            saveProfile(loaded);
          } else if (cloudProfile) {
            loaded = cloudProfile;
          } else if (localProfile) {
            loaded = localProfile;
            shouldSyncStaticProfile = true;
          }

          // Quand il n'existe encore aucun document cloud, on crée d'abord le
          // profil léger. La migration peut ensuite déposer les journées et
          // les envies dans leurs sous-collections sans créer un document
          // incomplet.
          if (loaded && !cloudProfile) {
            try {
              await saveFirestore(firebaseUser.uid, loaded);
            } catch (e) {
              console.warn('Création du profil cloud échouée', e);
              setSyncError(e);
            }
          }

          // Migration atomique des anciens profils volumineux. On l'attend
          // avant tout nouvel update du profil : ainsi les nouvelles règles
          // Firestore qui interdisent les tableaux historiques ne bloquent
          // jamais l'ouverture de comptes existants.
          if (loaded) {
            try {
              await migrateLegacyActivity(firebaseUser.uid, loaded);
            } catch (e) {
              console.warn('Migration activité cloud échouée', e);
              setSyncError(e);
            }
          }

          // Re-synchronise la partie statique uniquement après la migration.
          // Les champs d'activité sont filtrés dans saveFirestore().
          if (loaded && cloudProfile && shouldSyncStaticProfile) {
            try {
              await saveFirestore(firebaseUser.uid, loaded);
            } catch (e) {
              console.warn('Sync cloud échouée (fusion)', e);
              setSyncError(e);
            }
          }
        } else {
          loaded = await loadProfile();
          // Mode démo : aucun compte, donc jamais de profil cloud à charger.
          // Un profil type réaliste (5 semaines d'usage) est chargé au tout
          // premier lancement, une fois, puis persiste localement comme
          // n'importe quel profil normal.
          if (IS_DEMO_BUILD && !loaded) {
            loaded = buildDemoProfile();
            await saveProfile(loaded);
          }
        }

        setProfile(loaded);
        profileRef.current = loaded;
      } catch (_) {
        setProfile(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [firebaseUser]);

  // Les changements cloud (autre appareil, relance après réseau coupé) sont
  // reflétés automatiquement dans tous les écrans sans devoir redémarrer l'app.
  useEffect(() => {
    if (!firebaseUser) return undefined;
    return subscribeToUserData(
      firebaseUser.uid,
      cloudProfile => {
        if (!cloudProfile) return;
        profileRef.current = cloudProfile;
        setProfile(cloudProfile);
        saveProfile(cloudProfile);
        setSyncError(null);
      },
      error => {
        console.warn('Écoute Firestore indisponible', error);
        setSyncError(error);
      },
    );
  }, [firebaseUser]);

  // Met à jour une ou plusieurs clés du profil + persiste (local + cloud).
  // Fusionne sur `profileRef.current` (toujours à jour de façon synchrone),
  // pas sur `profile` capturé par la closure du render — deux appels très
  // rapprochés ne s'écrasent plus l'un l'autre.
  async function updateProfile(changes) {
    const updated = { ...profileRef.current, ...changes };
    profileRef.current = updated;
    setProfile(updated);
    // Sauvegarde locale (cache offline)
    await saveProfile(updated);
    // Sauvegarde cloud si connecté
    if (!firebaseUser) return { synced: false, offline: true };
    try {
      await saveFirestore(firebaseUser.uid, updated);
      setSyncError(null);
      return { synced: true };
    } catch (error) {
      console.warn('Sync cloud échouée (updateProfile)', error);
      setSyncError(error);
      return { synced: false, error };
    }
  }

  // Enregistre une journée entière dans un document Firestore dédié. En mémoire
  // on conserve la forme historique actuelle afin de ne pas dédoubler les
  // calculs dans les écrans pendant la migration.
  async function saveDailyConsumption({ dateKey = localDateKey(), cigarettes, entries = [], cravings = [] }) {
    const current = profileRef.current ?? {};
    const count = Math.max(0, Math.round(Number(cigarettes) || 0));
    const historique = { ...(current.historique ?? {}), [dateKey]: count };
    const existingLog = Array.isArray(current.cigLog) ? current.cigLog : [];
    const cigLog = [
      ...existingLog.filter(ts => localDateKey(ts) !== dateKey),
      ...entries.filter(ts => typeof ts === 'string'),
    ].sort();
    const oldEnvies = Array.isArray(current.envies) ? current.envies : [];
    const existingIds = new Set(oldEnvies.map(item => item.id).filter(Boolean));
    const newCravings = cravings.map((item, index) => ({
      ...item,
      id: item.id ?? `craving_${Date.now()}_${index}`,
    })).filter(item => !existingIds.has(item.id));
    const updated = {
      ...current,
      historique,
      cigLog,
      envies: [...oldEnvies, ...newCravings],
      cigarettesToday: dateKey === localDateKey() ? count : (current.cigarettesToday ?? 0),
      lastSavedDate: dateKey === localDateKey() ? dateKey : current.lastSavedDate,
    };
    profileRef.current = updated;
    setProfile(updated);
    await saveProfile(updated);

    if (!firebaseUser) return { synced: false, offline: true };
    try {
      await saveDailyActivity(firebaseUser.uid, dateKey, {
        cigarettes: count,
        entries,
        cravings: newCravings,
      });
      setSyncError(null);
      return { synced: true };
    } catch (error) {
      console.warn('Sync de la journée échouée', error);
      setSyncError(error);
      return { synced: false, error };
    }
  }

  async function recordCraving(craving) {
    const current = profileRef.current ?? {};
    const item = {
      ...craving,
      id: craving.id ?? `craving_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    };
    const updated = { ...current, envies: [...(current.envies ?? []), item] };
    profileRef.current = updated;
    setProfile(updated);
    await saveProfile(updated);
    if (!firebaseUser) return { synced: false, offline: true, item };
    try {
      await saveCravings(firebaseUser.uid, [item]);
      setSyncError(null);
      return { synced: true, item };
    } catch (error) {
      console.warn('Sync de l’envie échouée', error);
      setSyncError(error);
      return { synced: false, error, item };
    }
  }

  // Réinitialise tout (déconnexion / reset)
  async function resetProfile() {
    await clearProfile();
    profileRef.current = null;
    setProfile(null);
    if (firebaseUser) await firebaseSignOut();
  }

  // Suppression définitive : données Firestore, cache local, puis identité
  // Firebase Auth. L'ordre est important : les règles Firestore exigent que
  // l'utilisateur soit encore authentifié pour supprimer ses données.
  async function deleteAccount() {
    // Mode démo : aucun compte réel à supprimer. On recharge simplement un
    // profil type frais, pour qu'un visiteur curieux qui teste ce bouton
    // retombe sur la démo plutôt que sur un écran cassé.
    if (IS_DEMO_BUILD) {
      const fresh = buildDemoProfile();
      await saveProfile(fresh);
      profileRef.current = fresh;
      setProfile(fresh);
      return;
    }
    const user = firebaseUser;
    const backup = profileRef.current;
    try {
      if (user) await deleteUserData(user.uid);
      if (user) await deleteCurrentUser();

      // On ne supprime le cache qu'une fois les deux suppressions confirmées.
      await clearProfile();
      profileRef.current = null;
      setProfile(null);
    } catch (error) {
      // Si l'identité Firebase refuse sa suppression (reconnexion récente
      // requise), remettre immédiatement les données cloud depuis le cache.
      // L'utilisateur conserve alors son compte et peut se reconnecter avant
      // de refaire la demande, au lieu de perdre ses données à moitié.
      if (user && backup) {
        try {
          await restoreUserData(user.uid, backup);
          setSyncError(null);
        } catch (restoreError) {
          console.warn('Restauration après suppression interrompue échouée', restoreError);
          setSyncError(restoreError);
        }
      }
      throw error;
    }
  }

  // ── Calculs dérivés (accessibles partout dans l'app) ──────────────────────
  const stats = profile ? computeStats(profile) : null;

  return (
    <UserContext.Provider value={{
      profile, loading, firebaseUser, syncError, subscription,
      updateProfile, saveDailyConsumption, recordCraving,
      resetProfile, deleteAccount, refreshSubscription, stats,
    }}>
      {children}
    </UserContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser must be used inside <UserProvider>');
  return ctx;
}

// ─── Source unique de vérité pour toutes les stats ───────────────────────────
function computeStats(profile) {
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
  const baselineDeclared = consoAvantDeclaree === true
    || (consoDeclaree !== null && consoDeclaree !== undefined && Number.isFinite(Number(consoDeclaree)));
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
