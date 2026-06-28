import React, { createContext, useContext, useState, useEffect } from 'react';
import { loadProfile, saveProfile, clearProfile } from '../store/onboardingStore';
import { subscribeToAuth, signOut as firebaseSignOut } from '../services/authService';

// ─── Contexte ────────────────────────────────────────────────────────────────
const UserContext = createContext(null);

// ─── Provider ────────────────────────────────────────────────────────────────
export function UserProvider({ children }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [firebaseUser, setFirebaseUser] = useState(undefined); // undefined = pas encore connu

  // Écoute l'état Firebase auth
  useEffect(() => {
    const unsub = subscribeToAuth((user) => {
      setFirebaseUser(user ?? null);
    });
    return unsub;
  }, []);

  // Charge le profil local quand l'auth est connue
  useEffect(() => {
    if (firebaseUser === undefined) return; // en attente
    (async () => {
      const saved = await loadProfile();
      setProfile(saved);
      setLoading(false);
    })();
  }, [firebaseUser]);

  // Met à jour une ou plusieurs clés du profil + persiste
  async function updateProfile(changes) {
    const updated = { ...profile, ...changes };
    setProfile(updated);
    await saveProfile(updated);
  }

  // Réinitialise tout (déconnexion / reset)
  async function resetProfile() {
    await clearProfile();
    setProfile(null);
    await firebaseSignOut();
  }

  // ── Calculs dérivés (accessibles partout dans l'app) ──────────────────────
  const stats = profile ? computeStats(profile) : null;

  return (
    <UserContext.Provider value={{ profile, loading, firebaseUser, updateProfile, resetProfile, stats }}>
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

// ─── Calculs des stats en temps réel ─────────────────────────────────────────
function computeStats(profile) {
  const {
    dateArretSouhaitee,
    consoAvantApp = 0,
    prixPaquet = 0,
    cigarettesParPaquet = 20,
    createdAt,
  } = profile;

  // Date de départ : date d'arrêt souhaitée ou date d'inscription
  const startDate = dateArretSouhaitee
    ? new Date(dateArretSouhaitee)
    : createdAt
    ? new Date(createdAt)
    : new Date();

  const now = new Date();
  const diffMs = Math.max(0, now - startDate);
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHeures = Math.floor(diffMinutes / 60);
  const diffJours = Math.floor(diffHeures / 24);

  // Prix cigarette unitaire
  const prixCigarette = cigarettesParPaquet > 0 ? prixPaquet / cigarettesParPaquet : 0;

  // Cigarettes non fumées depuis l'arrêt
  const cigarettesNonFumees = Math.floor((consoAvantApp / 24 / 60) * diffMinutes);

  // Argent économisé
  const argentEconomise = cigarettesNonFumees * prixCigarette;

  // Durée formatée
  const duree = formatDuree(diffJours, diffHeures % 24, diffMinutes % 60, diffSeconds % 60);

  return {
    startDate,
    diffMs,
    diffSeconds,
    diffMinutes,
    diffHeures,
    diffJours,
    cigarettesNonFumees,
    argentEconomise: Math.round(argentEconomise * 100) / 100,
    prixCigarette: Math.round(prixCigarette * 100) / 100,
    duree,
    // Bénéfices santé (timeline standard post-arrêt tabac)
    beneficesSante: getBeneficesSante(diffHeures),
  };
}

function formatDuree(jours, heures, minutes, secondes) {
  if (jours > 0) return { valeur: jours, unite: jours === 1 ? 'jour' : 'jours', detail: `${heures}h ${minutes}min` };
  if (heures > 0) return { valeur: heures, unite: heures === 1 ? 'heure' : 'heures', detail: `${minutes}min ${secondes}s` };
  if (minutes > 0) return { valeur: minutes, unite: minutes === 1 ? 'minute' : 'minutes', detail: `${secondes} secondes` };
  return { valeur: secondes, unite: 'secondes', detail: '' };
}

function getBeneficesSante(heures) {
  const tous = [
    { heures: 0.33,  label: 'Tension artérielle', description: 'Votre tension revient à la normale', done: false },
    { heures: 8,     label: 'Oxygène', description: 'Le taux de CO dans le sang diminue de moitié', done: false },
    { heures: 24,    label: 'Cœur', description: 'Risque de crise cardiaque diminué', done: false },
    { heures: 48,    label: 'Goût & Odorat', description: 'Vos sens du goût et de l\'odorat s\'améliorent', done: false },
    { heures: 72,    label: 'Respiration', description: 'Respiration plus facile, bronches détendues', done: false },
    { heures: 24*14, label: 'Circulation', description: 'Circulation sanguine améliorée', done: false },
    { heures: 24*30, label: 'Poumons', description: 'Capacité pulmonaire en hausse de 30%', done: false },
    { heures: 24*365,label: 'Risque AVC', description: 'Risque d\'AVC équivalent à un non-fumeur', done: false },
  ];

  return tous.map(b => ({ ...b, done: heures >= b.heures }));
}
