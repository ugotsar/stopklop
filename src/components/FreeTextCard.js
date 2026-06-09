import React from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, spacing, font, radius } from '../theme';

export default function FreeTextCard({ title, description, placeholder, value, onChangeText, suffix, keyboardType = 'default' }) {
  return (
    <>
      <View style={styles.dividerRow}>
        <View style={styles.divider} />
        <Text style={styles.dividerText}>ou</Text>
        <View style={styles.divider} />
      </View>
      <View style={styles.card}>
        <View style={styles.iconCircle}>
          <Text style={styles.icon}>✏️</Text>
        </View>
        <View style={styles.textBlock}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.description}>{description}</Text>
        </View>
        <View style={styles.inputWrap}>
          <TextInput
            style={styles.input}
            placeholder={placeholder}
            placeholderTextColor={colors.gray}
            value={value}
            onChangeText={onChangeText}
            keyboardType={keyboardType}
          />
          {suffix ? <Text style={styles.suffix}>{suffix}</Text> : null}
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: spacing.md },
  divider: { flex: 1, height: 1, backgroundColor: colors.grayBorder },
  dividerText: { marginHorizontal: spacing.md, color: colors.gray, fontSize: font.sm },
  card: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: colors.grayBorder,
    borderRadius: radius.lg, padding: spacing.md, gap: spacing.sm,
    backgroundColor: colors.white,
  },
  iconCircle: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.primaryLight,
    alignItems: 'center', justifyContent: 'center',
  },
  icon: { fontSize: 18 },
  textBlock: { flex: 1 },
  title: { fontSize: font.sm, fontWeight: '700', color: colors.black, marginBottom: 2 },
  description: { fontSize: 12, color: colors.gray, lineHeight: 16 },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: colors.grayBorder,
    borderRadius: radius.sm, paddingHorizontal: spacing.sm, minWidth: 80,
  },
  input: { fontSize: font.sm, color: colors.black, paddingVertical: 8, minWidth: 60, textAlign: 'center' },
  suffix: { fontSize: font.sm, color: colors.gray, marginLeft: 2 },
});
