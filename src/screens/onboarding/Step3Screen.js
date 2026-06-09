import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, TextInput,
} from 'react-native';
import { colors, spacing, font, radius } from '../../theme';
import StepHeader from '../../components/StepHeader';
import PrimaryButton from '../../components/PrimaryButton';
import FreeTextCard from '../../components/FreeTextCard';

const OPTIONS = [
  { value: 20, icon: '🚬', label: 'cigarettes' },
  { value: 25, icon: '🚬', label: 'cigarettes' },
  { value: 30, icon: '🚬', label: 'cigarettes' },
];

export default function Step3Screen({ navigation, route }) {
  const [selected, setSelected] = useState(20);
  const [freeValue, setFreeValue] = useState('');

  function handleContinue() {
    const value = freeValue ? parseInt(freeValue, 10) || selected : (selected ?? 20);
    navigation.navigate('Step4', { ...route.params, cigarettesParPaquet: value });
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StepHeader step={3} onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Combien de cigarettes{'\n'}contient votre paquet ?</Text>
        <Text style={styles.subtitle}>Sélectionnez le nombre de cigarettes{'\n'}dans votre paquet habituel.</Text>

        <View style={styles.grid}>
          {OPTIONS.map((opt, i) => {
            const isSelected = opt.value === selected && !freeValue;
            return (
              <TouchableOpacity
                key={i}
                style={[styles.card, isSelected && styles.cardSelected]}
                onPress={() => { setSelected(opt.value); setFreeValue(''); }}
                activeOpacity={0.7}
              >
                {isSelected && (
                  <View style={styles.checkBadge}><Text style={styles.checkMark}>✓</Text></View>
                )}
                <Text style={styles.cardIcon}>{opt.icon}</Text>
                <Text style={[styles.cardValue, isSelected && styles.cardValueSelected]}>{opt.value}</Text>
                <Text style={[styles.cardLabel, isSelected && styles.cardLabelSelected]}>{opt.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <FreeTextCard
          title="Écrire mon propre nombre"
          description="Saisissez le nombre de cigarettes que contient votre paquet."
          placeholder="Ex. 25"
          value={freeValue}
          onChangeText={setFreeValue}
          keyboardType="number-pad"
        />
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
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  card: {
    width: '30%', flexGrow: 1, borderWidth: 1.5, borderColor: colors.grayBorder,
    borderRadius: radius.lg, paddingVertical: spacing.lg, alignItems: 'center',
    backgroundColor: colors.white, position: 'relative', gap: 4,
  },
  cardSelected: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  cardIcon: { fontSize: 36, marginBottom: 4 },
  cardValue: { fontSize: 28, fontWeight: '800', color: colors.black },
  cardValueSelected: { color: colors.primary },
  cardLabel: { fontSize: font.sm, color: colors.gray },
  cardLabelSelected: { color: colors.primaryMid },
  checkBadge: {
    position: 'absolute', top: 10, right: 10,
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  checkMark: { color: colors.white, fontSize: 12, fontWeight: '800' },
  bottom: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: spacing.lg, backgroundColor: colors.white },
});
