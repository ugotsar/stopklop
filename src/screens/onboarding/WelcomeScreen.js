import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Dimensions } from 'react-native';
import { colors, spacing, font, radius } from '../../theme';
import PrimaryButton from '../../components/PrimaryButton';
import NatureBackground from '../../components/NatureBackground';

const { height: SCREEN_H } = Dimensions.get('window');

export default function WelcomeScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.bgContainer}>
        <NatureBackground height={SCREEN_H * 0.62} />
      </View>

      <View style={styles.bottomCard}>
        <Text style={styles.title}>
          Bienvenue sur{'\n'}
          <Text style={styles.titleGreen}>Stopklop</Text>
        </Text>
        <Text style={styles.subtitle}>
          Votre compagnon pour arrêter{'\n'}de fumer et reprendre le contrôle{'\n'}de votre vie.
        </Text>

        <View style={styles.dots}>
          <View style={[styles.dot, styles.dotActive]} />
          <View style={styles.dot} />
          <View style={styles.dot} />
        </View>

        <PrimaryButton title="Commencer  →" onPress={() => navigation.navigate('Register')} />
        <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.loginLink}>
          <Text style={styles.loginText}>J'ai déjà un compte</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#EAF4EC' },
  bgContainer: { position: 'absolute', top: 0, left: 0, right: 0 },
  bottomCard: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: colors.white,
    borderTopLeftRadius: 32, borderTopRightRadius: 32,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  title: { fontSize: 32, fontWeight: '800', color: colors.black, textAlign: 'center', lineHeight: 42 },
  titleGreen: { color: colors.primary },
  subtitle: { fontSize: font.md, color: colors.gray, textAlign: 'center', lineHeight: 26 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginVertical: spacing.xs },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.grayBorder },
  dotActive: { width: 20, backgroundColor: colors.primary },
  loginLink: { alignItems: 'center', paddingTop: spacing.xs },
  loginText: { color: colors.gray, fontSize: font.md },
});
