import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, TextInput,
} from 'react-native';
import { colors, spacing, font, radius } from '../../theme';
import StepHeader from '../../components/StepHeader';
import PrimaryButton from '../../components/PrimaryButton';
import FreeTextCard from '../../components/FreeTextCard';

const OPTIONS = [8, 9, 10, 11, 12];

export default function Step1Screen({ navigation, route }) {
  const [selected, setSelected] = useState(10);
  const [freeValue, setFreeValue] = useState('');

  function handleContinue() {
    const value = freeValue ? parseInt(freeValue, 10) || selected : selected;
    navigation.navigate('Step2', { ...route.params, consoAvantApp: value });
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StepHeader step={1} onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Combien de cigarettes{'\n'}fumez-vous par jour ?</Text>
        <Text style={styles.subtitle}>Soyez honnête, cela nous aide{'\n'}à personnaliser votre expérience.</Text>

        <View style={styles.list}>
          {OPTIONS.map(n => {
            const isSelected = n === selected && !freeValue;
            return (
              <TouchableOpacity
                key={n}
                style={[styles.card, isSelected && styles.cardSelected]}
                onPress={() => { setSelected(n); setFreeValue(''); }}
                activeOpacity={0.7}
              >
                <Text style={[styles.cardNumber, isSelected && styles.cardNumberSelected]}>{n}</Text>
                {isSelected && <Text style={styles.cardUnit}>cigarettes / jour</Text>}
                {isSelected && (
                  <View style={styles.checkBadge}>
                    <Text style={styles.checkMark}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        <FreeTextCard
          title="Écrire mon propre nombre"
          description="Saisissez le nombre de cigarettes que vous fumez par jour."
          placeholder="Ex. 15"
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
  list: { gap: spacing.sm },
  card: {
    borderWidth: 1.5, borderColor: colors.grayBorder, borderRadius: radius.lg,
    paddingVertical: 18, paddingHorizontal: spacing.md,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.white, position: 'relative',
  },
  cardSelected: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  cardNumber: { fontSize: 22, fontWeight: '600', color: colors.black },
  cardNumberSelected: { color: colors.primary, fontWeight: '800' },
  cardUnit: { fontSize: font.sm, color: colors.primary, marginLeft: spacing.sm, fontWeight: '500' },
  checkBadge: {
    position: 'absolute', right: 14,
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  checkMark: { color: colors.white, fontSize: 14, fontWeight: '800' },
  bottom: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: spacing.lg, backgroundColor: colors.white },
});
