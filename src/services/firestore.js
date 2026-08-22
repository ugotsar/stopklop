import { db } from './firebase';
import {
  collection,
  deleteDoc,
  deleteField,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  writeBatch,
} from 'firebase/firestore';
import { localDateKey } from '../utils/dateKeys';

// Les événements de consommation ne doivent jamais être enregistrés dans le
// document `users/{uid}` : ce document possède une limite Firestore de 1 Mio.
// Le profil reste léger ; les données qui grandissent vivent en sous-collections.
const ACTIVITY_FIELDS = new Set(['historique', 'cigLog', 'envies', 'cigarettesToday', 'lastSavedDate']);

function serializableProfile(data = {}) {
  return Object.fromEntries(Object.entries(data).filter(([key]) => !ACTIVITY_FIELDS.has(key)));
}

function asDate(value) {
  return value?.toDate ? value.toDate() : value;
}

function normalizeProfile(data) {
  if (!data) return null;
  const profile = { ...data };
  ['createdAt', 'startDate', 'dateArretSouhaitee', 'updatedAt', 'onboardingCompletedAt', 'planStartDate']
    .forEach(key => { profile[key] = asDate(profile[key]); });
  return profile;
}

function normalizeDays(snapshot) {
  const historique = {};
  const cigLog = [];
  snapshot.forEach(item => {
    const data = item.data() ?? {};
    const dateKey = data.dateKey ?? item.id;
    historique[dateKey] = Number(data.cigarettes ?? 0);
    if (Array.isArray(data.entries)) cigLog.push(...data.entries.filter(ts => typeof ts === 'string'));
  });
  return { historique, cigLog: [...new Set(cigLog)].sort() };
}

function normalizeCravings(snapshot) {
  const envies = [];
  snapshot.forEach(item => {
    const data = item.data() ?? {};
    if (!data.ts || !data.trigger) return;
    envies.push({
      id: item.id,
      ts: data.ts,
      trigger: data.trigger,
      ...(data.note ? { note: data.note } : {}),
      fume: !!data.fume,
    });
  });
  return envies.sort((a, b) => new Date(a.ts) - new Date(b.ts));
}

function composeUserData(profile, daysSnapshot, cravingsSnapshot) {
  if (!profile) return null;
  const activity = normalizeDays(daysSnapshot);
  const envies = normalizeCravings(cravingsSnapshot);
  const todayKey = localDateKey();

  // Compatibilité avec les profils créés avant la migration. Dès qu'une vraie
  // sous-collection existe, elle devient la seule référence cloud.
  const useLegacyDays = daysSnapshot.empty && profile.historique && typeof profile.historique === 'object';
  const useLegacyCravings = cravingsSnapshot.empty && Array.isArray(profile.envies);
  const historique = useLegacyDays ? profile.historique : activity.historique;
  const cigLog = useLegacyDays ? (Array.isArray(profile.cigLog) ? profile.cigLog : []) : activity.cigLog;
  const allEnvies = useLegacyCravings ? profile.envies : envies;

  return {
    ...profile,
    historique,
    cigLog,
    envies: allEnvies,
    cigarettesToday: historique[todayKey] ?? 0,
    lastSavedDate: historique[todayKey] !== undefined ? todayKey : null,
  };
}

// ── Profil utilisateur ─────────────────────────────────────────────────────
export async function getProfile(uid) {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? normalizeProfile(snap.data()) : null;
}

export async function getUserData(uid) {
  const [profile, days, cravings] = await Promise.all([
    getProfile(uid),
    getDocs(collection(db, 'users', uid, 'days')),
    getDocs(collection(db, 'users', uid, 'cravings')),
  ]);
  return composeUserData(profile, days, cravings);
}

export async function saveProfile(uid, data) {
  const ref = doc(db, 'users', uid);
  await setDoc(ref, { ...serializableProfile(data), updatedAt: serverTimestamp() }, { merge: true });
}

// ── Données journalières ───────────────────────────────────────────────────
export async function saveDay(uid, dateKey, { cigarettes = 0, entries = [] } = {}) {
  const ref = doc(db, 'users', uid, 'days', dateKey);
  await setDoc(ref, {
    dateKey,
    cigarettes: Math.max(0, Math.round(Number(cigarettes) || 0)),
    entries: [...new Set((Array.isArray(entries) ? entries : []).filter(ts => typeof ts === 'string'))].sort(),
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

// Écrit le compteur journalier ET les éventuels déclencheurs dans le même
// batch Firestore. Une journée ne peut ainsi pas être enregistrée à moitié
// (ex. compteur mis à jour mais raison de la cigarette perdue).
export async function saveDailyActivity(uid, dateKey, { cigarettes = 0, entries = [], cravings = [] } = {}) {
  const batch = writeBatch(db);
  const dayRef = doc(db, 'users', uid, 'days', dateKey);
  batch.set(dayRef, {
    dateKey,
    cigarettes: Math.max(0, Math.round(Number(cigarettes) || 0)),
    entries: [...new Set((Array.isArray(entries) ? entries : []).filter(ts => typeof ts === 'string'))].sort(),
    updatedAt: serverTimestamp(),
  }, { merge: true });

  (Array.isArray(cravings) ? cravings : [])
    .filter(item => item?.ts && item?.trigger)
    .forEach(item => {
      const ref = item.id
        ? doc(db, 'users', uid, 'cravings', item.id)
        : doc(collection(db, 'users', uid, 'cravings'));
      batch.set(ref, {
        ts: item.ts,
        dayKey: localDateKey(item.ts),
        trigger: item.trigger,
        ...(item.note ? { note: item.note } : {}),
        fume: !!item.fume,
        updatedAt: serverTimestamp(),
      }, { merge: true });
    });

  await batch.commit();
}

export async function saveCravings(uid, cravings = []) {
  const valid = (Array.isArray(cravings) ? cravings : [])
    .filter(item => item?.ts && item?.trigger);
  if (!valid.length) return;

  let batch = writeBatch(db);
  let writes = 0;
  for (const item of valid) {
    const ref = item.id
      ? doc(db, 'users', uid, 'cravings', item.id)
      : doc(collection(db, 'users', uid, 'cravings'));
    batch.set(ref, {
      ts: item.ts,
      dayKey: localDateKey(item.ts),
      trigger: item.trigger,
      ...(item.note ? { note: item.note } : {}),
      fume: !!item.fume,
      updatedAt: serverTimestamp(),
    }, { merge: true });
    writes++;
    // Firestore accepte au plus 500 opérations par batch. 400 garde une
    // marge et fonctionne aussi avec des historiques très fournis.
    if (writes >= 400) {
      await batch.commit();
      batch = writeBatch(db);
      writes = 0;
    }
  }
  if (writes > 0) await batch.commit();
}

// Migration sans perte des profils historiques (ancien format : gros tableau
// dans users/{uid}). L'opération est idempotente : relancer l'app n'ajoute pas
// de doublons grâce aux identifiants déterministes.
export async function migrateLegacyActivity(uid, profile) {
  const historique = profile?.historique;
  const legacyEnvies = Array.isArray(profile?.envies) ? profile.envies : [];
  if ((!historique || !Object.keys(historique).length) && !legacyEnvies.length) return false;

  const [daysSnap, cravingsSnap] = await Promise.all([
    getDocs(collection(db, 'users', uid, 'days')),
    getDocs(collection(db, 'users', uid, 'cravings')),
  ]);
  const entries = Array.isArray(profile?.cigLog) ? profile.cigLog : [];
  const existingDayIds = new Set(daysSnap.docs.map(item => item.id));
  const existingCravingIds = new Set(cravingsSnap.docs.map(item => item.id));
  let batch = writeBatch(db);
  let writes = 0;
  async function flushIfNeeded(force = false) {
    if (writes === 0 || (!force && writes < 400)) return;
    await batch.commit();
    batch = writeBatch(db);
    writes = 0;
  }
  let changed = false;
  for (const [dateKey, cigarettes] of Object.entries(historique ?? {})) {
    // Une donnée déjà dans une sous-collection est plus récente : elle reste
    // prioritaire. On ne migre que les jours absents pour ne rien écraser.
    if (existingDayIds.has(dateKey)) continue;
    const dailyEntries = entries.filter(ts => localDateKey(ts) === dateKey);
    batch.set(doc(db, 'users', uid, 'days', dateKey), {
      dateKey,
      cigarettes: Math.max(0, Math.round(Number(cigarettes) || 0)),
      entries: dailyEntries,
      updatedAt: serverTimestamp(),
    }, { merge: true });
    writes++;
    changed = true;
    await flushIfNeeded();
  }
  for (let index = 0; index < legacyEnvies.length; index++) {
    const item = legacyEnvies[index];
    if (!item?.ts || !item?.trigger) continue;
    const id = item.id ?? `legacy_${String(index).padStart(6, '0')}_${String(item.ts).replace(/[^0-9]/g, '')}`;
    if (existingCravingIds.has(id)) continue;
    batch.set(doc(db, 'users', uid, 'cravings', id), {
      ts: item.ts,
      dayKey: localDateKey(item.ts),
      trigger: item.trigger,
      ...(item.note ? { note: item.note } : {}),
      fume: !!item.fume,
      updatedAt: serverTimestamp(),
    }, { merge: true });
    writes++;
    changed = true;
    await flushIfNeeded();
  }
  // Ne supprimer les champs historiques qu'après avoir écrit toutes les
  // sous-collections. Ce dernier batch ne s'exécute qu'en cas de succès des
  // précédents : aucune migration partielle ne peut effacer la source legacy.
  batch.set(doc(db, 'users', uid), {
    historique: deleteField(),
    cigLog: deleteField(),
    envies: deleteField(),
    cigarettesToday: deleteField(),
    lastSavedDate: deleteField(),
    updatedAt: serverTimestamp(),
  }, { merge: true });
  writes++;
  changed = true;
  await flushIfNeeded(true);
  return changed;
}

// Utilisé uniquement pour compenser une suppression de compte interrompue
// (par exemple si Firebase exige une reconnexion récente avant deleteUser()).
// Le cache local reste la sauvegarde de secours tant que la suppression n'a
// pas entièrement réussi.
export async function restoreUserData(uid, profile = {}) {
  await saveProfile(uid, profile);
  const historique = profile?.historique && typeof profile.historique === 'object'
    ? profile.historique : {};
  const cigLog = Array.isArray(profile?.cigLog) ? profile.cigLog : [];
  for (const [dateKey, cigarettes] of Object.entries(historique)) {
    const entries = cigLog.filter(ts => localDateKey(ts) === dateKey);
    await saveDay(uid, dateKey, { cigarettes, entries });
  }
  await saveCravings(uid, Array.isArray(profile?.envies) ? profile.envies : []);
}

// Écoute en temps réel : les trois sources cloud sont recomposées dans la même
// structure que celle attendue par l'interface.
export function subscribeToUserData(uid, onData, onError) {
  let profile = null;
  let days = [];
  let cravings = [];
  let profileReady = false;
  let daysReady = false;
  let cravingsReady = false;
  const fakeSnapshot = values => ({
    empty: values.length === 0,
    forEach: callback => values.forEach(callback),
  });
  const emit = () => {
    if (!profile || !profileReady || !daysReady || !cravingsReady) return;
    onData(composeUserData(profile, fakeSnapshot(days), fakeSnapshot(cravings)));
  };

  const unsubs = [
    onSnapshot(doc(db, 'users', uid), snap => {
      profile = snap.exists() ? normalizeProfile(snap.data()) : null;
      profileReady = true;
      emit();
    }, onError),
    onSnapshot(collection(db, 'users', uid, 'days'), snap => {
      days = snap.docs;
      daysReady = true;
      emit();
    }, onError),
    onSnapshot(collection(db, 'users', uid, 'cravings'), snap => {
      cravings = snap.docs;
      cravingsReady = true;
      emit();
    }, onError),
  ];
  return () => unsubs.forEach(unsub => unsub());
}

// ── Suppression de compte ───────────────────────────────────────────────────
async function deleteCollectionInBatches(collectionRef) {
  while (true) {
    const snapshot = await getDocs(query(collectionRef, limit(400)));
    if (snapshot.empty) return;
    const batch = writeBatch(db);
    snapshot.docs.forEach(document => batch.delete(document.ref));
    await batch.commit();
  }
}

export async function deleteUserData(uid) {
  if (!uid) throw new Error('missing-user-id');
  await Promise.all([
    deleteCollectionInBatches(collection(db, 'users', uid, 'days')),
    deleteCollectionInBatches(collection(db, 'users', uid, 'cravings')),
  ]);
  await deleteDoc(doc(db, 'users', uid));
}
