import React from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, Dimensions,
} from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { useUser } from '../context/UserContext';
import { colors, spacing, font, radius } from '../theme';

const { width: SCREEN_W } = Dimensions.get('window');
const CHART_W = SCREEN_W - spacing.md * 4;
const CHART_H = 80;

// ── Graphique projection (2 lignes) ─────────────────────────────────────────
function ProjectionChart({ width = CHART_W, height = CHART_H }) {
  // Ligne rouge (si vous continuez) : décroissante
  const bad  = [0, -200, -400, -600, -900, -1200, -1500, -1842];
  // Ligne verte (si vous réduisez) : croissante
  const good = [0,  80,  180,  300,  420,   520,   590,   612];

  const allVals = [...bad, ...good];
  const min = Math.min(...allVals);
  const max = Math.max(...allVals);
  const range = max - min || 1;
  const step = width / (bad.length - 1);

  function toY(v) {
    return height - ((v - min) / range) * (height - 8) - 4;
  }

  const badPath  = bad.map((v, i)  => `${i === 0 ? 'M' : 'L'}${(i * step).toFixed(1)},${toY(v).toFixed(1)}`).join(' ');
  const goodPath = good.map((v, i) => `${i === 0 ? 'M' : 'L'}${(i * step).toFixed(1)},${toY(v).toFixed(1)}`).join(' ');

  return (
    <Svg width={width} height={height}>
      <Path d={badPath}  stroke="#EF4444" strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" opacity={0.8} />
      <Path d={goodPath} stroke={colors.primary} strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      {/* Points extrêmes */}
      <Circle cx={0}                    cy={toY(0)}    r={4} fill={colors.gray} />
      <Circle cx={(bad.length-1)*step}  cy={toY(-1842)} r={4} fill="#EF4444" />
      <Circle cx={(good.length-1)*step} cy={toY(612)}  r={4} fill={colors.primary} />
    </Svg>
  );
}

// ── Graphique plan recommandé (barres décroissantes) ────────────────────────
function PlanChart({ data, labels, width = CHART_W, height = 80 }) {
  const max = Math.max(...data, 1);
  const barW = (width / data.length) * 0.5;
  const gap  = (width / data.length) * 0.5;

  return (
    <Svg width={width} height={height + 28}>
      {data.map((v, i) => {
        const barH = Math.max((v / max) * (height - 8), v === 0 ? 2 : 4);
        const x = i * (barW + gap) + gap / 2;
        const y = height - barH;
        return (
          <Svg key={i}>
            <Path
              d={`M${x+3},${y} L${x+barW-3},${y} Q${x+barW},${y} ${x+barW},${y+3} L${x+barW},${y+barH} L${x},${y+barH} L${x},${y+3} Q${x},${y} ${x+3},${y} Z`}
              fill={colors.primary}
              opacity={v === 0 ? 0.3 : 0.85}
            />
            <Svg>
              {/* Valeur au dessus */}
              <Path d="" />
            </Svg>
          </Svg>
        );
      })}
    </Svg>
  );
}

// ── Écran principal ──────────────────────────────────────────────────────────
export default function PlanScreen({ navigation }) {
  const { profile, stats } = useUser();

  const argentEco = stats?.argentEconomise ?? 38.40;
  const vieGagneeH = Math.floor((stats?.cigarettesNonFumees ?? 0) * 20 / 60);
  const vieGagneeJ = Math.max(14, Math.floor(vieGagneeH / 24));

  // Plan recommandé : 6 semaines de réduction
  const planData   = [8, 6, 6, 4, 2, 0];
  const planLabels = ["Auj.'", 'S1', 'S2', 'S3', 'S4', 'S5'];

  return (
    <SafeAreaView style={styles.safe}>

      {/* ── Header ── */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Plan d'arrêt</Text>
        <TouchableOpacity style={styles.settingsBtn}>
          <Text style={styles.settingsIcon}>⚙️</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Section 1 : Votre impact ── */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionNumBadge}>
            <Text style={styles.sectionNum}>1</Text>
          </View>
          <Text style={styles.sectionTitle}>Votre impact</Text>
          <TouchableOpacity>
            <Text style={styles.voirPlus}>Voir plus</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <View style={styles.impactGrid}>
            <ImpactCard icon="💰" valeur={`+${argentEco.toFixed(2)} €`} label="Argent économisé" sublabel="par jour" />
            <ImpactCard icon="⏱" valeur={`+${vieGagneeJ > 0 ? vieGagneeJ + 'j' : ''} 14h 32`} label="Temps gagné" sublabel="par semaine" valeurColor={colors.primary} />
            <ImpactCard icon="❤️" valeur={`+${vieGagneeJ} jours`} label="Vie gagnée" sublabel="par an" valeurColor="#EF4444" />
            <ImpactCard icon="🫁" valeur="Meilleure" label="santé" sublabel="chaque jour" valeurColor={colors.primary} />
          </View>
        </View>

        {/* ── Projection annuelle ── */}
        <Text style={styles.subSectionTitle}>Projection annuelle</Text>
        <View style={styles.card}>
          <View style={styles.projRow}>
            <View style={styles.projCol}>
              <Text style={styles.projLabel}>Si vous continuez</Text>
              <Text style={styles.projBad}>-1 842,60 €</Text>
            </View>
            <View style={styles.vsCircle}>
              <Text style={styles.vsText}>VS</Text>
            </View>
            <View style={[styles.projCol, { alignItems: 'flex-end' }]}>
              <Text style={styles.projLabel}>Si vous réduisez</Text>
              <Text style={styles.projGood}>+1 842,60 €</Text>
            </View>
          </View>
          <View style={styles.chartBox}>
            <ProjectionChart />
          </View>
        </View>

        {/* ── Section 2 : Analyse des habitudes ── */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionNumBadge}>
            <Text style={styles.sectionNum}>2</Text>
          </View>
          <Text style={styles.sectionTitle}>Analyse de vos habitudes</Text>
          <TouchableOpacity>
            <Text style={styles.voirPlus}>Voir l'analyse</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <View style={styles.habitudesRow}>
            <HabitudeChip icon="🕐" titre="19h – 22h" desc="Heure la plus critique" sub="40% de vos cigarettes" />
            <HabitudeChip icon="📅" titre="Vendredi" desc="Jour le plus difficile" sub="Jour le plus compliqué" />
            <HabitudeChip icon="🌿" titre="Stress" desc="Déclencheur n°1" sub="Déclencheur principal" />
          </View>
        </View>

        {/* ── Section 3 : Plan recommandé ── */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionNumBadge}>
            <Text style={styles.sectionNum}>3</Text>
          </View>
          <Text style={styles.sectionTitle}>Plan recommandé</Text>
          <View style={styles.tagBadge}>
            <Text style={styles.tagText}>Réduction progressive</Text>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.planRow}>
            {/* Objectif quotidien */}
            <View style={styles.planLeft}>
              <Text style={styles.planLabel}>Objectif quotidien</Text>
              <Text style={styles.planNumber}>8</Text>
              <Text style={styles.planUnit}>cigarettes max</Text>
            </View>

            {/* Mini graphique */}
            <View style={styles.planChartArea}>
              {planData.map((v, i) => (
                <View key={i} style={styles.planBarCol}>
                  <Text style={styles.planBarVal}>{v}</Text>
                  <View style={[
                    styles.planBar,
                    { height: Math.max(v * 6, 4), backgroundColor: v === 0 ? colors.grayBorder : colors.primary }
                  ]} />
                  <Text style={styles.planBarLabel}>{planLabels[i]}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.prochainPalier}>
            <Text style={styles.prochainText}>
              Prochain palier : <Text style={{ fontWeight: '700' }}>6 cigarettes</Text>  dans 7 jours
            </Text>
          </View>

          <TouchableOpacity
            style={styles.modifierBtn}
            onPress={() => navigation.navigate('ModifierObjectif')}
          >
            <Text style={styles.modifierBtnText}>Modifier le plan</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

// ── Sous-composants ───────────────────────────────────────────────────────────
function ImpactCard({ icon, valeur, label, sublabel, valeurColor = colors.black }) {
  return (
    <View style={styles.impactCard}>
      <Text style={styles.impactIcon}>{icon}</Text>
      <Text style={[styles.impactValeur, { color: valeurColor }]}>{valeur}</Text>
      <Text style={styles.impactLabel}>{label}</Text>
      <Text style={styles.impactSub}>{sublabel}</Text>
    </View>
  );
}

function HabitudeChip({ icon, titre, desc, sub }) {
  return (
    <View style={styles.habitudeChip}>
      <Text style={styles.habitudeIcon}>{icon}</Text>
      <Text style={styles.habitudeTitre}>{titre}</Text>
      <Text style={styles.habitudeDesc}>{desc}</Text>
      <Text style={styles.habitudeSub}>{sub}</Text>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: '#F7F8FA' },
  scroll: { padding: spacing.md, paddingBottom: 90 },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.sm,
    backgroundColor: colors.white,
    borderBottomWidth: 1, borderBottomColor: colors.grayBorder,
  },
  headerTitle:  { fontSize: font.lg, fontWeight: '800', color: colors.black, flex: 1, textAlign: 'center' },
  settingsBtn:  { position: 'absolute', right: spacing.lg },
  settingsIcon: { fontSize: 22 },

  // Sections
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginTop: spacing.md, marginBottom: spacing.sm,
  },
  sectionNumBadge: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  sectionNum:   { color: colors.white, fontSize: 12, fontWeight: '800' },
  sectionTitle: { fontSize: font.md, fontWeight: '700', color: colors.black, flex: 1 },
  voirPlus:     { fontSize: 12, color: colors.primary, fontWeight: '600' },
  subSectionTitle: { fontSize: font.sm, fontWeight: '700', color: colors.black, marginTop: spacing.sm, marginBottom: spacing.sm },

  card: {
    backgroundColor: colors.white, borderRadius: radius.xl,
    padding: spacing.md, marginBottom: spacing.sm,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },

  // Impact
  impactGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  impactCard: {
    width: (SCREEN_W - spacing.md * 4 - spacing.sm) / 2,
    backgroundColor: '#F7F8FA', borderRadius: radius.lg, padding: spacing.sm,
    alignItems: 'flex-start',
  },
  impactIcon:   { fontSize: 24, marginBottom: 4 },
  impactValeur: { fontSize: font.md, fontWeight: '800', color: colors.black },
  impactLabel:  { fontSize: 11, color: colors.gray },
  impactSub:    { fontSize: 10, color: colors.gray },

  // Projection
  projRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
  projCol: { flex: 1 },
  projLabel: { fontSize: 11, color: colors.gray, marginBottom: 2 },
  projBad:  { fontSize: font.md, fontWeight: '800', color: '#EF4444' },
  projGood: { fontSize: font.md, fontWeight: '800', color: colors.primary, textAlign: 'right' },
  vsCircle: {
    width: 36, height: 36, borderRadius: 18,
    borderWidth: 1, borderColor: colors.grayBorder,
    alignItems: 'center', justifyContent: 'center', marginHorizontal: 8,
  },
  vsText: { fontSize: 11, fontWeight: '700', color: colors.gray },
  chartBox: { marginTop: spacing.sm },

  // Habitudes
  habitudesRow: { flexDirection: 'row', gap: spacing.sm },
  habitudeChip: {
    flex: 1, backgroundColor: '#F7F8FA', borderRadius: radius.lg,
    padding: spacing.sm, alignItems: 'flex-start',
  },
  habitudeIcon:  { fontSize: 20, marginBottom: 4 },
  habitudeTitre: { fontSize: 12, fontWeight: '800', color: colors.black },
  habitudeDesc:  { fontSize: 10, color: colors.gray, marginTop: 2 },
  habitudeSub:   { fontSize: 10, color: colors.gray },

  // Tag
  tagBadge: {
    backgroundColor: colors.primaryLight, borderRadius: radius.full,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  tagText: { fontSize: 10, color: colors.primary, fontWeight: '600' },

  // Plan recommandé
  planRow: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.md, marginBottom: spacing.sm },
  planLeft: { alignItems: 'flex-start' },
  planLabel:  { fontSize: 11, color: colors.gray },
  planNumber: { fontSize: 48, fontWeight: '900', color: colors.primary, lineHeight: 52 },
  planUnit:   { fontSize: 12, color: colors.gray },
  planChartArea: { flex: 1, flexDirection: 'row', alignItems: 'flex-end', gap: 4 },
  planBarCol: { flex: 1, alignItems: 'center' },
  planBarVal: { fontSize: 10, fontWeight: '700', color: colors.black, marginBottom: 2 },
  planBar: { width: '100%', borderRadius: 3, maxWidth: 28 },
  planBarLabel: { fontSize: 9, color: colors.gray, marginTop: 2 },

  prochainPalier: {
    backgroundColor: colors.primaryLight, borderRadius: radius.md,
    padding: spacing.sm, marginBottom: spacing.sm,
  },
  prochainText: { fontSize: 12, color: colors.black, textAlign: 'center' },

  modifierBtn: {
    borderWidth: 1.5, borderColor: colors.primary,
    borderRadius: radius.full, paddingVertical: 14,
    alignItems: 'center',
  },
  modifierBtnText: { color: colors.primary, fontSize: font.md, fontWeight: '700' },
});
