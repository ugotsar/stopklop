import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { loadProfile, saveProfile, clearProfile, setProfileOwner } from '../store/onboardingStore';
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
import { localDateKey } from '../utils/dateKeys';
import { computeStats } from '../utils/stats';
import { applyDailyConsumption } from '../utils/dailyConsumption';
import { IS_DEMO_BUILD } from '../config/demoMode';
import { buildDemoProfile } from '../utils/demoData';
import { buildWidgetSnapshot } from '../widget/snapshot';
import { clearWidget, syncWidget } from '../widget/syncWidget';
import { grantTestAccess, loadTestAccess } from '../services/testAccess';

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
  // ⚠️ TEMPORAIRE : accès sans abonnement tant que les stores n'en proposent
  // aucun (voir src/services/testAccess.js). À retirer avant la mise en vente.
  const [testAccess, setTestAccess] = useState(false);
  useEffect(() => { loadTestAccess().then(setTestAccess); }, []);
  async function allowTestAccess() {
    await grantTestAccess();
    setTestAccess(true);
  }
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
    setProfileOwner(firebaseUser?.uid ?? null);
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
    const { profile: updated, count, newCravings } = applyDailyConsumption(
      profileRef.current,
      { dateKey, cigarettes, entries, cravings },
    );
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
    clearWidget();
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
      clearWidget();
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

  // Le widget d'écran d'accueil lit un instantané : on ne le réécrit que si son
  // contenu change, pas à chaque rendu.
  const widgetSnapshot = stats ? JSON.stringify(buildWidgetSnapshot(stats, profile)) : null;
  useEffect(() => {
    if (widgetSnapshot) syncWidget(JSON.parse(widgetSnapshot));
  }, [widgetSnapshot]);

  // Le widget peut être ajouté après le dernier calcul : on réécrit l'instantané
  // à chaque retour dans l'app pour qu'il ne reste jamais vide.
  useEffect(() => {
    const sub = AppState.addEventListener('change', etat => {
      if (etat === 'active' && widgetSnapshot) syncWidget(JSON.parse(widgetSnapshot));
    });
    return () => sub.remove();
  }, [widgetSnapshot]);

  return (
    <UserContext.Provider value={{
      profile, loading, firebaseUser, syncError, subscription,
      updateProfile, saveDailyConsumption, recordCraving,
      resetProfile, deleteAccount, refreshSubscription, stats,
      testAccess, allowTestAccess,
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

