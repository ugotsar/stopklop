import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity,
} from 'react-native';
import { useUser } from '../context/UserContext';
import { colors, spacing, font, radius } from '../theme';

export default function DashboardScreen({ navigation }) {
  const { profile, stats, resetProfile } = useUser();
  const [, setTick] = useState(0);

  // Rafraîchir chaque seconde pour le compteur live
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  if (!profile || !stats) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text style={styles.emoji}>🌿</Text>
          <Text style={styles.title}>Chargement...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const { duree, cigarettesNonFumees, argentEconomise, beneficesSante } = stats;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* ── Header ── */}
        <View style={styles.header}>
          <View>
            <Text style={styles.hello}>Bonjour 👋</Text>
            <Text style={styles.prenom}>{profile.email?.split('@')[0] || 'Champion'}</Text>
          </View>
          <TouchableOpacity style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(profile.email?.[0] || 'S').toUpperCase()}
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── Compteur principal ── */}
        <View style={styles.heroCard}>
          <Text style={styles.heroLabel}>Sans tabac depuis</Text>
          <Text style={styles.heroNumber}>{duree.valeur}</Text>
          <Text style={styles.heroUnit}>{duree.unite}</Text>
          {duree.detail ? <Text style={styles.heroDetail}>{duree.detail}</Text> : null}
          <View style={styles.heroDivider} />
          <Text style={styles.heroDate}>
            Arrêt le {stats.startDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
          </Text>
        </View>

        {/* ── Stats 2 colonnes ── */}
        <View style={styles.statsRow}>
          <StatCard
            icon="🚬"
            valeur={cigarettesNonFumees}
            label="Cigarettes\nnon fumées"
            color="#10B981"
          />
          <StatCard
            icon="💰"
            valeur={`${argentEconomise.toFixed(2)} €`}
            label="Argent\néconomisé"
            color="#F59E0B"
          />
        </View>

        <View style={styles.statsRow}>
          <StatCard
            icon="📦"
            valeur={Math.floor(cigarettesNonFumees / (profile.cigarettesParPaquet || 20))}
            label="Paquets\névités"
            color="#6366F1"
          />
          <StatCard
            icon="❤️"
            valeur={`${beneficesSante.filter(b => b.done).length}/${beneficesSante.length}`}
            label="Bénéfices\nsanté"
            color="#EF4444"
          />
        </View>

        {/* ── Bénéfices santé ── */}
        <Text style={styles.sectionTitle}>Bénéfices santé</Text>
        <View style={styles.beneficesCard}>
          {beneficesSante.map((b, i) => (
            <View key={i} style={[styles.beneficeRow, i < beneficesSante.length - 1 && styles.beneficeRowBorder]}>
              <View style={[styles.beneficeDot, b.done && styles.beneficeDotDone]} />
              <View style={styles.beneficeText}>
                <Text style={[styles.beneficeLabel, b.done && styles.beneficeLabelDone]}>{b.label}</Text>
                <Text style={styles.beneficeDesc}>{b.description}</Text>
              </View>
              <Text style={styles.beneficeCheck}>{b.done ? '✓' : '○'}</Text>
            </View>
          ))}
        </View>

        {/* ── Niveau de motivation ── */}
        <View style={styles.motivationCard}>
          <Text style={styles.motivationTitle}>Votre motivation</Text>
          <Text style={styles.motivationLevel}>{profile.niveauMotivation}/10</Text>
          <View style={styles.motivationBar}>
            <View style={[styles.motivationFill, { width: `${(profile.niveauMotivation / 10) * 100}%` }]} />
          </View>
        </View>

        {/* ── Reset (dev) ── */}
        <TouchableOpacity
          style={styles.resetBtn}
          onPress={async () => { await resetProfile(); navigation.replace('Welcome'); }}
        >
          <Text style={styles.resetText}>↩ Recommencer l'onboarding</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({ icon, valeur, label, color }) {
  return (
    <View style={[styles.statCard, { borderTopColor: color }]}>
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={[styles.statValeur, { color }]}>{valeur}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.grayLight },
  content: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.xxl },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emoji: { fontSize: 64, marginBottom: spacing.md },

  // Header
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
  hello: { fontSize: font.sm, color: colors.gray },
  prenom: { fontSize: font.xl, fontWeight: '800', color: colors.black, textTransform: 'capitalize' },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: colors.white, fontSize: font.lg, fontWeight: '800' },

  // Hero
  heroCard: {
    backgroundColor: colors.primary, borderRadius: radius.xl,
    padding: spacing.xl, alignItems: 'center', marginBottom: spacing.md,
  },
  heroLabel: { color: 'rgba(255,255,255,0.8)', fontSize: font.sm, marginBottom: spacing.sm },
  heroNumber: { color: colors.white, fontSize: 80, fontWeight: '900', lineHeight: 88 },
  heroUnit: { color: 'rgba(255,255,255,0.9)', fontSize: font.xl, fontWeight: '700', marginTop: -8 },
  heroDetail: { color: 'rgba(255,255,255,0.7)', fontSize: font.sm, marginTop: spacing.xs },
  heroDivider: { width: 40, height: 1, backgroundColor: 'rgba(255,255,255,0.3)', marginVertical: spacing.md },
  heroDate: { color: 'rgba(255,255,255,0.8)', fontSize: font.sm },

  // Stats
  statsRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
  statCard: {
    flex: 1, backgroundColor: colors.white, borderRadius: radius.lg,
    padding: spacing.md, alignItems: 'center', borderTopWidth: 3,
  },
  statIcon: { fontSize: 28, marginBottom: spacing.xs },
  statValeur: { fontSize: font.xl, fontWeight: '800', marginBottom: 2 },
  statLabel: { fontSize: 12, color: colors.gray, textAlign: 'center', lineHeight: 16 },

  // Bénéfices
  sectionTitle: { fontSize: font.md, fontWeight: '800', color: colors.black, marginTop: spacing.md, marginBottom: spacing.sm },
  beneficesCard: { backgroundColor: colors.white, borderRadius: radius.lg, overflow: 'hidden', marginBottom: spacing.md },
  beneficeRow: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, gap: spacing.sm },
  beneficeRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.grayBorder },
  beneficeDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.grayBorder },
  beneficeDotDone: { backgroundColor: colors.primary },
  beneficeText: { flex: 1 },
  beneficeLabel: { fontSize: font.sm, fontWeight: '600', color: colors.gray },
  beneficeLabelDone: { color: colors.black },
  beneficeDesc: { fontSize: 12, color: colors.gray, marginTop: 2 },
  beneficeCheck: { fontSize: 16, color: colors.primary },

  // Motivation
  motivationCard: { backgroundColor: colors.white, borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.lg },
  motivationTitle: { fontSize: font.sm, fontWeight: '600', color: colors.gray, marginBottom: spacing.sm },
  motivationLevel: { fontSize: font.xxl, fontWeight: '900', color: colors.primary, marginBottom: spacing.sm },
  motivationBar: { height: 8, backgroundColor: colors.grayBorder, borderRadius: 4 },
  motivationFill: { height: '100%', backgroundColor: colors.primary, borderRadius: 4 },

  // Reset
  resetBtn: { alignItems: 'center', paddingVertical: spacing.md },
  resetText: { color: colors.gray, fontSize: font.sm },

  title: { fontSize: 24, fontWeight: '800', color: colors.black },
});
