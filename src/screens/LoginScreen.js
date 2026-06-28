import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  SafeAreaView, ActivityIndicator, Platform,
} from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import { useGoogleAuth, signInWithApple } from '../services/authService';
import { colors, spacing, font, radius } from '../theme';

export default function LoginScreen() {
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);
  const { request, signInWithGoogle } = useGoogleAuth();

  async function handleGoogle() {
    try {
      setLoading(true);
      setError(null);
      await signInWithGoogle();
    } catch (e) {
      setError('Connexion Google échouée. Réessaie.');
    } finally {
      setLoading(false);
    }
  }

  async function handleApple() {
    try {
      setLoading(true);
      setError(null);
      await signInWithApple();
    } catch (e) {
      if (e.code !== 'ERR_REQUEST_CANCELED') {
        setError('Connexion Apple échouée. Réessaie.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.container}>

        {/* Logo / titre */}
        <View style={s.hero}>
          <Text style={s.logo}>🚭</Text>
          <Text style={s.appName}>Stopklop</Text>
          <Text style={s.tagline}>Arrête de fumer, un jour à la fois.</Text>
        </View>

        {/* Boutons connexion */}
        <View style={s.btnContainer}>

          {loading ? (
            <ActivityIndicator size="large" color={colors.primary} />
          ) : (
            <>
              {/* Google */}
              <TouchableOpacity
                style={s.btnGoogle}
                onPress={handleGoogle}
                disabled={!request}
              >
                <Text style={s.btnGoogleIcon}>G</Text>
                <Text style={s.btnGoogleText}>Continuer avec Google</Text>
              </TouchableOpacity>

              {/* Apple — affiché seulement sur iOS */}
              {Platform.OS === 'ios' && (
                <AppleAuthentication.AppleAuthenticationButton
                  buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
                  buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
                  cornerRadius={30}
                  style={s.btnApple}
                  onPress={handleApple}
                />
              )}
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
  safe:      { flex: 1, backgroundColor: colors.white },
  container: { flex: 1, paddingHorizontal: spacing.xl, justifyContent: 'space-between', paddingVertical: spacing.xxl },
  hero: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  logo:    { fontSize: 72 },
  appName: { fontSize: 32, fontWeight: '900', color: colors.primary },
  tagline: { fontSize: font.md, color: colors.gray, textAlign: 'center' },
  btnContainer: { gap: 12, marginBottom: spacing.xl },
  btnGoogle: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, backgroundColor: colors.white,
    borderWidth: 1.5, borderColor: '#E5E7EB',
    borderRadius: 30, paddingVertical: 14,
  },
  btnGoogleIcon: { fontSize: 18, fontWeight: '700', color: '#4285F4' },
  btnGoogleText: { fontSize: font.md, fontWeight: '600', color: colors.black },
  btnApple:  { height: 50, width: '100%' },
  errorText: { color: '#EF4444', fontSize: font.sm, textAlign: 'center', marginTop: 8 },
  legal:     { fontSize: 11, color: colors.gray, textAlign: 'center', lineHeight: 16 },
  legalLink: { color: colors.primary, fontWeight: '600' },
});
