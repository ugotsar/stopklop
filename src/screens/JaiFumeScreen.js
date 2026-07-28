import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity,
  ScrollView, Modal, TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import { useUser } from '../context/UserContext';
import { colors, spacing, font, radius } from '../theme';
import { jouerSon } from '../services/sounds';

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

// ── Déclencheurs (habitudes) ────────────────────────────────────────────────
const DECLENCHEURS = [
  { key: 'stress',   emoji: '😰' },
  { key: 'ennui',    emoji: '😴' },
  { key: 'cafe',     emoji: '☕' },
  { key: 'repas',    emoji: '🍽' },
  { key: 'social',   emoji: '👥' },
  { key: 'alcool',   emoji: '🍺' },
  { key: 'habitude', emoji: '🚬' },
];

// ── Modal "Pourquoi cette cigarette ?" ──────────────────────────────────────
function RaisonModal({ visible, persoList, onPick, onCreatePerso, onSkip }) {
  const { t } = useTranslation('jaifume');
  const [mode, setMode]   = useState('pick'); // 'pick' | 'note' | 'creer'
  const [texte, setTexte] = useState('');

  function reset() { setMode('pick'); setTexte(''); }

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
                    <Text style={{ fontSize: 18 }}>{d.emoji}</Text>
                    <Text style={rm.chipLabel}>{t(`triggers.${d.key}`)}</Text>
                  </TouchableOpacity>
                ))}
                {persoList.map(d => (
                  <TouchableOpacity key={d.key} style={[rm.chip, rm.chipPerso]} onPress={() => { reset(); onPick(d.key, null); }}>
                    <Text style={{ fontSize: 18 }}>📝</Text>
                    <Text style={rm.chipLabel} numberOfLines={2}>{d.label}</Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity style={[rm.chip, rm.chipAction]} onPress={() => setMode('note')}>
                  <Text style={{ fontSize: 18 }}>✍️</Text>
                  <Text style={rm.chipLabel}>{t('raisonModal.otherNote')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[rm.chip, rm.chipAction]} onPress={() => setMode('creer')}>
                  <Text style={{ fontSize: 18 }}>➕</Text>
                  <Text style={rm.chipLabel}>{t('raisonModal.createHabit')}</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity onPress={() => { reset(); onSkip(); }} style={{ alignItems: 'center', paddingVertical: 8 }}>
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
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  card:    { width: '100%', backgroundColor: colors.white, borderRadius: 20, padding: 18 },
  titre:   { fontSize: 16, fontWeight: '800', color: colors.black, textAlign: 'center' },
  sous:    { fontSize: 11, color: colors.gray, textAlign: 'center', marginTop: 2, marginBottom: 12 },
  grid:    { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    width: '31%', flexGrow: 1, backgroundColor: '#F7F8FA',
    borderRadius: 12, borderWidth: 1, borderColor: '#EEE',
    paddingVertical: 10, paddingHorizontal: 4, alignItems: 'center', gap: 3,
  },
  chipPerso:  { backgroundColor: '#EEF6F0', borderColor: '#C8E2CF' },
  chipAction: { borderStyle: 'dashed', borderColor: '#CCC', backgroundColor: colors.white },
  chipLabel:  { fontSize: 10, fontWeight: '600', color: colors.black, textAlign: 'center' },
  input: {
    borderWidth: 1, borderColor: colors.grayBorder, borderRadius: 12,
    padding: 12, fontSize: 14, color: colors.black, marginBottom: 10,
  },
  creerHint: { fontSize: 11, color: colors.gray, marginBottom: 8, textAlign: 'center', lineHeight: 16 },
  btn:     { backgroundColor: colors.primary, borderRadius: 30, paddingVertical: 12, alignItems: 'center' },
  btnText: { color: colors.white, fontSize: 14, fontWeight: '700' },
});

// ── Modal feedback ──────────────────────────────────────────────────────────
function FeedbackModal({ visible, count, objectif, prixCigarette, diffJours, onClose, onNavigate }) {
  const { t } = useTranslation('jaifume');
  const isParfait  = count === 0;
  const isOk       = count > 0 && count <= objectif;
  const isDepasse  = count > objectif;

  const bannerColor    = isParfait ? '#1B6B3A' : isOk ? '#EAF3DE' : '#92400E';
  const bannerBorder   = isOk ? '#C0DD97' : 'transparent';
  const emoji          = isParfait ? '🏆' : isOk ? '✅' : '⚠️';
  const titre          = isParfait ? t('feedbackModal.perfectTitle') : isOk ? t('feedbackModal.okTitle') : t('feedbackModal.exceededTitle');
  const titreColor     = isOk ? '#27500A' : '#fff';
  const sousTitreColor = isOk ? '#3B6D11' : 'rgba(255,255,255,0.8)';
  const sousTitre   = isParfait
    ? t('feedbackModal.perfectSub')
    : isOk
    ? t('feedbackModal.okSub')
    : t('feedbackModal.exceededSub', { count, diff: count - objectif });

  const argentDepense = (count * prixCigarette).toFixed(2);
  const vieGagnee     = isParfait ? objectif * 20 : null;
  const streak        = diffJours || 0;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={modal.overlay}>
        <View style={modal.card}>

          {/* Bandeau couleur */}
          <View style={[modal.banner, { backgroundColor: bannerColor, borderBottomWidth: 0.5, borderBottomColor: bannerBorder }]}>
            <Text style={modal.bannerEmoji}>{emoji}</Text>
            <View style={{ flex: 1 }}>
              <Text style={[modal.bannerTitle, { color: titreColor }]}>{titre}</Text>
              <Text style={[modal.bannerSub, { color: sousTitreColor }]}>{sousTitre}</Text>
            </View>
          </View>

          <View style={modal.body}>

            {/* Cas parfait : 3 métriques */}
            {isParfait && (
              <View style={modal.statsRow}>
                <StatItem valeur={`+${vieGagnee} min`} label={t('feedbackModal.lifeGained')} color="#1B6B3A" />
                <View style={modal.statDiv} />
                <StatItem valeur={`0,00 €`} label={t('feedbackModal.spent')} color="#1B6B3A" />
                <View style={modal.statDiv} />
                <StatItem valeur={`🔥 ${streak}${t('common:dayShort')}`} label={t('feedbackModal.streak')} color="#F59E0B" />
              </View>
            )}

              {/* Cas objectif ok : barre de progression + 2 chips */}
            {isOk && (() => {
              const pct = Math.round((count / objectif) * 100);
              const marge = Math.round(((objectif - count) / objectif) * 100);
              const viePreservee = (objectif - count) * 5;
              return (
                <>
                  <View style={modal.okBarRow}>
                    <Text style={modal.okBarLabel}>{count} {t('common:cigarette', { count })}</Text>
                    <Text style={modal.okBarLabel}>{t('feedbackModal.goalLabel', { goal: objectif })}</Text>
                  </View>
                  <View style={modal.okBarTrack}>
                    <View style={[modal.okBarFill, { width: `${pct}%` }]} />
                  </View>
                  <Text style={modal.okBarMarge}>{t('feedbackModal.margin', { pct: marge })}</Text>
                  <View style={modal.okChips}>
                    <View style={modal.okChip}>
                      <Text style={modal.okChipVal}>{argentDepense} €</Text>
                      <Text style={modal.okChipLbl}>{t('feedbackModal.spent')}</Text>
                    </View>
                    <View style={modal.okChip}>
                      <Text style={modal.okChipVal}>{viePreservee} min</Text>
                      <Text style={modal.okChipLbl}>{t('feedbackModal.lifePreserved')}</Text>
                    </View>
                  </View>
                </>
              );
            })()}

            {/* Cas dépassé : barre overflow + chips + message */}
            {isDepasse && (() => {
              const exces     = count - objectif;
              const viePerdue = count * 5;
              const totalBar  = objectif + exces;
              const pctObj    = Math.round((objectif / totalBar) * 100);
              return (
                <>
                  <View style={modal.okBarRow}>
                    <Text style={modal.depBarLabel}>{t('feedbackModal.goalLabel', { goal: objectif })}</Text>
                    <Text style={[modal.depBarLabel, { color: '#DC2626' }]}>{t('feedbackModal.tooMuch', { exces })}</Text>
                  </View>
                  <View style={modal.depBarTrack}>
                    <View style={[modal.depBarObj, { width: `${pctObj}%` }]} />
                    <View style={[modal.depBarExces, { width: `${100 - pctObj}%` }]} />
                  </View>
                  <Text style={modal.depBarSub}>{t('feedbackModal.smokedToday', { count })}</Text>
                  <View style={modal.okChips}>
                    <View style={[modal.okChip, modal.depChip]}>
                      <Text style={[modal.okChipVal, { color: '#92400E' }]}>{argentDepense} €</Text>
                      <Text style={[modal.okChipLbl, { color: '#B45309' }]}>{t('feedbackModal.spent')}</Text>
                    </View>
                    <View style={[modal.okChip, modal.depChip]}>
                      <Text style={[modal.okChipVal, { color: '#92400E' }]}>{viePerdue} min</Text>
                      <Text style={[modal.okChipLbl, { color: '#B45309' }]}>{t('feedbackModal.lifeLost')}</Text>
                    </View>
                  </View>
                  <View style={modal.depMsg}>
                    <Text style={modal.depMsgText}>
                      {t('feedbackModal.message')}
                    </Text>
                  </View>
                </>
              );
            })()}

            {/* Boutons */}
            <View style={modal.btnRow}>
              {isDepasse && (
                <TouchableOpacity
                  style={[modal.btn, modal.btnGhost]}
                  onPress={() => { onClose(); onNavigate('ModifierObjectif'); }}
                >
                  <Text style={modal.btnGhostText}>{t('feedbackModal.modifyGoal')}</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={[modal.btn, modal.btnPrimary]} onPress={onClose}>
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
  const { t } = useTranslation('jaifume');
  const { profile, updateProfile, stats } = useUser();

  const objectifJour  = stats?.objectifJour ?? 8;
  const prixCigarette = stats?.prixCig ?? 0.5;

  const [count, setCount]           = useState(profile?.cigarettesToday ?? 0);
  const [modalVisible, setModal]    = useState(false);
  // Heures des cigarettes ajoutées pendant cette session (pour le journal horaire)
  const [addedTimes, setAddedTimes] = useState([]);
  // Raisons associées aux cigarettes ajoutées ({ ts, trigger, note })
  const [raisons, setRaisons]       = useState([]);
  const [raisonModal, setRaisonModal] = useState(false);
  const [raisonTs, setRaisonTs]       = useState(null);

  const persoList = Array.isArray(profile?.declencheursPerso) ? profile.declencheursPerso : [];

  const argentDepense = (count * prixCigarette).toFixed(2);
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

    const todayKey = new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
    const historique = { ...(profile?.historique ?? {}), [todayKey]: count };

    // cigLog : une entrée horodatée par cigarette. On reconstruit celles du jour
    // pour rester cohérent avec le compteur (ajouts et retraits compris).
    const cigLog     = Array.isArray(profile?.cigLog) ? profile.cigLog : [];
    const autresJours = cigLog.filter(ts => ts.slice(0, 10) !== todayKey);
    let aujourdhui    = cigLog.filter(ts => ts.slice(0, 10) === todayKey).sort();
    aujourdhui = [...aujourdhui, ...addedTimes];
    if (aujourdhui.length > count) aujourdhui = aujourdhui.slice(0, count);
    while (aujourdhui.length < count) aujourdhui.push(new Date().toISOString());

    // Les raisons rejoignent le journal des envies (fume: true) pour l'analyse
    // des habitudes — uniquement celles des cigarettes encore comptées.
    const enviesExistantes = Array.isArray(profile?.envies) ? profile.envies : [];
    const raisonsValides = raisons.filter(r => aujourdhui.includes(r.ts));
    const nouvellesEnvies = raisonsValides.map(r => ({
      ts: r.ts, trigger: r.trigger, ...(r.note ? { note: r.note } : {}), fume: true,
    }));

    await updateProfile({
      cigarettesToday: count,
      lastSavedDate: todayKey,
      historique,
      cigLog: [...autresJours, ...aujourdhui],
      envies: [...enviesExistantes, ...nouvellesEnvies],
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
        diffJours={stats?.diffJours ?? 0}
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
        </View>

        {/* ── Sous-titre ── */}
        <Text style={styles.subTitle}>
          {count === 0
            ? t('subtitle.none')
            : t('subtitle.some', { count })}
        </Text>

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
        {count > objectifJour && (
          <View style={[styles.tipCard, styles.tipCardWarning]}>
            <Text style={styles.tipEmoji}>⚠️</Text>
            <Text style={styles.tipText}>
              {t('tip.overGoal', { count: count - objectifJour })}
            </Text>
          </View>
        )}

        {/* ── Bouton Enregistrer ── */}
        <TouchableOpacity style={styles.saveBtn} onPress={handleEnregistrer}>
          <Text style={styles.saveBtnText}>{t('common:save')}</Text>
        </TouchableOpacity>

        {/* ── Récapitulatif ── */}
        <View style={styles.recapCard}>
          <Text style={styles.recapTitle}>{t('recap.title')}</Text>
          <View style={styles.recapRow}>
            <RecapItem emoji="🚬" valeur={`${count}`} label={t('common:cigarette', { count })} />
            <View style={styles.recapDivider} />
            <RecapItem emoji="💸" valeur={`${argentDepense}€`} label={t('recap.spent')} valeurColor="#EF4444" />
            <View style={styles.recapDivider} />
            <RecapItem
              emoji="⏳"
              valeur={viePerdue >= 60
                ? `${Math.floor(viePerdue/60)}h${viePerdue%60>0 ? ` ${viePerdue%60}m` : ''}`
                : `${viePerdue}min`}
              label={t('recap.lifeExpectancy')}
              valeurColor="#F59E0B"
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

function RecapItem({ emoji, valeur, label, valeurColor = colors.black }) {
  return (
    <View style={styles.recapItem}>
      <Text style={styles.recapEmoji}>{emoji}</Text>
      <Text style={[styles.recapValeur, { color: valeurColor }]}>{valeur}</Text>
      <Text style={styles.recapLabel}>{label}</Text>
    </View>
  );
}

// ── Styles écran ────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: colors.white },
  scroll: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: spacing.md, paddingBottom: spacing.lg,
  },
  backBtn:     { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  backText:    { fontSize: 24, color: colors.black, fontWeight: '300' },
  headerTitle: { fontSize: font.md, fontWeight: '700', color: colors.black },
  dialContainer: { alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
  dialInner:   { position: 'absolute', alignItems: 'center' },
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
  tipEmoji: { fontSize: 20 },
  tipText:  { flex: 1, fontSize: font.sm, color: colors.black, lineHeight: 20 },
  saveBtn: {
    backgroundColor: colors.primary, borderRadius: radius.full,
    paddingVertical: 16, alignItems: 'center', marginBottom: spacing.lg,
  },
  saveBtnText: { color: colors.white, fontSize: font.md, fontWeight: '700' },
  recapCard: {
    borderWidth: 1, borderColor: colors.grayBorder,
    borderRadius: radius.xl, padding: spacing.md,
  },
  recapTitle:   { fontSize: font.sm, fontWeight: '700', color: colors.black, marginBottom: spacing.md, textAlign: 'center' },
  recapRow:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' },
  recapItem:    { alignItems: 'center', flex: 1 },
  recapEmoji:   { fontSize: 22, marginBottom: 4 },
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
    width: '100%', backgroundColor: colors.white,
    borderRadius: 20, overflow: 'hidden',
  },
  banner: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 16, paddingHorizontal: 18, gap: 12,
  },
  bannerEmoji: { fontSize: 30 },
  bannerTitle: { fontSize: 15, fontWeight: '700', color: '#fff' },
  bannerSub:   { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  body:        { padding: 18 },
  statsRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-around', marginBottom: 16,
    paddingVertical: 10,
    backgroundColor: '#F9FAFB', borderRadius: 12,
  },
  statDiv:  { width: 1, height: 32, backgroundColor: colors.grayBorder },
  okBarRow:   { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  okBarLabel: { fontSize: 11, color: colors.gray },
  okBarTrack: { height: 7, backgroundColor: '#E5E7EB', borderRadius: 6, overflow: 'hidden', marginBottom: 4 },
  okBarFill:  { height: '100%', backgroundColor: '#3B6D11', borderRadius: 6 },
  okBarMarge: { fontSize: 10, color: '#3B6D11', textAlign: 'right', marginBottom: 12 },
  okChips:    { flexDirection: 'row', gap: 8, marginBottom: 14 },
  okChip:     { flex: 1, backgroundColor: '#EAF3DE', borderRadius: 10, paddingVertical: 8, alignItems: 'center' },
  okChipVal:  { fontSize: 13, fontWeight: '700', color: '#27500A' },
  okChipLbl:  { fontSize: 10, color: '#3B6D11', marginTop: 1 },
  depBarLabel:  { fontSize: 11, color: '#92400E' },
  depBarTrack:  { height: 7, borderRadius: 6, overflow: 'hidden', flexDirection: 'row', marginBottom: 4 },
  depBarObj:    { height: '100%', backgroundColor: '#F59E0B' },
  depBarExces:  { height: '100%', backgroundColor: '#DC2626' },
  depBarSub:    { fontSize: 10, color: '#B45309', textAlign: 'center', marginBottom: 12 },
  depChip:      { backgroundColor: '#FEF3C7' },
  depMsg: {
    backgroundColor: '#FFF7ED', borderRadius: 10, borderWidth: 1, borderColor: '#FDE68A',
    padding: 12, marginBottom: 14,
  },
  depMsgText:   { fontSize: 13, color: '#92400E', lineHeight: 19, textAlign: 'center' },
  btnRow:  { flexDirection: 'row', gap: 10 },
  btn:     { flex: 1, paddingVertical: 13, borderRadius: 30, alignItems: 'center' },
  btnPrimary:     { backgroundColor: colors.primary },
  btnPrimaryText: { color: colors.white, fontSize: 14, fontWeight: '700' },
  btnGhost:       { borderWidth: 1, borderColor: colors.grayBorder },
  btnGhostText:   { color: colors.gray, fontSize: 13, fontWeight: '500' },
});
