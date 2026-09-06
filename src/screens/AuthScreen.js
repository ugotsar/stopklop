import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  SafeAreaView, ScrollView, ActivityIndicator, Image, TextInput,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  createAccountWithEmail, signInAsGuest, signInWithApple,
  signInWithEmail, useGoogleAuth,
} from '../services/authService';
import { colors, spacing, font } from '../theme';

// Visuel de la page 1 de l'onboarding (proposition n°2) : illustration figée
// (anneau 68% + info-bulles), pas de données réelles — l'utilisateur n'a pas
// encore de compte à ce stade. Icônes fournies en PNG transparents pour
// coller exactement à la maquette (glyphe Google/Apple/e-mail réels).
const HERO = require('../../assets/auth-hero/01-illustration-complete.png');
const ICON_GOOGLE = require('../../assets/auth-hero/06-icone-google.png');
const ICON_APPLE  = require('../../assets/auth-hero/07-icone-apple.png');
const ICON_EMAIL  = require('../../assets/auth-hero/08-icone-email.png');

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

        <Text style={s.logo}>Stopklop</Text>

        <Image source={HERO} style={s.hero} resizeMode="contain" />

        <Text style={s.headline}>{t('hero.headline')}</Text>
        <Text style={s.subtitle}>{t('hero.subtitle')}</Text>

        <View style={s.chipsRow}>
          <View style={s.chip}>
            <Text style={s.chipValue}>{t('hero.progressValue')}</Text>
            <Text style={s.chipLabel}>{t('hero.progressLabel')}</Text>
          </View>
          <View style={s.chip}>
            <Text style={s.chipValue}>{t('hero.savingsValue')}</Text>
            <Text style={s.chipLabel}>{t('hero.savingsLabel')}</Text>
          </View>
          <View style={s.chip}>
            <Text style={s.chipValue}>{t('hero.paceValue')}</Text>
            <Text style={s.chipLabel}>{t('hero.paceLabel')}</Text>
          </View>
        </View>

        <View style={s.btnContainer}>
          {loading || google.loading ? (
            <ActivityIndicator size="large" color={colors.primary} />
          ) : (
            <>
              <TouchableOpacity
                style={[s.btnGoogle, (!google.request || !google.configured) && s.btnDisabled]}
                disabled={!google.request || !google.configured}
                onPress={handleGoogle}
              >
                <Image source={ICON_GOOGLE} style={s.btnIcon} resizeMode="contain" />
                <Text style={s.btnGoogleText}>{t('google.button')}</Text>
              </TouchableOpacity>
              {!google.configured && (
                <Text style={s.providerHint}>{t('google.unavailable')}</Text>
              )}

              <TouchableOpacity style={s.btnApple} onPress={handleApple}>
                <Image source={ICON_APPLE} style={s.btnIcon} resizeMode="contain" />
                <Text style={s.btnAppleText}>{t('apple.button')}</Text>
              </TouchableOpacity>

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

        {/* Mode invité — outil de développement, jamais montré à un vrai
            utilisateur. Retiré définitivement au moment du build EAS de sortie. */}
        {__DEV__ && (
          <TouchableOpacity onPress={handleGuest} style={s.devGuest}>
            <Text style={s.devGuestText}>{t('guest.button')} (dev)</Text>
          </TouchableOpacity>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:      { flex: 1, backgroundColor: '#FBF8EF' },
  container: { flexGrow: 1, paddingHorizontal: spacing.xl, paddingTop: spacing.lg, paddingBottom: spacing.xxl, alignItems: 'center' },

  logo: { alignSelf: 'flex-start', fontSize: 26, fontWeight: '800', color: '#197A47', marginBottom: spacing.sm },

  hero: { width: '100%', height: 220, marginVertical: spacing.sm },

  headline: { fontSize: 26, fontWeight: '800', color: '#0B4B31', textAlign: 'center', lineHeight: 32, marginTop: spacing.sm },
  subtitle: { fontSize: font.md, color: colors.gray, textAlign: 'center', lineHeight: 22, marginTop: 8, marginBottom: spacing.lg },

  chipsRow: { flexDirection: 'row', gap: 8, width: '100%', marginBottom: spacing.lg },
  chip: {
    flex: 1, backgroundColor: '#EAF5ED', borderRadius: 16,
    paddingVertical: 12, alignItems: 'center', gap: 2,
  },
  chipValue: { fontSize: 16, fontWeight: '800', color: '#197A47' },
  chipLabel: { fontSize: 10, fontWeight: '700', color: '#5C8A6E', letterSpacing: 0.3 },

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
  providerHint:  { color: colors.gray, fontSize: 11, textAlign: 'center', marginTop: -5 },

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

  devGuest: { marginTop: spacing.lg, alignItems: 'center' },
  devGuestText: { color: '#B0B7B2', fontSize: 11, textDecorationLine: 'underline' },

  // ── Formulaire e-mail ──────────────────────────────────────────────────────
  emailContainer: { flexGrow: 1, paddingHorizontal: spacing.xl, justifyContent: 'center', gap: 12 },
  emailTitle: { fontSize: 20, color: '#0B4B31', fontWeight: '800', textAlign: 'center', marginBottom: 4 },
  emailInput: { borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 14, backgroundColor: colors.white, paddingHorizontal: 14, paddingVertical: 13, color: colors.black, fontSize: font.md },
  btnEmailSolid: { backgroundColor: '#197A47', borderRadius: 30, paddingVertical: 14, alignItems: 'center' },
  btnEmailSolidText: { color: '#fff', fontSize: font.md, fontWeight: '700' },
  emailLink: { color: '#197A47', fontSize: font.sm, fontWeight: '700', textAlign: 'center', paddingVertical: 4 },
  emailBack: { color: colors.gray, fontSize: font.sm, textAlign: 'center', paddingVertical: 4 },
});
