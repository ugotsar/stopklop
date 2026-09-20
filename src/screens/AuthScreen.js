import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  SafeAreaView, ScrollView, ActivityIndicator, Image, TextInput,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  createAccountWithEmail, signInWithApple,
  signInWithEmail, useAppleAuthAvailable, useGoogleAuth,
} from '../services/authService';
import { colors, spacing, font } from '../theme';
import KlopWave from '../components/KlopWave';

// Première page (variante A « Klop t'accueille ») : Klop fait coucou et parle
// en premier, sans aucun chiffre. Icônes Google/Apple/e-mail en PNG transparents.
const ICON_GOOGLE = require('../../assets/auth-hero/06-icone-google.png');
const ICON_APPLE  = require('../../assets/auth-hero/07-icone-apple.png');
const ICON_EMAIL  = require('../../assets/auth-hero/08-icone-email.png');

export default function AuthScreen({ navigation }) {
  const { t } = useTranslation('authMain');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);
  const [emailMode, setEmailMode] = useState(null); // 'create' | 'login'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const google = useGoogleAuth();
  const appleAvailable = useAppleAuthAvailable();

  async function handleGoogle() {
    setError(null);
    await google.signInWithGoogle();
  }

  async function handleApple() {
    try {
      setLoading(true);
      setError(null);
      await signInWithApple();
    } catch (_) {
      setError(t('errors.apple'));
    } finally {
      setLoading(false);
    }
  }

  async function handleEmail() {
    const normalizedEmail = email.trim();
    if (!normalizedEmail || !normalizedEmail.includes('@') || !password) {
      setError(t('errors.emailInvalid'));
      return;
    }
    if (emailMode === 'create' && password.length < 8) {
      setError(t('errors.passwordShort'));
      return;
    }
    try {
      setLoading(true);
      setError(null);
      if (emailMode === 'create') await createAccountWithEmail(normalizedEmail, password);
      else await signInWithEmail(normalizedEmail, password);
    } catch (_) {
      setError(t('errors.email'));
    } finally {
      setLoading(false);
    }
  }

  // ── Formulaire e-mail (créer / se connecter) ───────────────────────────────
  if (emailMode) {
    return (
      <SafeAreaView style={s.safe}>
        <ScrollView contentContainerStyle={s.emailContainer} keyboardShouldPersistTaps="handled">
          <Text style={s.emailTitle}>{t(emailMode === 'create' ? 'email.createTitle' : 'email.loginTitle')}</Text>
          <TextInput
            style={s.emailInput}
            value={email}
            onChangeText={setEmail}
            placeholder={t('email.emailPlaceholder')}
            placeholderTextColor={colors.gray}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            textContentType="emailAddress"
          />
          <TextInput
            style={s.emailInput}
            value={password}
            onChangeText={setPassword}
            placeholder={t('email.passwordPlaceholder')}
            placeholderTextColor={colors.gray}
            secureTextEntry
            textContentType={emailMode === 'create' ? 'newPassword' : 'password'}
          />
          {loading ? (
            <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: spacing.md }} />
          ) : (
            <TouchableOpacity style={s.btnEmailSolid} onPress={handleEmail}>
              <Text style={s.btnEmailSolidText}>{t(emailMode === 'create' ? 'email.createButton' : 'email.loginButton')}</Text>
            </TouchableOpacity>
          )}
          {error && <Text style={s.errorText}>{error}</Text>}
          <TouchableOpacity onPress={() => { setEmailMode(emailMode === 'create' ? 'login' : 'create'); setError(null); }}>
            <Text style={s.emailLink}>{t(emailMode === 'create' ? 'email.alreadyHaveAccount' : 'email.createInstead')}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => { setEmailMode(null); setError(null); }}>
            <Text style={s.emailBack}>{t('email.back')}</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── Page principale (proposition n°2) ──────────────────────────────────────
  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.container} showsVerticalScrollIndicator={false}>

        <Text style={s.logo}>stopklop</Text>

        <View style={s.hero}>
          <View style={s.bubble}>
            <Text style={s.bubbleText}>{t('hero.bubble')}</Text>
            <View style={s.bubbleTail} />
          </View>
          <KlopWave width={170} />
        </View>

        <Text style={s.headline}>{t('hero.headline')}</Text>
        <Text style={s.subtitle}>{t('hero.subtitle')}</Text>

        <View style={s.spacer} />

        <View style={s.btnContainer}>
          {loading || google.loading ? (
            <ActivityIndicator size="large" color={colors.primary} />
          ) : (
            <>
              {/* Masqué tant que les identifiants Google (EXPO_PUBLIC_GOOGLE_*) ne sont pas renseignés. */}
              {google.configured && (
                <TouchableOpacity
                  style={[s.btnGoogle, !google.request && s.btnDisabled]}
                  disabled={!google.request}
                  onPress={handleGoogle}
                >
                  <Image source={ICON_GOOGLE} style={s.btnIcon} resizeMode="contain" />
                  <Text style={s.btnGoogleText}>{t('google.button')}</Text>
                </TouchableOpacity>
              )}

              {appleAvailable && (
                <TouchableOpacity style={s.btnApple} onPress={handleApple}>
                  <Image source={ICON_APPLE} style={s.btnIcon} resizeMode="contain" />
                  <Text style={s.btnAppleText}>{t('apple.button')}</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity style={s.btnEmail} onPress={() => setEmailMode('create')}>
                <Image source={ICON_EMAIL} style={s.btnIcon} resizeMode="contain" />
                <Text style={s.btnEmailText}>{t('email.createEntry')}</Text>
              </TouchableOpacity>
            </>
          )}
          {(error || google.error) && <Text style={s.errorText}>{error ?? t('errors.google')}</Text>}
        </View>

        <TouchableOpacity onPress={() => setEmailMode('login')} style={s.footerRow}>
          <Text style={s.footerQuestion}>{t('footer.question')} </Text>
          <Text style={s.footerCta}>{t('footer.cta')}</Text>
        </TouchableOpacity>

        <Text style={s.legal}>
          {t('legal.prefix')}{' '}
          <Text style={s.legalLink}>{t('legal.terms')}</Text>{' '}
          {t('legal.middle')}{' '}
          <Text style={s.legalLink}>{t('legal.privacy')}</Text>.
        </Text>

      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:      { flex: 1, backgroundColor: '#FBF8EF' },
  container: { flexGrow: 1, paddingHorizontal: spacing.xl, paddingTop: spacing.lg, paddingBottom: spacing.xxl, alignItems: 'center' },

  logo: { alignSelf: 'flex-start', fontSize: 22, fontWeight: '900', color: '#197A47', letterSpacing: -0.3 },

  hero: { alignItems: 'center', marginTop: spacing.lg },
  bubble: {
    backgroundColor: colors.white, borderWidth: 1.5, borderColor: '#E4DEC9', borderRadius: 18,
    paddingVertical: 10, paddingHorizontal: 16, marginBottom: 12,
  },
  bubbleText: { fontSize: 15, fontWeight: '700', color: '#1E5530', textAlign: 'center', lineHeight: 20 },
  bubbleTail: {
    position: 'absolute', bottom: -8, left: '50%', marginLeft: -7, width: 14, height: 14,
    backgroundColor: colors.white, borderRightWidth: 1.5, borderBottomWidth: 1.5, borderColor: '#E4DEC9',
    transform: [{ rotate: '45deg' }],
  },

  headline: { fontSize: 28, fontWeight: '900', color: '#1E5530', textAlign: 'center', lineHeight: 33, marginTop: spacing.md },
  subtitle: { fontSize: font.md, color: colors.gray, textAlign: 'center', lineHeight: 22, marginTop: 8 },

  spacer: { flexGrow: 1, minHeight: spacing.lg },

  btnContainer: { gap: 12, width: '100%' },
  btnIcon: { width: 22, height: 22 },

  btnGoogle: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, backgroundColor: colors.white,
    borderWidth: 1.5, borderColor: '#E5E7EB',
    borderRadius: 30, paddingVertical: 14,
  },
  btnGoogleText: { fontSize: font.md, fontWeight: '700', color: '#0B4B31' },
  btnDisabled:   { opacity: 0.35 },

  btnApple: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, height: 50, width: '100%', backgroundColor: '#0B0B0B', borderRadius: 30,
  },
  btnAppleText: { color: '#fff', fontSize: font.md, fontWeight: '700' },

  btnEmail: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, backgroundColor: '#197A47', borderRadius: 30, paddingVertical: 14,
  },
  btnEmailText: { color: '#fff', fontSize: font.md, fontWeight: '700' },

  footerRow: { flexDirection: 'row', justifyContent: 'center', paddingTop: spacing.md },
  footerQuestion: { color: colors.gray, fontSize: font.sm },
  footerCta: { color: '#197A47', fontSize: font.sm, fontWeight: '800' },

  legal: { fontSize: 11, color: colors.gray, textAlign: 'center', lineHeight: 16, marginTop: spacing.md },
  legalLink: { color: '#197A47', fontWeight: '600' },

  errorText: { color: '#EF4444', fontSize: font.sm, textAlign: 'center', marginTop: 8 },

  // ── Formulaire e-mail ──────────────────────────────────────────────────────
  emailContainer: { flexGrow: 1, paddingHorizontal: spacing.xl, justifyContent: 'center', gap: 12 },
  emailTitle: { fontSize: 20, color: '#0B4B31', fontWeight: '800', textAlign: 'center', marginBottom: 4 },
  emailInput: { borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 14, backgroundColor: colors.white, paddingHorizontal: 14, paddingVertical: 13, color: colors.black, fontSize: font.md },
  btnEmailSolid: { backgroundColor: '#197A47', borderRadius: 30, paddingVertical: 14, alignItems: 'center' },
  btnEmailSolidText: { color: '#fff', fontSize: font.md, fontWeight: '700' },
  emailLink: { color: '#197A47', fontSize: font.sm, fontWeight: '700', textAlign: 'center', paddingVertical: 4 },
  emailBack: { color: colors.gray, fontSize: font.sm, textAlign: 'center', paddingVertical: 4 },
});
