import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, spacing, font } from '../theme';

export default function StepHeader({ step, total = 7, onBack }) {
  const progress = step / total;
  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.stepLabel}>Étape {step} sur {total}</Text>
        <View style={styles.placeholder} />
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${progress * 100}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
  backBtn: {},
  backArrow: { fontSize: 22, color: colors.primary, fontWeight: '600' },
  stepLabel: { fontSize: font.sm, color: colors.primary, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  placeholder: { width: 22 },
  track: { height: 4, backgroundColor: colors.grayBorder, borderRadius: 99 },
  fill: { height: '100%', backgroundColor: colors.primary, borderRadius: 99 },
});
