import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity,
  ScrollView, Modal, TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Image } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useUser } from '../context/UserContext';
import { localDateKey } from '../utils/dateKeys';
import { colors, spacing, font, radius, shadow } from '../theme';
import { UI } from '../assets/uiKit';
import { jouerSon } from '../services/sounds';
import { formatCurrency } from '../utils/currency';

// ── Arc circulaire ──────────────────────────────────────────────────────────
// Règle simple : sous l'objectif = vert · pile à l'objectif = orange ·
// dépassé = cercle ENTIÈREMENT rouge.
function CircularDial({ current, total, size = 200 }) {
  const strokeWidth = 14;
  const r = (size - strokeWidth) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;
  const ratio = total > 0 ? Math.min(current / total, 1) : 0;
  const dash = circumference * ratio;
  const gap  = circumference - dash;

  const arcColor = current > total ? '#DC2626' : current === total ? '#F59E0B' : colors.primary;

  return (
    <Svg width={size} height={size}>
      <Circle cx={cx} cy={cy} r={r} stroke={current > total ? '#FECACA' : '#E5E7EB'} strokeWidth={strokeWidth} fill="none" />
      {current > 0 && (
        <Circle
          cx={cx} cy={cy} r={r}
          stroke={arcColor} strokeWidth={strokeWidth} fill="none"
          strokeDasharray={`${dash} ${gap}`}
          strokeLinecap="round" rotation="-90" origin={`${cx}, ${cy}`}
        />
      )}
    </Svg>
  );
}

// ── Anneau "objectif non atteint" — deux arcs (vert tenu / corail dépassé)
// + pastille d'alerte, posé directement sur la carte crème (réf. maquette) ──
function ExceededRingIcon({ pctGreen, size = 120 }) {
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
        {/* Piste corail complète, puis arc vert superposé pour la part tenue */}
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
      <View style={styles_exceeded.badge}>
        <Text style={styles_exceeded.badgeText}>!</Text>
      </View>
    </View>
  );
}

const styles_exceeded = StyleSheet.create({
  badge: {
    position: 'absolute', bottom: -2, right: -2,
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#F0998A', alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: colors.surface,
  },
  badgeText: { fontSize: 20, fontWeight: '900', color: '#7A4636' },
});

// ── Déclencheurs (habitudes) — illustrations 3D du kit UI (page 09) ──────────
const DECLENCHEURS = [
  { key: 'stress',   img: UI.trig_stress },
  { key: 'ennui',    img: UI.trig_ennui },
  { key: 'cafe',     img: UI.trig_cafe },
  { key: 'repas',    img: UI.trig_repas },
  { key: 'social',   img: UI.trig_entourage },
  { key: 'alcool',   img: UI.trig_alcool },
  { key: 'habitude', img: UI.trig_habitude },
];

// ── Modal "Pourquoi cette cigarette ?" ──────────────────────────────────────
function RaisonModal({ visible, persoList, onPick, onCreatePerso, onSkip }) {
  const { t } = useTranslation('jaifume');
  const [mode, setMode]   = useState('pick'); // 'pick' | 'note' | 'creer'
  const [texte, setTexte] = useState('');

  function reset() { setMode('pick'); setTexte(''); }

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={() => { reset(); onSkip(); }}>
      <KeyboardAvoidingView
        style={rm.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={rm.card}>
          <Text style={rm.titre}>{t('raisonModal.title')}</Text>
          <Text style={rm.sous}>{t('raisonModal.subtitle')}</Text>

          {mode === 'pick' && (
            <>
              <View style={rm.grid}>
                {DECLENCHEURS.map(d => (
                  <TouchableOpacity key={d.key} style={rm.chip} onPress={() => { reset(); onPick(d.key, null); }}>
                    <Image source={d.img} style={rm.chipIllus} resizeMode="contain" />
                    <Text style={rm.chipLabel}>{t(`triggers.${d.key}`)}</Text>
                  </TouchableOpacity>
                ))}
                {persoList.map(d => (
                  <TouchableOpacity key={d.key} style={[rm.chip, rm.chipPerso]} onPress={() => { reset(); onPick(d.key, null); }}>
                    <Text style={rm.chipEmoji}>📝</Text>
                    <Text style={rm.chipLabel} numberOfLines={2}>{d.label}</Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity style={rm.chip} onPress={() => setMode('note')}>
                  <Image source={UI.trig_autre} style={rm.chipIllus} resizeMode="contain" />
                  <Text style={rm.chipLabel}>{t('raisonModal.otherNote')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[rm.chip, rm.chipAction]} onPress={() => setMode('creer')}>
                  <Text style={rm.chipPlus}>+</Text>
                  <Text style={rm.chipLabel}>{t('raisonModal.createHabit')}</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity onPress={() => { reset(); onSkip(); }} style={{ alignItems: 'center', paddingVertical: 10 }}>
                <Text style={{ color: colors.gray, fontSize: 13 }}>{t('raisonModal.skip')}</Text>
              </TouchableOpacity>
            </>
          )}

          {mode === 'note' && (
            <>
              <TextInput
                style={rm.input}
                value={texte}
                onChangeText={setTexte}
                placeholder={t('raisonModal.notePlaceholder')}
                placeholderTextColor="#B0B0B0"
                autoFocus
                maxLength={120}
              />
              <TouchableOpacity
                style={[rm.btn, !texte.trim() && { opacity: 0.5 }]}
                disabled={!texte.trim()}
                onPress={() => { const txt = texte.trim(); reset(); onPick('autre', txt); }}
              >
                <Text style={rm.btnText}>{t('raisonModal.validate')}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setMode('pick')} style={{ alignItems: 'center', paddingVertical: 8 }}>
                <Text style={{ color: colors.gray, fontSize: 13 }}>{t('raisonModal.backArrow')}</Text>
              </TouchableOpacity>
            </>
          )}

          {mode === 'creer' && (
            <>
              <Text style={rm.creerHint}>
                {t('raisonModal.createHint')}
              </Text>
              <TextInput
                style={rm.input}
                value={texte}
                onChangeText={setTexte}
                placeholder={t('raisonModal.createPlaceholder')}
                placeholderTextColor="#B0B0B0"
                autoFocus
                maxLength={40}
              />
              <TouchableOpacity
                style={[rm.btn, !texte.trim() && { opacity: 0.5 }]}
                disabled={!texte.trim()}
                onPress={() => { const txt = texte.trim(); reset(); onCreatePerso(txt); }}
              >
                <Text style={rm.btnText}>{t('raisonModal.createAndSelect')}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setMode('pick')} style={{ alignItems: 'center', paddingVertical: 8 }}>
                <Text style={{ color: colors.gray, fontSize: 13 }}>{t('raisonModal.backArrow')}</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const rm = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(23, 61, 38, 0.55)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  card:    { width: '100%', backgroundColor: colors.surface, borderRadius: radius.xl, padding: spacing.lg, ...shadow.modal },
  titre:   { fontSize: 19, fontWeight: '900', color: colors.primaryDeep, textAlign: 'center' },
  sous:    { fontSize: 12, color: colors.gray, textAlign: 'center', marginTop: 4, marginBottom: spacing.md },
  grid:    { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  chip: {
    width: '29%', flexGrow: 1, backgroundColor: colors.cream,
    borderRadius: radius.lg, borderWidth: 1, borderColor: colors.grayBorder,
    paddingVertical: 16, paddingHorizontal: 4, alignItems: 'center', gap: 8,
    minHeight: 96, justifyContent: 'center',
  },
  chipIllus:  { width: 48, height: 48 },
  chipEmoji:  { fontSize: 32 },
  chipPerso:  { backgroundColor: colors.primaryLight, borderColor: '#C8E2CF' },
  chipAction: { borderStyle: 'dashed', borderColor: colors.gray, backgroundColor: colors.surface },
  chipPlus:   { fontSize: 26, color: colors.primaryDeep, fontWeight: '300', lineHeight: 30 },
  chipLabel:  { fontSize: 11, fontWeight: '700', color: colors.primaryDeep, textAlign: 'center' },
  input: {
    borderWidth: 1, borderColor: colors.grayBorder, borderRadius: radius.md,
    padding: 12, fontSize: 14, color: colors.black, marginBottom: spacing.sm,
  },
  creerHint: { fontSize: 11, color: colors.gray, marginBottom: spacing.sm, textAlign: 'center', lineHeight: 16 },
  btn:     { backgroundColor: colors.primary, borderRadius: radius.pill, paddingVertical: 13, alignItems: 'center' },
  btnText: { color: colors.white, fontSize: 14, fontWeight: '700' },
});

// ── Modal feedback ──────────────────────────────────────────────────────────
function FeedbackModal({ visible, count, objectif, prixCigarette, currency, serie, onClose, onNavigate }) {
  const { t, i18n } = useTranslation('jaifume');
  if (!visible) return null;
  const isParfait  = count === 0;
  const isOk       = count > 0 && count <= objectif;
  const isDepasse  = count > objectif;
  // "Pile à l'objectif" (aucune marge) a son propre ton ambré — ni vert franc,
  // ni rouge — cohérent avec l'anneau orange affiché sur la saisie dans ce
  // même cas (0 marge = prudence, pas encore un dépassement).
  const isPile     = count === objectif && count > 0;

  const titre       = isParfait ? t('feedbackModal.perfectTitle') : isPile ? t('feedbackModal.pileTitle') : isOk ? t('feedbackModal.okTitle') : t('feedbackModal.exceededTitle');
  const sousTitre   = isParfait
    ? t('feedbackModal.perfectSub')
    : isPile
    ? t('feedbackModal.pileSub')
    : isOk
    ? t('feedbackModal.okSub')
    : t('feedbackModal.exceededSub');

  const argentDepense = formatCurrency(count * prixCigarette, currency, i18n.language);
  const vieGagnee     = isParfait ? objectif * 5 : null;
  const streak        = serie || 0;
  const pctGreen       = isDepasse && count > 0 ? Math.round((objectif / count) * 100) : 0;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={modal.overlay}>
        <View style={modal.card}>

          {/* Trophée feuillage sur fond crème si journée parfaite (réf. kit UI écran 04-B) */}
          {isParfait ? (
            <View style={modal.trophyHeader}>
              <Image source={UI.trophee_feuilles_creme} style={modal.trophyIllus} resizeMode="contain" />
              <Text style={modal.trophyTitle}>{titre}</Text>
              <Text style={modal.trophySub}>{sousTitre}</Text>
            </View>
          ) : isPile ? (
            <View style={modal.trophyHeader}>
              <Image source={UI.cible_objectif} style={modal.trophyIllus} resizeMode="contain" />
              <Text style={[modal.trophyTitle, { color: '#92400E' }]}>{titre}</Text>
              <Text style={modal.trophySub}>{sousTitre}</Text>
            </View>
          ) : isOk ? (
            <View style={modal.trophyHeader}>
              <Image source={UI.trophee_feuilles_creme} style={modal.trophyIllus} resizeMode="contain" />
              <Text style={modal.trophyTitle}>{titre}</Text>
              <Text style={modal.trophySub}>{sousTitre}</Text>
            </View>
          ) : (
            <View style={modal.trophyHeader}>
              <ExceededRingIcon pctGreen={pctGreen} />
              <Text style={modal.trophyTitle}>{titre}</Text>
              <Text style={modal.trophySub}>{sousTitre}</Text>
            </View>
          )}

          <View style={modal.body}>

            {/* Cas parfait : 3 métriques */}
            {isParfait && (
              <View style={modal.statsRow}>
                <StatItem valeur={`+${vieGagnee}min`} label={t('feedbackModal.lifeGained')} color={colors.primary} />
                <View style={modal.statDiv} />
                <StatItem valeur={formatCurrency(0, currency, i18n.language)} label={t('feedbackModal.spent')} color={colors.black} />
                <View style={modal.statDiv} />
                <StatItem valeur={`🔥 ${streak}${t('common:dayShort')}`} label={t('feedbackModal.streak')} color={colors.warning} />
              </View>
            )}

            {/* Cas objectif respecté (pile ou non) : même mise en page que la
                modale "journée parfaite" (trophée/cible + 3 métriques) */}
            {isOk && (() => {
              const viePreservee = (objectif - count) * 5;
              return (
                <View style={modal.statsRow}>
                  <StatItem valeur={`+${viePreservee}min`} label={t('feedbackModal.lifePreserved')} color={colors.primary} />
                  <View style={modal.statDiv} />
                  <StatItem valeur={argentDepense} label={t('feedbackModal.spent')} color={colors.black} />
                  <View style={modal.statDiv} />
                  <StatItem valeur={`🔥 ${streak}${t('common:dayShort')}`} label={t('feedbackModal.streak')} color={colors.warning} />
                </View>
              );
            })()}

            {/* Cas dépassé : pastille à 3 statistiques, teinte corail pour
                marquer l'état négatif tout en gardant la même forme (bloc
                arrondi + séparateurs) que les autres cas — réf. maquette */}
            {isDepasse && (
              <View style={modal.depStatsPill}>
                <View style={modal.depStatCol}>
                  <Text style={modal.depStatVal}>{count}</Text>
                  <Text style={modal.depStatLbl}>{t('feedbackModal.smokedCigarettes')}</Text>
                </View>
                <View style={modal.depStatDiv} />
                <View style={modal.depStatCol}>
                  <Text style={modal.depStatVal}>{argentDepense}</Text>
                  <Text style={modal.depStatLbl}>{t('feedbackModal.spent')}</Text>
                </View>
                <View style={modal.depStatDiv} />
                <View style={modal.depStatCol}>
                  <Text style={modal.depStatVal}>-{count * 5}min</Text>
                  <Text style={modal.depStatLbl}>{t('feedbackModal.lifeLostLabel')}</Text>
                </View>
              </View>
            )}

            {/* Boutons */}
            <View style={modal.btnRow}>
              <TouchableOpacity
                style={[modal.btn, modal.btnPrimary, isDepasse && { backgroundColor: '#D85A30' }]}
                onPress={onClose}
              >
                <Text style={modal.btnPrimaryText}>
                  {isParfait ? t('feedbackModal.btnPerfect') : isOk ? t('feedbackModal.btnOk') : t('feedbackModal.btnExceeded')}
                </Text>
              </TouchableOpacity>
            </View>

          </View>
        </View>
      </View>
    </Modal>
  );
}

function StatItem({ valeur, label, color }) {
  return (
    <View style={{ alignItems: 'center', flex: 1 }}>
      <Text style={{ fontSize: 16, fontWeight: '700', color }}>{valeur}</Text>
      <Text style={{ fontSize: 10, color: colors.gray, marginTop: 2 }}>{label}</Text>
    </View>
  );
}

// ── Écran principal ─────────────────────────────────────────────────────────
export default function JaiFumeScreen({ navigation }) {
  const { t, i18n } = useTranslation('jaifume');
  const { profile, updateProfile, saveDailyConsumption, stats } = useUser();

  const objectifJour  = stats?.objectifJour ?? 8;
  const prixCigarette = stats?.prixCig ?? 0.5;

  // Ne reprendre le compteur existant que s'il date d'AUJOURD'HUI — sinon
  // (nouveau jour, rien encore saisi) on repart de 0, comme le fait déjà
  // computeStats() pour `cigarettesToday` ailleurs dans l'app.
  const todayKeyInit = localDateKey();
  const [count, setCount]           = useState(
    profile?.lastSavedDate === todayKeyInit ? (profile?.cigarettesToday ?? 0) : 0
  );
  const [modalVisible, setModal]    = useState(false);
  // Heures des cigarettes ajoutées pendant cette session (pour le journal horaire)
  const [addedTimes, setAddedTimes] = useState([]);
  // Raisons associées aux cigarettes ajoutées ({ ts, trigger, note })
  const [raisons, setRaisons]       = useState([]);
  const [raisonModal, setRaisonModal] = useState(false);
  const [raisonTs, setRaisonTs]       = useState(null);

  const persoList = Array.isArray(profile?.declencheursPerso) ? profile.declencheursPerso : [];

  const currency = profile?.monnaie ?? 'EUR';
  const argentDepense = formatCurrency(count * prixCigarette, currency, i18n.language);
  const viePerdue     = count * 5;

  function decrement() {
    if (count === 0) return;
    jouerSon('click_decrement');
    setCount(c => Math.max(0, c - 1));
    const derniere = addedTimes[addedTimes.length - 1];
    setAddedTimes(t => t.slice(0, -1));
    if (derniere) setRaisons(r => r.filter(x => x.ts !== derniere));
  }
  function increment() {
    jouerSon('click_increment');
    const ts = new Date().toISOString();
    setCount(c => c + 1);
    setAddedTimes(t => [...t, ts]);
    // On demande la raison de CETTE cigarette
    setRaisonTs(ts);
    setRaisonModal(true);
  }

  function handleRaison(trigger, note) {
    if (raisonTs) setRaisons(r => [...r, { ts: raisonTs, trigger, ...(note ? { note } : {}) }]);
    setRaisonModal(false);
    setRaisonTs(null);
  }

  async function handleCreerPerso(label) {
    // Crée une habitude personnalisée réutilisable, puis la sélectionne
    const key = 'perso_' + Date.now();
    await updateProfile({ declencheursPerso: [...persoList, { key, label }] });
    handleRaison(key, null);
  }

  async function handleEnregistrer() {
    if (count === 0) jouerSon('enregistrer_zero');
    else if (count <= objectifJour) jouerSon('enregistrer_objectif');
    else jouerSon('enregistrer_depasse');

    const todayKey = localDateKey();
    // cigLog : une entrée horodatée par cigarette. On reconstruit celles du jour
    // pour rester cohérent avec le compteur (ajouts et retraits compris).
    const cigLog     = Array.isArray(profile?.cigLog) ? profile.cigLog : [];
    let aujourdhui    = cigLog.filter(ts => localDateKey(ts) === todayKey).sort();
    aujourdhui = [...aujourdhui, ...addedTimes];
    if (aujourdhui.length > count) aujourdhui = aujourdhui.slice(0, count);
    while (aujourdhui.length < count) aujourdhui.push(new Date().toISOString());

    // Les raisons rejoignent le journal des envies (fume: true) pour l'analyse
    // des habitudes — uniquement celles des cigarettes encore comptées.
    const raisonsValides = raisons.filter(r => aujourdhui.includes(r.ts));
    const nouvellesEnvies = raisonsValides.map(r => ({
      ts: r.ts, trigger: r.trigger, ...(r.note ? { note: r.note } : {}), fume: true,
    }));

    await saveDailyConsumption({
      dateKey: todayKey,
      cigarettes: count,
      entries: aujourdhui,
      cravings: nouvellesEnvies,
    });
    setModal(true);
  }

  function handleCloseModal() {
    setModal(false);
    navigation.goBack();
  }

  function handleNavigate(screen) {
    navigation.navigate(screen);
  }

  const tipVisible = count > 0 && count < objectifJour;

  return (
    <SafeAreaView style={styles.safe}>

      <FeedbackModal
        visible={modalVisible}
        count={count}
        objectif={objectifJour}
        prixCigarette={prixCigarette}
        currency={currency}
        serie={stats?.serie ?? 0}
        onClose={handleCloseModal}
        onNavigate={handleNavigate}
      />
      <RaisonModal
        visible={raisonModal}
        persoList={persoList}
        onPick={handleRaison}
        onCreatePerso={handleCreerPerso}
        onSkip={() => { setRaisonModal(false); setRaisonTs(null); }}
      />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Header ── */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('header.title')}</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* ── Arc + compteur ── */}
        <View style={styles.dialContainer}>
          <CircularDial current={count} total={objectifJour} size={200} />
          <View style={styles.dialInner}>
            <Text style={styles.dialNumber}>{count}</Text>
            <Text style={styles.dialLabel}>{t('common:cigarette', { count })}</Text>
          </View>
          {count === 0 && (
            <Image source={UI.feuille_anneau} style={styles.dialLeaf} resizeMode="contain" />
          )}
        </View>

        {/* ── Sous-titre ── */}
        {count === 0 && (
          <Text style={styles.subTitle}>{t('subtitle.none')}</Text>
        )}

        {/* ── Boutons − / + ── */}
        <View style={styles.controls}>
          <TouchableOpacity
            style={[styles.controlBtn, count === 0 && styles.controlBtnDisabled]}
            onPress={decrement}
            disabled={count === 0}
          >
            <Text style={[styles.controlBtnText, count === 0 && styles.controlBtnTextDisabled]}>−</Text>
          </TouchableOpacity>
          <View style={styles.countBox}>
            <Text style={styles.countNumber}>{count}</Text>
          </View>
          <TouchableOpacity style={styles.controlBtn} onPress={increment}>
            <Text style={styles.controlBtnText}>+</Text>
          </TouchableOpacity>
        </View>

        {/* ── Carte conseil ── */}
        {tipVisible && (
          <View style={styles.tipCard}>
            <Text style={styles.tipEmoji}>💡</Text>
            <Text style={styles.tipText}>
              {t('tip.underGoal', { remaining: objectifJour - count })}
            </Text>
          </View>
        )}
        {count === objectifJour && count > 0 && (
          <View style={[styles.tipCard, { backgroundColor: '#FEF9C3', borderColor: '#FDE047' }]}>
            <Text style={styles.tipEmoji}>🎯</Text>
            <Text style={styles.tipText}>
              {t('tip.atGoal', { goal: objectifJour })}
            </Text>
          </View>
        )}
        {count > objectifJour && (() => {
          const exces = count - objectifJour;
          // Le ton s'aggrave avec le dépassement : un léger écart reste
          // encourageant, un dépassement important passe sur un message et
          // un visuel plus sérieux (pas juste le même texte avec un chiffre
          // qui change).
          const severe = exces >= 3;
          return (
            <View style={[styles.tipCard, severe ? styles.tipCardSevere : styles.tipCardWarning]}>
              <Text style={styles.tipEmoji}>{severe ? '🚨' : '⚠️'}</Text>
              <Text style={styles.tipText}>
                {t(severe ? 'tip.overGoalSevere' : 'tip.overGoal', { count: exces })}
              </Text>
            </View>
          );
        })()}

        {/* ── Bouton Enregistrer ── */}
        <TouchableOpacity style={styles.saveBtn} onPress={handleEnregistrer}>
          <Text style={styles.saveBtnText}>{t('common:save')}</Text>
        </TouchableOpacity>

        {/* ── Récapitulatif ── */}
        <View style={styles.recapCard}>
          <Text style={styles.recapTitle}>{t('recap.title')}</Text>
          <View style={styles.recapRow}>
            <RecapItem img={UI.cigarette_fumee} valeur={`${count}`} label={t('common:cigarette', { count })} />
            <View style={styles.recapDivider} />
            <RecapItem img={UI.argent_depense} valeur={argentDepense} label={t('recap.spent')} valeurColor={colors.danger} />
            <View style={styles.recapDivider} />
            <RecapItem
              img={UI.sablier_vie}
              valeur={viePerdue >= 60
                ? `${Math.floor(viePerdue/60)}h${viePerdue%60>0 ? ` ${viePerdue%60}m` : ''}`
                : `${viePerdue}min`}
              label={t('recap.lifeExpectancy')}
              valeurColor={colors.warning}
            />
          </View>
          <Text style={styles.recapNote}>
            {t('recap.note')}
          </Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

function RecapItem({ emoji, img, valeur, label, valeurColor = colors.black }) {
  return (
    <View style={styles.recapItem}>
      {img
        ? <Image source={img} style={styles.recapIllus} resizeMode="contain" />
        : <Text style={styles.recapEmoji}>{emoji}</Text>}
      <Text style={[styles.recapValeur, { color: valeurColor }]}>{valeur}</Text>
      <Text style={styles.recapLabel}>{label}</Text>
    </View>
  );
}

// ── Styles écran ────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: colors.cream },
  scroll: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: spacing.md, paddingBottom: spacing.lg,
  },
  backBtn:     { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  backText:    { fontSize: 24, color: colors.black, fontWeight: '300' },
  headerTitle: { fontSize: font.md, fontWeight: '700', color: colors.black },
  dialContainer: { position: 'relative', alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
  dialInner:   { position: 'absolute', alignItems: 'center' },
  dialLeaf:    { position: 'absolute', top: 4, right: '18%', width: 36, height: 36 },
  dialNumber:  { fontSize: 56, fontWeight: '900', color: colors.primary, lineHeight: 60 },
  dialLabel:   { fontSize: font.sm, color: colors.gray, fontWeight: '500' },
  subTitle: {
    textAlign: 'center', fontSize: font.md, fontWeight: '600',
    color: colors.black, marginBottom: spacing.xl,
  },
  controls: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.lg, marginBottom: spacing.xl,
  },
  controlBtn: {
    width: 56, height: 56, borderRadius: 28,
    borderWidth: 2, borderColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  controlBtnDisabled:     { borderColor: colors.grayBorder },
  controlBtnText:         { fontSize: 28, color: colors.primary, fontWeight: '300', lineHeight: 32 },
  controlBtnTextDisabled: { color: colors.grayBorder },
  countBox: {
    width: 80, height: 56, borderRadius: radius.md,
    backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center',
  },
  countNumber: { fontSize: font.xl, fontWeight: '900', color: colors.primary },
  tipCard: {
    flexDirection: 'row', alignItems: 'flex-start',
    backgroundColor: colors.primaryLight, borderRadius: radius.lg,
    padding: spacing.md, gap: spacing.sm, marginBottom: spacing.lg,
  },
  tipCardWarning: { backgroundColor: '#FEF3C7' },
  tipCardSevere:  { backgroundColor: '#FEE2E2', borderWidth: 1, borderColor: '#FCA5A5' },
  tipEmoji: { fontSize: 20 },
  tipText:  { flex: 1, fontSize: font.sm, color: colors.black, lineHeight: 20 },
  saveBtn: {
    backgroundColor: colors.primary, borderRadius: radius.pill,
    paddingVertical: 16, alignItems: 'center', marginBottom: spacing.lg,
    ...shadow.card,
  },
  saveBtnText: { color: colors.white, fontSize: font.md, fontWeight: '700' },
  recapCard: {
    borderWidth: 1, borderColor: colors.grayBorder,
    borderRadius: radius.xl, padding: spacing.md,
    backgroundColor: colors.surface,
    ...shadow.card,
  },
  recapTitle:   { fontSize: font.sm, fontWeight: '700', color: colors.primaryDeep, marginBottom: spacing.md, textAlign: 'center' },
  recapRow:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' },
  recapItem:    { alignItems: 'center', flex: 1 },
  recapEmoji:   { fontSize: 22, marginBottom: 4 },
  recapIllus:   { width: 36, height: 36, marginBottom: 4 },
  recapValeur:  { fontSize: font.md, fontWeight: '800', color: colors.black },
  recapLabel:   { fontSize: 11, color: colors.gray, marginTop: 2 },
  recapDivider: { width: 1, height: 40, backgroundColor: colors.grayBorder },
  recapNote:    { fontSize: 10, color: colors.gray, textAlign: 'center', marginTop: spacing.sm, fontStyle: 'italic' },
});

// ── Styles modal ────────────────────────────────────────────────────────────
const modal = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  card: {
    width: '100%', backgroundColor: colors.surface,
    borderRadius: radius.xl, overflow: 'hidden',
  },
  banner: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 16, paddingHorizontal: 18, gap: 12,
  },
  bannerEmoji: { fontSize: 30 },
  bannerTitle: { fontSize: 15, fontWeight: '700', color: '#fff' },
  bannerSub:   { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  // Trophée feuillage posé directement sur la carte crème (journée parfaite — réf. kit UI écran 04-B)
  trophyHeader: {
    paddingTop: 22, paddingHorizontal: 18,
    alignItems: 'center',
  },
  trophyIllus: { width: 140, height: 140, marginBottom: 4 },
  trophyTitle: { fontSize: 20, fontWeight: '900', color: colors.primaryDeep, textAlign: 'center' },
  trophySub:   { fontSize: 14, color: colors.gray, marginTop: 4, textAlign: 'center' },
  body:        { padding: 18 },
  statsRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-around', marginBottom: 16,
    backgroundColor: colors.primaryLight, borderRadius: radius.lg,
    paddingVertical: 14,
  },
  statDiv: { width: 1, height: 36, backgroundColor: colors.grayBorder },
  okBarRow:   { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  okBarLabel: { fontSize: 11, color: colors.gray },
  okBarTrack: { height: 7, backgroundColor: '#E5E7EB', borderRadius: 6, overflow: 'hidden', marginBottom: 4 },
  okBarFill:  { height: '100%', backgroundColor: colors.primary, borderRadius: 6 },
  okBarMarge: { fontSize: 10, color: colors.primary, textAlign: 'right', marginBottom: 12 },
  okChips:    { flexDirection: 'row', gap: 8, marginBottom: 14 },
  okChip:     { flex: 1, backgroundColor: colors.primaryLight, borderRadius: 10, paddingVertical: 8, alignItems: 'center' },
  okChipVal:  { fontSize: 13, fontWeight: '700', color: colors.primaryDeep },
  okChipLbl:  { fontSize: 10, color: colors.primary, marginTop: 1 },
  // Pastille de statistiques — cas objectif non atteint (teinte corail,
  // réf. maquette)
  depStatsPill: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around',
    backgroundColor: '#FAECE7', borderRadius: radius.lg,
    paddingVertical: 14, marginBottom: 16,
  },
  depStatCol: { alignItems: 'center', flex: 1 },
  depStatVal: { fontSize: 16, fontWeight: '700', color: '#4A1B0C' },
  depStatLbl: { fontSize: 10, color: colors.gray, marginTop: 2 },
  depStatDiv: { width: 1, height: 36, backgroundColor: '#F0997B' },
  btnRow:  { flexDirection: 'row', gap: 10 },
  btn:     { flex: 1, paddingVertical: 13, borderRadius: 30, alignItems: 'center' },
  btnPrimary:     { backgroundColor: colors.primary },
  btnPrimaryText: { color: colors.white, fontSize: 14, fontWeight: '700' },
});
