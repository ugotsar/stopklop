import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  SafeAreaView, ActivityIndicator, ScrollView, Alert,
} from 'react-native';
import { getOfferings, purchasePackage, restorePurchases, isPro } from '../services/purchases';
import { colors, spacing, font, radius } from '../theme';

const FEATURES = [
  { icon: '📊', label: 'Statistiques avancées illimitées' },
  { icon: '🏆', label: 'Tous les badges & milestones' },
  { icon: '☁️', label: 'Sauvegarde cloud automatique' },
  { icon: '🔔', label: 'Rappels personnalisés' },
  { icon: '📤', label: 'Export de tes données' },
];

export default function PaywallScreen({ navigation }) {
  const [offering, setOffering]       = useState(null);
  const [selected, setSelected]       = useState(null);
  const [loading, setLoading]         = useState(true);
  const [purchasing, setPurchasing]   = useState(false);

  useEffect(() => {
    (async () => {
      const o = await getOfferings();
      setOffering(o);
      // Sélectionner l'annuel par défaut
      const yearly = o?.availablePackages?.find(p => p.packageType === 'ANNUAL');
      if (yearly) setSelected(yearly);
      setLoading(false);
    })();
  }, []);

  async function handlePurchase() {
    if (!selected) return;
    try {
      setPurchasing(true);
      const info = await purchasePackage(selected);
      if (isPro(info)) {
        Alert.alert('🎉 Bienvenue dans Stopklop Pro !', 'Toutes les fonctionnalités sont débloquées.', [
          { text: 'Super !', onPress: () => navigation.goBack() },
        ]);
      }
    } catch (e) {
      if (!e.userCancelled) {
        Alert.alert('Erreur', 'Achat impossible. Réessaie.');
      }
    } finally {
      setPurchasing(false);
    }
  }

  async function handleRestore() {
    try {
      setPurchasing(true);
      const info = await restorePurchases();
      if (isPro(info)) {
        Alert.alert('✅ Abonnement restauré !', '', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        Alert.alert('Aucun abonnement trouvé', 'Aucun achat à restaurer.');
      }
    } catch (e) {
      Alert.alert('Erreur', 'Restauration impossible.');
    } finally {
      setPurchasing(false);
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={s.safe}>
        <ActivityIndicator size="large" color={colors.primary} style={{ flex: 1 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <TouchableOpacity style={s.closeBtn} onPress={() => navigation.goBack()}>
          <Text style={s.closeText}>✕</Text>
        </TouchableOpacity>

        <Text style={s.crown}>👑</Text>
        <Text style={s.title}>Stopklop Pro</Text>
        <Text style={s.subtitle}>Toutes les fonctionnalités pour arrêter définitivement</Text>

        {/* Features */}
        <View style={s.featureList}>
          {FEATURES.map((f, i) => (
            <View key={i} style={s.featureRow}>
              <Text style={s.featureIcon}>{f.icon}</Text>
              <Text style={s.featureLabel}>{f.label}</Text>
            </View>
          ))}
        </View>

        {/* Plans */}
        {offering?.availablePackages?.map(pkg => {
          const isSelected = selected?.identifier === pkg.identifier;
          const isYearly   = pkg.packageType === 'ANNUAL';
          return (
            <TouchableOpacity
              key={pkg.identifier}
              style={[s.plan, isSelected && s.planSelected]}
              onPress={() => setSelected(pkg)}
            >
              {isYearly && <View style={s.badgePopulaire}><Text style={s.badgeText}>Populaire</Text></View>}
              <View style={s.planLeft}>
                <Text style={[s.planName, isSelected && s.planNameSelected]}>
                  {pkg.packageType === 'LIFETIME' ? 'À vie' : isYearly ? 'Annuel' : 'Mensuel'}
                </Text>
                {isYearly && (
                  <Text style={s.planEco}>Économise 50%</Text>
                )}
              </View>
              <Text style={[s.planPrice, isSelected && s.planPriceSelected]}>
                {pkg.product.priceString}
                {pkg.packageType !== 'LIFETIME' && (
                  <Text style={s.planPer}>
                    {isYearly ? '/an' : '/mois'}
                  </Text>
                )}
              </Text>
            </TouchableOpacity>
          );
        })}

        {/* CTA */}
        <TouchableOpacity
          style={[s.cta, purchasing && s.ctaDisabled]}
          onPress={handlePurchase}
          disabled={purchasing || !selected}
        >
          {purchasing
            ? <ActivityIndicator color="#fff" />
            : <Text style={s.ctaText}>Commencer maintenant</Text>
          }
        </TouchableOpacity>

        <Text style={s.trial}>Essai gratuit 7 jours · Annulable à tout moment</Text>

        <TouchableOpacity onPress={handleRestore}>
          <Text style={s.restore}>Restaurer mes achats</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: colors.white },
  scroll:       { paddingHorizontal: spacing.xl, paddingBottom: 40, alignItems: 'center' },
  closeBtn:     { alignSelf: 'flex-end', padding: 8, marginTop: 8 },
  closeText:    { fontSize: 18, color: colors.gray },
  crown:        { fontSize: 56, marginTop: 16 },
  title:        { fontSize: 26, fontWeight: '900', color: colors.primary, marginTop: 8 },
  subtitle:     { fontSize: font.sm, color: colors.gray, textAlign: 'center', marginTop: 6, marginBottom: 24 },
  featureList:  { width: '100%', gap: 10, marginBottom: 24 },
  featureRow:   { flexDirection: 'row', alignItems: 'center', gap: 12 },
  featureIcon:  { fontSize: 20 },
  featureLabel: { fontSize: font.sm, color: colors.black, fontWeight: '500' },
  plan: {
    width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: radius.lg,
    padding: 14, marginBottom: 10, position: 'relative',
  },
  planSelected:      { borderColor: colors.primary, backgroundColor: '#EAF3DE' },
  planLeft:          { gap: 2 },
  planName:          { fontSize: font.md, fontWeight: '700', color: colors.black },
  planNameSelected:  { color: colors.primary },
  planPrice:         { fontSize: font.md, fontWeight: '800', color: colors.black },
  planPriceSelected: { color: colors.primary },
  planPer:           { fontSize: 12, fontWeight: '400' },
  planEco:           { fontSize: 11, color: '#1B6B3A' },
  badgePopulaire: {
    position: 'absolute', top: -10, right: 12,
    backgroundColor: colors.primary, borderRadius: 10,
    paddingHorizontal: 8, paddingVertical: 2,
  },
  badgeText: { fontSize: 10, color: '#fff', fontWeight: '700' },
  cta: {
    width: '100%', backgroundColor: colors.primary,
    borderRadius: radius.full, paddingVertical: 16,
    alignItems: 'center', marginTop: 8,
  },
  ctaDisabled: { opacity: 0.6 },
  ctaText:     { color: '#fff', fontSize: font.md, fontWeight: '800' },
  trial:       { fontSize: 11, color: colors.gray, marginTop: 10, textAlign: 'center' },
  restore:     { fontSize: 12, color: colors.gray, marginTop: 16, textDecorationLine: 'underline' },
});
