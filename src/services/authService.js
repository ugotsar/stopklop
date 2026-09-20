import { auth } from './firebase';
import {
  GoogleAuthProvider,
  OAuthProvider,
  createUserWithEmailAndPassword,
  signInWithCredential,
  signInWithEmailAndPassword,
  deleteUser,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from 'firebase/auth';
import * as Google from 'expo-auth-session/providers/google';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

// Chaque plateforme a son propre client OAuth Google. Un client Web ne peut
// pas servir de client iOS lors d'une authentification native.
const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID
  ?? '96875002607-7f342hira5brbv9qiokn2qt5fn6b25ft.apps.googleusercontent.com';
const GOOGLE_IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID
  ?? '96875002607-cgdatuce0q3c8mn26p1ak3s3fqp0l9c6.apps.googleusercontent.com';
// Android n'utilise pas d'identifiant dans le code : Google reconnaît l'app à
// l'empreinte SHA-1 de sa clé de signature, déclarée dans Firebase (faite le
// 20/09/2026 pour la clé de build EAS). À la mise en ligne sur le Play Store,
// ajouter aussi la SHA-1 de la clé de signature Google Play, sinon Google
// marchera en build interne mais pas depuis le Store.
const GOOGLE_ANDROID_READY = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_READY !== 'false';

// Le hook expo-auth-session exige une valeur native au rendu. Ce repli ne sert
// qu'à empêcher l'écran de planter : le bouton reste bloqué sans vraie clé.
const GOOGLE_HOOK_FALLBACK_CLIENT_ID = GOOGLE_WEB_CLIENT_ID
  || 'stopklop-placeholder.apps.googleusercontent.com';

// Connexion Google native (feuille de comptes du téléphone, sans navigateur).
// Absente d'Expo Go et du Web : on retombe alors sur expo-auth-session.
let GoogleNative = null;
let GoogleNativeCodes = null;
if (Platform.OS !== 'web') {
  try {
    const mod = require('@react-native-google-signin/google-signin');
    GoogleNative = mod.GoogleSignin;
    GoogleNativeCodes = mod.statusCodes;
    GoogleNative.configure({
      webClientId: GOOGLE_WEB_CLIENT_ID,          // requis pour obtenir un idToken
      iosClientId: GOOGLE_IOS_CLIENT_ID || undefined,
      offlineAccess: false,
    });
  } catch (_) {
    GoogleNative = null; // module natif absent (Expo Go) : bouton masqué
  }
}
// ── Écouter l'état de connexion ───────────────────────────────────────────────
export function subscribeToAuth(callback) {
  return onAuthStateChanged(auth, callback);
}

// ── Déconnexion ───────────────────────────────────────────────────────────────
export async function signOut() {
  await firebaseSignOut(auth);
}

export async function deleteCurrentUser() {
  const user = auth.currentUser;
  if (!user) return;
  await deleteUser(user);
}

export function isRecentLoginRequired(error) {
  return error?.code === 'auth/requires-recent-login';
}

// ── Connexion e-mail / mot de passe ─────────────────────────────────────────
// Le provider Email/Password doit être activé dans Firebase Authentication.
// Les erreurs Firebase sont volontairement propagées à l'écran afin de ne pas
// faire croire à l'utilisateur qu'un compte a été créé lorsqu'il ne l'est pas.
export async function createAccountWithEmail(email, password) {
  return createUserWithEmailAndPassword(auth, email.trim(), password);
}

export async function signInWithEmail(email, password) {
  return signInWithEmailAndPassword(auth, email.trim(), password);
}

// ── Connexion Google ──────────────────────────────────────────────────────────
export function useGoogleAuth() {
  const native = GoogleNative != null;
  const configured = Platform.select({
    ios: native && Boolean(GOOGLE_IOS_CLIENT_ID),
    android: native && GOOGLE_ANDROID_READY,
    default: Boolean(GOOGLE_WEB_CLIENT_ID),
  });

  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: GOOGLE_WEB_CLIENT_ID || GOOGLE_HOOK_FALLBACK_CLIENT_ID,
    iosClientId: GOOGLE_IOS_CLIENT_ID || GOOGLE_HOOK_FALLBACK_CLIENT_ID,
    androidClientId: GOOGLE_HOOK_FALLBACK_CLIENT_ID,
    selectAccount: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (response?.type === 'success') {
      const idToken = response.params?.id_token ?? response.authentication?.idToken;
      if (!idToken) {
        setError(new Error('google-id-token-missing'));
        setLoading(false);
        return;
      }
      signInWithCredential(auth, GoogleAuthProvider.credential(idToken))
        .catch(setError)
        .finally(() => setLoading(false));
    } else if (response?.type === 'error') {
      setError(response.error ?? new Error('google-auth-failed'));
      setLoading(false);
    }
  }, [response]);

  async function signInWithGoogle() {
    if (!configured) {
      setError(new Error('google-auth-not-configured'));
      return;
    }
    setLoading(true);
    setError(null);

    // Téléphone : feuille de comptes native, puis on échange le jeton Google
    // contre une session Firebase.
    if (native) {
      try {
        if (Platform.OS === 'android') await GoogleNative.hasPlayServices({ showPlayServicesUpdateDialog: true });
        const result = await GoogleNative.signIn();
        const idToken = result?.data?.idToken ?? result?.idToken;
        if (!idToken) throw new Error('google-id-token-missing');
        await signInWithCredential(auth, GoogleAuthProvider.credential(idToken));
      } catch (e) {
        // Fermer la feuille de comptes n'est pas une erreur à afficher.
        const annule = e?.code === GoogleNativeCodes?.SIGN_IN_CANCELLED;
        if (!annule) setError(e);
      } finally {
        setLoading(false);
      }
      return;
    }

    try {
      await promptAsync();
    } catch (e) {
      setError(e);
      setLoading(false);
    }
  }

  return { request: native ? true : request, signInWithGoogle, loading, error, configured };
}

// ── Connexion Apple ───────────────────────────────────────────────────────────
// « Se connecter avec Apple » n'existe que sur iPhone : ailleurs (Android, Web)
// le bouton est masqué au lieu d'échouer au clic.
export function useAppleAuthAvailable() {
  const [available, setAvailable] = useState(false);
  useEffect(() => {
    if (Platform.OS !== 'ios') return;
    let alive = true;
    AppleAuthentication.isAvailableAsync()
      .then(ok => { if (alive) setAvailable(ok); })
      .catch(() => {});
    return () => { alive = false; };
  }, []);
  return available;
}

export async function signInWithApple() {
  const nonce     = Math.random().toString(36).substring(2, 10);
  const hashedNonce = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    nonce,
  );

  const credential = await AppleAuthentication.signInAsync({
    requestedScopes: [
      AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      AppleAuthentication.AppleAuthenticationScope.EMAIL,
    ],
    nonce: hashedNonce,
  });

  const provider    = new OAuthProvider('apple.com');
  const oAuthCred   = provider.credential({
    idToken: credential.identityToken,
    rawNonce: nonce,
  });

  return signInWithCredential(auth, oAuthCred);
}
