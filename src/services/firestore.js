import { db } from './firebase';
import {
  doc, getDoc, setDoc, updateDoc, serverTimestamp,
} from 'firebase/firestore';

// ── Profil utilisateur ────────────────────────────────────────────────────────

export async function getProfile(uid) {
  const ref  = doc(db, 'users', uid);
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data() : null;
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
