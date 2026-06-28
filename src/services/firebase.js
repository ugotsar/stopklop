import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeAuth, getAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey:            'AIzaSyAAaJxb8PMlPUjSfSvbg2bSrjS3Z-fBbCM',
  authDomain:        'stopklop-413e1.firebaseapp.com',
  projectId:         'stopklop-413e1',
  storageBucket:     'stopklop-413e1.firebasestorage.app',
  messagingSenderId: '96875002607',
  appId:             '1:96875002607:web:65d31b73044e50eb60791a',
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Auth avec persistance AsyncStorage — try/catch pour éviter l'erreur au hot-reload
let auth;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch {
  auth = getAuth(app);
}

export { auth };
export const db = getFirestore(app);
