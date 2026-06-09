import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { colors, spacing, font } from '../theme';

export default function DashboardScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.emoji}>🌿</Text>
        <Text style={styles.title}>Bienvenue !</Text>
        <Text style={styles.subtitle}>Votre parcours commence maintenant.{'\n'}Dashboard en cours de construction.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.white },
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.lg },
  emoji: { fontSize: 72, marginBottom: spacing.lg },
  title: { fontSize: 32, fontWeight: '800', color: colors.black, marginBottom: spacing.sm },
  subtitle: { fontSize: font.md, color: colors.gray, textAlign: 'center', lineHeight: 26 },
});
