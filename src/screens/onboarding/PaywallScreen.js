import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity,
  Alert, ActivityIndicator, ScrollView,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, spacing, font, radius } from '../../theme';
import PrimaryButton from '../../components/PrimaryButton';
import {
  getOfferings, isPaywallBypassEnabled, isPro, purchasePackage, restorePurchases,
} from '../../services/purchases';
import { useUser } from '../../context/UserContext';

function planKey(pkg) {
  if (pkg.packageType === 'ANNUAL') return 'annual';
  if (pkg.packageType === 'LIFETIME') return 'lifetime';
  return 'monthly';
}

export default function PaywallScreen({ navigation }) {
  const { t, i18n } = useTranslation('paywallOnboarding');
  const { subscription, refreshSubscription } = useUser();
  const [offering, setOffering] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!subscription.available) {
        if (active) setLoading(false);
        return;
      }
      try {
        const current = await getOfferings();
        if (!active) return;
        setOffering(current);
        const packages = current?.availablePackages ?? [];
        setSelectedPlan(packages.find(pkg => pkg.packageType === 'ANNUAL') ?? packages[0] ?? null);
        if (!packages.length) setLoadError('no-offering');
      } catch (error) {
        if (active) setLoadError(error);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [subscription.available]);

  async function handlePurchase() {
    if (!selectedPlan || purchasing) return;
    try {
      setPurchasing(true);
      const info = await purchasePackage(selectedPlan);
      const result = await refreshSubscription(info);
      if (!result.isPro) {
        Alert.alert(t('purchaseErrorTitle'), t('purchaseErrorBody'));
      }
      // Si l'entitlement est actif, AppNavigator bascule automatiquement vers
      // MainTabs. Aucune navigation directe ne peut contourner ce contrôle.
    } catch (error) {
      if (!error?.userCancelled) Alert.alert(t('purchaseErrorTitle'), t('purchaseErrorBody'));
    } finally {
      setPurchasing(false);
    }
  }

  async function handleRestore() {
    if (purchasing) return;
    setPurchasing(true);
    try {
      const info = await restorePurchases();
      const result = await refreshSubscription(info);
      if (!isPro(info) || !result.isPro) {
        Alert.alert(t('restoreNoneTitle'), t('restoreNoneBody'));
      }
    } catch (error) {
      Alert.alert(t('restoreErrorTitle'), t('restoreErrorBody'));
    } finally {
      setPurchasing(false);
    }
  }

  const features = t('features', { returnObjects: true }) || [];
  const packages = offering?.availablePackages ?? [];
  const unavailable = !subscription.available || loadError || !packages.length;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.emoji}>🌿</Text>
          <Text style={styles.title}>{t('header.title')}</Text>
          <Text style={styles.subtitle}>{t('header.subtitle')}</Text>
        </View>

        <View style={styles.features}>
          {(Array.isArray(features) ? features : []).map((feature, index) => (
            <View key={index} style={styles.featureRow}>
              <View style={styles.featureCheck}><Text style={styles.featureCheckText}>✓</Text></View>
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
        ) : unavailable ? (
          <View style={styles.unavailableCard}>
            <Text style={styles.unavailableTitle}>{t('unavailableTitle')}</Text>
            <Text style={styles.unavailableText}>{t('unavailableBody')}</Text>
          </View>
        ) : (
          <View style={styles.plans}>
            {packages.map(pkg => {
              const key = planKey(pkg);
              const selected = selectedPlan?.identifier === pkg.identifier;
              const badgeKey = `plans.${key}.badge`;
              const badge = i18n.exists(badgeKey, { ns: 'paywallOnboarding' }) ? t(badgeKey) : '';
              return (
                <TouchableOpacity
                  key={pkg.identifier}
                  style={[styles.planCard, selected && styles.planCardSelected]}
                  onPress={() => setSelectedPlan(pkg)}
                  activeOpacity={0.8}
                >
                  {badge ? <View style={styles.badge}><Text style={styles.badgeText}>{badge}</Text></View> : null}
                  <View style={styles.planLeft}>
                    <View style={[styles.planRadio, selected && styles.planRadioSelected]}>
                      {selected && <View style={styles.planRadioDot} />}
                    </View>
                    <Text style={[styles.planLabel, selected && styles.planLabelSelected]}>{t(`plans.${key}.label`)}</Text>
                  </View>
                  <View style={styles.planRight}>
                    <Text style={[styles.planPrice, selected && styles.planPriceSelected]}>{pkg.product.priceString}</Text>
                    {pkg.packageType !== 'LIFETIME' && <Text style={styles.planPerMonth}>{t(`plans.${key}.period`)}</Text>}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        <PrimaryButton
          title={purchasing ? t('purchasingLabel') : t('ctaButton')}
          onPress={handlePurchase}
          disabled={unavailable || !selectedPlan || purchasing}
          style={[styles.cta, (unavailable || purchasing) && styles.ctaDisabled]}
        />

        {isPaywallBypassEnabled() && (
          <TouchableOpacity onPress={() => navigation.navigate('MainTabs')} disabled={purchasing}>
            <Text style={styles.skip}>{t('skipButton')}</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity onPress={handleRestore} disabled={purchasing || unavailable}>
          <Text style={[styles.restore, unavailable && styles.restoreDisabled]}>
            {purchasing ? t('restoringLabel') : t('restoreButton')}
          </Text>
        </TouchableOpacity>

        <Text style={styles.legal}>{t('legalDisclosure')}</Text>
        <View style={styles.legalLinks}>
          <Text style={styles.legalLink} onPress={() => navigation.navigate('MentionsLegales', { type: 'terms' })}>{t('termsLink')}</Text>
          <Text style={styles.legalDot}>•</Text>
          <Text style={styles.legalLink} onPress={() => navigation.navigate('MentionsLegales', { type: 'privacy' })}>{t('privacyLink')}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.white },
  container: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.xl, flexGrow: 1 },
  header: { alignItems: 'center', marginBottom: spacing.lg },
  emoji: { fontSize: 56, marginBottom: spacing.sm },
  title: { fontSize: 26, fontWeight: '800', color: colors.black, textAlign: 'center', lineHeight: 34, marginBottom: spacing.sm },
  subtitle: { fontSize: font.sm, color: colors.gray, textAlign: 'center', lineHeight: 22 },
  features: { gap: spacing.sm, marginBottom: spacing.lg },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  featureCheck: { width: 22, height: 22, borderRadius: 11, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  featureCheckText: { color: colors.primary, fontSize: 13, fontWeight: '800' },
  featureText: { fontSize: font.sm, color: colors.black, flex: 1 },
  loader: { marginVertical: spacing.xl },
  unavailableCard: { backgroundColor: '#FFF7ED', borderWidth: 1, borderColor: '#FED7AA', borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.lg },
  unavailableTitle: { fontSize: font.md, fontWeight: '800', color: '#9A3412', textAlign: 'center', marginBottom: 6 },
  unavailableText: { fontSize: font.sm, color: '#9A3412', textAlign: 'center', lineHeight: 20 },
  plans: { gap: spacing.sm, marginBottom: spacing.lg },
  planCard: { borderWidth: 1.5, borderColor: colors.grayBorder, borderRadius: radius.lg, padding: spacing.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', position: 'relative', overflow: 'visible' },
  planCardSelected: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  badge: { position: 'absolute', top: -10, right: 16, backgroundColor: colors.primary, borderRadius: radius.full, paddingHorizontal: 10, paddingVertical: 3 },
  badgeText: { color: colors.white, fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  planLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1 },
  planRadio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: colors.grayBorder, alignItems: 'center', justifyContent: 'center' },
  planRadioSelected: { borderColor: colors.primary, backgroundColor: colors.primary },
  planRadioDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.white },
  planLabel: { fontSize: font.md, fontWeight: '700', color: colors.black },
  planLabelSelected: { color: colors.primary },
  planRight: { alignItems: 'flex-end', marginLeft: spacing.sm },
  planPrice: { fontSize: font.lg, fontWeight: '800', color: colors.black },
  planPriceSelected: { color: colors.primary },
  planPerMonth: { fontSize: 12, color: colors.gray, marginTop: 2 },
  cta: { marginBottom: spacing.md },
  ctaDisabled: { opacity: 0.55 },
  skip: { textAlign: 'center', color: colors.gray, fontSize: font.sm, marginBottom: spacing.sm },
  restore: { textAlign: 'center', color: colors.primary, fontSize: font.sm, fontWeight: '600', textDecorationLine: 'underline', marginBottom: spacing.md },
  restoreDisabled: { color: colors.gray },
  legal: { textAlign: 'center', color: colors.gray, fontSize: 11, lineHeight: 15, marginTop: 'auto' },
  legalLinks: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, marginTop: 6 },
  legalLink: { color: colors.gray, fontSize: 11, textDecorationLine: 'underline' },
  legalDot: { color: colors.gray, fontSize: 11 },
});
