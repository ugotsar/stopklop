import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity,
} from 'react-native';
import { useUser } from '../context/UserContext';
import { colors, spacing, font, radius } from '../theme';

const MONNAIES = [
  { code: 'EUR', label: 'Euro (€)',            flag: '🇪🇺', exemple: null,        recommande: true },
  { code: 'USD', label: 'Dollar américain ($)', flag: '🇺🇸', exemple: '11,00 $' },
  { code: 'GBP', label: 'Livre sterling (£)',   flag: '🇬🇧', exemple: '9,50 £'  },
  { code: 'CHF', label: 'Franc suisse (CHF)',   flag: '🇨🇭', exemple: '10,30 CHF'},
  { code: 'CAD', label: 'Dollar canadien (C$)', flag: '🇨🇦', exemple: '14,80 C$'},
  { code: 'AUD', label: 'Dollar australien (A$)',flag: '🇦🇺', exemple: '16,90 A$'},
  { code: 'OTHER', label: 'Autre monnaie',      flag: '···', exemple: 'Choisir une autre devise' },
];

export default function UniteMonnaieScreen({ navigation }) {
  const { profile, updateProfile } = useUser();
  const [selected, setSelected] = useState(profile?.monnaie ?? 'EUR');

  async function handleSave() {
    await updateProfile({ monnaie: selected });
    navigation.goBack();
  }

  const currentMonnaie = MONNAIES.find(m => m.code === selected) ?? MONNAIES[0];
  const prixParJour = ((profile?.prixPaquet ?? 11) / (profile?.cigarettesParPaquet ?? 20) * (profile?.consoAvantApp ?? 10)).toFixed(2);

  return (
    <SafeAreaView style={styles.safe}>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Unité de monnaie</Text>
        <View style={{ width: 40 }}><Text style={{ textAlign: 'right', fontSize: 18 }}>ⓘ</Text></View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        <Text style={styles.intro}>
          Sélectionnez la monnaie utilisée pour{'\n'}vos dépenses et vos projections.
        </Text>

        {/* Monnaie actuelle */}
        <View style={styles.currentCard}>
          <View style={[styles.flagCircle, { backgroundColor: colors.primaryLight }]}>
            <Text style={styles.flagText}>💶</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.currentLabel}>Monnaie actuelle</Text>
            <Text style={styles.currentValue}>{currentMonnaie.label}</Text>
          </View>
          {currentMonnaie.recommande && (
            <View style={styles.recommandeBadge}>
              <Text style={styles.recommandeText}>Recommandé</Text>
            </View>
          )}
        </View>

        <Text style={styles.sectionTitle}>Choisir une monnaie</Text>

        {/* Liste */}
        <View style={styles.listCard}>
          {MONNAIES.map((m, i) => (
            <TouchableOpacity
              key={m.code}
              style={[styles.monnaieRow, i < MONNAIES.length - 1 && styles.monnaieRowBorder, selected === m.code && styles.monnaieRowActive]}
              onPress={() => setSelected(m.code)}
            >
              {/* Radio */}
              <View style={[styles.radio, selected === m.code && styles.radioActive]}>
                {selected === m.code && <View style={styles.radioDot} />}
              </View>
              {/* Flag */}
              <View style={styles.flagSmall}>
                <Text style={{ fontSize: 20 }}>{m.flag}</Text>
              </View>
              {/* Label */}
              <Text style={styles.monnaieLabel}>{m.label}</Text>
              {/* Exemple */}
              {m.exemple && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={styles.monnaieEx}>{m.exemple}</Text>
                  {m.code === 'OTHER' && <Text style={styles.chevron}>›</Text>}
                </View>
              )}
              {selected === m.code && m.code !== 'OTHER' && (
                <Text style={styles.checkGreen}>✓</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Aperçu */}
        <View style={styles.apercuCard}>
          <Text style={styles.apercuTitle}>Aperçu</Text>
          <View style={styles.apercuRow}>
            <View style={[styles.flagCircle, { backgroundColor: colors.primaryLight, width: 40, height: 40 }]}>
              <Text style={{ fontSize: 20 }}>🐷</Text>
            </View>
            <Text style={styles.apercuText}>
              Vos données seront automatiquement{'\n'}mises à jour avec la nouvelle monnaie.
            </Text>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.apercuLabel}>Dépense actuelle</Text>
              <Text style={styles.apercuValue}>{prixParJour} €</Text>
              <Text style={styles.apercuSub}>par jour</Text>
            </View>
          </View>
        </View>

        {/* Bouton */}
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.saveBtnText}>Enregistrer la monnaie</Text>
        </TouchableOpacity>
        <Text style={styles.footerNote}>ⓘ  Ce paramètre peut être modifié à tout moment.</Text>

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
    backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.grayBorder,
  },
  backBtn:     { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  backText:    { fontSize: 24, color: colors.black, fontWeight: '300' },
  headerTitle: { fontSize: font.md, fontWeight: '700', color: colors.black },

  intro: { fontSize: font.sm, color: colors.gray, textAlign: 'center', lineHeight: 22, marginBottom: spacing.lg },

  currentCard: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: colors.white, borderRadius: radius.xl, padding: spacing.md,
    marginBottom: spacing.lg,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  flagCircle: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  flagText:   { fontSize: 24 },
  currentLabel: { fontSize: 11, color: colors.gray },
  currentValue: { fontSize: font.md, fontWeight: '700', color: colors.black },
  recommandeBadge: { backgroundColor: colors.primaryLight, borderRadius: radius.full, paddingHorizontal: 10, paddingVertical: 4 },
  recommandeText:  { fontSize: 11, color: colors.primary, fontWeight: '600' },

  sectionTitle: { fontSize: font.sm, fontWeight: '700', color: colors.black, marginBottom: spacing.sm },

  listCard: {
    backgroundColor: colors.white, borderRadius: radius.xl, overflow: 'hidden',
    marginBottom: spacing.md,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  monnaieRow: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, gap: spacing.sm },
  monnaieRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.grayBorder },
  monnaieRowActive: { backgroundColor: colors.primaryLight },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: colors.grayBorder, alignItems: 'center', justifyContent: 'center' },
  radioActive: { borderColor: colors.primary },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary },
  flagSmall: { width: 32, alignItems: 'center' },
  monnaieLabel: { flex: 1, fontSize: font.sm, color: colors.black, fontWeight: '500' },
  monnaieEx:   { fontSize: 12, color: colors.gray },
  checkGreen:  { fontSize: 16, color: colors.primary, fontWeight: '700' },
  chevron:     { fontSize: 16, color: colors.gray },

  apercuCard: {
    backgroundColor: colors.white, borderRadius: radius.xl, padding: spacing.md,
    marginBottom: spacing.md,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  apercuTitle: { fontSize: font.sm, fontWeight: '700', color: colors.primary, marginBottom: spacing.sm },
  apercuRow:   { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  apercuText:  { flex: 1, fontSize: 12, color: colors.gray, lineHeight: 18 },
  apercuLabel: { fontSize: 11, color: colors.gray },
  apercuValue: { fontSize: font.lg, fontWeight: '900', color: colors.primary },
  apercuSub:   { fontSize: 11, color: colors.gray },

  saveBtn: { backgroundColor: colors.primary, borderRadius: radius.full, paddingVertical: 16, alignItems: 'center', marginBottom: spacing.sm },
  saveBtnText: { color: colors.white, fontSize: font.md, fontWeight: '700' },
  footerNote: { textAlign: 'center', fontSize: 11, color: colors.gray },
});
