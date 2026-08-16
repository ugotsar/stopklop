import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, Dimensions, Modal, TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { Image } from 'react-native';
import { useTranslation } from 'react-i18next';

import { UI } from '../assets/uiKit';
const PICTOS = {
  temps:    UI.chrono_vie_preservee,
  evitees:  UI.progression_fleche,
  objectif: UI.cible_objectif,
  economie: UI.pile_pieces_feuilles,
};
import { useUser } from '../context/UserContext';
import { colors, spacing, font, radius, shadow, getScreenWidth } from '../theme';
import { annulerNotificationSoir } from '../services/notifications';
import { jouerSon } from '../services/sounds';
import { buildDemoProfile } from '../utils/demoData';

const SCREEN_W = getScreenWidth();

// Nombre de citations motivationnelles disponibles (voir dashboard.json → motivation.quotes)
const MOTIVATIONS_COUNT = 5;

// ── Modal journée parfaite ──────────────────────────────────────────────────
function ModalParfait({ visible, diffJours, objectifJour, prixCig, onClose }) {
  const { t, i18n } = useTranslation('dashboard');
  const streak = diffJours || 0;
  const vieGagneeMins = objectifJour * 5;
  const vieGagneeStr = vieGagneeMins >= 60
    ? `+${Math.floor(vieGagneeMins/60)}h ${vieGagneeMins%60}min`
    : `+${vieGagneeMins}min`;
  const spentZero = `${new Intl.NumberFormat(i18n.language, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(0)} €`;
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={mp.overlay}>
        <View style={mp.card}>
          {/* Trophée feuillage flottant directement sur la carte crème (réf. kit UI écran 04-B) */}
          <Image source={UI.trophee_feuilles_creme} style={mp.trophyIllus} resizeMode="contain" />
          <Text style={mp.trophyTitle}>{t('perfectDayModal.title')}</Text>
          <Text style={mp.trophySub}>{t('perfectDayModal.subtitle')}</Text>

          <View style={mp.statsRow}>
            <StatColonne valeur={vieGagneeStr} label={t('perfectDayModal.lifeRegained')} color={colors.primary} />
            <StatColonne valeur={spentZero} label={t('perfectDayModal.spent')} color={colors.black} />
            <StatColonne valeur={`🔥 ${streak}${t('common:dayShort')}`} label={t('perfectDayModal.streak')} color={colors.warning} />
          </View>
          <TouchableOpacity style={mp.btn} onPress={onClose}>
            <Text style={mp.btnText}>{t('perfectDayModal.closeButton')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

function StatColonne({ valeur, label, color }) {
  return (
    <View style={{ alignItems: 'center', flex: 1 }}>
      <Text style={{ fontSize: 16, fontWeight: '800', color }}>{valeur}</Text>
      <Text style={{ fontSize: 11, color: colors.gray, marginTop: 3, textAlign: 'center' }}>{label}</Text>
    </View>
  );
}

const mp = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(23, 61, 38, 0.55)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28 },
  card:    {
    width: '100%', backgroundColor: colors.surface, borderRadius: radius.xl,
    padding: spacing.lg, alignItems: 'center',
    ...shadow.modal,
  },
  banner:  { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primaryDeep, paddingVertical: 16, paddingHorizontal: 18, gap: 12, borderRadius: radius.xl },
  emoji:   { fontSize: 30 },
  bannerIllusWrap: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center', justifyContent: 'center',
  },
  bannerIllus: { width: 32, height: 32 },
  titre:   { fontSize: 15, fontWeight: '700', color: '#fff' },
  sous:    { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  // Trophée feuillage posé directement sur la carte (réf. kit UI écran 04-B)
  trophyIllus:  { width: 150, height: 150, marginBottom: 4 },
  trophyTitle:  { fontSize: 20, fontWeight: '900', color: colors.primaryDeep, textAlign: 'center' },
  trophySub:    { fontSize: 14, color: colors.gray, marginTop: 4, marginBottom: spacing.lg, textAlign: 'center' },
  statsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', width: '100%', paddingVertical: 14, marginBottom: spacing.md },
  btn:     { width: '100%', backgroundColor: colors.primary, borderRadius: radius.pill, paddingVertical: 15, alignItems: 'center' },
  btnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});

// ── Modal feedback journée (variante A = ok, variante B = dépassé) ───────────
function ModalObjectif({ visible, count, objectif, prixCigarette, onClose }) {
  const { t, i18n } = useTranslation('dashboard');
  const isOk      = count <= objectif;
  const depense   = new Intl.NumberFormat(i18n.language, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(count * prixCigarette);

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
        <View style={[mp.card, { borderWidth: 0.5, borderColor: isOk ? '#CFE0C6' : '#FCD34D' }]}>

          {/* ── Bandeau ── */}
          {isOk ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primaryLight, paddingVertical: 14, paddingHorizontal: 16, gap: 10, borderBottomWidth: 0.5, borderBottomColor: '#CFE0C6' }}>
              <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: '#CFE0C6', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 20 }}>✅</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: colors.primaryDeep }}>{t('goalModal.successTitle')}</Text>
                <Text style={{ fontSize: 11, color: colors.primary, marginTop: 2 }}>{t('goalModal.successSubtitle')}</Text>
              </View>
            </View>
          ) : (
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#92400E', paddingVertical: 14, paddingHorizontal: 16, gap: 10 }}>
              <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 20 }}>⚠️</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: '#fff' }}>{t('goalModal.exceededTitle')}</Text>
                <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.8)', marginTop: 2 }}>{t('goalModal.exceededSubtitle', { count, exceeded: exces })}</Text>
              </View>
            </View>
          )}

          {/* ── Corps ── */}
          <View style={{ padding: 16 }}>
            {isOk ? (
              <>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}>
                  <Text style={{ fontSize: 11, color: '#888' }}>{count} {t('common:cigarette', { count })}</Text>
                  <Text style={{ fontSize: 11, color: '#888' }}>{t('goalModal.goalLabel', { count: objectif })}</Text>
                </View>
                <View style={{ height: 7, backgroundColor: '#E5E7EB', borderRadius: 6, overflow: 'hidden', marginBottom: 4 }}>
                  <View style={{ height: '100%', width: `${pct}%`, backgroundColor: colors.primary, borderRadius: 6 }} />
                </View>
                <Text style={{ fontSize: 10, color: colors.primary, textAlign: 'right', marginBottom: 12 }}>{t('goalModal.marginLabel', { percent: marge })}</Text>
                <View style={{ flexDirection: 'row', gap: 8, marginBottom: 14 }}>
                  <View style={{ flex: 1, backgroundColor: colors.primaryLight, borderRadius: 10, paddingVertical: 8, alignItems: 'center' }}>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: colors.primaryDeep }}>{depense} €</Text>
                    <Text style={{ fontSize: 10, color: colors.primary, marginTop: 1 }}>{t('goalModal.spent')}</Text>
                  </View>
                  <View style={{ flex: 1, backgroundColor: colors.primaryLight, borderRadius: 10, paddingVertical: 8, alignItems: 'center' }}>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: colors.primaryDeep }}>{viePreservee} {t('common:min')}</Text>
                    <Text style={{ fontSize: 10, color: colors.primary, marginTop: 1 }}>{t('goalModal.lifePreserved')}</Text>
                  </View>
                </View>
                <TouchableOpacity style={{ backgroundColor: colors.primary, borderRadius: 30, paddingVertical: 12, alignItems: 'center' }} onPress={onClose}>
                  <Text style={{ color: '#fff', fontSize: 14, fontWeight: '700' }}>{t('goalModal.successButton')}</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}>
                  <Text style={{ fontSize: 11, color: '#92400E' }}>{t('goalModal.goalLabel', { count: objectif })}</Text>
                  <Text style={{ fontSize: 11, color: '#DC2626' }}>{t('goalModal.tooMany', { count: exces })}</Text>
                </View>
                <View style={{ height: 7, borderRadius: 6, overflow: 'hidden', flexDirection: 'row', marginBottom: 4 }}>
                  <View style={{ height: '100%', width: `${pctObj}%`, backgroundColor: '#F59E0B' }} />
                  <View style={{ height: '100%', width: `${100 - pctObj}%`, backgroundColor: '#DC2626' }} />
                </View>
                <Text style={{ fontSize: 10, color: '#B45309', textAlign: 'center', marginBottom: 12 }}>{t('goalModal.cigsSmokedToday', { count })}</Text>
                <View style={{ flexDirection: 'row', gap: 8, marginBottom: 14 }}>
                  <View style={{ flex: 1, backgroundColor: '#FEF3C7', borderRadius: 10, paddingVertical: 8, alignItems: 'center' }}>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: '#92400E' }}>{depense} €</Text>
                    <Text style={{ fontSize: 10, color: '#B45309', marginTop: 1 }}>{t('goalModal.spent')}</Text>
                  </View>
                  <View style={{ flex: 1, backgroundColor: '#FEF3C7', borderRadius: 10, paddingVertical: 8, alignItems: 'center' }}>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: '#92400E' }}>{viePerdue} {t('common:min')}</Text>
                    <Text style={{ fontSize: 10, color: '#B45309', marginTop: 1 }}>{t('goalModal.lifeLost')}</Text>
                  </View>
                </View>
                <View style={{ backgroundColor: '#FFF7ED', borderRadius: 10, borderWidth: 1, borderColor: '#FDE68A', padding: 12, marginBottom: 14 }}>
                  <Text style={{ fontSize: 13, color: '#92400E', lineHeight: 19, textAlign: 'center' }}>
                    {t('goalModal.encouragement')}
                  </Text>
                </View>
                <TouchableOpacity style={{ backgroundColor: '#92400E', borderRadius: 30, paddingVertical: 12, alignItems: 'center' }} onPress={onClose}>
                  <Text style={{ color: '#fff', fontSize: 14, fontWeight: '700' }}>{t('goalModal.exceededButton')}</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ── Déclencheurs d'envie de fumer — illustrations 3D du kit UI (page 09) ────
// Les clés (key) sont des identifiants de données utilisés pour l'analyse des
// habitudes — ne pas les traduire. Seuls les libellés affichés (namespace
// dashboard → triggers.*) sont traduits.
const DECLENCHEURS = [
  { key: 'stress',   img: UI.trig_stress },
  { key: 'ennui',    img: UI.trig_ennui },
  { key: 'cafe',     img: UI.trig_cafe },
  { key: 'repas',    img: UI.trig_repas },
  { key: 'social',   img: UI.trig_entourage },
  { key: 'alcool',   img: UI.trig_alcool },
  { key: 'habitude', img: UI.trig_habitude },
  { key: 'autre',    img: UI.trig_autre },
];

// ── Modal "J'ai envie de fumer" ─────────────────────────────────────────────
// Étapes : pick (choisir le déclencheur) → note (si "autre" : texte libre)
//          → result (conseils + issue : "j'ai tenu bon" ou "j'ai fumé")
function ModalEnvie({ visible, onSave, onClose }) {
  const { t } = useTranslation('dashboard');
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
                <View style={mp.bannerIllusWrap}>
                  <Image source={UI.envie_flamme} style={mp.bannerIllus} resizeMode="contain" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={mp.titre}>{t('envieModal.pickTitle')}</Text>
                  <Text style={mp.sous}>{t('envieModal.pickSubtitle')}</Text>
                </View>
              </View>
              <View style={mp.body}>
                <View style={env.grid}>
                  {DECLENCHEURS.map(d => (
                    <TouchableOpacity key={d.key} style={env.chip} onPress={() => handleSelect(d.key)}>
                      <Image source={d.img} style={env.chipIllus} resizeMode="contain" />
                      <Text style={env.chipLabel}>{t(`triggers.${d.key}`)}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <TouchableOpacity onPress={handleClose} style={{ alignItems: 'center', paddingVertical: 8 }}>
                  <Text style={{ color: colors.gray, fontSize: 13 }}>{t('common:cancel')}</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          {step === 'note' && (
            <>
              <View style={[mp.banner, { backgroundColor: '#B45309' }]}>
                <Text style={mp.emoji}>✍️</Text>
                <View style={{ flex: 1 }}>
                  <Text style={mp.titre}>{t('envieModal.noteTitle')}</Text>
                  <Text style={mp.sous}>{t('envieModal.noteSubtitle')}</Text>
                </View>
              </View>
              <View style={mp.body}>
                <TextInput
                  style={env.noteInput}
                  value={note}
                  onChangeText={setNote}
                  placeholder={t('envieModal.notePlaceholder')}
                  placeholderTextColor="#B0B0B0"
                  multiline
                  autoFocus
                  maxLength={200}
                />
                <TouchableOpacity style={mp.btn} onPress={() => setStep('result')}>
                  <Text style={mp.btnText}>{t('envieModal.continueButton')}</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          {step === 'result' && (
            <>
              <View style={mp.banner}>
                <Text style={mp.emoji}>💪</Text>
                <View style={{ flex: 1 }}>
                  <Text style={mp.titre}>{t('envieModal.resultTitle')}</Text>
                  <Text style={mp.sous}>{t('envieModal.resultSubtitle')}</Text>
                </View>
              </View>
              <View style={mp.body}>
                <Text style={env.conseil}>
                  {t('envieModal.conseilPrefix')}<Text style={{ fontWeight: '800' }}>{t('envieModal.conseilBold')}</Text>{t('envieModal.conseilSuffix')}
                </Text>
                <TouchableOpacity style={mp.btn} onPress={() => handleOutcome(false)}>
                  <Text style={mp.btnText}>{t('envieModal.keptButton')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={env.btnFume} onPress={() => handleOutcome(true)}>
                  <Text style={env.btnFumeText}>{t('envieModal.smokedButton')}</Text>
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
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 14 },
  chip: {
    width: '29%', flexGrow: 1, backgroundColor: colors.cream,
    borderRadius: radius.lg, borderWidth: 1, borderColor: colors.grayBorder,
    paddingVertical: 16, alignItems: 'center', gap: 8,
    minHeight: 96, justifyContent: 'center',
  },
  chipIllus: { width: 48, height: 48 },
  chipLabel: { fontSize: 11, fontWeight: '700', color: colors.primaryDeep, textAlign: 'center' },
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
  const { t, i18n } = useTranslation('dashboard');
  const { profile, stats, resetProfile, updateProfile } = useUser();
  const [, setTick]          = useState(0);
  const [quoteIdx]           = useState(() => Math.floor(Math.random() * MOTIVATIONS_COUNT));
  const [liked, setLiked]    = useState(false);
  const [modalParfait, setModalParfait]   = useState(false);
  const [modalObjectif, setModalObjectif] = useState(false);
  const [modalEnvie, setModalEnvie]       = useState(false);

  const motivationQuotes = t('motivation.quotes', { returnObjects: true });

  // Formatage monétaire adapté à la langue (séparateur décimal), symbole € conservé
  const fmtEur = n => new Intl.NumberFormat(i18n.language, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);

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
          <Text style={styles.loadingText}>{t('common:loading')}</Text>
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
            {t('header.greeting')}{' '}
            <Text style={styles.prenom}>
              {profile.prenom || profile.email?.split('@')[0] || t('header.defaultName')}
            </Text>
          </Text>
          <TouchableOpacity style={styles.bellBtn} onPress={() => navigation.navigate('Notifications')}>
            <Image source={UI.cloche_rappel} style={styles.bellIcon} resizeMode="contain" />
          </TouchableOpacity>
        </View>

        {/* ── Carte verte "Temps sans cigarette" (remise à zéro à chaque cigarette) ── */}
        <View style={styles.heroCard}>
          <View style={{ flex: 1 }}>
            <View style={styles.heroRow}>
              <Text style={styles.heroLabel}>{t('hero.label')}</Text>
              <Text style={styles.heroMedal}>🏅</Text>
            </View>
            <Text style={styles.heroTimer}>{dureeSansCigStr}</Text>
            <Text style={styles.heroSub}>
              {aDejaFume ? t('hero.sinceLastCig') : t('hero.sinceStart', { duration: dureeStr })}
            </Text>
          </View>
          <Image source={UI.chrono_feuilles} style={styles.heroIllus} resizeMode="contain" />
        </View>

        {/* ── Section Aujourd'hui (kit UI accueil_reference) ── */}
        <View style={styles.todayCard}>
          <Text style={styles.todayTitle}>{t('today.sectionTitle')}</Text>

          <View style={styles.todayContent}>
            {/* Arc circulaire */}
            <View style={styles.arcContainer}>
              <CircularProgress current={cigarettesToday} total={objectifJour} size={84} />
              <View style={styles.arcInner}>
                <Text style={[
                  styles.arcCurrent,
                  cigarettesToday > objectifJour && { color: colors.danger },
                  cigarettesToday === objectifJour && cigarettesToday > 0 && { color: colors.warning },
                ]}>{cigarettesToday}</Text>
                <Text style={styles.arcTotal}>/{objectifJour}</Text>
              </View>
            </View>

            {/* Label au centre */}
            <View style={styles.todayCenter}>
              <Text style={styles.todaySubtitle}>{t('today.subtitle')}</Text>
              <Text style={styles.todayObjectif}>{t('today.goal', { count: objectifJour })}</Text>
            </View>

            {/* Illustration paquet à droite */}
            <Image source={UI.paquet_cigarettes} style={styles.todayIllus} resizeMode="contain" />
          </View>

          {/* Bouton valider — pilule pleine largeur avec check */}
          <TouchableOpacity
            style={styles.validateBtn}
            onPress={() => {
              jouerSon(cigarettesToday === 0 ? 'enregistrer_zero' : 'valider_journee');
              annulerNotificationSoir();
              if (cigarettesToday === 0) setModalParfait(true);
              else setModalObjectif(true);
            }}
          >
            <Text style={styles.validateBtnCheck}>✓</Text>
            <Text style={styles.validateBtnText}>{t('today.validateButton')}</Text>
          </TouchableOpacity>

          {/* Lien "J'ai fumé" */}
          <TouchableOpacity
            style={styles.fumerLink}
            onPress={() => navigation.navigate('JaiFume')}
          >
            <Text style={styles.fumerLinkText}>{t('today.smokedLink')}</Text>
          </TouchableOpacity>
        </View>

        {/* ── Grille stats 2×2 — illustration à gauche, texte à droite ── */}
        <View style={styles.statsGrid}>
          <StatBox
            img={PICTOS.objectif}
            valeur={ecartPlanJour > 0 ? t('stats.aboveGoal', { count: ecartPlanJour }) : t('stats.belowGoal', { count: Math.abs(ecartPlanJour) })}
            label={t('stats.vsGoalLabel', { count: objectifJour })}
            valeurColor={sousObjectif ? colors.primaryDeep : colors.danger}
          />
          <StatBox
            img={PICTOS.economie}
            valeur={`${argentVsPlanJour >= 0 ? '+' : '-'}${fmtEur(Math.abs(argentVsPlanJour))}€`}
            label={argentVsPlanJour >= 0 ? t('stats.moneyPreserved') : t('stats.moneyOver')}
            valeurColor={argentVsPlanJour >= 0 ? colors.primaryDeep : colors.danger}
          />
          <StatBox
            img={PICTOS.temps}
            valeur={t('stats.minutesVsPlan', { sign: vieVsPlanJour >= 0 ? '+' : '-', count: Math.abs(vieVsPlanJour) })}
            label={vieVsPlanJour >= 0 ? t('stats.lifePreservedVsPlan') : t('stats.lifeLostVsPlan')}
            valeurColor={vieVsPlanJour >= 0 ? colors.primaryDeep : colors.danger}
          />
          <StatBox
            img={PICTOS.evitees}
            valeur={t('stats.progressionValue', { sign: progression > 0 ? '+' : '', count: progression })}
            label={t('stats.progressionLabel')}
            valeurColor={progressionPositif ? colors.primaryDeep : colors.danger}
          />
        </View>

        {/* ── Envie de fumer — layout horizontal avec bouton à droite ── */}
        <View style={styles.envieCard}>
          <View style={styles.envieTop}>
            <Image source={UI.envie_flamme} style={styles.envieIllus} resizeMode="contain" />
            <View style={{ flex: 1, minWidth: 0, marginHorizontal: 8 }}>
              <Text style={styles.envieTitle}>{t('envieCard.title')}</Text>
              <Text style={styles.envieSub}>
                {t('envieCard.subtitle')}
              </Text>
            </View>
            <TouchableOpacity style={styles.envieBtn} onPress={() => setModalEnvie(true)}>
              <Text style={styles.envieBtnText}>{t('envieCard.button')}</Text>
            </TouchableOpacity>
          </View>
          {(profile?.envies?.length ?? 0) > 0 && (
            <Text style={styles.envieCount}>
              {t('envieCard.count', { count: profile.envies.length })}
            </Text>
          )}
        </View>

        {/* ── Motivation du jour — fond sauge + illustration à droite ── */}
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => { if (!liked) jouerSon('motivation_like'); setLiked(l => !l); }}
          style={styles.motivCard}
        >
          <View style={{ flex: 1 }}>
            <View style={styles.motivHeader}>
              <Text style={styles.motivSparkle}>✨</Text>
              <Text style={styles.motivTitle}>{t('motivation.sectionTitle')}</Text>
            </View>
            <Text style={styles.motivQuote}>"{motivationQuotes[quoteIdx]}"</Text>
          </View>
          <Image source={UI.coeur_feuilles} style={styles.motivIllus} resizeMode="contain" />
        </TouchableOpacity>

        {/* ── Boutons dev — 2 cartes horizontales côte à côte ── */}
        <View style={styles.devRow}>
          <TouchableOpacity
            style={styles.devCard}
            onPress={async () => { await updateProfile(buildDemoProfile()); }}
          >
            <Text style={styles.devIcon}>🎬</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.devText}>{t('devButtons.loadDemo')}</Text>
              <View style={styles.devProgress}>
                <View style={styles.devProgressFill} />
              </View>
            </View>
          </TouchableOpacity>
          <View style={styles.devDivider} />
          <TouchableOpacity
            style={styles.devCard}
            onPress={async () => { await resetProfile(); }}
          >
            <Text style={styles.devIcon}>↺</Text>
            <Text style={styles.devText}>{t('devButtons.resetOnboarding')}</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

// ── Composant StatBox ───────────────────────────────────────────────────────
function StatBox({ emoji, img, valeur, label, valeurColor = colors.black }) {
  return (
    <View style={styles.statBox}>
      {img
        ? <Image source={img} style={styles.statIllus} resizeMode="contain" />
        : <Text style={styles.statEmoji}>{emoji}</Text>}
      {/* minWidth: 0 nécessaire sur web pour que ce flex:1 accepte de se réduire
          au lieu de forcer la troncature du texte avec adjustsFontSizeToFit,
          qui ne fonctionne pas sur React Native Web (iOS/Android uniquement). */}
      <View style={styles.statText}>
        <Text style={[styles.statValeur, { color: valeurColor }]}>{valeur}</Text>
        <Text style={styles.statLabel} numberOfLines={3}>{label}</Text>
      </View>
    </View>
  );
}

// ── Styles (refonte kit UI — accueil_reference) ──────────────────────────────
const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: colors.cream },
  scroll: { paddingHorizontal: spacing.md, paddingTop: spacing.md, paddingBottom: 90 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { fontSize: font.md, color: colors.gray, marginTop: spacing.sm },

  // Header
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: spacing.md,
  },
  hello:  { fontSize: 22, color: colors.black, fontWeight: '500' },
  prenom: { fontWeight: '900', color: colors.primaryDeep },
  bellBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: colors.grayBorder,
    ...shadow.card,
  },
  bellIcon: { width: 26, height: 26 },

  // Hero verte + grand chrono à droite (PNG réellement transparent, posé tel quel)
  heroCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.primaryDeep, borderRadius: radius.xl,
    paddingVertical: 24, paddingLeft: spacing.lg, paddingRight: spacing.sm,
    marginBottom: spacing.md,
    ...shadow.card,
  },
  heroIllus: { width: 118, height: 118 },
  heroRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  heroLabel: { color: 'rgba(255,255,255,0.9)', fontSize: 15, fontWeight: '600' },
  heroMedal: { fontSize: 20 },
  heroTimer: { color: colors.white, fontSize: 44, fontWeight: '900', letterSpacing: 0.3, marginBottom: 6 },
  heroSub:   { color: 'rgba(255,255,255,0.7)', fontSize: 13 },

  // Aujourd'hui — anneau à gauche · texte au centre · paquet à droite
  todayCard: {
    backgroundColor: colors.surface, borderRadius: radius.xl,
    padding: spacing.lg, marginBottom: spacing.md,
    borderWidth: 1, borderColor: colors.grayBorder,
    ...shadow.card,
  },
  todayTitle: { fontSize: 20, fontWeight: '900', color: colors.primaryDeep, marginBottom: spacing.md },
  todayContent: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md, gap: 6 },
  arcContainer: { position: 'relative', width: 84, height: 84, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  arcInner: { position: 'absolute', flexDirection: 'row', alignItems: 'baseline' },
  arcCurrent: { fontSize: 34, fontWeight: '900', color: colors.primary, lineHeight: 36 },
  arcTotal:   { fontSize: 15, fontWeight: '600', color: colors.gray, marginLeft: 2 },
  // minWidth: 0 est indispensable sur React Native Web : sans lui, un enfant flex:1
  // dans une row garde sa largeur de contenu et force un retour à la ligne lettre
  // par lettre au lieu de rester sur la largeur réellement disponible.
  todayCenter:   { flex: 1, minWidth: 0, marginLeft: 2 },
  todaySubtitle: { fontSize: 17, fontWeight: '800', color: colors.black, lineHeight: 21 },
  todayObjectif: { fontSize: 12, color: colors.gray, marginTop: 4 },
  todayIllus:    { width: 84, height: 84, flexShrink: 0 },

  // Bouton valider — pilule pleine largeur avec check
  validateBtn: {
    flexDirection: 'row', backgroundColor: colors.primaryDeep, borderRadius: radius.pill,
    paddingVertical: 15, alignItems: 'center', justifyContent: 'center',
    gap: 8, marginBottom: spacing.sm,
    ...shadow.card,
  },
  validateBtnCheck: { color: colors.white, fontSize: 18, fontWeight: '900' },
  validateBtnText:  { color: colors.white, fontSize: font.md, fontWeight: '700' },
  fumerLink:   { alignItems: 'center', paddingVertical: 4 },
  fumerLinkText: { color: colors.primary, fontSize: font.sm, fontWeight: '600' },

  // Stats 2×2 — cercle crème à gauche · valeur+label à droite (kit UI)
  statsGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginBottom: spacing.md,
  },
  statBox: {
    width: (SCREEN_W - spacing.md * 2 - spacing.md) / 2,
    backgroundColor: colors.surface, borderRadius: radius.lg,
    padding: 10, flexDirection: 'row', alignItems: 'center',
    gap: 6,
    borderWidth: 1, borderColor: colors.grayBorder,
    minHeight: 92,
    ...shadow.card,
  },
  // Illustration 3D, sans cercle de fond — le PNG a déjà son fond transparent
  statIllus:  { width: 46, height: 46, flexShrink: 0 },
  statEmoji:  { fontSize: 22 },
  // minWidth: 0 nécessaire sur web pour que ce flex:1 se réduise correctement
  // au lieu de forcer la valeur à déborder / se faire tronquer.
  statText:   { flex: 1, minWidth: 0, justifyContent: 'center' },
  statValeur: { fontSize: 16, fontWeight: '900', color: colors.primaryDeep, marginBottom: 2 },
  statLabel:  { fontSize: 10.5, color: colors.gray, lineHeight: 13 },

  // Envie de fumer — flamme · texte · bouton rectangle arrondi orange
  envieCard: {
    backgroundColor: '#FDF0DC', borderRadius: radius.xl,
    borderWidth: 1, borderColor: '#F0D5A8',
    padding: spacing.md, marginBottom: spacing.md,
  },
  envieTop:   { flexDirection: 'row', alignItems: 'center' },
  envieIllus: { width: 46, height: 46 },
  envieTitle: { fontSize: 13.5, fontWeight: '800', color: '#5C3800' },
  envieSub:   { fontSize: 11, color: '#7A5A20', marginTop: 3, lineHeight: 14 },
  envieBtn: {
    backgroundColor: '#B45309', borderRadius: 14,
    paddingVertical: 12, paddingHorizontal: 8,
    alignItems: 'center', justifyContent: 'center',
    width: 96, minHeight: 62,
  },
  envieBtnText: { color: colors.white, fontSize: 13, fontWeight: '700', textAlign: 'center', lineHeight: 16 },
  envieCount:   { fontSize: 11, color: '#B45309', textAlign: 'center', marginTop: 10, fontWeight: '600' },

  // Motivation — fond sauge + illustration cœur/feuilles à droite (kit UI)
  motivCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#EEF3E4', borderRadius: radius.xl,
    padding: spacing.md, marginBottom: spacing.md,
    borderWidth: 1, borderColor: '#D5E4CE',
  },
  motivHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  motivSparkle:{ fontSize: 16 },
  motivTitle:  { fontSize: 14, fontWeight: '800', color: colors.primaryDeep },
  motivIllus:  { width: 58, height: 58, marginLeft: 8 },
  motivHeart:  { fontSize: 22 },
  motivQuote:  { fontSize: 13, color: '#3A5942', lineHeight: 19, fontStyle: 'italic' },

  // Boutons dev — carte horizontale à 2 zones cliquables
  devRow: {
    flexDirection: 'row', alignItems: 'stretch',
    backgroundColor: colors.surface, borderRadius: radius.xl,
    borderWidth: 1, borderColor: colors.grayBorder,
    marginBottom: spacing.md,
    overflow: 'hidden',
    ...shadow.card,
  },
  devCard: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 14, paddingHorizontal: 10,
  },
  devDivider: { width: 1, backgroundColor: colors.grayBorder },
  devIcon:    { fontSize: 18 },
  devText:    { fontSize: 12, color: colors.black, textAlign: 'center', flexShrink: 1 },
  devProgress:{ height: 3, backgroundColor: colors.grayLight, borderRadius: 2, marginTop: 6, overflow: 'hidden' },
  devProgressFill: { width: '35%', height: '100%', backgroundColor: colors.primary },

  // Reset
  resetBtn:  { alignItems: 'center', paddingVertical: spacing.md },
  resetText: { color: colors.gray, fontSize: 12 },
});
