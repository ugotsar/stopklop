import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  SafeAreaView, ScrollView, KeyboardAvoidingView, Platform, Dimensions,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, spacing, font, radius } from '../../theme';
import PrimaryButton from '../../components/PrimaryButton';
import NatureBackground from '../../components/NatureBackground';

const { height: SCREEN_H } = Dimensions.get('window');

function check(password) {
  return {
    length: password.length >= 8,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    digit: /[0-9]/.test(password),
  };
}

export default function RegisterScreen({ navigation }) {
  const { t } = useTranslation('onboardingLegacy');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');

  const checks = check(password);

  function handleRegister() {
    if (!email.includes('@')) { setError(t('register.errorInvalidEmail')); return; }
    if (!checks.length || !checks.upper || !checks.digit) { setError(t('register.errorInvalidPassword')); return; }
    if (password !== confirm) { setError(t('register.errorPasswordMismatch')); return; }
    setError('');
    navigation.navigate('Step1', { email });
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <NatureBackground height={SCREEN_H * 0.28} />
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>

        <ScrollView style={styles.sheet} contentContainerStyle={styles.sheetContent} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>{t('register.title')}</Text>
          <Text style={styles.subtitle}>{t('register.subtitle')}</Text>

          <SocialBtn icon="🇬" label={t('register.googleButton')} onPress={() => navigation.navigate('Step1', { email: '' })} />
          <SocialBtn icon="🍎" label={t('register.appleButton')} onPress={() => navigation.navigate('Step1', { email: '' })} />

          <Divider />

          <InputField icon="✉️" placeholder={t('register.emailPlaceholder')} value={email} onChangeText={setEmail} keyboardType="email-address" />
          <InputField icon="🔒" placeholder={t('register.passwordPlaceholder')} value={password} onChangeText={setPassword} secureTextEntry={!showPass} eye onToggleEye={() => setShowPass(v => !v)} showPass={showPass} />
          <InputField icon="🔒" placeholder={t('register.confirmPasswordPlaceholder')} value={confirm} onChangeText={setConfirm} secureTextEntry={!showPass} eye onToggleEye={() => setShowPass(v => !v)} showPass={showPass} />

          <View style={styles.checks}>
            <CheckItem ok={checks.length} label={t('register.checkLength')} />
            <CheckItem ok={checks.lower} label={t('register.checkLower')} />
            <CheckItem ok={checks.upper} label={t('register.checkUpper')} />
            <CheckItem ok={checks.digit} label={t('register.checkDigit')} />
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <PrimaryButton title={t('register.submitButton')} onPress={handleRegister} style={styles.btn} />

          <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.link}>
            <Text style={styles.linkText}>{t('register.haveAccountText')} <Text style={styles.linkBold}>{t('register.loginLink')}</Text></Text>
          </TouchableOpacity>

          <Text style={styles.terms}>
            {t('register.termsPrefix')} <Text style={styles.termsLink}>{t('register.termsLink')}</Text>
            {' '}{t('register.termsMiddle')} <Text style={styles.termsLink}>{t('register.privacyLink')}</Text>.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function SocialBtn({ icon, label, onPress }) {
  return (
    <TouchableOpacity style={styles.socialBtn} onPress={onPress} activeOpacity={0.8}>
      <Text style={styles.socialIcon}>{icon}</Text>
      <Text style={styles.socialLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

function Divider() {
  const { t } = useTranslation('onboardingLegacy');
  return (
    <View style={styles.dividerRow}>
      <View style={styles.divider} /><Text style={styles.dividerText}>{t('shared.dividerOr')}</Text><View style={styles.divider} />
    </View>
  );
}

function InputField({ icon, eye, onToggleEye, showPass, ...props }) {
  return (
    <View style={styles.inputWrap}>
      <Text style={styles.inputIcon}>{icon}</Text>
      <TextInput style={styles.input} autoCapitalize="none" placeholderTextColor={colors.gray} {...props} />
      {eye && (
        <TouchableOpacity onPress={onToggleEye} style={styles.eyeBtn}>
          <Text style={styles.eyeIcon}>{showPass ? '🙈' : '👁️'}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

function CheckItem({ ok, label }) {
  return (
    <View style={styles.checkRow}>
      <Text style={[styles.checkMark, ok && styles.checkMarkOk]}>✓</Text>
      <Text style={styles.checkLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#EAF4EC' },
  backBtn: { position: 'absolute', top: 52, left: 20, zIndex: 10 },
  backText: { fontSize: 22, color: colors.primary, fontWeight: '600' },
  sheet: { flex: 1, backgroundColor: colors.white, borderTopLeftRadius: 28, borderTopRightRadius: 28, marginTop: -20 },
  sheetContent: { paddingHorizontal: spacing.lg, paddingTop: spacing.xl, paddingBottom: 40 },
  title: { fontSize: 28, fontWeight: '800', color: colors.black, textAlign: 'center', marginBottom: spacing.xs },
  subtitle: { fontSize: font.sm, color: colors.gray, textAlign: 'center', lineHeight: 22, marginBottom: spacing.lg },
  socialBtn: {
    flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: colors.grayBorder,
    borderRadius: radius.lg, paddingVertical: 14, paddingHorizontal: spacing.md, marginBottom: spacing.sm,
  },
  socialIcon: { fontSize: 20, marginRight: spacing.sm },
  socialLabel: { fontSize: font.md, fontWeight: '600', color: colors.black },
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: spacing.md },
  divider: { flex: 1, height: 1, backgroundColor: colors.grayBorder },
  dividerText: { marginHorizontal: spacing.md, color: colors.gray, fontSize: font.sm },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: colors.grayBorder,
    borderRadius: radius.lg, paddingHorizontal: spacing.md,
    marginBottom: spacing.sm, height: 52,
  },
  inputIcon: { fontSize: 16, marginRight: spacing.sm },
  input: { flex: 1, fontSize: font.md, color: colors.black },
  eyeBtn: { padding: 4 },
  eyeIcon: { fontSize: 16 },
  checks: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: spacing.md },
  checkRow: { flexDirection: 'row', alignItems: 'center', width: '48%', gap: 4 },
  checkMark: { fontSize: 13, color: colors.grayBorder, fontWeight: '700' },
  checkMarkOk: { color: colors.primary },
  checkLabel: { fontSize: 12, color: colors.gray },
  error: { color: colors.red, fontSize: font.sm, textAlign: 'center', marginBottom: spacing.sm },
  btn: { marginBottom: spacing.md },
  link: { alignItems: 'center', marginBottom: spacing.md },
  linkText: { color: colors.gray, fontSize: font.sm },
  linkBold: { color: colors.primary, fontWeight: '700' },
  terms: { fontSize: 11, color: colors.gray, textAlign: 'center', lineHeight: 18 },
  termsLink: { color: colors.primary },
});
