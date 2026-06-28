import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  SafeAreaView, ActivityIndicator, Platform,
} from 'react-native';
import { signInAsGuest } from '../services/authService';
import { colors, spacing, font } from '../theme';

export default function AuthScreen() {
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  async function handleGuest() {
    try {
      setLoading(true);
      setError(null);
      await signInAsGuest();
    } catch (e) {
      setError('Erreur de connexion. Réessaie.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.container}>

        <View style={s.hero}>
          <Text style={s.logo}>🚭</Text>
          <Text style={s.appName}>Stopklop</Text>
          <Text style={s.tagline}>Arrête de fumer, un jour à la fois.</Text>
        </View>

        <View style={s.btnContainer}>
          {loading ? (
            <ActivityIndicator size="large" color={colors.primary} />
          ) : (
            <>
              {/* Boutons Google + Apple — activés sur build natif EAS */}
              <TouchableOpacity style={[s.btnGoogle, s.btnDisabled]} disabled>
                <Text style={s.btnGoogleIcon}>G</Text>
                <Text style={[s.btnGoogleText, { color: '#999' }]}>Continuer avec Google</Text>
              </TouchableOpacity>

              {Platform.OS === 'ios' && (
                <TouchableOpacity style={[s.btnAppleCustom, s.btnDisabled]} disabled>
                  <Text style={{ color: '#999', fontSize: font.md, fontWeight: '600' }}>Continuer avec Apple</Text>
                </TouchableOpacity>
              )}

              <View style={s.divider}>
                <View style={s.divLine} />
                <Text style={s.divText}>ou</Text>
                <View style={s.divLine} />
              </View>

              {/* Mode invité — disponible dans Expo Go */}
              <TouchableOpacity style={s.btnGuest} onPress={handleGuest}>
                <Text style={s.btnGuestText}>Continuer sans compte</Text>
              </TouchableOpacity>
            </>
          )}
          {error && <Text style={s.errorText}>{error}</Text>}
        </View>

        <Text style={s.legal}>
          En continuant, tu acceptes nos{' '}
          <Text style={s.legalLink}>CGU</Text> et notre{' '}
          <Text style={s.legalLink}>Politique de confidentialité</Text>.
        </Text>

      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: colors.white },
  container:    { flex: 1, paddingHorizontal: spacing.xl, justifyContent: 'space-between', paddingVertical: spacing.xxl },
  hero:         { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  logo:         { fontSize: 72 },
  appName:      { fontSize: 32, fontWeight: '900', color: colors.primary },
  tagline:      { fontSize: font.md, color: colors.gray, textAlign: 'center' },
  btnContainer: { gap: 12, marginBottom: spacing.xl },
  btnGoogle: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, backgroundColor: colors.white,
    borderWidth: 1.5, borderColor: '#E5E7EB',
    borderRadius: 30, paddingVertical: 14,
  },
  btnGoogleIcon: { fontSize: 18, fontWeight: '700', color: '#4285F4' },
  btnGoogleText: { fontSize: font.md, fontWeight: '600', color: colors.black },
  btnAppleCustom: { height: 50, width: '100%', backgroundColor: '#000', borderRadius: 30, alignItems: 'center', justifyContent: 'center' },
  btnDisabled:   { opacity: 0.35 },
  divider:       { flexDirection: 'row', alignItems: 'center', gap: 10 },
  divLine:       { flex: 1, height: 1, backgroundColor: '#E5E7EB' },
  divText:       { fontSize: 12, color: colors.gray },
  btnGuest: {
    backgroundColor: colors.primary, borderRadius: 30,
    paddingVertical: 14, alignItems: 'center',
  },
  btnGuestText:  { color: '#fff', fontSize: font.md, fontWeight: '700' },
  errorText:     { color: '#EF4444', fontSize: font.sm, textAlign: 'center', marginTop: 8 },
  legal:         { fontSize: 11, color: colors.gray, textAlign: 'center', lineHeight: 16 },
  legalLink:     { color: colors.primary, fontWeight: '600' },
});
