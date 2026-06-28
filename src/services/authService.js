import { auth } from './firebase';
import {
  GoogleAuthProvider,
  OAuthProvider,
  signInWithCredential,
  signInAnonymously,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from 'firebase/auth';
import * as Google from 'expo-auth-session/providers/google';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';

// ── Écouter l'état de connexion ───────────────────────────────────────────────
export function subscribeToAuth(callback) {
  return onAuthStateChanged(auth, callback);
}

// ── Déconnexion ───────────────────────────────────────────────────────────────
export async function signOut() {
  await firebaseSignOut(auth);
}

// ── Auth anonyme (test / dev) ─────────────────────────────────────────────────
export async function signInAsGuest() {
  return signInAnonymously(auth);
}

// ── Connexion Google ──────────────────────────────────────────────────────────
export function useGoogleAuth() {
  const [request, response, promptAsync] = Google.useAuthRequest({
    // À remplacer par ton vrai Client ID Web depuis Firebase Console
    // Paramètres > Général > Vos applications > Clé API web
    webClientId: '96875002607-7f342hira5brbv9qiokn2qt5fn6b25ft.apps.googleusercontent.com',
  });

  async function signInWithGoogle() {
    await promptAsync();
    if (response?.type === 'success') {
      const { id_token } = response.params;
      const credential = GoogleAuthProvider.credential(id_token);
      return signInWithCredential(auth, credential);
    }
  }

  return { request, signInWithGoogle };
}

// ── Connexion Apple ───────────────────────────────────────────────────────────
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
