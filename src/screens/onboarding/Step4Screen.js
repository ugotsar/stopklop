import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, spacing, font, radius } from '../../theme';
import { jouerSon } from '../../services/sounds';
import StepHeader from '../../components/StepHeader';
import PrimaryButton from '../../components/PrimaryButton';
import FreeTextCard from '../../components/FreeTextCard';

const OPTION_KEYS = [
  { key: 'lessThanOne', icon: '📅' },
  { key: 'oneToFive', icon: '📅' },
  { key: 'fiveToTen', icon: '📅' },
  { key: 'tenToTwenty', icon: '📅' },
  { key: 'moreThanTwenty', icon: '📅' },
];

export default function Step4Screen({ navigation, route }) {
  const { t } = useTranslation('onboardingLegacy');
  const [selected, setSelected] = useState('');
  const [freeValue, setFreeValue] = useState('');

  const OPTIONS = OPTION_KEYS.map(opt => ({ ...opt, label: t(`step4.options.${opt.key}`) }));

  function handleContinue() {
    jouerSon('onboarding_step');
    const value = freeValue || selected;
    navigation.navigate('Step5', { ...route.params, ancienneteTabac: value });
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StepHeader step={4} onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>{t('step4.title')}</Text>
        <Text style={styles.subtitle}>{t('step4.subtitle')}</Text>

        <View style={styles.list}>
          {OPTIONS.map((opt) => {
            const isSelected = opt.label === selected && !freeValue;
            return (
              <TouchableOpacity
                key={opt.key}
                style={[styles.row, isSelected && styles.rowSelected]}
                onPress={() => { setSelected(opt.label); setFreeValue(''); }}
                activeOpacity={0.7}
              >
                <Text style={[styles.rowIcon, isSelected && styles.rowIconSelected]}>{opt.icon}</Text>
                <Text style={[styles.rowLabel, isSelected && styles.rowLabelSelected]}>{opt.label}</Text>
                <View style={[styles.radio, isSelected && styles.radioSelected]}>
                  {isSelected && <View style={styles.radioDot} />}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <FreeTextCard
          title={t('step4.freeTitle')}
          description={t('step4.freeDescription')}
          placeholder={t('step4.freePlaceholder')}
          value={freeValue}
          onChangeText={setFreeValue}
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
  list: { gap: spacing.sm },
  row: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: colors.grayBorder,
    borderRadius: radius.lg, paddingVertical: 16, paddingHorizontal: spacing.md,
    backgroundColor: colors.white,
  },
  rowSelected: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  rowIcon: { fontSize: 20, marginRight: spacing.md, color: colors.gray },
  rowIconSelected: { color: colors.primary },
  rowLabel: { flex: 1, fontSize: font.md, color: colors.black },
  rowLabelSelected: { color: colors.primary, fontWeight: '700' },
  radio: {
    width: 22, height: 22, borderRadius: 11, borderWidth: 2,
    borderColor: colors.grayBorder, alignItems: 'center', justifyContent: 'center',
  },
  radioSelected: { borderColor: colors.primary, backgroundColor: colors.primary },
  radioDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.white },
  bottom: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: spacing.lg, backgroundColor: colors.white },
});

