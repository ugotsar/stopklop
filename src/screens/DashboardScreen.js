import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, Dimensions, Modal, TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { Image } from 'react-native';

const PICTOS = {
  temps:    require('../../assets/onboarding/stopklop-illustrations-hd/pictogrammes/10-dashboard-temps.jpg'),
  evitees:  require('../../assets/onboarding/stopklop-illustrations-hd/pictogrammes/11-dashboard-cigarettes-evitees.jpg'),
  objectif: require('../../assets/onboarding/stopklop-illustrations-hd/pictogrammes/12-dashboard-objectif.jpg'),
  economie: require('../../assets/onboarding/stopklop-illustrations-hd/pictogrammes/13-dashboard-economies.jpg'),
};
import { useUser } from '../context/UserContext';
import { colors, spacing, font, radius } from '../theme';
import { annulerNotificationSoir } from '../services/notifications';
import { jouerSon } from '../services/sounds';
import { buildDemoProfile } from '../utils/demoData';

const { width: SCREEN_W } = Dimensions.get('window');

// ── Modal journée parfaite ──────────────────────────────────────────────────
function ModalParfait({ visible, diffJours, objectifJour, prixCig, onClose }) {
  const streak = diffJours || 0;
  const vieGagneeMins = objectifJour * 5;
  const vieGagneeStr = vieGagneeMins >= 60
    ? `+${Math.floor(vieGagneeMins/60)}h ${vieGagneeMins%60}min`
    : `+${vieGagneeMins}min`;
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={mp.overlay}>
        <View style={mp.card}>
          <View style={mp.banner}>
            <Text style={mp.emoji}>🏆</Text>
            <View style={{ flex: 1 }}>
              <Text style={mp.titre}>Journée sans tabac !</Text>
              <Text style={mp.sous}>0 cigarette aujourd'hui</Text>
            </View>
          </View>
          <View style={mp.body}>
            <View style={mp.statsRow}>
              <StatColonne valeur={vieGagneeStr} label="vie récupérée" color="#1B6B3A" />
              <View style={mp.div} />
              <StatColonne valeur="0,00 €" label="dépensé" color="#1B6B3A" />
              <View style={mp.div} />
              <StatColonne valeur={`🔥 ${streak}j`} label="streak" color="#F59E0B" />
            </View>
            <TouchableOpacity style={mp.btn} onPress={onClose}>
              <Text style={mp.btnText}>Super, merci !</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function StatColonne({ valeur, label, color }) {
  return (
    <View style={{ alignItems: 'center', flex: 1 }}>
      <Text style={{ fontSize: 15, fontWeight: '700', color }}>{valeur}</Text>
      <Text style={{ fontSize: 10, color: colors.gray, marginTop: 2 }}>{label}</Text>
    </View>
  );
}

const mp = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28 },
  card:    { width: '100%', backgroundColor: colors.white, borderRadius: 20, overflow: 'hidden' },
  banner:  { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1B6B3A', paddingVertical: 16, paddingHorizontal: 18, gap: 12 },
  emoji:   { fontSize: 30 },
  titre:   { fontSize: 15, fontWeight: '700', color: '#fff' },
  sous:    { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  body:    { padding: 18 },
  statsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', backgroundColor: '#F9FAFB', borderRadius: 12, paddingVertical: 12, marginBottom: 16 },
  div:     { width: 1, height: 32, backgroundColor: colors.grayBorder },
  btn:     { backgroundColor: '#1B6B3A', borderRadius: 30, paddingVertical: 13, alignItems: 'center' },
  btnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
});

// ── Modal feedback journée (variante A = ok, variante B = dépassé) ───────────
function ModalObjectif({ visible, count, objectif, prixCigarette, onClose }) {
  const isOk      = count <= objectif;
  const depense   = (count * prixCigarette).toFixed(2);

  // Variante A — objectif respecté
  const pct          = isOk ? Math.round((count / objectif) * 100) : 0;
  const marge        = isOk ? Math.round(((objectif - count) / objectif) * 100) : 0;
  const viePreservee = isOk ? (objectif - count) * 5 : 0;

  // Variante B — objectif dépassé
  const exces      = !isOk ? count - objectif : 0;
  const viePerdue  = !isOk ? count * 5 : 0;
  const totalBar   = !isOk ? objectif + exces : 1;
  const pctObj     = !isOk ? Math.round((objectif / totalBar) * 100) : 0;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={mp.overlay}>
        <View style={[mp.card, { borderWidth: 0.5, borderColor: isOk ? '#C0DD97' : '#FCD34D' }]}>

          {/* ── Bandeau ── */}
          {isOk ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#EAF3DE', paddingVertical: 14, paddingHorizontal: 16, gap: 10, borderBottomWidth: 0.5, borderBottomColor: '#C0DD97' }}>
              <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: '#C0DD97', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 20 }}>✅</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: '#27500A' }}>Bien joué !</Text>
                <Text style={{ fontSize: 11, color: '#3B6D11', marginTop: 2 }}>Objectif respecté aujourd'hui</Text>
              </View>
            </View>
          ) : (
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#92400E', paddingVertical: 14, paddingHorizontal: 16, gap: 10 }}>
              <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 20 }}>⚠️</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: '#fff' }}>Objectif dépassé</Text>
                <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.8)', marginTop: 2 }}>{count} cig · +{exces} au-dessus</Text>
              </View>
            </View>
          )}

          {/* ── Corps ── */}
          <View style={{ padding: 16 }}>
            {isOk ? (
              <>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}>
                  <Text style={{ fontSize: 11, color: '#888' }}>{count} cigarette{count > 1 ? 's' : ''}</Text>
                  <Text style={{ fontSize: 11, color: '#888' }}>objectif : {objectif}</Text>
                </View>
                <View style={{ height: 7, backgroundColor: '#E5E7EB', borderRadius: 6, overflow: 'hidden', marginBottom: 4 }}>
                  <View style={{ height: '100%', width: `${pct}%`, backgroundColor: '#1B6B3A', borderRadius: 6 }} />
                </View>
                <Text style={{ fontSize: 10, color: '#1B6B3A', textAlign: 'right', marginBottom: 12 }}>{marge}% de marge</Text>
                <View style={{ flexDirection: 'row', gap: 8, marginBottom: 14 }}>
                  <View style={{ flex: 1, backgroundColor: '#EAF3DE', borderRadius: 10, paddingVertical: 8, alignItems: 'center' }}>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: '#27500A' }}>{depense} €</Text>
                    <Text style={{ fontSize: 10, color: '#1B6B3A', marginTop: 1 }}>dépensé</Text>
                  </View>
                  <View style={{ flex: 1, backgroundColor: '#EAF3DE', borderRadius: 10, paddingVertical: 8, alignItems: 'center' }}>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: '#27500A' }}>{viePreservee} min</Text>
                    <Text style={{ fontSize: 10, color: '#1B6B3A', marginTop: 1 }}>vie préservée</Text>
                  </View>
                </View>
                <TouchableOpacity style={{ backgroundColor: '#1B6B3A', borderRadius: 30, paddingVertical: 12, alignItems: 'center' }} onPress={onClose}>
                  <Text style={{ color: '#fff', fontSize: 14, fontWeight: '700' }}>C'est noté !</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}>
                  <Text style={{ fontSize: 11, color: '#92400E' }}>objectif : {objectif}</Text>
                  <Text style={{ fontSize: 11, color: '#DC2626' }}>+{exces} de trop</Text>
                </View>
                <View style={{ height: 7, borderRadius: 6, overflow: 'hidden', flexDirection: 'row', marginBottom: 4 }}>
                  <View style={{ height: '100%', width: `${pctObj}%`, backgroundColor: '#F59E0B' }} />
                  <View style={{ height: '100%', width: `${100 - pctObj}%`, backgroundColor: '#DC2626' }} />
                </View>
                <Text style={{ fontSize: 10, color: '#B45309', textAlign: 'center', marginBottom: 12 }}>{count} cigarettes fumées aujourd'hui</Text>
                <View style={{ flexDirection: 'row', gap: 8, marginBottom: 14 }}>
                  <View style={{ flex: 1, backgroundColor: '#FEF3C7', borderRadius: 10, paddingVertical: 8, alignItems: 'center' }}>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: '#92400E' }}>{depense} €</Text>
                    <Text style={{ fontSize: 10, color: '#B45309', marginTop: 1 }}>dépensé</Text>
                  </View>
                  <View style={{ flex: 1, backgroundColor: '#FEF3C7', borderRadius: 10, paddingVertical: 8, alignItems: 'center' }}>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: '#92400E' }}>{viePerdue} min</Text>
                    <Text style={{ fontSize: 10, color: '#B45309', marginTop: 1 }}>de vie</Text>
                  </View>
                </View>
                <View style={{ backgroundColor: '#FFF7ED', borderRadius: 10, borderWidth: 1, borderColor: '#FDE68A', padding: 12, marginBottom: 14 }}>
                  <Text style={{ fontSize: 13, color: '#92400E', lineHeight: 19, textAlign: 'center' }}>
                    Chaque jour est une nouvelle chance.{'\n'}Demain, vous pouvez le faire. 💪
                  </Text>
                </View>
                <TouchableOpacity style={{ backgroundColor: '#92400E', borderRadius: 30, paddingVertical: 12, alignItems: 'center' }} onPress={onClose}>
                  <Text style={{ color: '#fff', fontSize: 14, fontWeight: '700' }}>Compris !</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ── Déclencheurs d'envie de fumer ───────────────────────────────────────────
const DECLENCHEURS = [
  { key: 'stress',   emoji: '😰', label: 'Stress' },
  { key: 'ennui',    emoji: '😴', label: 'Ennui' },
  { key: 'cafe',     emoji: '☕', label: 'Café / pause' },
  { key: 'repas',    emoji: '🍽', label: 'Après repas' },
  { key: 'social',   emoji: '👥', label: 'Entourage' },
  { key: 'alcool',   emoji: '🍺', label: 'Soirée / alcool' },
  { key: 'habitude', emoji: '🚬', label: 'Habitude' },
  { key: 'autre',    emoji: '🤷', label: 'Autre' },
];

// ── Modal "J'ai envie de fumer" ─────────────────────────────────────────────
// Étapes : pick (choisir le déclencheur) → note (si "autre" : texte libre)
//          → result (conseils + issue : "j'ai tenu bon" ou "j'ai fumé")
function ModalEnvie({ visible, onSave, onClose }) {
  const [step, setStep]       = useState('pick');
  const [trigger, setTrigger] = useState(null);
  const [note, setNote]       = useState('');
  const [ts, setTs]           = useState(null);

  function reset() {
    setStep('pick'); setTrigger(null); setNote(''); setTs(null);
  }
  function handleClose() { reset(); onClose(); }

  function handleSelect(key) {
    setTrigger(key);
    setTs(new Date().toISOString()); // heure + jour de l'envie
    setStep(key === 'autre' ? 'note' : 'result');
  }

  async function handleOutcome(fume) {
    await onSave({ ts, trigger, note: note.trim() || null, fume });
    handleClose();
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <KeyboardAvoidingView
        style={mp.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={mp.card}>

          {step === 'pick' && (
            <>
              <View style={[mp.banner, { backgroundColor: '#B45309' }]}>
                <Text style={mp.emoji}>🔥</Text>
                <View style={{ flex: 1 }}>
                  <Text style={mp.titre}>Une envie de fumer ?</Text>
                  <Text style={mp.sous}>Qu'est-ce qui la déclenche ?</Text>
                </View>
              </View>
              <View style={mp.body}>
                <View style={env.grid}>
                  {DECLENCHEURS.map(d => (
                    <TouchableOpacity key={d.key} style={env.chip} onPress={() => handleSelect(d.key)}>
                      <Text style={{ fontSize: 22 }}>{d.emoji}</Text>
                      <Text style={env.chipLabel}>{d.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <TouchableOpacity onPress={handleClose} style={{ alignItems: 'center', paddingVertical: 8 }}>
                  <Text style={{ color: colors.gray, fontSize: 13 }}>Annuler</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          {step === 'note' && (
            <>
              <View style={[mp.banner, { backgroundColor: '#B45309' }]}>
                <Text style={mp.emoji}>✍️</Text>
                <View style={{ flex: 1 }}>
                  <Text style={mp.titre}>Dites-nous en plus</Text>
                  <Text style={mp.sous}>Que ressentez-vous ? Pourquoi cette envie ?</Text>
                </View>
              </View>
              <View style={mp.body}>
                <TextInput
                  style={env.noteInput}
                  value={note}
                  onChangeText={setNote}
                  placeholder="Ex : je viens de raccrocher un appel stressant…"
                  placeholderTextColor="#B0B0B0"
                  multiline
                  autoFocus
                  maxLength={200}
                />
                <TouchableOpacity style={mp.btn} onPress={() => setStep('result')}>
                  <Text style={mp.btnText}>Continuer</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          {step === 'result' && (
            <>
              <View style={mp.banner}>
                <Text style={mp.emoji}>💪</Text>
                <View style={{ flex: 1 }}>
                  <Text style={mp.titre}>C'est noté !</Text>
                  <Text style={mp.sous}>Envie enregistrée dans vos habitudes</Text>
                </View>
              </View>
              <View style={mp.body}>
                <Text style={env.conseil}>
                  Une envie dure en moyenne <Text style={{ fontWeight: '800' }}>3 à 5 minutes</Text>.{'\n\n'}
                  💧 Buvez un verre d'eau{'\n'}
                  🫁 Respirez profondément 5 fois{'\n'}
                  🚶 Changez de pièce ou d'activité{'\n\n'}
                  Elle va passer — tenez bon !
                </Text>
                <TouchableOpacity style={mp.btn} onPress={() => handleOutcome(false)}>
                  <Text style={mp.btnText}>J'ai tenu bon 💪</Text>
                </TouchableOpacity>
                <TouchableOpacity style={env.btnFume} onPress={() => handleOutcome(true)}>
                  <Text style={env.btnFumeText}>J'ai fumé  🚬  (+1 cigarette)</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const env = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  chip: {
    width: '48%', flexGrow: 1, backgroundColor: '#F7F8FA',
    borderRadius: 12, borderWidth: 1, borderColor: '#EEE',
    paddingVertical: 12, alignItems: 'center', gap: 4,
  },
  chipLabel: { fontSize: 12, fontWeight: '600', color: colors.black },
  conseil:   { fontSize: 14, color: colors.black, lineHeight: 22, textAlign: 'center', marginBottom: 16 },
  noteInput: {
    borderWidth: 1, borderColor: colors.grayBorder, borderRadius: 12,
    padding: 12, minHeight: 90, fontSize: 14, color: colors.black,
    textAlignVertical: 'top', marginBottom: 14,
  },
  btnFume: {
    borderWidth: 1.5, borderColor: '#FCA5A5', borderRadius: 30,
    paddingVertical: 12, alignItems: 'center', marginTop: 8,
  },
  btnFumeText: { color: '#DC2626', fontSize: 13, fontWeight: '700' },
});

// ── Citations motivation ────────────────────────────────────────────────────
const MOTIVATIONS = [
  "Chaque heure sans cigarette est une victoire pour votre santé.",
  "Vous n'abandonnez pas quelque chose, vous gagnez une vie meilleure.",
  "La force que vous montrez aujourd'hui construit votre santé de demain.",
  "Un jour à la fois. Vous y arrivez ! 💪",
  "Votre corps vous remercie à chaque minute sans tabac.",
];

// ── Arc circulaire de progression ───────────────────────────────────────────
// Règle simple : sous l'objectif = vert · pile à l'objectif = orange ·
// dépassé = cercle ENTIÈREMENT rouge.
function CircularProgress({ current, total, size = 110 }) {
  const strokeWidth = 10;
  const r = (size - strokeWidth) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;
  const depasse  = current > total;
  const limite   = current === total && current > 0;
  const ratio    = total > 0 ? Math.min(current / total, 1) : 0;
  const dash     = circumference * ratio;
  const gap      = circumference - dash;
  const strokeColor = depasse ? '#DC2626' : limite ? '#F59E0B' : colors.primary;
  const trackColor  = depasse ? '#FECACA' : limite ? '#FEF3C7' : '#E5E7EB';

  // Arc starts at top (rotate -90deg)
  return (
    <Svg width={size} height={size}>
      {/* Track */}
      <Circle
        cx={cx} cy={cy} r={r}
        stroke={trackColor}
        strokeWidth={strokeWidth}
        fill="none"
      />
      {/* Progress */}
      <Circle
        cx={cx} cy={cy} r={r}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        fill="none"
        strokeDasharray={`${dash} ${gap}`}
        strokeLinecap="round"
        rotation="-90"
        origin={`${cx}, ${cy}`}
      />
    </Svg>
  );
}

// ── Composant principal ─────────────────────────────────────────────────────
export default function DashboardScreen({ navigation }) {
  const { profile, stats, resetProfile, updateProfile } = useUser();
  const [, setTick]          = useState(0);
  const [quoteIdx]           = useState(() => Math.floor(Math.random() * MOTIVATIONS.length));
  const [liked, setLiked]    = useState(false);
  const [modalParfait, setModalParfait]   = useState(false);
  const [modalObjectif, setModalObjectif] = useState(false);
  const [modalEnvie, setModalEnvie]       = useState(false);

  // Enregistre une envie de fumer (heure + jour + déclencheur + note + issue).
  // Si l'utilisateur a fumé, la cigarette est aussi comptée partout (compteur + historique + cloud).
  async function handleEnvie({ ts, trigger, note, fume }) {
    const envies = Array.isArray(profile?.envies) ? profile.envies : [];
    const changes = {
      envies: [...envies, { ts, trigger, ...(note ? { note } : {}), fume: !!fume }],
    };
    if (fume) {
      const todayKey = new Date().toISOString().slice(0, 10);
      const current  = profile?.lastSavedDate === todayKey ? (profile.cigarettesToday ?? 0) : 0;
      changes.cigarettesToday = current + 1;
      changes.lastSavedDate   = todayKey;
      changes.historique      = { ...(profile?.historique ?? {}), [todayKey]: current + 1 };
      changes.cigLog          = [...(Array.isArray(profile?.cigLog) ? profile.cigLog : []), ts];
    }
    await updateProfile(changes);
  }
  const milestonesJoues      = React.useRef(new Set());

  // Rafraîchir chaque seconde pour le compteur live
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  // Détection milestones — jouer le son une seule fois par session
  useEffect(() => {
    if (!stats) return;
    const { diffJours, diffHeures } = stats;
    const totalHeures = diffJours * 24 + diffHeures;

    if (totalHeures >= 24 && !milestonesJoues.current.has('24h')) {
      milestonesJoues.current.add('24h');
      jouerSon('milestone_24h');
    } else if (diffJours >= 7 && !milestonesJoues.current.has('7j')) {
      milestonesJoues.current.add('7j');
      jouerSon('milestone_7j');
    } else if (diffJours >= 30 && !milestonesJoues.current.has('30j')) {
      milestonesJoues.current.add('30j');
      jouerSon('milestone_30j');
    }
  }, [stats?.diffJours]);

  if (!profile || !stats) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text style={{ fontSize: 40 }}>🌿</Text>
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const {
    diffJours, dureeStr, dureeSansCigStr, aDejaFume,
    objectifJour, cigarettesToday,
    ecartPlanJour, argentVsPlanJour, vieVsPlanJour,
    progressionJour: progression,
    prixCig,
  } = stats;

  const progressionPositif = progression >= 0;
  const sousObjectif = ecartPlanJour <= 0;

  return (
    <SafeAreaView style={styles.safe}>

      <ModalParfait
        visible={modalParfait}
        diffJours={diffJours}
        objectifJour={objectifJour}
        onClose={() => setModalParfait(false)}
      />
      <ModalObjectif
        visible={modalObjectif}
        count={cigarettesToday}
        objectif={objectifJour}
        prixCigarette={prixCig}
        onClose={() => setModalObjectif(false)}
      />
      <ModalEnvie
        visible={modalEnvie}
        onSave={handleEnvie}
        onClose={() => setModalEnvie(false)}
      />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Header ── */}
        <View style={styles.header}>
          <Text style={styles.hello}>
            Bonjour 👋{' '}
            <Text style={styles.prenom}>
              {profile.prenom || profile.email?.split('@')[0] || 'Champion'}
            </Text>
          </Text>
          <TouchableOpacity style={styles.bellBtn} onPress={() => navigation.navigate('Notifications')}>
            <Text style={styles.bellIcon}>🔔</Text>
          </TouchableOpacity>
        </View>

        {/* ── Carte verte "Temps sans cigarette" (remise à zéro à chaque cigarette) ── */}
        <View style={styles.heroCard}>
          <View style={styles.heroRow}>
            <Text style={styles.heroLabel}>Temps sans cigarette</Text>
            <Text style={styles.heroMedal}>🏅</Text>
          </View>
          <Text style={styles.heroTimer}>{dureeSansCigStr}</Text>
          <Text style={styles.heroSub}>
            {aDejaFume ? 'depuis votre dernière cigarette' : `depuis le début (${dureeStr})`}
          </Text>
        </View>

        {/* ── Section Aujourd'hui ── */}
        <View style={styles.todayCard}>
          <Text style={styles.sectionTitle}>Aujourd'hui</Text>

          <View style={styles.todayContent}>
            {/* Arc circulaire */}
            <View style={styles.arcContainer}>
              <CircularProgress current={cigarettesToday} total={objectifJour} size={110} />
              <View style={styles.arcInner}>
                <Text style={[
                  styles.arcCurrent,
                  cigarettesToday > objectifJour && { color: '#DC2626' },
                  cigarettesToday === objectifJour && cigarettesToday > 0 && { color: '#F59E0B' },
                ]}>{cigarettesToday}</Text>
                <Text style={styles.arcSep}>/</Text>
                <Text style={styles.arcTotal}>{objectifJour}</Text>
              </View>
            </View>

            {/* Label à côté */}
            <View style={styles.todayRight}>
              <Text style={styles.todaySubtitle}>cigarettes{'\n'}aujourd'hui</Text>
              <Text style={styles.todayObjectif}>Objectif : {objectifJour} max</Text>
            </View>
          </View>

          {/* Bouton valider */}
          <TouchableOpacity
            style={styles.validateBtn}
            onPress={() => {
              jouerSon(cigarettesToday === 0 ? 'enregistrer_zero' : 'valider_journee');
              annulerNotificationSoir();
              if (cigarettesToday === 0) setModalParfait(true);
              else setModalObjectif(true);
            }}
          >
            <Text style={styles.validateBtnText}>✓  Valider ma journée</Text>
          </TouchableOpacity>

          {/* Lien "J'ai fumé" */}
          <TouchableOpacity
            style={styles.fumerLink}
            onPress={() => navigation.navigate('JaiFume')}
          >
            <Text style={styles.fumerLinkText}>J'ai fumé aujourd'hui  ›</Text>
          </TouchableOpacity>
        </View>

        {/* ── Grille stats 2×2 — tout est comparé au PLAN du jour ── */}
        <View style={styles.statsGrid}>
          <StatBox
            img={PICTOS.objectif}
            valeur={ecartPlanJour > 0 ? `+${ecartPlanJour} de trop` : `${Math.abs(ecartPlanJour)} de marge`}
            label={`vs objectif du jour (${objectifJour})`}
            valeurColor={sousObjectif ? colors.primary : '#DC2626'}
          />
          <StatBox
            img={PICTOS.economie}
            valeur={`${argentVsPlanJour >= 0 ? '+' : '-'}${Math.abs(argentVsPlanJour).toFixed(2)}€`}
            label={argentVsPlanJour >= 0 ? 'Argent préservé\nvs votre plan' : 'Surcoût\nvs votre plan'}
            valeurColor={argentVsPlanJour >= 0 ? colors.primary : '#DC2626'}
          />
          <StatBox
            img={PICTOS.temps}
            valeur={`${vieVsPlanJour >= 0 ? '+' : '-'}${Math.abs(vieVsPlanJour)} min`}
            label={vieVsPlanJour >= 0 ? `Vie préservée vs plan\n(5 min / cigarette)` : `Vie perdue vs plan\n(5 min / cigarette)`}
            valeurColor={vieVsPlanJour >= 0 ? colors.primary : '#DC2626'}
          />
          <StatBox
            img={PICTOS.evitees}
            valeur={`${progression > 0 ? '+' : ''}${progression}%`}
            label={`Progression\nvs avant l'app`}
            valeurColor={progressionPositif ? colors.primary : colors.red}
          />
        </View>

        {/* ── Envie de fumer ── */}
        <View style={styles.envieCard}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: spacing.sm }}>
            <Text style={{ fontSize: 24 }}>🔥</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.envieTitle}>Une envie de fumer, là maintenant ?</Text>
              <Text style={styles.envieSub}>
                Enregistrez-la : on analyse vos déclencheurs pour vous aider à les anticiper.
              </Text>
            </View>
          </View>
          <TouchableOpacity style={styles.envieBtn} onPress={() => setModalEnvie(true)}>
            <Text style={styles.envieBtnText}>J'ai envie de fumer</Text>
          </TouchableOpacity>
          {(profile?.envies?.length ?? 0) > 0 && (
            <Text style={styles.envieCount}>
              {profile.envies.length} envie{profile.envies.length > 1 ? 's' : ''} enregistrée{profile.envies.length > 1 ? 's' : ''} — analyse visible dans l'onglet Plan
            </Text>
          )}
        </View>

        {/* ── Motivation du jour ── */}
        <View style={styles.motivCard}>
          <View style={styles.motivHeader}>
            <Text style={styles.motivTitle}>✨  Motivation du jour</Text>
            <TouchableOpacity onPress={() => { if (!liked) jouerSon('motivation_like'); setLiked(l => !l); }}>
              <Text style={styles.motivHeart}>{liked ? '❤️' : '🤍'}</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.motivQuote}>"{MOTIVATIONS[quoteIdx]}"</Text>
        </View>

        {/* ── Boutons dev ── */}
        <TouchableOpacity
          style={styles.resetBtn}
          onPress={async () => { await updateProfile(buildDemoProfile()); }}
        >
          <Text style={styles.resetText}>🎬 Charger la démo (5 semaines d'utilisation)</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.resetBtn}
          onPress={async () => { await resetProfile(); }}
        >
          <Text style={styles.resetText}>↩ Recommencer l'onboarding</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

// ── Composant StatBox ───────────────────────────────────────────────────────
function StatBox({ emoji, img, valeur, label, valeurColor = colors.black }) {
  return (
    <View style={styles.statBox}>
      {img
        ? <Image source={img} style={{ width: 34, height: 34, marginBottom: 6 }} resizeMode="contain" />
        : <Text style={styles.statEmoji}>{emoji}</Text>}
      <Text style={[styles.statValeur, { color: valeurColor }]}>{valeur}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

// ── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: '#F7F8FA' },
  scroll: { paddingHorizontal: spacing.md, paddingTop: spacing.md, paddingBottom: 90 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { fontSize: font.md, color: colors.gray, marginTop: spacing.sm },

  // Header
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: spacing.md,
  },
  hello:  { fontSize: font.lg, color: colors.black, fontWeight: '500' },
  prenom: { fontWeight: '800', color: colors.black },
  bellBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08, shadowRadius: 4, elevation: 2,
  },
  bellIcon: { fontSize: 18 },

  // Hero verte
  heroCard: {
    backgroundColor: colors.primary, borderRadius: radius.xl,
    padding: spacing.lg, marginBottom: spacing.md,
  },
  heroRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  heroLabel: { color: 'rgba(255,255,255,0.85)', fontSize: font.sm, fontWeight: '600' },
  heroMedal: { fontSize: 22 },
  heroTimer: { color: colors.white, fontSize: 30, fontWeight: '900', letterSpacing: 1 },
  heroSub:   { color: 'rgba(255,255,255,0.7)', fontSize: 11, marginTop: 4 },

  // Aujourd'hui
  todayCard: {
    backgroundColor: colors.white, borderRadius: radius.xl,
    padding: spacing.md, marginBottom: spacing.md,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  sectionTitle: { fontSize: font.md, fontWeight: '700', color: colors.black, marginBottom: spacing.md },
  todayContent: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  arcContainer: { position: 'relative', width: 110, height: 110, alignItems: 'center', justifyContent: 'center' },
  arcInner: { position: 'absolute', flexDirection: 'row', alignItems: 'baseline' },
  arcCurrent: { fontSize: 26, fontWeight: '900', color: colors.primary },
  arcSep:     { fontSize: 14, color: colors.gray, marginHorizontal: 2 },
  arcTotal:   { fontSize: 14, fontWeight: '600', color: colors.gray },
  todayRight: { marginLeft: spacing.lg, flex: 1 },
  todaySubtitle: { fontSize: font.md, fontWeight: '600', color: colors.black, lineHeight: 22 },
  todayObjectif:  { fontSize: 12, color: colors.gray, marginTop: 4 },

  validateBtn: {
    backgroundColor: colors.primary, borderRadius: radius.full,
    paddingVertical: 14, alignItems: 'center', marginBottom: spacing.sm,
  },
  validateBtnText: { color: colors.white, fontSize: font.md, fontWeight: '700' },
  fumerLink:   { alignItems: 'center', paddingVertical: 4 },
  fumerLinkText: { color: colors.primary, fontSize: font.sm, fontWeight: '500' },

  // Stats 2×2
  statsGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md,
  },
  statBox: {
    width: (SCREEN_W - spacing.md * 2 - spacing.sm) / 2,
    backgroundColor: colors.white, borderRadius: radius.lg,
    padding: spacing.md, alignItems: 'flex-start',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  statEmoji:  { fontSize: 22, marginBottom: 6 },
  statValeur: { fontSize: font.xl, fontWeight: '900', color: colors.black, marginBottom: 2 },
  statLabel:  { fontSize: 12, color: colors.gray, lineHeight: 16 },

  // Motivation
  motivCard: {
    backgroundColor: colors.white, borderRadius: radius.xl,
    padding: spacing.md, marginBottom: spacing.md,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  motivHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  motivTitle:  { fontSize: font.sm, fontWeight: '700', color: colors.black },
  motivHeart:  { fontSize: 22 },
  motivQuote:  { fontSize: font.sm, color: colors.gray, lineHeight: 22, fontStyle: 'italic' },

  // Envie de fumer
  envieCard: {
    backgroundColor: '#FFF7ED', borderRadius: radius.xl,
    borderWidth: 1, borderColor: '#FED7AA',
    padding: spacing.md, marginBottom: spacing.md,
  },
  envieTitle: { fontSize: font.sm, fontWeight: '700', color: '#92400E' },
  envieSub:   { fontSize: 11, color: '#B45309', marginTop: 2, lineHeight: 15 },
  envieBtn: {
    backgroundColor: '#B45309', borderRadius: radius.full,
    paddingVertical: 12, alignItems: 'center',
  },
  envieBtnText: { color: colors.white, fontSize: font.sm, fontWeight: '700' },
  envieCount:   { fontSize: 10, color: '#B45309', textAlign: 'center', marginTop: 8 },

  // Reset
  resetBtn:  { alignItems: 'center', paddingVertical: spacing.md },
  resetText: { color: colors.gray, fontSize: 12 },
});
