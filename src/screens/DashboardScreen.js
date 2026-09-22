import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, Dimensions, Modal, TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { Image } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTourScroll, useTourTarget } from '../tour/TourContext';
import { validateDayPayload } from '../utils/dailyConsumption';
import { widgetDebugStatus } from '../widget/syncWidget';

import { UI } from '../assets/uiKit';
const PICTOS = {
  temps:    UI.sablier_bois_feuilles,
  evitees:  UI.escalier_progression_drapeau,
  objectif: UI.cible_fleche_feuillue,
  economie: UI.portefeuille_euros_feuilles,
};
import Klop from '../components/Klop';
import { useUser } from '../context/UserContext';
import { colors, spacing, font, radius, shadow, getScreenWidth } from '../theme';
import { annulerNotificationSoir } from '../services/notifications';
import { jouerSon } from '../services/sounds';
import { buildDemoProfile } from '../utils/demoData';
import { IS_DEMO_BUILD } from '../config/demoMode';
import { localDateKey } from '../utils/dateKeys';
import { formatCurrency } from '../utils/currency';

const SCREEN_W = getScreenWidth();

// Nombre de citations motivationnelles disponibles (voir dashboard.json → motivation.quotes)
const MOTIVATIONS_COUNT = 5;

// ── Modal journée parfaite ──────────────────────────────────────────────────
function ModalParfait({ visible, serie, objectifJour, prixCig, currency, onClose }) {
  const { t, i18n } = useTranslation('dashboard');
  // Ne pas garder le <Modal> monté avec visible=false : sur web, le portail
  // de react-native-web peut laisser une couche invisible qui intercepte les
  // clics de l'écran en dessous tant que le composant reste monté. Démonter
  // entièrement quand invisible force un nettoyage propre.
  if (!visible) return null;
  const streak = serie || 0;
  const vieGagneeMins = objectifJour * 5;
  const vieGagneeStr = vieGagneeMins >= 60
    ? `+${Math.floor(vieGagneeMins/60)}h ${vieGagneeMins%60}min`
    : `+${vieGagneeMins}min`;
  const spentZero = formatCurrency(0, currency, i18n.language);
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
            <View style={mp.statDiv} />
            <StatColonne valeur={spentZero} label={t('perfectDayModal.spent')} color={colors.black} />
            <View style={mp.statDiv} />
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
  statsRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', width: '100%',
    backgroundColor: colors.primaryLight, borderRadius: radius.lg,
    paddingVertical: 14, marginBottom: spacing.md,
  },
  statDiv: { width: 1, height: 36, backgroundColor: colors.grayBorder },
  btn:     { width: '100%', backgroundColor: colors.primary, borderRadius: radius.pill, paddingVertical: 15, alignItems: 'center' },
  btnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});

// ── Anneau "objectif non atteint" — deux arcs (vert tenu / corail dépassé)
// + pastille d'alerte, posé directement sur la carte crème (réf. maquette) ──
function ExceededRingIcon({ pctGreen, size = 110 }) {
  const strokeWidth = 16;
  const r  = (size - strokeWidth) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;
  const greenDash = circumference * (pctGreen / 100);
  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <Circle cx={cx} cy={cy} r={r - strokeWidth / 2} fill={colors.surface} />
        <Circle cx={cx} cy={cy} r={r} stroke="#E8A08C" strokeWidth={strokeWidth} fill="none" />
        {pctGreen > 0 && (
          <Circle
            cx={cx} cy={cy} r={r}
            stroke={colors.primary} strokeWidth={strokeWidth} fill="none"
            strokeDasharray={`${greenDash} ${circumference - greenDash}`}
            strokeLinecap="round" rotation="-90" origin={`${cx}, ${cy}`}
          />
        )}
      </Svg>
      <View style={ringStyles.badge}>
        <Text style={ringStyles.badgeText}>!</Text>
      </View>
    </View>
  );
}

const ringStyles = StyleSheet.create({
  badge: {
    position: 'absolute', bottom: -2, right: -2,
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#F0998A', alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: colors.surface,
  },
  badgeText: { fontSize: 18, fontWeight: '900', color: '#7A4636' },
});

// ── Modal feedback journée (variante A = ok, variante B = dépassé) ───────────
function ModalObjectif({ visible, count, objectif, prixCigarette, currency, serie, onClose }) {
  const { t, i18n } = useTranslation('dashboard');
  if (!visible) return null;
  const isOk      = count <= objectif;
  // "Pile à l'objectif" (aucune marge) a son propre ton — ni vert franc
  // (comme sous l'objectif), ni rouge — pour rester cohérent avec l'anneau
  // orange affiché sur l'Accueil dans ce même cas (0 marge = prudence).
  const isPile    = count === objectif && count > 0;
  const depense   = formatCurrency(count * prixCigarette, currency, i18n.language);
  const streak    = serie || 0;

  // Variante A — objectif respecté
  const viePreservee = isOk ? (objectif - count) * 5 : 0;

  // Variante B — objectif dépassé
  const viePerdue  = !isOk ? count * 5 : 0;
  const pctGreen   = !isOk && count > 0 ? Math.round((objectif / count) * 100) : 0;

  // Cas "objectif respecté" (pas pile, pas dépassé) : même mise en page que
  // la modale "journée parfaite" (trophée + titre + 3 stats + bouton plein),
  // réf. maquette explicitement demandée — plutôt qu'une bannière + barre.
  if (isOk && !isPile) {
    return (
      <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
        <View style={mp.overlay}>
          <View style={mp.card}>
            <Image source={UI.trophee_feuilles_creme} style={mp.trophyIllus} resizeMode="contain" />
            <Text style={mp.trophyTitle}>{t('goalModal.successTitle')}</Text>
            <Text style={mp.trophySub}>{t('goalModal.successSubtitle')}</Text>

            <View style={mp.statsRow}>
              <StatColonne valeur={`+${viePreservee} ${t('common:min')}`} label={t('goalModal.lifePreserved')} color={colors.primary} />
              <View style={mp.statDiv} />
              <StatColonne valeur={depense} label={t('goalModal.spent')} color={colors.black} />
              <View style={mp.statDiv} />
              <StatColonne valeur={`🔥 ${streak}${t('common:dayShort')}`} label={t('perfectDayModal.streak')} color={colors.warning} />
            </View>
            <TouchableOpacity style={mp.btn} onPress={onClose}>
              <Text style={mp.btnText}>{t('goalModal.successButton')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  // Cas "pile à l'objectif" (0 marge) : même mise en page (image + titre +
  // 3 stats + bouton plein) que les deux autres cas, avec la cible comme
  // illustration et un ton ambré pour rester distinct d'un succès franc.
  if (isPile) {
    return (
      <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
        <View style={mp.overlay}>
          <View style={mp.card}>
            <Image source={UI.cible_objectif} style={mp.trophyIllus} resizeMode="contain" />
            <Text style={[mp.trophyTitle, { color: '#92400E' }]}>{t('goalModal.pileTitle')}</Text>
            <Text style={mp.trophySub}>{t('goalModal.pileSubtitle')}</Text>

            <View style={mp.statsRow}>
              <StatColonne valeur={`+${viePreservee} ${t('common:min')}`} label={t('goalModal.lifePreserved')} color={colors.primary} />
              <View style={mp.statDiv} />
              <StatColonne valeur={depense} label={t('goalModal.spent')} color={colors.black} />
              <View style={mp.statDiv} />
              <StatColonne valeur={`🔥 ${streak}${t('common:dayShort')}`} label={t('perfectDayModal.streak')} color={colors.warning} />
            </View>
            <TouchableOpacity style={[mp.btn, { backgroundColor: '#D97706' }]} onPress={onClose}>
              <Text style={mp.btnText}>{t('goalModal.successButton')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  // Cas "objectif dépassé" (dernier cas restant, isOk et isPile retournent
  // déjà plus haut) : même mise en page que les trois autres cas (image +
  // titre + bloc de stats à séparateurs + bouton plein), teinte corail pour
  // marquer l'état négatif — réf. maquette.
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={mp.overlay}>
        <View style={mp.card}>
          <ExceededRingIcon pctGreen={pctGreen} />
          <Text style={[mp.trophyTitle, { color: '#4A1B0C' }]}>{t('goalModal.exceededTitle')}</Text>
          <Text style={mp.trophySub}>{t('goalModal.exceededSubtitleShort')}</Text>

          <View style={[mp.statsRow, { backgroundColor: '#FAECE7' }]}>
            <StatColonne valeur={`${count}`} label={t('goalModal.smokedCigarettes')} color="#4A1B0C" />
            <View style={[mp.statDiv, { backgroundColor: '#F0997B' }]} />
            <StatColonne valeur={depense} label={t('goalModal.spent')} color="#4A1B0C" />
            <View style={[mp.statDiv, { backgroundColor: '#F0997B' }]} />
            <StatColonne valeur={`-${viePerdue} ${t('common:min')}`} label={t('goalModal.lifeLostLabel')} color="#4A1B0C" />
          </View>
          <TouchableOpacity style={[mp.btn, { backgroundColor: '#D85A30' }]} onPress={onClose}>
            <Text style={mp.btnText}>{t('goalModal.exceededButton')}</Text>
          </TouchableOpacity>
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

  if (!visible) return null;

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
  const tourScroll = useTourScroll('Accueil');
  const smokedLinkRef = useTourTarget('home.smokedLink');
  const {
    profile, stats, resetProfile, updateProfile,
    saveDailyConsumption, recordCraving, testAccess,
  } = useUser();
  const [, setTick]          = useState(0);
  const [quoteIdx]           = useState(() => Math.floor(Math.random() * MOTIVATIONS_COUNT));
  const [liked, setLiked]    = useState(false);
  const [modalParfait, setModalParfait]   = useState(false);
  const [modalObjectif, setModalObjectif] = useState(false);
  const [modalEnvie, setModalEnvie]       = useState(false);

  const motivationQuotes = t('motivation.quotes', { returnObjects: true });

  const currency = profile?.monnaie ?? 'EUR';
  const fmtMoney = n => formatCurrency(n, currency, i18n.language);

  // Enregistre une envie de fumer (heure + jour + déclencheur + note + issue).
  // Si l'utilisateur a fumé, la cigarette est aussi comptée partout (compteur + historique + cloud).
  async function handleEnvie({ ts, trigger, note, fume }) {
    const craving = { ts, trigger, ...(note ? { note } : {}), fume: !!fume };
    if (fume) {
      // `ts` date de la SÉLECTION du déclencheur (début de l'envie) — utile
      // pour l'analyse des habitudes, mais pas pour le compteur "sans
      // cigarette depuis" : l'utilisateur peut ensuite passer par un écran
      // de note avant de confirmer. On horodate la cigarette elle-même à
      // l'instant précis où ce bouton est pressé, pour que le compteur
      // reparte bien de zéro à ce moment-là et pas avant.
      const cigaretteTs = new Date().toISOString();
      const todayKey = localDateKey();
      const current  = profile?.lastSavedDate === todayKey ? (profile.cigarettesToday ?? 0) : 0;
      const entries = (Array.isArray(profile?.cigLog) ? profile.cigLog : [])
        .filter(value => localDateKey(value) === todayKey);
      await saveDailyConsumption({
        dateKey: todayKey,
        cigarettes: current + 1,
        entries: [...entries, cigaretteTs],
        cravings: [craving],
      });
      return;
    }
    await recordCraving(craving);
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
    objectifJour, cigarettesToday, jourRenseigne, consoEstimee,
    ecartPlanJour, argentVsPlanJour, vieVsPlanJour,
    progressionJour: progression,
    prixCig, serie,
  } = stats;

  const progressionPositif = progression >= 0;
  const sousObjectif = ecartPlanJour <= 0;

  // ── Semaine : barres, limite et total (données issues de computeStats) ──
  const weekData       = stats.weekData ?? [];
  const weekLabels     = stats.weekLabels ?? [];
  const weekObjectifs  = stats.weekObjectifs ?? [];
  const weekRenseignes = stats.weekRenseignes ?? [];
  const weekMax        = weekObjectifs.reduce((somme, o) => somme + o, 0);
  const weekJours      = weekRenseignes.filter(Boolean).length;
  const weekJoursOk    = weekRenseignes.filter((ok, i) => ok && weekData[i] <= weekObjectifs[i]).length;
  const weekEchelle    = Math.max(...weekData, ...weekObjectifs, 1);
  const cigEviteesSemaine = Math.max(0, Math.round((stats.consoAvant ?? 0) * weekJours - (stats.weekSum ?? 0)));
  const restantJour    = Math.max(0, objectifJour - cigarettesToday);
  const depassement    = Math.max(0, cigarettesToday - objectifJour);
  // Décimales à la française (4,3) plutôt qu'au format anglais (4.3).
  const fmtNb = n => Number(n).toLocaleString(i18n.language || 'fr-FR');
  const consoAvantJour = stats.consoAvant ?? 0;
  const consoActuelle  = Math.round((stats.consoRecente ?? consoAvantJour) * 10) / 10;
  const baisseParJour  = Math.round(Math.max(0, consoAvantJour - consoActuelle) * 10) / 10;

  return (
    <SafeAreaView style={styles.safe}>

      <ModalParfait
        visible={modalParfait}
        serie={serie}
        objectifJour={objectifJour}
        currency={currency}
        onClose={() => setModalParfait(false)}
      />
      <ModalObjectif
        visible={modalObjectif}
        count={cigarettesToday}
        objectif={objectifJour}
        prixCigarette={prixCig}
        currency={currency}
        serie={serie}
        onClose={() => setModalObjectif(false)}
      />
      <ModalEnvie
        visible={modalEnvie}
        onSave={handleEnvie}
        onClose={() => setModalEnvie(false)}
      />

      <ScrollView {...tourScroll} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Marque, notifications et série ── */}
        <View style={styles.topBar}>
          <Text style={styles.brand}>stopklop</Text>
          <View style={styles.topRight}>
            <TouchableOpacity style={styles.bellBtn} onPress={() => navigation.navigate('Notifications')}>
              <Image source={UI.cloche_rappel} style={styles.bellIcon} resizeMode="contain" />
            </TouchableOpacity>
            <View style={styles.streakChip}>
              <Text style={styles.streakText}>{`\u{1F525} ${serie} ${t('common:dayShort')}`}</Text>
            </View>
          </View>
        </View>

        {/* ── Klop annonce l'état du jour ── */}
        <View style={styles.helloRow}>
          <Klop width={58} />
          <View style={styles.bubble}>
            <Text style={styles.bubbleText}>
              {depassement > 0
                ? t('home2.bubbleOver')
                : `${t('home2.bubbleLeft', { count: restantJour })} ${(stats.weekSum ?? 0) <= weekMax ? t('home2.bubbleUnder') : t('home2.bubbleAbove')}`}
            </Text>
          </View>
        </View>

        {/* ── Semaine : une barre par jour, le trait marque la limite ── */}
        <View style={styles.weekCard}>
          <View style={styles.weekHead}>
            <Text style={styles.cardLabel}>{t('home2.weekTitle')}</Text>
            <View style={styles.weekTotal}>
              <Image source={UI.paquet_cigarettes} style={styles.weekTotalIcon} resizeMode="contain" />
              <Text style={styles.weekTotalText}>{t('home2.weekCount', { count: stats.weekSum ?? 0, max: weekMax })}</Text>
            </View>
          </View>

          <View style={styles.bars}>
            {weekData.map((valeur, i) => {
              const renseigne = weekRenseignes[i];
              const objectif  = weekObjectifs[i] ?? objectifJour;
              const hauteur   = Math.max(6, Math.round((valeur / weekEchelle) * 54));
              const depasse   = renseigne && valeur > objectif;
              return (
                <View key={i} style={styles.barCol}>
                  <View style={[
                    styles.bar,
                    { height: renseigne ? hauteur : 6 },
                    !renseigne && styles.barVide,
                    depasse && styles.barDepasse,
                  ]} />
                </View>
              );
            })}
            <View pointerEvents="none" style={[styles.goalLine, { bottom: Math.round((objectifJour / weekEchelle) * 54) }]} />
          </View>

          <View style={styles.barLabels}>
            {weekLabels.map((label, i) => (
              <Text
                key={i}
                style={[
                  styles.barLabel,
                  weekRenseignes[i] && weekData[i] > (weekObjectifs[i] ?? objectifJour) && styles.barLabelDepasse,
                ]}
              >{label}</Text>
            ))}
          </View>

          <Text style={styles.weekFoot}>
            {t('home2.weekLimit', { count: objectifJour })}
            {weekJours > 0 ? ` \u00B7 ${t('home2.weekInGoal', { ok: weekJoursOk, total: weekJours })}` : ''}
          </Text>
        </View>

        {/* ── Aujourd'hui : anneau, objectif et les deux actions ── */}
        <View style={styles.todayCard}>
          <View style={styles.todayRow}>
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

            <View style={styles.todayTexts}>
              <Text style={styles.cardLabel}>{t('home2.todayTitle')}</Text>

              <View style={styles.todayLine}>
                <Image source={UI.cigarette_fumee} style={styles.lineIcon} resizeMode="contain" />
                <Text style={styles.todayValue}>
                  {depassement > 0
                    ? t('home2.reserveOver', { count: depassement })
                    : t('home2.reserve', { count: restantJour })}
                </Text>
              </View>

              <View style={styles.todayLine}>
                <Image source={UI.cible_limite} style={styles.lineIcon} resizeMode="contain" />
                <Text style={styles.todayGoal}>{t('home2.goalLine', { count: objectifJour })}</Text>
              </View>

              <View style={styles.actions}>
                <TouchableOpacity
                  style={styles.validateBtn}
                  onPress={async () => {
                    jouerSon(cigarettesToday === 0 ? 'enregistrer_zero' : 'valider_journee');
                    annulerNotificationSoir();
                    // Avant ce clic, 0 veut dire « pas encore renseigné ». Valider
                    // crée donc explicitement une journée à 0 cigarette.
                    const payload = validateDayPayload(jourRenseigne, localDateKey());
                    if (payload) await saveDailyConsumption(payload);
                    if (cigarettesToday === 0) setModalParfait(true);
                    else setModalObjectif(true);
                  }}
                >
                  <Text style={styles.validateBtnText}>{`\u2713 ${t('home2.validate')}`}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  ref={smokedLinkRef}
                  collapsable={false}
                  style={styles.smokedBtn}
                  onPress={() => navigation.navigate('JaiFume')}
                >
                  <Text style={styles.smokedBtnText}>{t('home2.smoked')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        {/* ── Ta baisse : avant → maintenant ── */}
        <View style={styles.dropCard}>
          <View style={styles.dropHead}>
            <Image source={UI.cigarette_fumee} style={styles.dropHeadIcon} resizeMode="contain" />
            <Text style={styles.cardLabel}>{t('home2.dropTitle')}</Text>
          </View>
          <View style={styles.dropRow}>
            <View style={styles.dropBefore}>
              <Text style={styles.dropBeforeValue}>{fmtNb(Math.round(consoAvantJour * 10) / 10)}</Text>
              <Text style={styles.dropBeforeLabel}>{t('home2.dropBefore')}</Text>
            </View>
            <Text style={styles.dropArrow}>{'\u2192'}</Text>
            <View style={styles.dropNow}>
              <Text style={styles.dropNowValue}>{fmtNb(consoActuelle)}</Text>
              <Text style={styles.dropNowLabel}>{t('home2.dropNow')}</Text>
            </View>
          </View>
          {baisseParJour > 0 && (
            <Text style={styles.dropDelta}>{t('home2.dropDelta', { count: fmtNb(baisseParJour) })}</Text>
          )}
        </View>

        {/* ── Jour et semaine : les mêmes trois chiffres des deux côtés ── */}
        <View style={styles.colsRow}>
          <View style={styles.colCard}>
            <Text style={styles.cardLabel}>{t('home2.todayTitle')}</Text>
            <ColStat img={UI.cigarette_fumee} valeur={jourRenseigne ? String(stats.cigEviteesAujourdhu ?? 0) : '\u2014'} label={t('home2.colAvoided')} />
            <ColStat img={UI.portefeuille_euros_feuilles} valeur={jourRenseigne ? fmtMoney(stats.argentEcoAujourdhui ?? 0) : '\u2014'} label={t('home2.colMoney')} />
            <ColStat img={UI.chrono_vie_preservee} valeur={jourRenseigne ? stats.vieGagneeStrAujourdhui : '\u2014'} label={t('home2.colLife')} />
          </View>
          <View style={[styles.colCard, styles.colCardDark]}>
            <Text style={[styles.cardLabel, styles.cardLabelDark]}>{t('home2.weekTitle')}</Text>
            <ColStat dark img={UI.cigarette_fumee} valeur={String(cigEviteesSemaine)} label={t('home2.colAvoided')} />
            <ColStat dark img={UI.portefeuille_euros_feuilles} valeur={fmtMoney(stats.argentEcoSemaine ?? 0)} label={t('home2.colMoney')} />
            <ColStat dark img={UI.chrono_vie_preservee} valeur={stats.vieGagneeStrSemaine} label={t('home2.colLife')} />
          </View>
        </View>

        {/* Sans cette phrase, « 13 cigarettes évitées » le jour où l'on en fume 2
            n'a aucun sens : il manque le point de comparaison. */}
        {consoAvantJour > 0 && (
          <Text style={styles.colsFootnote}>
            {t('home2.colsFootnote', { count: fmtNb(Math.round(consoAvantJour * 10) / 10) })}
          </Text>
        )}

        {/* ── Envie de fumer — layout horizontal avec bouton à droite ── */}
        <View style={styles.envieCard}>
          <View style={styles.envieTop}>
            <Image source={UI.envie_flamme} style={styles.envieIllus} resizeMode="contain" />
            <View style={{ flex: 1, minWidth: 0, marginHorizontal: 8 }}>
              <Text style={styles.envieTitle}>{t('envieCard.title')}</Text>
              <Text style={styles.envieSub}>{t('envieCard.subtitle')}</Text>
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

        {/* ⚠️ TEMPORAIRE : refaire l'onboarding depuis une build de test.
            Visible uniquement avec l'accès de test (voir services/testAccess.js). */}
        {(testAccess || __DEV__) && !IS_DEMO_BUILD && (
          <View style={styles.testTools}>
            <TouchableOpacity style={styles.testBtn} onPress={() => navigation.navigate('ApercuOnboarding')}>
              <Text style={styles.testBtnText}>{t('home2.previewOnboarding')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.testBtn} onPress={() => navigation.navigate('ApercuPaywall')}>
              <Text style={styles.testBtnText}>{t('home2.previewPaywall')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.testBtn} onPress={async () => { await resetProfile(); }}>
              <Text style={styles.testBtnText}>{t('home2.backToOnboarding')}</Text>
            </TouchableOpacity>
            <Text style={styles.testInfo}>widget : {widgetDebugStatus()}</Text>
          </View>
        )}

        {/* ── Boutons dev — 2 cartes horizontales côte à côte ──
             Outils de développement uniquement : jamais montrés à un vrai
             utilisateur en production (Expo Go / build dev = __DEV__ true). */}
        {__DEV__ && !IS_DEMO_BUILD && (
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
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

// ── Ligne d'une colonne « Aujourd'hui » / « Cette semaine » ─────────────────
// L'icône est posée sur une pastille blanche : les PNG du kit portent une ombre
// claire qui baverait sur le fond vert foncé de la colonne « cette semaine ».
function ColStat({ img, valeur, label, dark }) {
  return (
    <View style={styles.colStat}>
      <View style={styles.colStatIcon}>
        <Image source={img} style={styles.colStatImg} resizeMode="contain" />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={[styles.colStatValue, dark && styles.colStatValueDark]}>{valeur}</Text>
        <Text style={[styles.colStatLabel, dark && styles.colStatLabelDark]}>{label}</Text>
      </View>
    </View>
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
  // ── Accueil : marque, Klop, semaine, jour, baisse, colonnes ────────────────
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
  brand: { fontSize: 20, fontWeight: '900', color: colors.primaryDeep, letterSpacing: -0.4 },
  topRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  streakChip: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.grayBorder, borderRadius: radius.full, paddingHorizontal: 12, paddingVertical: 7 },
  streakText: { fontSize: 13, fontWeight: '800', color: '#B4670F' },

  helloRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 9, marginBottom: spacing.md },
  bubble: { flex: 1, backgroundColor: '#E7F2E8', borderRadius: 16, borderBottomLeftRadius: 4, paddingVertical: 10, paddingHorizontal: 12, marginBottom: 6 },
  bubbleText: { fontSize: 13.5, fontWeight: '700', color: colors.primaryDeep, lineHeight: 19 },

  cardLabel: { fontSize: 10.5, fontWeight: '800', letterSpacing: 0.9, textTransform: 'uppercase', color: '#8A9A90' },
  cardLabelDark: { color: '#92D6B0' },

  weekCard: { backgroundColor: colors.surface, borderRadius: radius.xl, padding: 14, marginBottom: spacing.sm, ...shadow.card },
  weekHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  weekTotal: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  weekTotalIcon: { width: 20, height: 20 },
  weekTotalText: { fontSize: 12.5, fontWeight: '800', color: colors.primaryDeep },
  bars: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: 58, marginTop: 10, position: 'relative' },
  barCol: { flex: 1, alignItems: 'center' },
  bar: { width: 22, borderRadius: 5, backgroundColor: colors.primary },
  barVide: { backgroundColor: '#DCE8DF' },
  barDepasse: { backgroundColor: '#E08A3C' },
  goalLine: { position: 'absolute', left: 0, right: 0, height: 1.5, backgroundColor: '#B9C9BE' },
  barLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 5 },
  barLabel: { flex: 1, textAlign: 'center', fontSize: 9.5, fontWeight: '800', color: '#9AA79F' },
  barLabelDepasse: { color: '#E08A3C' },
  weekFoot: { fontSize: 10.5, color: '#7D8F84', fontWeight: '600', marginTop: 7 },

  todayCard: { backgroundColor: colors.surface, borderRadius: radius.xl, padding: 14, marginBottom: spacing.sm, ...shadow.card },
  todayRow: { flexDirection: 'row', alignItems: 'center', gap: 13 },
  todayTexts: { flex: 1, minWidth: 0 },
  todayLine: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 3 },
  lineIcon: { width: 20, height: 20 },
  todayValue: { flex: 1, fontSize: 14.5, fontWeight: '800', color: colors.black },
  todayGoal: { flex: 1, fontSize: 12.5, color: '#6F8078', fontWeight: '600' },
  actions: { flexDirection: 'row', gap: 7, marginTop: 10 },
  validateBtn: { flex: 1, backgroundColor: colors.primaryDeep, borderRadius: 14, paddingVertical: 11, alignItems: 'center' },
  validateBtnText: { color: colors.white, fontSize: 13, fontWeight: '800' },
  smokedBtn: { flex: 1, backgroundColor: colors.white, borderWidth: 1.5, borderColor: '#DCE6DD', borderRadius: 14, paddingVertical: 11, alignItems: 'center' },
  smokedBtnText: { color: colors.primaryDeep, fontSize: 13, fontWeight: '800' },

  dropCard: { backgroundColor: colors.surface, borderRadius: radius.xl, padding: 14, marginBottom: spacing.sm, ...shadow.card },
  dropHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dropHeadIcon: { width: 22, height: 22 },
  dropRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10 },
  dropBefore: { flex: 1, alignItems: 'center', backgroundColor: '#F4F2EC', borderRadius: 14, paddingVertical: 10 },
  dropBeforeValue: { fontSize: 20, fontWeight: '900', color: '#8A7C62' },
  dropBeforeLabel: { fontSize: 10, fontWeight: '700', color: '#8A9A90', marginTop: 2 },
  dropArrow: { fontSize: 18, fontWeight: '900', color: colors.primary },
  dropNow: { flex: 1, alignItems: 'center', backgroundColor: '#EFF7F1', borderRadius: 14, paddingVertical: 10 },
  dropNowValue: { fontSize: 20, fontWeight: '900', color: colors.primaryDeep },
  dropNowLabel: { fontSize: 10, fontWeight: '700', color: '#5C8A6E', marginTop: 2 },
  dropDelta: { fontSize: 11.5, color: '#7D8F84', fontWeight: '600', textAlign: 'center', marginTop: 9 },

  colsRow: { flexDirection: 'row', gap: 8, marginBottom: spacing.sm },
  colsFootnote: { fontSize: 12.5, color: '#8A938C', textAlign: 'center', marginTop: -2, marginBottom: spacing.sm, lineHeight: 17 },
  colCard: { flex: 1, backgroundColor: colors.surface, borderRadius: radius.xl, padding: 12, ...shadow.card },
  colCardDark: { backgroundColor: colors.primaryDeep },
  colStat: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 9 },
  colStatIcon: { width: 30, height: 30, borderRadius: 10, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  colStatImg: { width: 22, height: 22 },
  colStatValue: { fontSize: 14.5, fontWeight: '800', color: colors.black },
  colStatValueDark: { color: colors.white },
  colStatLabel: { fontSize: 10, fontWeight: '700', color: '#8A9A90', lineHeight: 13 },
  colStatLabelDark: { color: '#BFE3CE' },

  testTools: { marginTop: spacing.sm },
  testBtn: { alignItems: 'center', paddingVertical: 9 },
  testInfo: { textAlign: 'center', fontSize: 11, color: '#9AA79F', marginTop: 4 },
  testBtnText: { color: '#9A3412', fontSize: 13, fontWeight: '700', textDecorationLine: 'underline' },
});
