import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  SafeAreaView, ActivityIndicator, Platform, TextInput,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  createAccountWithEmail, signInAsGuest, signInWithApple,
  signInWithEmail, useGoogleAuth,
} from '../services/authService';
import { colors, spacing, font } from '../theme';

export default function AuthScreen() {
  const { t } = useTranslation('authMain');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);
  const [emailMode, setEmailMode] = useState(null); // 'create' | 'login'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const google = useGoogleAuth();

  async function handleGuest() {
    try {
      setLoading(true);
      setError(null);
      await signInAsGuest();
    } catch (e) {
      setError(t('errors.guest'));
    } finally {
      setLoading(false);
    }
  }

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

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.container}>

        <View style={s.hero}>
          <Text style={s.logo}>🚭</Text>
          <Text style={s.appName}>Stopklop</Text>
          <Text style={s.tagline}>{t('tagline')}</Text>
        </View>

        <View style={s.btnContainer}>
          {loading || google.loading ? (
            <ActivityIndicator size="large" color={colors.primary} />
          ) : emailMode ? (
            <>
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
              <TouchableOpacity style={s.btnGuest} onPress={handleEmail}>
                <Text style={s.btnGuestText}>{t(emailMode === 'create' ? 'email.createButton' : 'email.loginButton')}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => { setEmailMode(emailMode === 'create' ? 'login' : 'create'); setError(null); }}>
                <Text style={s.emailLink}>{t(emailMode === 'create' ? 'email.alreadyHaveAccount' : 'email.createInstead')}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => { setEmailMode(null); setError(null); }}>
                <Text style={s.emailBack}>{t('email.back')}</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity
                style={[s.btnGoogle, (!google.request || !google.configured) && s.btnDisabled]}
                disabled={!google.request || !google.configured}
                onPress={handleGoogle}
              >
                <Text style={s.btnGoogleIcon}>G</Text>
                <Text style={s.btnGoogleText}>{t('google.button')}</Text>
              </TouchableOpacity>
              {!google.configured && (
                <Text style={s.providerHint}>{t('google.unavailable')}</Text>
              )}

              {Platform.OS === 'ios' && (
                <TouchableOpacity style={s.btnAppleCustom} onPress={handleApple}>
                  <Text style={{ color: '#fff', fontSize: font.md, fontWeight: '600' }}>{t('apple.button')}</Text>
                </TouchableOpacity>
              )}

              <View style={s.divider}>
                <View style={s.divLine} />
                <Text style={s.divText}>{t('divider.or')}</Text>
                <View style={s.divLine} />
              </View>

              <TouchableOpacity style={s.btnEmail} onPress={() => setEmailMode('create')}>
                <Text style={s.btnEmailText}>{t('email.createEntry')}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setEmailMode('login')}>
                <Text style={s.emailLink}>{t('email.loginEntry')}</Text>
              </TouchableOpacity>

              {/* Mode invité — disponible dans Expo Go */}
              <TouchableOpacity style={s.btnGuest} onPress={handleGuest}>
                <Text style={s.btnGuestText}>{t('guest.button')}</Text>
              </TouchableOpacity>
            </>
          )}
          {(error || google.error) && <Text style={s.errorText}>{error ?? t('errors.google')}</Text>}
        </View>

        <Text style={s.legal}>
          {t('legal.prefix')}{' '}
          <Text style={s.legalLink}>{t('legal.terms')}</Text>{' '}
          {t('legal.middle')}{' '}
          <Text style={s.legalLink}>{t('legal.privacy')}</Text>.
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
  providerHint:  { color: colors.gray, fontSize: 11, textAlign: 'center', marginTop: -5 },
  divider:       { flexDirection: 'row', alignItems: 'center', gap: 10 },
  divLine:       { flex: 1, height: 1, backgroundColor: '#E5E7EB' },
  divText:       { fontSize: 12, color: colors.gray },
  btnGuest: {
    backgroundColor: colors.primary, borderRadius: 30,
    paddingVertical: 14, alignItems: 'center',
  },
  btnGuestText:  { color: '#fff', fontSize: font.md, fontWeight: '700' },
  btnEmail: {
    backgroundColor: colors.primaryLight, borderRadius: 30,
    paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: '#C8E2CF',
  },
  btnEmailText: { color: colors.primaryDeep, fontSize: font.md, fontWeight: '700' },
  emailTitle: { fontSize: 18, color: colors.black, fontWeight: '800', textAlign: 'center', marginBottom: 2 },
  emailInput: { borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 14, backgroundColor: colors.white, paddingHorizontal: 14, paddingVertical: 13, color: colors.black, fontSize: font.md },
  emailLink: { color: colors.primary, fontSize: font.sm, fontWeight: '700', textAlign: 'center', paddingVertical: 4 },
  emailBack: { color: colors.gray, fontSize: font.sm, textAlign: 'center', paddingVertical: 4 },
  errorText:     { color: '#EF4444', fontSize: font.sm, textAlign: 'center', marginTop: 8 },
  legal:         { fontSize: 11, color: colors.gray, textAlign: 'center', lineHeight: 16 },
  legalLink:     { color: colors.primary, fontWeight: '600' },
});
