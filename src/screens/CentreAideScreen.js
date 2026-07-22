import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity,
} from 'react-native';
import { colors, spacing, font, radius } from '../theme';

const FAQ = [
  {
    q: "Comment fonctionne le plan de réduction progressive ?",
    r: "Vous choisissez un point de départ (votre consommation actuelle) et un rythme, par exemple 2 cigarettes en moins par semaine. Chaque semaine, votre objectif quotidien baisse automatiquement jusqu'à atteindre 0. Vous pouvez modifier le rythme à tout moment depuis l'onglet Plan.",
  },
  {
    q: "À quoi sert le bouton « J'ai envie de fumer » ?",
    r: "Il enregistre le moment et la cause de vos envies (stress, café, soirée…). L'application analyse ensuite vos heures critiques, vos jours difficiles et vos déclencheurs principaux dans l'onglet Plan, pour vous aider à les anticiper.",
  },
  {
    q: "Que signifie « Vie récupérée » ?",
    r: "Les études médicales estiment qu'une cigarette réduit l'espérance de vie d'environ 5 minutes. Chaque cigarette non fumée par rapport à votre ancienne consommation vous « rend » donc 5 minutes de vie.",
  },
  {
    q: "Comment est calculé l'argent économisé ?",
    r: "On compare votre consommation actuelle à celle d'avant l'application, multipliée par le prix d'une cigarette (prix du paquet ÷ nombre de cigarettes). Vous pouvez ajuster ces valeurs dans Profil → Paramètres de consommation.",
  },
  {
    q: "J'ai dépassé mon objectif, que se passe-t-il ?",
    r: "Rien de grave ! Le cercle passe en rouge pour vous l'indiquer, mais chaque jour est un nouveau départ. L'important est la tendance sur la durée, pas une journée isolée.",
  },
  {
    q: "Mes données sont-elles sauvegardées ?",
    r: "Oui. Vos données sont stockées localement sur votre téléphone et synchronisées dans le cloud. Vous les retrouvez si vous changez d'appareil.",
  },
  {
    q: "Comment modifier mon objectif ?",
    r: "Allez dans l'onglet Plan → « Modifier le plan », ou dans Profil → « Mon objectif actuel ». Vous pouvez choisir l'arrêt complet, la réduction progressive ou un objectif libre.",
  },
];

export default function CentreAideScreen({ navigation }) {
  const [openIdx, setOpenIdx] = useState(null);

  return (
    <SafeAreaView style={styles.safe}>

      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Centre d'aide</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.intro}>Questions fréquentes</Text>

        {FAQ.map((item, i) => (
          <TouchableOpacity
            key={i}
            style={styles.faqCard}
            activeOpacity={0.8}
            onPress={() => setOpenIdx(openIdx === i ? null : i)}
          >
            <View style={styles.faqRow}>
              <Text style={styles.faqQ}>{item.q}</Text>
              <Text style={styles.faqChevron}>{openIdx === i ? '−' : '+'}</Text>
            </View>
            {openIdx === i && <Text style={styles.faqR}>{item.r}</Text>}
          </TouchableOpacity>
        ))}

        <View style={styles.contactCard}>
          <Text style={{ fontSize: 22, marginBottom: 4 }}>💬</Text>
          <Text style={styles.contactTitle}>Vous n'avez pas trouvé votre réponse ?</Text>
          <TouchableOpacity
            style={styles.contactBtn}
            onPress={() => navigation.navigate('NousContacter')}
          >
            <Text style={styles.contactBtnText}>Nous contacter</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: '#F7F8FA' },
  scroll: { padding: spacing.md, paddingBottom: spacing.xxl },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1, borderBottomColor: colors.grayBorder,
  },
  backBtn:     { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  backText:    { fontSize: 24, color: colors.black, fontWeight: '300' },
  headerTitle: { fontSize: font.md, fontWeight: '700', color: colors.black },

  intro: { fontSize: font.sm, fontWeight: '700', color: colors.black, marginBottom: spacing.sm },

  faqCard: {
    backgroundColor: colors.white, borderRadius: radius.lg,
    padding: spacing.md, marginBottom: spacing.sm,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  faqRow:     { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  faqQ:       { flex: 1, fontSize: 13, fontWeight: '600', color: colors.black, lineHeight: 18 },
  faqChevron: { fontSize: 20, color: colors.primary, fontWeight: '400' },
  faqR:       { fontSize: 12, color: colors.gray, lineHeight: 18, marginTop: spacing.sm },

  contactCard: {
    backgroundColor: colors.primaryLight, borderRadius: radius.xl,
    padding: spacing.md, alignItems: 'center', marginTop: spacing.sm,
  },
  contactTitle: { fontSize: 13, fontWeight: '600', color: colors.black, marginBottom: spacing.sm, textAlign: 'center' },
  contactBtn: {
    backgroundColor: colors.primary, borderRadius: radius.full,
    paddingVertical: 10, paddingHorizontal: 24,
  },
  contactBtnText: { color: colors.white, fontSize: 13, fontWeight: '700' },
});
