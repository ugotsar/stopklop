import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  SafeAreaView, ScrollView, KeyboardAvoidingView, Platform, Dimensions,
} from 'react-native';
import { colors, spacing, font, radius } from '../../theme';
import PrimaryButton from '../../components/PrimaryButton';
import NatureBackground from '../../components/NatureBackground';

const { height: SCREEN_H } = Dimensions.get('window');

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');

  function handleLogin() {
    if (!email || !password) { setError('Veuillez remplir tous les champs.'); return; }
    setError('');
    navigation.navigate('Step1', { email });
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <NatureBackground height={SCREEN_H * 0.32} />
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>

        <ScrollView style={styles.sheet} contentContainerStyle={styles.sheetContent} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Se connecter</Text>
          <Text style={styles.subtitle}>Bienvenue de retour !</Text>

          <SocialBtn icon="🇬" label="Continuer avec Google" onPress={() => navigation.navigate('Step1', { email: '' })} />
          <SocialBtn icon="🍎" label="Continuer avec Apple" onPress={() => navigation.navigate('Step1', { email: '' })} />

          <View style={styles.dividerRow}>
            <View style={styles.divider} /><Text style={styles.dividerText}>ou</Text><View style={styles.divider} />
          </View>

          <View style={styles.inputWrap}>
            <Text style={styles.inputIcon}>✉️</Text>
            <TextInput style={styles.input} placeholder="Adresse e-mail" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" placeholderTextColor={colors.gray} />
          </View>

          <View style={styles.inputWrap}>
            <Text style={styles.inputIcon}>🔒</Text>
            <TextInput style={styles.input} placeholder="Mot de passe" value={password} onChangeText={setPassword} secureTextEntry={!showPass} placeholderTextColor={colors.gray} />
            <TouchableOpacity onPress={() => setShowPass(v => !v)}>
              <Text style={styles.eyeIcon}>{showPass ? '🙈' : '👁️'}</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.forgotWrap}>
            <Text style={styles.forgot}>Mot de passe oublié ?</Text>
          </TouchableOpacity>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <PrimaryButton title="Se connecter" onPress={handleLogin} style={styles.btn} />

          <TouchableOpacity onPress={() => navigation.navigate('Register')} style={styles.link}>
            <Text style={styles.linkText}>Vous n'avez pas de compte ?</Text>
            <Text style={styles.linkBold}>Créer un compte</Text>
          </TouchableOpacity>
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

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#EAF4EC' },
  backBtn: { position: 'absolute', top: 52, left: 20, zIndex: 10 },
  backText: { fontSize: 22, color: colors.primary, fontWeight: '600' },
  sheet: { flex: 1, backgroundColor: colors.white, borderTopLeftRadius: 28, borderTopRightRadius: 28, marginTop: -20 },
  sheetContent: { paddingHorizontal: spacing.lg, paddingTop: spacing.xl, paddingBottom: 40 },
  title: { fontSize: 28, fontWeight: '800', color: colors.black, textAlign: 'center', marginBottom: 4 },
  subtitle: { fontSize: font.md, color: colors.gray, textAlign: 'center', marginBottom: spacing.lg },
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
  eyeIcon: { fontSize: 16 },
  forgotWrap: { alignItems: 'flex-end', marginBottom: spacing.md },
  forgot: { color: colors.primary, fontSize: font.sm, fontWeight: '600' },
  error: { color: colors.red, fontSize: font.sm, textAlign: 'center', marginBottom: spacing.sm },
  btn: { marginBottom: spacing.lg },
  link: { alignItems: 'center', gap: 2 },
  linkText: { color: colors.gray, fontSize: font.sm },
  linkBold: { color: colors.primary, fontSize: font.sm, fontWeight: '700' },
});
