import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, TextInput,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, spacing, font, radius } from '../../theme';
import { jouerSon } from '../../services/sounds';
import StepHeader from '../../components/StepHeader';
import PrimaryButton from '../../components/PrimaryButton';
import FreeTextCard from '../../components/FreeTextCard';

const OPTIONS = [
  { value: 20, icon: '🚬' },
  { value: 25, icon: '🚬' },
  { value: 30, icon: '🚬' },
];

export default function Step3Screen({ navigation, route }) {
  const { t } = useTranslation('onboardingLegacy');
  const [selected, setSelected] = useState(20);
  const [freeValue, setFreeValue] = useState('');

  function handleContinue() {
    jouerSon('onboarding_step');
    const value = freeValue ? parseInt(freeValue, 10) || selected : (selected ?? 20);
    navigation.navigate('Step4', { ...route.params, cigarettesParPaquet: value });
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StepHeader step={3} onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>{t('step3.title')}</Text>
        <Text style={styles.subtitle}>{t('step3.subtitle')}</Text>

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
                <Text style={[styles.cardLabel, isSelected && styles.cardLabelSelected]}>{t('step3.unitLabel')}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <FreeTextCard
          title={t('step3.freeTitle')}
          description={t('step3.freeDescription')}
          placeholder={t('step3.freePlaceholder')}
          value={freeValue}
          onChangeText={setFreeValue}
          keyboardType="number-pad"
        />
      </ScrollView>

      <View style={styles.bottom}>
        <PrimaryButton title={t('common:continue')} onPress={handleContinue} />
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

