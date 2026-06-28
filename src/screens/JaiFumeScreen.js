import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity,
  ScrollView, Modal,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useUser } from '../context/UserContext';
import { colors, spacing, font, radius } from '../theme';
import { jouerSon } from '../services/sounds';

// ── Arc circulaire ──────────────────────────────────────────────────────────
function CircularDial({ current, total, size = 200 }) {
  const strokeWidth = 14;
  const r = (size - strokeWidth) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;
  const ratio = total > 0 ? Math.min(current / total, 1) : 0;
  const dash = circumference * ratio;
  const gap  = circumference - dash;

  const arcColor = ratio >= 1 ? '#D97706' : ratio >= 0.7 ? '#F59E0B' : colors.primary;

  return (
    <Svg width={size} height={size}>
      <Circle cx={cx} cy={cy} r={r} stroke="#E5E7EB" strokeWidth={strokeWidth} fill="none" />
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

// ── Modal feedback ──────────────────────────────────────────────────────────
function FeedbackModal({ visible, count, objectif, prixCigarette, diffJours, onClose, onNavigate }) {
  const isParfait  = count === 0;
  const isOk       = count > 0 && count <= objectif;
  const isDepasse  = count > objectif;

  const bannerColor    = isParfait ? '#1B6B3A' : isOk ? '#EAF3DE' : '#92400E';
  const bannerBorder   = isOk ? '#C0DD97' : 'transparent';
  const emoji          = isParfait ? '🏆' : isOk ? '✅' : '⚠️';
  const titre          = isParfait ? 'Journée sans tabac !' : isOk ? 'Bien joué !' : 'Objectif dépassé';
  const titreColor     = isOk ? '#27500A' : '#fff';
  const sousTitreColor = isOk ? '#3B6D11' : 'rgba(255,255,255,0.8)';
  const sousTitre   = isParfait
    ? '0 cigarette aujourd\'hui'
    : isOk
    ? 'Objectif respecté aujourd\'hui'
    : `${count} cig · +${count - objectif} au-dessus`;

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
                <StatItem valeur={`+${vieGagnee} min`} label="vie gagnée" color="#1B6B3A" />
                <View style={modal.statDiv} />
                <StatItem valeur="0,00 €" label="dépensé" color="#1B6B3A" />
                <View style={modal.statDiv} />
                <StatItem valeur={`🔥 ${streak}j`} label="streak" color="#F59E0B" />
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
                    <Text style={modal.okBarLabel}>{count} cigarette{count > 1 ? 's' : ''}</Text>
                    <Text style={modal.okBarLabel}>objectif : {objectif}</Text>
                  </View>
                  <View style={modal.okBarTrack}>
                    <View style={[modal.okBarFill, { width: `${pct}%` }]} />
                  </View>
                  <Text style={modal.okBarMarge}>{marge}% de marge</Text>
                  <View style={modal.okChips}>
                    <View style={modal.okChip}>
                      <Text style={modal.okChipVal}>{argentDepense} €</Text>
                      <Text style={modal.okChipLbl}>dépensé</Text>
                    </View>
                    <View style={modal.okChip}>
                      <Text style={modal.okChipVal}>{viePreservee} min</Text>
                      <Text style={modal.okChipLbl}>vie préservée</Text>
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
                    <Text style={modal.depBarLabel}>objectif : {objectif}</Text>
                    <Text style={[modal.depBarLabel, { color: '#DC2626' }]}>+{exces} de trop</Text>
                  </View>
                  <View style={modal.depBarTrack}>
                    <View style={[modal.depBarObj, { width: `${pctObj}%` }]} />
                    <View style={[modal.depBarExces, { width: `${100 - pctObj}%` }]} />
                  </View>
                  <Text style={modal.depBarSub}>{count} cigarettes fumées aujourd'hui</Text>
                  <View style={modal.okChips}>
                    <View style={[modal.okChip, modal.depChip]}>
                      <Text style={[modal.okChipVal, { color: '#92400E' }]}>{argentDepense} €</Text>
                      <Text style={[modal.okChipLbl, { color: '#B45309' }]}>dépensé</Text>
                    </View>
                    <View style={[modal.okChip, modal.depChip]}>
                      <Text style={[modal.okChipVal, { color: '#92400E' }]}>{viePerdue} min</Text>
                      <Text style={[modal.okChipLbl, { color: '#B45309' }]}>de vie</Text>
                    </View>
                  </View>
                  <View style={modal.depMsg}>
                    <Text style={modal.depMsgText}>
                      Chaque jour est une nouvelle chance.{'\n'}Demain, vous pouvez le faire. 💪
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
                  <Text style={modal.btnGhostText}>Modifier objectif</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={[modal.btn, modal.btnPrimary]} onPress={onClose}>
                <Text style={modal.btnPrimaryText}>
                  {isParfait ? 'Super, merci !' : isOk ? 'C\'est noté !' : 'Compris !'}
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
  const { profile, updateProfile, stats } = useUser();

  const objectifJour    = profile?.objectifCigarettes
    ?? Math.max(1, Math.floor((profile?.consoAvantApp || 10) * 0.8));
  const prixCigarette   = stats?.prixCigarette ?? 0.55;

  const [count, setCount]           = useState(profile?.cigarettesToday ?? 0);
  const [modalVisible, setModal]    = useState(false);

  const argentDepense = (count * prixCigarette).toFixed(2);
  const viePerdue     = count * 5;

  function decrement() {
    if (count === 0) return;
    jouerSon('click_decrement');
    setCount(c => Math.max(0, c - 1));
  }
  function increment() {
    jouerSon('click_increment');
    setCount(c => c + 1);
  }

  async function handleEnregistrer() {
    if (count === 0) jouerSon('enregistrer_zero');
    else if (count <= objectifJour) jouerSon('enregistrer_objectif');
    else jouerSon('enregistrer_depasse');

    await updateProfile({ cigarettesToday: count });
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

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Header ── */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>J'ai fumé aujourd'hui</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* ── Arc + compteur ── */}
        <View style={styles.dialContainer}>
          <CircularDial current={count} total={objectifJour} size={200} />
          <View style={styles.dialInner}>
            <Text style={styles.dialNumber}>{count}</Text>
            <Text style={styles.dialLabel}>cigarette{count > 1 ? 's' : ''}</Text>
          </View>
        </View>

        {/* ── Sous-titre ── */}
        <Text style={styles.subTitle}>
          {count === 0
            ? "Aucune cigarette aujourd'hui 🎉"
            : `${count} cigarette${count > 1 ? 's' : ''} aujourd'hui`}
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
              Chaque cigarette en moins compte !{'\n'}
              Vous êtes à {objectifJour - count} de votre objectif.
            </Text>
          </View>
        )}
        {count >= objectifJour && count > 0 && (
          <View style={[styles.tipCard, styles.tipCardWarning]}>
            <Text style={styles.tipEmoji}>⚠️</Text>
            <Text style={styles.tipText}>
              Vous avez dépassé votre objectif de {objectifJour} cigarettes.{'\n'}
              Demain est un nouveau départ !
            </Text>
          </View>
        )}

        {/* ── Bouton Enregistrer ── */}
        <TouchableOpacity style={styles.saveBtn} onPress={handleEnregistrer}>
          <Text style={styles.saveBtnText}>Enregistrer</Text>
        </TouchableOpacity>

        {/* ── Récapitulatif ── */}
        <View style={styles.recapCard}>
          <Text style={styles.recapTitle}>Récapitulatif aujourd'hui</Text>
          <View style={styles.recapRow}>
            <RecapItem emoji="🚬" valeur={`${count}`} label={`cigarette${count > 1 ? 's' : ''}`} />
            <View style={styles.recapDivider} />
            <RecapItem emoji="💸" valeur={`${argentDepense}€`} label="dépensés" valeurColor="#EF4444" />
            <View style={styles.recapDivider} />
            <RecapItem emoji="⏱" valeur={`${viePerdue} min`} label="de vie" valeurColor="#F59E0B" />
          </View>
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
