import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, TextInput,
} from 'react-native';
import { colors, spacing, font, radius } from '../../theme';
import { jouerSon } from '../../services/sounds';
import StepHeader from '../../components/StepHeader';
import PrimaryButton from '../../components/PrimaryButton';

const MOTIVATIONS = [
  { id: 'sante', label: 'Ma santé', icon: '❤️' },
  { id: 'famille', label: 'Ma famille', icon: '👨‍👩‍👧' },
  { id: 'apparence', label: 'Mon apparence', icon: '✨' },
  { id: 'economiser', label: "Économiser\nde l'argent", icon: '💰' },
  { id: 'souffle', label: 'Un meilleur\nsouffle', icon: '💨' },
  { id: 'condition', label: 'Retrouver ma\ncondition', icon: '🏃' },
];

export default function Step6Screen({ navigation, route }) {
  const [selected, setSelected] = useState([]);
  const [freeValue, setFreeValue] = useState('');

  function toggle(id) {
    setSelected(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id);
      if (prev.length >= 3) return prev;
      return [...prev, id];
    });
  }

  function handleContinue() {
    jouerSon('onboarding_step');
    const motivations = [...selected];
    if (freeValue) motivations.push(freeValue);
    navigation.navigate('Step7', { ...route.params, motivations });
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StepHeader step={6} onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Quelles sont vos principales{'\n'}motivations ?</Text>
        <Text style={styles.subtitle}>Sélectionnez jusqu'à 3 motivations{'\n'}qui comptent le plus pour vous.</Text>

        <View style={styles.grid}>
          {MOTIVATIONS.map(m => {
            const isSelected = selected.includes(m.id);
            return (
              <TouchableOpacity
                key={m.id}
                style={[styles.card, isSelected && styles.cardSelected]}
                onPress={() => toggle(m.id)}
                activeOpacity={0.7}
              >
                <Text style={styles.cardIcon}>{m.icon}</Text>
                <Text style={[styles.cardLabel, isSelected && styles.cardLabelSelected]}>{m.label}</Text>
                <View style={[styles.radio, isSelected && styles.radioSelected]}>
                  {isSelected && <Text style={styles.checkMark}>✓</Text>}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.dividerRow}>
          <View style={styles.divider} /><Text style={styles.dividerText}>ou</Text><View style={styles.divider} />
        </View>

        <View style={styles.freeCard}>
          <View style={styles.freeIconCircle}><Text>✏️</Text></View>
          <View style={styles.freeTextBlock}>
            <Text style={styles.freeTitle}>Écrire ma propre motivation</Text>
            <Text style={styles.freeDesc}>Saisissez une motivation qui compte pour vous.</Text>
          </View>
          <TextInput
            style={styles.freeInput}
            placeholder="Votre motivation"
            placeholderTextColor={colors.gray}
            value={freeValue}
            onChangeText={setFreeValue}
          />
        </View>
      </ScrollView>

      <View style={styles.bottom}>
        <PrimaryButton title="Continuer  →" onPress={handleContinue} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.white },
  content: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: 120 },
  title: { fontSize: 26, fontWeight: '800', color: colors.black, textAlign: 'center', lineHeight: 34, marginBottom: spacing.sm },
  subtitle: { fontSize: font.sm, color: colors.gray, textAlign: 'center', lineHeight: 22, marginBottom: spacing.lg },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.sm },
  card: {
    width: '30.5%', borderWidth: 1.5, borderColor: colors.grayBorder,
    borderRadius: radius.lg, paddingVertical: spacing.md, paddingHorizontal: spacing.sm,
    alignItems: 'center', backgroundColor: colors.white, gap: 6,
  },
  cardSelected: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  cardIcon: { fontSize: 28 },
  cardLabel: { fontSize: 12, color: colors.black, textAlign: 'center', lineHeight: 16 },
  cardLabelSelected: { color: colors.primary, fontWeight: '700' },
  radio: {
    width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: colors.grayBorder,
    alignItems: 'center', justifyContent: 'center', marginTop: 2,
  },
  radioSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  checkMark: { color: colors.white, fontSize: 11, fontWeight: '800' },
  autreCard: {
    borderWidth: 1.5, borderColor: colors.grayBorder, borderRadius: radius.lg,
    paddingVertical: spacing.md, alignItems: 'center', gap: 4, marginBottom: spacing.sm,
  },
  autreCardSelected: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  autreIcon: { fontSize: 20, color: colors.gray },
  autreLabel: { fontSize: font.sm, color: colors.black },
  autreLabelSelected: { color: colors.primary, fontWeight: '700' },
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: spacing.md },
  divider: { flex: 1, height: 1, backgroundColor: colors.grayBorder },
  dividerText: { marginHorizontal: spacing.md, color: colors.gray, fontSize: font.sm },
  freeCard: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: colors.grayBorder,
    borderRadius: radius.lg, padding: spacing.md, gap: spacing.sm,
  },
  freeIconCircle: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center',
  },
  freeTextBlock: { flex: 1 },
  freeTitle: { fontSize: font.sm, fontWeight: '700', color: colors.black, marginBottom: 2 },
  freeDesc: { fontSize: 12, color: colors.gray, lineHeight: 16 },
  freeInput: {
    borderWidth: 1.5, borderColor: colors.grayBorder, borderRadius: radius.sm,
    paddingHorizontal: spacing.sm, paddingVertical: 8, fontSize: font.sm, color: colors.black, minWidth: 100,
  },
  bottom: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: spacing.lg, backgroundColor: colors.white },
});

