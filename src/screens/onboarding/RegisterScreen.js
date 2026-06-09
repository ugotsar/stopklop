import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  SafeAreaView, ScrollView, KeyboardAvoidingView, Platform, Dimensions,
} from 'react-native';
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
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');

  const checks = check(password);

  function handleRegister() {
    if (!email.includes('@')) { setError('Email invalide.'); return; }
    if (!checks.length || !checks.upper || !checks.digit) { setError('Mot de passe invalide.'); return; }
    if (password !== confirm) { setError('Les mots de passe ne correspondent pas.'); return; }
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
          <Text style={styles.title}>S'inscrire</Text>
          <Text style={styles.subtitle}>Créez votre compte pour commencer{'\n'}votre parcours vers une vie sans tabac.</Text>

          <SocialBtn icon="🇬" label="S'inscrire avec Google" onPress={() => navigation.navigate('Step1', { email: '' })} />
          <SocialBtn icon="🍎" label="S'inscrire avec Apple" onPress={() => navigation.navigate('Step1', { email: '' })} />

          <Divider />

          <InputField icon="✉️" placeholder="Adresse e-mail" value={email} onChangeText={setEmail} keyboardType="email-address" />
          <InputField icon="🔒" placeholder="Mot de passe" value={password} onChangeText={setPassword} secureTextEntry={!showPass} eye onToggleEye={() => setShowPass(v => !v)} showPass={showPass} />
          <InputField icon="🔒" placeholder="Confirmer le mot de passe" value={confirm} onChangeText={setConfirm} secureTextEntry={!showPass} eye onToggleEye={() => setShowPass(v => !v)} showPass={showPass} />

          <View style={styles.checks}>
            <CheckItem ok={checks.length} label="8 caractères minimum" />
            <CheckItem ok={checks.lower} label="Au moins une minuscule" />
            <CheckItem ok={checks.upper} label="Au moins une majuscule" />
            <CheckItem ok={checks.digit} label="Au moins un chiffre" />
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <PrimaryButton title="S'inscrire" onPress={handleRegister} style={styles.btn} />

          <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.link}>
            <Text style={styles.linkText}>Vous avez déjà un compte ? <Text style={styles.linkBold}>Se connecter</Text></Text>
          </TouchableOpacity>

          <Text style={styles.terms}>
            En vous inscrivant, vous acceptez nos <Text style={styles.termsLink}>Conditions d'utilisation</Text>
            {' '}et notre <Text style={styles.termsLink}>Politique de confidentialité</Text>.
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
  return (
    <View style={styles.dividerRow}>
      <View style={styles.divider} /><Text style={styles.dividerText}>ou</Text><View style={styles.divider} />
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
