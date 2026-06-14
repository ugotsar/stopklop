import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useUser } from '../context/UserContext';
import { colors, spacing, font, radius } from '../theme';

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

  // Couleur selon niveau : vert si peu, orange si moyen, rouge si dépassé
  const arcColor = ratio >= 1
    ? '#EF4444'
    : ratio >= 0.7
    ? '#F59E0B'
    : colors.primary;

  return (
    <Svg width={size} height={size}>
      {/* Track */}
      <Circle
        cx={cx} cy={cy} r={r}
        stroke="#E5E7EB"
        strokeWidth={strokeWidth}
        fill="none"
      />
      {/* Progress */}
      {current > 0 && (
        <Circle
          cx={cx} cy={cy} r={r}
          stroke={arcColor}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${dash} ${gap}`}
          strokeLinecap="round"
          rotation="-90"
          origin={`${cx}, ${cy}`}
        />
      )}
    </Svg>
  );
}

// ── Écran principal ─────────────────────────────────────────────────────────
export default function JaiFumeScreen({ navigation }) {
  const { profile, updateProfile, stats } = useUser();

  const objectifJour = profile?.objectifCigarettes
    ?? Math.max(1, Math.floor((profile?.consoAvantApp || 10) * 0.8));

  const [count, setCount] = useState(profile?.cigarettesToday ?? 0);

  const prixCigarette = stats?.prixCigarette ?? 0.55;

  // Calculs récapitulatif
  const argentDepense = (count * prixCigarette).toFixed(2);
  const viePerdue     = count * 5; // 5 min de vie perdue / cigarette

  function decrement() {
    setCount(c => Math.max(0, c - 1));
  }
  function increment() {
    setCount(c => c + 1);
  }

  async function handleEnregistrer() {
    await updateProfile({ cigarettesToday: count });
    navigation.goBack();
  }

  const tipVisible = count > 0 && count < objectifJour;

  return (
    <SafeAreaView style={styles.safe}>
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
            : `${count} cigarette${count > 1 ? 's' : ''} aujourd’hui`}
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
            <RecapItem
              emoji="🚬"
              valeur={`${count}`}
              label={`cigarette${count > 1 ? 's' : ''}`}
            />
            <View style={styles.recapDivider} />
            <RecapItem
              emoji="💸"
              valeur={`${argentDepense}€`}
              label="dépensés"
              valeurColor="#EF4444"
            />
            <View style={styles.recapDivider} />
            <RecapItem
              emoji="⏱"
              valeur={`${viePerdue} min`}
              label="de vie"
              valeurColor="#F59E0B"
            />
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

// ── Sous-composant récap ────────────────────────────────────────────────────
function RecapItem({ emoji, valeur, label, valeurColor = colors.black }) {
  return (
    <View style={styles.recapItem}>
      <Text style={styles.recapEmoji}>{emoji}</Text>
      <Text style={[styles.recapValeur, { color: valeurColor }]}>{valeur}</Text>
      <Text style={styles.recapLabel}>{label}</Text>
    </View>
  );
}

// ── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: colors.white },
  scroll: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: spacing.md, paddingBottom: spacing.lg,
  },
  backBtn:      { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  backText:     { fontSize: 24, color: colors.black, fontWeight: '300' },
  headerTitle:  { fontSize: font.md, fontWeight: '700', color: colors.black },

  // Arc
  dialContainer: {
    alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.md,
  },
  dialInner: {
    position: 'absolute', alignItems: 'center',
  },
  dialNumber: { fontSize: 56, fontWeight: '900', color: colors.primary, lineHeight: 60 },
  dialLabel:  { fontSize: font.sm, color: colors.gray, fontWeight: '500' },

  subTitle: {
    textAlign: 'center', fontSize: font.md, fontWeight: '600',
    color: colors.black, marginBottom: spacing.xl,
  },

  // Contrôles
  controls: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.lg, marginBottom: spacing.xl,
  },
  controlBtn: {
    width: 56, height: 56, borderRadius: 28,
    borderWidth: 2, borderColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  controlBtnDisabled: { borderColor: colors.grayBorder },
  controlBtnText:     { fontSize: 28, color: colors.primary, fontWeight: '300', lineHeight: 32 },
  controlBtnTextDisabled: { color: colors.grayBorder },
  countBox: {
    width: 80, height: 56, borderRadius: radius.md,
    backgroundColor: colors.primaryLight,
    alignItems: 'center', justifyContent: 'center',
  },
  countNumber: { fontSize: font.xl, fontWeight: '900', color: colors.primary },

  // Tip
  tipCard: {
    flexDirection: 'row', alignItems: 'flex-start',
    backgroundColor: colors.primaryLight, borderRadius: radius.lg,
    padding: spacing.md, gap: spacing.sm, marginBottom: spacing.lg,
  },
  tipCardWarning: { backgroundColor: '#FEF3C7' },
  tipEmoji: { fontSize: 20 },
  tipText:  { flex: 1, fontSize: font.sm, color: colors.black, lineHeight: 20 },

  // Bouton enregistrer
  saveBtn: {
    backgroundColor: colors.primary, borderRadius: radius.full,
    paddingVertical: 16, alignItems: 'center', marginBottom: spacing.lg,
  },
  saveBtnText: { color: colors.white, fontSize: font.md, fontWeight: '700' },

  // Récapitulatif
  recapCard: {
    borderWidth: 1, borderColor: colors.grayBorder,
    borderRadius: radius.xl, padding: spacing.md,
  },
  recapTitle: { fontSize: font.sm, fontWeight: '700', color: colors.black, marginBottom: spacing.md, textAlign: 'center' },
  recapRow:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' },
  recapItem:  { alignItems: 'center', flex: 1 },
  recapEmoji: { fontSize: 22, marginBottom: 4 },
  recapValeur: { fontSize: font.md, fontWeight: '800', color: colors.black },
  recapLabel:  { fontSize: 11, color: colors.gray, marginTop: 2 },
  recapDivider: { width: 1, height: 40, backgroundColor: colors.grayBorder },
});
