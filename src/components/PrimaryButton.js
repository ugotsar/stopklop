import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { colors, radius, font, spacing } from '../theme';

export default function PrimaryButton({ title, onPress, loading, style }) {
  return (
    <TouchableOpacity style={[styles.btn, style]} onPress={onPress} activeOpacity={0.85} disabled={loading}>
      {loading
        ? <ActivityIndicator color={colors.white} />
        : <Text style={styles.label}>{title}</Text>
      }
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    backgroundColor: colors.primary,
    borderRadius: radius.xl,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    color: colors.white,
    fontSize: font.md,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
