import { initializeApp } from 'firebase/app';
import { deleteUser, getAuth, signInAnonymously } from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  limit,
  query,
  setDoc,
  writeBatch,
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyAAaJxb8PMlPUjSfSvbg2bSrjS3Z-fBbCM',
  authDomain: 'stopklop-413e1.firebaseapp.com',
  projectId: 'stopklop-413e1',
  appId: '1:96875002607:web:65d31b73044e50eb60791a',
};

if (firebaseConfig.projectId !== 'stopklop-413e1') {
  throw new Error('Refusing to run against an unexpected Firebase project.');
}

const app = initializeApp(firebaseConfig, `deletion-smoke-${Date.now()}`);
const auth = getAuth(app);
const db = getFirestore(app);

async function deleteCollectionInBatches(collectionRef) {
  while (true) {
    const snapshot = await getDocs(query(collectionRef, limit(400)));
    if (snapshot.empty) return;
    const batch = writeBatch(db);
    snapshot.docs.forEach(document => batch.delete(document.ref));
    await batch.commit();
  }
}

async function deleteUserData(uid) {
  await deleteCollectionInBatches(collection(db, 'users', uid, 'days'));
  await deleteCollectionInBatches(collection(db, 'users', uid, 'cravings'));
  await deleteDoc(doc(db, 'users', uid));
}

const credential = await signInAnonymously(auth);
const user = credential.user;
const uid = user.uid;
const idToken = await user.getIdToken();

try {
  // Le schéma actuel (post-migration sous-collections) exige `dateKey` sur
  // chaque jour et `ts`/`trigger`/`fume` sur chaque envie — voir firestore.rules.
  await setDoc(doc(db, 'users', uid), { onboardingComplete: true });
  await setDoc(doc(db, 'users', uid, 'days', 'day-1'), { dateKey: 'day-1', cigarettes: 1, entries: [] });
  await setDoc(doc(db, 'users', uid, 'days', 'day-2'), { dateKey: 'day-2', cigarettes: 0, entries: [] });
  await setDoc(doc(db, 'users', uid, 'cravings', 'craving-1'), {
    ts: new Date().toISOString(), dayKey: 'day-1', trigger: 'stress', fume: false,
  });

  await deleteUserData(uid);

  const [profile, days, cravings] = await Promise.all([
    getDoc(doc(db, 'users', uid)),
    getDocs(collection(db, 'users', uid, 'days')),
    getDocs(collection(db, 'users', uid, 'cravings')),
  ]);
  if (profile.exists()) throw new Error('The /users/{uid} document still exists.');
  if (!days.empty) throw new Error('The /users/{uid}/days collection still contains data.');
  if (!cravings.empty) throw new Error('The /users/{uid}/cravings collection still contains data.');

  await deleteUser(user);
  if (auth.currentUser !== null) throw new Error('Firebase Auth still has a current user.');

  const lookupResponse = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${firebaseConfig.apiKey}`,
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ idToken }),
    },
  );
  if (lookupResponse.ok) throw new Error('The deleted Firebase Auth user is still retrievable.');

  console.log(JSON.stringify({
    ok: true,
    checks: {
      guestAccountDeleted: true,
      firestoreProfileDeleted: true,
      firestoreDaysDeleted: true,
      firestoreCravingsDeleted: true,
      firebaseAuthDeleted: true,
    },
  }, null, 2));
} catch (error) {
  if (auth.currentUser?.uid === uid) {
    try {
      await deleteUserData(uid);
    } catch {
      // Firestore cleanup is best effort; Auth cleanup must still run.
    }
    try {
      await deleteUser(auth.currentUser);
    } catch {
      // Keep the original failure.
    }
  }
  throw error;
}
