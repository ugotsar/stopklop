import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useUser } from '../context/UserContext';
import { colors, spacing, font, radius } from '../theme';

const OBJECTIFS = [
  {
    key: 'stop',
    titre: 'Arréter complètement',
    desc: '0 cigarette',
    icon: '🎯',
    iconBg: colors.primaryLight,
  },
  {
    key: 'reduce',
    titre: 'Réduire progressivement',
    desc: 'Diminuer étape par étape',
    icon: '📉',
    iconBg: '#FEF3C7',
  },
  {
    key: 'libre',
    titre: 'Objectif libre',
    desc: 'Choisir vous-même',
    icon: '✏️',
    iconBg: '#EDE9FE',
  },
];

export default function ModifierObjectifScreen({ navigation }) {
  const { profile, updateProfile } = useUser();

  const [selected, setSelected] = useState(profile?.typeObjectif ?? 'reduce');
  const [quantite, setQuantite] = useState(profile?.objectifCigarettes ?? 8);

  const prixCig = (profile?.prixPaquet ?? 11) / (profile?.cigarettesParPaquet ?? 20);
  const economie    = (((profile?.consoAvantApp ?? 10) - quantite) * prixCig * 30).toFixed(0);
  const vieGagneeH  = Math.round(((profile?.consoAvantApp ?? 10) - quantite) * 20 / 60 * 30);
  const reduction   = profile?.consoAvantApp
    ? Math.round(((profile.consoAvantApp - quantite) / profile.consoAvantApp) * 100)
    : 28;

  async function handleEnregistrer() {
    await updateProfile({ typeObjectif: selected, objectifCigarettes: quantite });
    navigation.goBack();
  }

  return (
    <SafeAreaView style={styles.safe}>

      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Modifier mon objectif</Text>
        <View style={{ width: 40 }}>
          <Text style={{ textAlign: 'right', fontSize: 18 }}>ⓘ</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Choisir l'objectif ── */}
        <Text style={styles.sectionTitle}>Choisissez votre objectif</Text>
        <View style={styles.card}>
          {OBJECTIFS.map((obj, i) => (
            <TouchableOpacity
              key={obj.key}
              style={[
                styles.optionRow,
                i < OBJECTIFS.length - 1 && styles.optionRowBorder,
                selected === obj.key && styles.optionRowActive,
              ]}
              onPress={() => setSelected(obj.key)}
            >
              {/* Radio */}
              <View style={[styles.radio, selected === obj.key && styles.radioActive]}>
                {selected === obj.key && <View style={styles.radioDot} />}
              </View>

              {/* Texte */}
              <View style={{ flex: 1 }}>
                <Text style={styles.optionTitre}>{obj.titre}</Text>
                <Text style={styles.optionDesc}>{obj.desc}</Text>
              </View>

              {/* Icône */}
              <View style={[styles.iconCircle, { backgroundColor: obj.iconBg }]}>
                <Text style={{ fontSize: 18 }}>{obj.icon}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Objectif quotidien ── */}
        <Text style={styles.sectionTitle}>Objectif quotidien</Text>
        <View style={styles.card}>
          <View style={styles.stepperRow}>
            <TouchableOpacity
              style={[styles.stepperBtn, quantite <= 0 && styles.stepperBtnDisabled]}
              onPress={() => setQuantite(q => Math.max(0, q - 1))}
              disabled={quantite <= 0}
            >
              <Text style={[styles.stepperBtnText, quantite <= 0 && { color: colors.grayBorder }]}>−</Text>
            </TouchableOpacity>

            <View style={styles.stepperCenter}>
              <Text style={styles.stepperNumber}>{quantite}</Text>
              <Text style={styles.stepperUnit}>cigarettes / jour</Text>
            </View>

            <TouchableOpacity
              style={styles.stepperBtn}
              onPress={() => setQuantite(q => q + 1)}
            >
              <Text style={styles.stepperBtnText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Aperçu de l'objectif ── */}
        <View style={styles.apercuCard}>
          <Text style={styles.apercuTitle}>Aperçu de votre objectif</Text>

          <View style={styles.apercuRow}>
            <View style={styles.apercuIconCircle}>
              <Text style={{ fontSize: 20 }}>🐷</Text>
            </View>
            <Text style={styles.apercuLabel}>Économie estimée</Text>
            <Text style={styles.apercuValGreen}>+{economie} € / mois</Text>
          </View>

          <View style={styles.apercuRow}>
            <View style={[styles.apercuIconCircle, { backgroundColor: '#FEF3C7' }]}>
              <Text style={{ fontSize: 20 }}>🕐</Text>
            </View>
            <Text style={styles.apercuLabel}>Temps de vie gagné</Text>
            <Text style={styles.apercuValOrange}>+{vieGagneeH} h / mois</Text>
          </View>

          <View style={styles.apercuRow}>
            <View style={[styles.apercuIconCircle, { backgroundColor: '#EDE9FE' }]}>
              <Text style={{ fontSize: 20 }}>📊</Text>
            </View>
            <Text style={styles.apercuLabel}>Réduction de consommation</Text>
            <Text style={styles.apercuValPurple}>-{reduction} %</Text>
          </View>
        </View>

        {/* ── Bouton enregistrer ── */}
        <TouchableOpacity style={styles.saveBtn} onPress={handleEnregistrer}>
          <Text style={styles.saveBtnText}>Enregistrer mon objectif</Text>
        </TouchableOpacity>

        <Text style={styles.footerNote}>
          ⓘ  Vous pourrez modifier votre objectif à tout moment.
        </Text>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: '#F7F8FA' },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxl },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1, borderBottomColor: colors.grayBorder,
  },
  backBtn:     { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  backText:    { fontSize: 24, color: colors.black, fontWeight: '300' },
  headerTitle: { fontSize: font.md, fontWeight: '700', color: colors.black },

  sectionTitle: { fontSize: font.sm, fontWeight: '700', color: colors.black, marginBottom: spacing.sm, marginTop: spacing.md },

  card: {
    backgroundColor: colors.white, borderRadius: radius.xl, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },

  // Options radio
  optionRow: {
    flexDirection: 'row', alignItems: 'center', padding: spacing.md, gap: spacing.sm,
  },
  optionRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.grayBorder },
  optionRowActive: { backgroundColor: colors.primaryLight },
  radio: {
    width: 22, height: 22, borderRadius: 11,
    borderWidth: 2, borderColor: colors.grayBorder,
    alignItems: 'center', justifyContent: 'center',
  },
  radioActive: { borderColor: colors.primary },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary },
  optionTitre: { fontSize: font.sm, fontWeight: '700', color: colors.black },
  optionDesc:  { fontSize: 12, color: colors.gray },
  iconCircle: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
  },

  // Stepper
  stepperRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: spacing.lg,
  },
  stepperBtn: {
    width: 52, height: 52, borderRadius: radius.md,
    borderWidth: 1.5, borderColor: colors.grayBorder,
    alignItems: 'center', justifyContent: 'center',
  },
  stepperBtnDisabled: { borderColor: '#F0F0F0' },
  stepperBtnText: { fontSize: 28, color: colors.primary, fontWeight: '300', lineHeight: 32 },
  stepperCenter:  { alignItems: 'center' },
  stepperNumber:  { fontSize: 48, fontWeight: '900', color: colors.black, lineHeight: 52 },
  stepperUnit:    { fontSize: 12, color: colors.gray },

  // Aperçu
  apercuCard: {
    backgroundColor: colors.white, borderRadius: radius.xl,
    padding: spacing.md, marginTop: spacing.sm,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  apercuTitle: { fontSize: font.sm, fontWeight: '700', color: colors.black, textAlign: 'center', marginBottom: spacing.md },
  apercuRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
  },
  apercuIconCircle: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center',
  },
  apercuLabel:    { flex: 1, fontSize: 12, color: colors.gray },
  apercuValGreen:  { fontSize: font.sm, fontWeight: '800', color: colors.primary },
  apercuValOrange: { fontSize: font.sm, fontWeight: '800', color: '#F59E0B' },
  apercuValPurple: { fontSize: font.sm, fontWeight: '800', color: '#7C3AED' },

  // Boutons
  saveBtn: {
    backgroundColor: colors.primary, borderRadius: radius.full,
    paddingVertical: 16, alignItems: 'center', marginTop: spacing.lg,
  },
  saveBtnText: { color: colors.white, fontSize: font.md, fontWeight: '700' },
  footerNote:  { textAlign: 'center', fontSize: 11, color: colors.gray, marginTop: spacing.sm },
});
