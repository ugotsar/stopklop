import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity,
  Alert, ActivityIndicator, ScrollView, Image,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, spacing, font, radius } from '../../theme';
import Klop from '../../components/Klop';
import { IconCible, IconLoupe, IconPieces } from '../../components/PaywallIcons';
import {
  getOfferings, isPaywallBypassEnabled, isPro, purchasePackage, restorePurchases,
} from '../../services/purchases';
import { useUser } from '../../context/UserContext';

const BOCAL = require('../../../assets/ui-kit/bocal_economies_3d.png');
const BENEFIT_ICONS = [IconCible, IconLoupe, IconPieces];

// Essai gratuit déclaré côté store (Apple : « offre introductive »). Renvoie
// le nombre de jours offerts, ou 0 si la formule n'en propose pas.
function trialDays(pkg) {
  const intro = pkg?.product?.introPrice;
  if (!intro || intro.price > 0) return 0;
  const units = intro.periodNumberOfUnits ?? 0;
  switch (intro.periodUnit) {
    case 'DAY': return units;
    case 'WEEK': return units * 7;
    case 'MONTH': return units * 30;
    case 'YEAR': return units * 365;
    default: return 0;
  }
}

function planKey(pkg) {
  if (pkg.packageType === 'ANNUAL') return 'annual';
  if (pkg.packageType === 'THREE_MONTH') return 'quarterly';
  if (pkg.packageType === 'LIFETIME') return 'lifetime';
  return 'monthly';
}

export default function PaywallScreen({ navigation, route }) {
  // Ouvert depuis l'accueil pour revoir l'écran : la croix referme l'aperçu.
  const apercu = route?.params?.apercu === true;
  const { t } = useTranslation('paywallOnboarding');
  const { subscription, refreshSubscription, allowTestAccess } = useUser();
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
        // Le trimestriel est le plan mis en avant (meilleur rapport prix/engagement
        // réel une fois renouvelé 4x sur l'année) — présélectionné par défaut.
        setSelectedPlan(
          packages.find(pkg => pkg.packageType === 'THREE_MONTH')
          ?? packages.find(pkg => pkg.packageType === 'ANNUAL')
          ?? packages[0] ?? null
        );
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

  const benefits = t('benefits', { returnObjects: true });
  const packages = offering?.availablePackages ?? [];
  const unavailable = !subscription.available || loadError || !packages.length;
  const selectedKey = selectedPlan ? planKey(selectedPlan) : null;
  const selectedTrial = trialDays(selectedPlan);
  // ⚠️ TEMPORAIRE : visible seulement tant qu'aucun abonnement n'est proposé
  // par le store. Disparaît tout seul dès que les abonnements fonctionnent.
  const showTestAccess = !apercu && !loading && (unavailable || isPaywallBypassEnabled());

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.container} showsVerticalScrollIndicator={false}>

        <View style={s.topBar}>
          <Text style={s.brand}>STOPKLOP</Text>
          {(showTestAccess || apercu) && (
            <TouchableOpacity
              style={s.close}
              onPress={apercu ? () => navigation.goBack() : allowTestAccess}
              accessibilityLabel={apercu ? t('common:close', { defaultValue: 'Fermer' }) : t('testAccessButton')}
            >
              <Text style={s.closeText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={s.hero}>
          <View style={s.heroText}>
            <Text style={s.title}>{t('header.title')}</Text>
            <Text style={s.subtitle}>{t('header.subtitle')}</Text>
          </View>
          <View style={s.heroArt}>
            <Klop width={82} />
            <Image source={BOCAL} style={s.bocal} resizeMode="contain" />
          </View>
        </View>

        <View style={s.benefits}>
          {(Array.isArray(benefits) ? benefits : []).map((benefit, index) => {
            const Icon = BENEFIT_ICONS[index] ?? IconCible;
            return (
              <View key={index} style={s.benefitCard}>
                <View style={s.benefitIcon}><Icon /></View>
                <View style={s.benefitTexts}>
                  <Text style={s.benefitTitle}>{benefit.title}</Text>
                  <Text style={s.benefitDesc}>{benefit.desc}</Text>
                </View>
              </View>
            );
          })}
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={s.loader} />
        ) : unavailable ? (
          <View style={s.unavailableCard}>
            <Text style={s.unavailableTitle}>{t('unavailableTitle')}</Text>
            <Text style={s.unavailableText}>{t('unavailableBody')}</Text>
          </View>
        ) : (
          <View style={s.plans}>
            {packages.map(pkg => {
              const key = planKey(pkg);
              const selected = selectedPlan?.identifier === pkg.identifier;
              const days = trialDays(pkg);
              return (
                <TouchableOpacity
                  key={pkg.identifier}
                  style={[s.planRow, selected && s.planRowSelected]}
                  onPress={() => setSelectedPlan(pkg)}
                  activeOpacity={0.85}
                >
                  <View style={[s.radio, selected && s.radioSelected]}>
                    {selected && <View style={s.radioDot} />}
                  </View>
                  <View style={s.planTexts}>
                    <Text style={s.planLabel}>{t(`plans.${key}.label`)}</Text>
                    {days > 0 && <Text style={s.planTrial}>{t('trialBadge', { count: days })}</Text>}
                  </View>
                  <Text style={s.planPrice}>
                    {pkg.product.priceString}
                    <Text style={s.planPer}> {t(`plans.${key}.per`)}</Text>
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        <TouchableOpacity
          style={[s.cta, (unavailable || purchasing) && s.ctaDisabled]}
          onPress={handlePurchase}
          disabled={unavailable || !selectedPlan || purchasing}
          activeOpacity={0.9}
        >
          <Text style={s.ctaText}>
            {purchasing
              ? t('purchasingLabel')
              : selectedTrial > 0 ? t('ctaTrialButton', { count: selectedTrial }) : t('ctaButton')}
          </Text>
        </TouchableOpacity>

        {selectedKey ? (
          <Text style={s.billing}>
            {selectedTrial > 0
              ? t('trialBilling', {
                  count: selectedTrial,
                  price: selectedPlan.product.priceString,
                  per: t(`plans.${selectedKey}.per`),
                })
              : t(`plans.${selectedKey}.billing`, { price: selectedPlan.product.priceString })}
          </Text>
        ) : null}

        {showTestAccess && (
          <TouchableOpacity onPress={allowTestAccess} disabled={purchasing} style={s.testAccess}>
            <Text style={s.testAccessText}>{t('testAccessButton')}</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity onPress={handleRestore} disabled={purchasing || unavailable}>
          <Text style={[s.restore, unavailable && s.restoreDisabled]}>
            {purchasing ? t('restoringLabel') : t('restoreButton')}
          </Text>
        </TouchableOpacity>

        <View style={s.legalLinks}>
          <Text style={s.legalLink} onPress={() => navigation.navigate('MentionsLegales', { type: 'terms' })}>{t('termsLink')}</Text>
          <Text style={s.legalDot}>·</Text>
          <Text style={s.legalLink} onPress={() => navigation.navigate('MentionsLegales', { type: 'privacy' })}>{t('privacyLink')}</Text>
        </View>
        <Text style={s.legal}>{t('legalDisclosure')}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const CREAM = '#FBF9F1';
const MINT = '#E7F2E8';
const DEEP = '#0B5135';

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: CREAM },
  container: { paddingHorizontal: 22, paddingTop: 8, paddingBottom: 28 },

  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', height: 40 },
  brand: { fontSize: 17, fontWeight: '900', letterSpacing: 1.2, color: DEEP },
  close: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#EFEEE4', alignItems: 'center', justifyContent: 'center' },
  closeText: { fontSize: 16, color: '#4B6358', fontWeight: '700' },

  hero: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  heroText: { flex: 1, paddingRight: 6 },
  title: { fontSize: 34, fontWeight: '900', color: '#0A2A1C', lineHeight: 39, letterSpacing: -0.5 },
  subtitle: { fontSize: 15, color: '#6B7C72', lineHeight: 21, marginTop: 12 },
  heroArt: { flexDirection: 'row', alignItems: 'flex-end' },
  bocal: { width: 86, height: 100, marginLeft: -8 },

  benefits: { gap: 10, marginTop: 22 },
  benefitCard: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: MINT, borderRadius: 18, padding: 14 },
  benefitIcon: { width: 46, height: 46, borderRadius: 14, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  benefitTexts: { flex: 1 },
  benefitTitle: { fontSize: 16, fontWeight: '800', color: '#0A2A1C' },
  benefitDesc: { fontSize: 13.5, color: '#5E6F64', marginTop: 3, lineHeight: 18 },

  loader: { marginVertical: spacing.xl },
  unavailableCard: { backgroundColor: '#FFF7ED', borderWidth: 1, borderColor: '#FED7AA', borderRadius: radius.lg, padding: spacing.md, marginTop: 20 },
  unavailableTitle: { fontSize: font.md, fontWeight: '800', color: '#9A3412', textAlign: 'center', marginBottom: 6 },
  unavailableText: { fontSize: font.sm, color: '#9A3412', textAlign: 'center', lineHeight: 20 },

  plans: { gap: 9, marginTop: 20 },
  planRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderWidth: 1.5, borderColor: '#E4E2D6', borderRadius: 16,
    backgroundColor: colors.white, paddingVertical: 15, paddingHorizontal: 16,
  },
  planRowSelected: { borderColor: '#1E8E4E', backgroundColor: '#F3FAF4' },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: '#D3DED7', alignItems: 'center', justifyContent: 'center' },
  radioSelected: { borderColor: '#1E8E4E' },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#1E8E4E' },
  planTexts: { flex: 1 },
  planLabel: { fontSize: 16, fontWeight: '800', color: '#0A2A1C' },
  planTrial: { fontSize: 12.5, fontWeight: '700', color: '#1E8E4E', marginTop: 2 },
  planPrice: { fontSize: 16, fontWeight: '800', color: '#0A2A1C' },
  planPer: { fontSize: 14, fontWeight: '500', color: '#6B7C72' },

  cta: { marginTop: 18, borderRadius: 26, backgroundColor: DEEP, paddingVertical: 17, alignItems: 'center' },
  ctaDisabled: { opacity: 0.5 },
  ctaText: { color: colors.white, fontSize: 16.5, fontWeight: '800' },
  billing: { textAlign: 'center', color: '#8A938C', fontSize: 12.5, marginTop: 10 },

  testAccess: { marginTop: 14, alignItems: 'center' },
  testAccessText: { color: '#9A3412', fontSize: 13, fontWeight: '700', textDecorationLine: 'underline' },

  restore: { textAlign: 'center', color: DEEP, fontSize: 14, fontWeight: '700', textDecorationLine: 'underline', marginTop: 16 },
  restoreDisabled: { color: '#9AA79F' },
  legalLinks: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 12 },
  legalLink: { color: DEEP, fontSize: 13, textDecorationLine: 'underline' },
  legalDot: { color: '#8A938C', fontSize: 13 },
  legal: { textAlign: 'center', color: '#9AA79F', fontSize: 10.5, lineHeight: 15, marginTop: 12 },
});
