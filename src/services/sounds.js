import { Platform } from 'react-native';
import { Audio } from 'expo-av';

// ── Map de tous les fichiers audio ───────────────────────────────────────────
const SOUND_FILES = {
  click_increment:     require('../../assets/sounds/click_increment.wav'),
  click_decrement:     require('../../assets/sounds/click_decrement.wav'),
  enregistrer_zero:    require('../../assets/sounds/enregistrer_zero.wav'),
  enregistrer_objectif:require('../../assets/sounds/enregistrer_objectif.wav'),
  enregistrer_depasse: require('../../assets/sounds/enregistrer_depasse.wav'),
  valider_journee:     require('../../assets/sounds/valider_journee.wav'),
  milestone_24h:       require('../../assets/sounds/milestone_24h.wav'),
  milestone_7j:        require('../../assets/sounds/milestone_7j.wav'),
  milestone_30j:       require('../../assets/sounds/milestone_30j.wav'),
  badge_debloque:      require('../../assets/sounds/badge_debloque.wav'),
  onboarding_step:     require('../../assets/sounds/onboarding_step.wav'),
  motivation_like:     require('../../assets/sounds/motivation_like.wav'),
};

// ── Cache des objets Sound chargés ───────────────────────────────────────────
const cache = {};
let audioConfigured = false;

async function configureAudio() {
  if (audioConfigured || Platform.OS === 'web') return;
  await Audio.setAudioModeAsync({
    playsInSilentModeIOS: true,
    staysActiveInBackground: false,
  });
  audioConfigured = true;
}

// ── Jouer un son par nom ──────────────────────────────────────────────────────
export async function jouerSon(nom) {
  if (Platform.OS === 'web') return;

  try {
    await configureAudio();

    // Libérer le précédent si déjà en cache
    if (cache[nom]) {
      await cache[nom].stopAsync().catch(() => {});
      await cache[nom].setPositionAsync(0).catch(() => {});
      await cache[nom].playAsync();
      return;
    }

    const { sound } = await Audio.Sound.createAsync(SOUND_FILES[nom], {
      shouldPlay: true,
      volume: 1.0,
    });

    cache[nom] = sound;

    // Libérer la mémoire une fois le son terminé (mais garder en cache pour replay)
    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.didJustFinish) {
        sound.setPositionAsync(0).catch(() => {});
      }
    });
  } catch (e) {
    console.warn('[son] erreur jouerSon(' + nom + '):', e?.message ?? e);
  }
}

// ── Préchargement optionnel au démarrage ──────────────────────────────────────
export async function prechargerSons() {
  if (Platform.OS === 'web') return;
  await configureAudio();

  // Précharger les sons fréquents en priorité
  const prioritaires = ['click_increment', 'click_decrement', 'valider_journee', 'enregistrer_objectif'];
  for (const nom of prioritaires) {
    try {
      const { sound } = await Audio.Sound.createAsync(SOUND_FILES[nom]);
      cache[nom] = sound;
    } catch (_) {}
  }
}

// ── Libérer tous les sons (cleanup) ──────────────────────────────────────────
export async function libererSons() {
  for (const sound of Object.values(cache)) {
    await sound.unloadAsync().catch(() => {});
  }
  Object.keys(cache).forEach((k) => delete cache[k]);
}
