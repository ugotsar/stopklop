import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors, radius } from '../theme';

export default function ProgressBar({ step, total = 7 }) {
  const progress = step / total;
  return (
    <View style={styles.track}>
      <View style={[styles.fill, { width: `${progress * 100}%` }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 4,
    backgroundColor: colors.grayBorder,
    borderRadius: radius.full,
    marginHorizontal: 24,
    marginTop: 12,
    marginBottom: 8,
  },
  fill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: radius.full,
  },
});
