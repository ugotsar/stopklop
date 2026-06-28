import { db } from './firebase';
import {
  doc, getDoc, setDoc, updateDoc, serverTimestamp,
} from 'firebase/firestore';

// ── Profil utilisateur ────────────────────────────────────────────────────────

export async function getProfile(uid) {
  const ref  = doc(db, 'users', uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  const data = snap.data();
  // Convertir les Timestamps Firestore en Date JS
  ['createdAt', 'startDate', 'dateArretSouhaitee', 'updatedAt'].forEach(k => {
    if (data[k]?.toDate) data[k] = data[k].toDate();
  });
  return data;
}

export async function saveProfile(uid, data) {
  const ref = doc(db, 'users', uid);
  await setDoc(ref, { ...data, updatedAt: serverTimestamp() }, { merge: true });
}

export async function updateProfile(uid, partial) {
  const ref = doc(db, 'users', uid);
  await updateDoc(ref, { ...partial, updatedAt: serverTimestamp() });
}

// ── Journée (cigarettes du jour) ──────────────────────────────────────────────

export async function saveDay(uid, dateStr, data) {
  // dateStr format : "2026-06-28"
  const ref = doc(db, 'users', uid, 'days', dateStr);
  await setDoc(ref, { ...data, savedAt: serverTimestamp() }, { merge: true });
}

export async function getDay(uid, dateStr) {
  const ref  = doc(db, 'users', uid, 'days', dateStr);
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data() : null;
}
