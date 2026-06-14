import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity,
} from 'react-native';
import { colors, spacing, font, radius } from '../../theme';
import PrimaryButton from '../../components/PrimaryButton';

const PLANS = [
  {
    id: 'annual',
    label: 'Annuel',
    price: '49,99 €',
    pricePerMonth: '4,17 € / mois',
    badge: 'MEILLEURE OFFRE',
    trial: '7 jours gratuits',
  },
  {
    id: 'monthly',
    label: 'Mensuel',
    price: '9,99 €',
    pricePerMonth: '9,99 € / mois',
    badge: null,
    trial: '3 jours gratuits',
  },
];

export default function PaywallScreen({ navigation }) {
  const [selectedPlan, setSelectedPlan] = useState('annual');

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.emoji}>🌿</Text>
          <Text style={styles.title}>Commencez votre{'\n'}parcours sans tabac</Text>
          <Text style={styles.subtitle}>Accédez à toutes les fonctionnalités{'\n'}pour maximiser vos chances de réussite.</Text>
        </View>

        <View style={styles.features}>
          {['Suivi quotidien personnalisé', 'Calcul des économies en temps réel', 'Conseils et défis quotidiens', 'Statistiques détaillées de santé'].map((f, i) => (
            <View key={i} style={styles.featureRow}>
              <View style={styles.featureCheck}><Text style={styles.featureCheckText}>✓</Text></View>
              <Text style={styles.featureText}>{f}</Text>
            </View>
          ))}
        </View>

        <View style={styles.plans}>
          {PLANS.map(plan => {
            const isSelected = plan.id === selectedPlan;
            return (
              <TouchableOpacity
                key={plan.id}
                style={[styles.planCard, isSelected && styles.planCardSelected]}
                onPress={() => setSelectedPlan(plan.id)}
                activeOpacity={0.8}
              >
                {plan.badge && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{plan.badge}</Text>
                  </View>
                )}
                <View style={styles.planLeft}>
                  <View style={[styles.planRadio, isSelected && styles.planRadioSelected]}>
                    {isSelected && <View style={styles.planRadioDot} />}
                  </View>
                  <View>
                    <Text style={[styles.planLabel, isSelected && styles.planLabelSelected]}>{plan.label}</Text>
                    <Text style={styles.planTrial}>{plan.trial}</Text>
                  </View>
                </View>
                <View style={styles.planRight}>
                  <Text style={[styles.planPrice, isSelected && styles.planPriceSelected]}>{plan.price}</Text>
                  <Text style={styles.planPerMonth}>{plan.pricePerMonth}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <PrimaryButton title="Commencer mon essai →" onPress={() => navigation.navigate('MainTabs')} style={styles.cta} />

        <TouchableOpacity onPress={() => navigation.navigate('MainTabs')}>
          <Text style={styles.skip}>Continuer sans abonnement</Text>
        </TouchableOpacity>

        <Text style={styles.legal}>Sans engagement • Annulation à tout moment</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.white },
  container: { flex: 1, paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.lg },
  header: { alignItems: 'center', marginBottom: spacing.lg },
  emoji: { fontSize: 56, marginBottom: spacing.sm },
  title: { fontSize: 26, fontWeight: '800', color: colors.black, textAlign: 'center', lineHeight: 34, marginBottom: spacing.sm },
  subtitle: { fontSize: font.sm, color: colors.gray, textAlign: 'center', lineHeight: 22 },
  features: { gap: spacing.sm, marginBottom: spacing.lg },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  featureCheck: {
    width: 22, height: 22, borderRadius: 11, backgroundColor: colors.primaryLight,
    alignItems: 'center', justifyContent: 'center',
  },
  featureCheckText: { color: colors.primary, fontSize: 13, fontWeight: '800' },
  featureText: { fontSize: font.sm, color: colors.black, flex: 1 },
  plans: { gap: spacing.sm, marginBottom: spacing.lg },
  planCard: {
    borderWidth: 1.5, borderColor: colors.grayBorder, borderRadius: radius.lg,
    padding: spacing.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    position: 'relative', overflow: 'visible',
  },
  planCardSelected: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  badge: {
    position: 'absolute', top: -10, right: 16,
    backgroundColor: colors.primary, borderRadius: radius.full,
    paddingHorizontal: 10, paddingVertical: 3,
  },
  badgeText: { color: colors.white, fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  planLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  planRadio: {
    width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: colors.grayBorder,
    alignItems: 'center', justifyContent: 'center',
  },
  planRadioSelected: { borderColor: colors.primary, backgroundColor: colors.primary },
  planRadioDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.white },
  planLabel: { fontSize: font.md, fontWeight: '700', color: colors.black },
  planLabelSelected: { color: colors.primary },
  planTrial: { fontSize: 12, color: colors.gray, marginTop: 2 },
  planRight: { alignItems: 'flex-end' },
  planPrice: { fontSize: font.lg, fontWeight: '800', color: colors.black },
  planPriceSelected: { color: colors.primary },
  planPerMonth: { fontSize: 12, color: colors.gray },
  cta: { marginBottom: spacing.md },
  skip: { textAlign: 'center', color: colors.gray, fontSize: font.sm, marginBottom: spacing.sm },
  legal: { textAlign: 'center', color: colors.gray, fontSize: 12 },
});
