import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Alert,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, spacing, font, radius } from '../../theme';
import PrimaryButton from '../../components/PrimaryButton';
import { restorePurchases, isPro } from '../../services/purchases';

const PLAN_IDS = ['annual', 'monthly'];

export default function PaywallScreen({ navigation }) {
  const { t } = useTranslation('paywallOnboarding');
  const [selectedPlan, setSelectedPlan] = useState('annual');
  const [restoring, setRestoring] = useState(false);

  async function handleRestore() {
    setRestoring(true);
    try {
      const info = await restorePurchases();
      if (isPro(info)) {
        Alert.alert(t('restoreSuccessTitle'), t('restoreSuccessBody'), [
          { text: t('common:ok'), onPress: () => navigation.navigate('MainTabs') },
        ]);
      } else {
        Alert.alert(t('restoreNoneTitle'), t('restoreNoneBody'));
      }
    } catch (e) {
      Alert.alert(t('restoreErrorTitle'), t('restoreErrorBody'));
    } finally {
      setRestoring(false);
    }
  }

  const features = t('features', { returnObjects: true }) || [];

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.emoji}>🌿</Text>
          <Text style={styles.title}>{t('header.title')}</Text>
          <Text style={styles.subtitle}>{t('header.subtitle')}</Text>
        </View>

        <View style={styles.features}>
          {(Array.isArray(features) ? features : []).map((f, i) => (
            <View key={i} style={styles.featureRow}>
              <View style={styles.featureCheck}><Text style={styles.featureCheckText}>✓</Text></View>
              <Text style={styles.featureText}>{f}</Text>
            </View>
          ))}
        </View>

        <View style={styles.plans}>
          {PLAN_IDS.map(id => {
            const isSelected = id === selectedPlan;
            const badge = t(`plans.${id}.badge`, { defaultValue: '' });
            return (
              <TouchableOpacity
                key={id}
                style={[styles.planCard, isSelected && styles.planCardSelected]}
                onPress={() => setSelectedPlan(id)}
                activeOpacity={0.8}
              >
                {badge ? (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{badge}</Text>
                  </View>
                ) : null}
                <View style={styles.planLeft}>
                  <View style={[styles.planRadio, isSelected && styles.planRadioSelected]}>
                    {isSelected && <View style={styles.planRadioDot} />}
                  </View>
                  <View>
                    <Text style={[styles.planLabel, isSelected && styles.planLabelSelected]}>{t(`plans.${id}.label`)}</Text>
                    <Text style={styles.planTrial}>{t(`plans.${id}.trial`)}</Text>
                  </View>
                </View>
                <View style={styles.planRight}>
                  <Text style={[styles.planPrice, isSelected && styles.planPriceSelected]}>{t(`plans.${id}.price`)}</Text>
                  <Text style={styles.planPerMonth}>{t(`plans.${id}.pricePerMonth`)}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <PrimaryButton title={t('ctaButton')} onPress={() => navigation.navigate('MainTabs')} style={styles.cta} />

        <TouchableOpacity onPress={() => navigation.navigate('MainTabs')}>
          <Text style={styles.skip}>{t('skipButton')}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleRestore} disabled={restoring}>
          <Text style={styles.restore}>
            {restoring ? t('restoringLabel') : t('restoreButton')}
          </Text>
        </TouchableOpacity>

        {/* Mentions d'abonnement exigées par l'App Store */}
        <Text style={styles.legal}>{t('legalDisclosure')}</Text>
        <View style={styles.legalLinks}>
          <Text style={styles.legalLink} onPress={() => navigation.navigate('MentionsLegales', { type: 'terms' })}>
            {t('termsLink')}
          </Text>
          <Text style={styles.legalDot}>•</Text>
          <Text style={styles.legalLink} onPress={() => navigation.navigate('MentionsLegales', { type: 'privacy' })}>
            {t('privacyLink')}
          </Text>
        </View>
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
  restore: { textAlign: 'center', color: colors.primary, fontSize: font.sm, fontWeight: '600', textDecorationLine: 'underline', marginBottom: spacing.md },
  legal: { textAlign: 'center', color: colors.gray, fontSize: 11, lineHeight: 15 },
  legalLinks: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, marginTop: 6 },
  legalLink: { color: colors.gray, fontSize: 11, textDecorationLine: 'underline' },
  legalDot: { color: colors.gray, fontSize: 11 },
});
