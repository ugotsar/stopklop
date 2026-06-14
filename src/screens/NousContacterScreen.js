import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, TextInput, Alert,
} from 'react-native';
import { colors, spacing, font, radius } from '../theme';

const SUJETS = [
  { icon: '👤', titre: 'Compte et profil',          desc: 'Problème de compte, connexion, données...' },
  { icon: '📊', titre: 'Suivi et statistiques',     desc: 'Données, objectifs, projections...' },
  { icon: '€',  titre: 'Paiements et abonnements',  desc: 'Facturation, abonnement, remboursement...' },
  { icon: '❓', titre: "Utilisation de l'app",      desc: 'Fonctionnalités, fonctionnement, bugs...' },
  { icon: '💡', titre: 'Suggestion',                desc: 'Partagez vos idées pour améliorer Stopklop' },
];

export default function NousContacterScreen({ navigation }) {
  const [sujet,   setSujet]   = useState(null);
  const [message, setMessage] = useState('');

  function handleEnvoyer() {
    if (!sujet) {
      Alert.alert('Sujet requis', 'Veuillez choisir un sujet avant d\'envoyer.');
      return;
    }
    if (message.trim().length < 10) {
      Alert.alert('Message trop court', 'Décrivez votre demande en quelques mots.');
      return;
    }
    Alert.alert('Message envoyé !', 'Notre équipe vous répondra dans les 24-48h ouvrées. 💚', [
      { text: 'OK', onPress: () => navigation.goBack() },
    ]);
  }

  return (
    <SafeAreaView style={styles.safe}>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nous contacter</Text>
        <View style={{ width: 40 }}><Text style={{ textAlign: 'right', fontSize: 18 }}>ⓘ</Text></View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Hero */}
        <View style={styles.heroRow}>
          <View style={styles.heroIconCircle}>
            <Text style={{ fontSize: 32 }}>💬</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.heroTitle}>Nous sommes là pour vous</Text>
            <Text style={styles.heroSub}>
              Une question, un problème ou une suggestion ?{'\n'}
              Notre équipe vous répondra dans les{'\n'}plus brefs délais.
            </Text>
          </View>
        </View>

        {/* Choisir un sujet */}
        <Text style={styles.sectionTitle}>Choisissez un sujet</Text>
        <View style={styles.listCard}>
          {SUJETS.map((s, i) => (
            <TouchableOpacity
              key={i}
              style={[
                styles.sujetRow,
                i < SUJETS.length - 1 && styles.sujetRowBorder,
                sujet === i && styles.sujetRowActive,
              ]}
              onPress={() => setSujet(i)}
            >
              <View style={[styles.sujetIconCircle, sujet === i && { backgroundColor: colors.primary }]}>
                <Text style={{ fontSize: 18, color: sujet === i ? '#fff' : colors.primary }}>{s.icon}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.sujetTitre}>{s.titre}</Text>
                <Text style={styles.sujetDesc}>{s.desc}</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Zone de message */}
        <Text style={styles.sectionTitle}>Envoyez-nous un message</Text>
        <View style={styles.textAreaCard}>
          <TextInput
            style={styles.textArea}
            placeholder="Décrivez votre demande ici..."
            placeholderTextColor={colors.gray}
            multiline
            value={message}
            onChangeText={setMessage}
            maxLength={1000}
          />
          <Text style={styles.charCount}>{message.length}/1000</Text>
        </View>

        {/* Autres moyens */}
        <View style={styles.autresCard}>
          <View style={styles.autresIconCircle}>
            <Text style={{ fontSize: 22 }}>✉️</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.autresTitre}>Autres moyens de nous joindre</Text>
            <Text style={styles.autresText}>Email : <Text style={styles.autresLink}>support@stopklop.app</Text></Text>
            <Text style={styles.autresText}>Délai de réponse : sous <Text style={styles.autresLink}>24 à 48h ouvrées</Text></Text>
          </View>
        </View>

        {/* Bouton */}
        <TouchableOpacity style={styles.sendBtn} onPress={handleEnvoyer}>
          <Text style={styles.sendBtnText}>✈  Envoyer le message</Text>
        </TouchableOpacity>

        <Text style={styles.footerNote}>🔒  Vos données sont traitées en toute confidentialité.</Text>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: '#F7F8FA' },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxl },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.md,
    backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.grayBorder,
  },
  backBtn:     { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  backText:    { fontSize: 24, color: colors.black, fontWeight: '300' },
  headerTitle: { fontSize: font.md, fontWeight: '700', color: colors.black },

  heroRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md, marginBottom: spacing.lg },
  heroIconCircle: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center',
  },
  heroTitle: { fontSize: font.lg, fontWeight: '800', color: colors.black, marginBottom: 4 },
  heroSub:   { fontSize: 12, color: colors.gray, lineHeight: 18 },

  sectionTitle: { fontSize: font.sm, fontWeight: '700', color: colors.black, marginBottom: spacing.sm },

  listCard: {
    backgroundColor: colors.white, borderRadius: radius.xl, overflow: 'hidden',
    marginBottom: spacing.md,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  sujetRow: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, gap: spacing.sm },
  sujetRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.grayBorder },
  sujetRowActive: { backgroundColor: colors.primaryLight },
  sujetIconCircle: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center',
  },
  sujetTitre: { fontSize: font.sm, fontWeight: '600', color: colors.black },
  sujetDesc:  { fontSize: 11, color: colors.gray, marginTop: 1 },
  chevron:    { fontSize: 16, color: colors.gray },

  textAreaCard: {
    backgroundColor: colors.white, borderRadius: radius.xl,
    padding: spacing.md, marginBottom: spacing.md,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
    minHeight: 120,
  },
  textArea:  { fontSize: font.sm, color: colors.black, minHeight: 80, textAlignVertical: 'top' },
  charCount: { fontSize: 11, color: colors.gray, textAlign: 'right', marginTop: 4 },

  autresCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm,
    backgroundColor: colors.white, borderRadius: radius.xl, padding: spacing.md,
    marginBottom: spacing.lg,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  autresIconCircle: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center',
  },
  autresTitre: { fontSize: font.sm, fontWeight: '700', color: colors.black, marginBottom: 4 },
  autresText:  { fontSize: 12, color: colors.gray, marginTop: 2 },
  autresLink:  { color: colors.primary, fontWeight: '600' },

  sendBtn: { backgroundColor: colors.primary, borderRadius: radius.full, paddingVertical: 16, alignItems: 'center', marginBottom: spacing.sm },
  sendBtnText: { color: colors.white, fontSize: font.md, fontWeight: '700' },
  footerNote: { textAlign: 'center', fontSize: 11, color: colors.gray },
});
