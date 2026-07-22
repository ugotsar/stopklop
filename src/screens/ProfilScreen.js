import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, Switch, Modal, TextInput, Alert,
} from 'react-native';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { useUser } from '../context/UserContext';
import { colors, spacing, font, radius } from '../theme';

// ── Icônes SVG (trait vert, style cohérent avec la maquette) ─────────────────
function Icon({ name, size = 22, color = colors.primary }) {
  const stroke = { stroke: color, strokeWidth: 2, fill: 'none', strokeLinecap: 'round', strokeLinejoin: 'round' };
  const box = { width: size, height: size, viewBox: '0 0 24 24' };
  switch (name) {
    case 'person':
      return (
        <Svg {...box}>
          <Circle cx="12" cy="8" r="4" fill={color} />
          <Path d="M4 20c0-4.4 3.6-7 8-7s8 2.6 8 7z" fill={color} />
        </Svg>
      );
    case 'wallet':
      return (
        <Svg {...box}>
          <Rect x="3" y="6" width="18" height="13" rx="2.5" {...stroke} />
          <Path d="M3 10h18" {...stroke} />
          <Circle cx="17" cy="14.5" r="1.3" fill={color} />
        </Svg>
      );
    case 'clock':
      return (
        <Svg {...box}>
          <Circle cx="12" cy="12" r="9" {...stroke} />
          <Path d="M12 7v5.2l3.2 2.3" {...stroke} />
        </Svg>
      );
    case 'target':
      return (
        <Svg {...box}>
          <Circle cx="12" cy="12" r="9" {...stroke} />
          <Circle cx="12" cy="12" r="5" {...stroke} />
          <Circle cx="12" cy="12" r="1.7" fill={color} />
        </Svg>
      );
    case 'calendar':
      return (
        <Svg {...box}>
          <Rect x="3" y="5" width="18" height="16" rx="2.5" {...stroke} />
          <Path d="M3 9.5h18M8 3v3M16 3v3" {...stroke} />
          <Path d="M8.5 14.7l2.2 2.2 4-4.4" {...stroke} />
        </Svg>
      );
    case 'tag':
      return (
        <Svg {...box}>
          <Path d="M20.6 13.4l-7-7A2 2 0 0 0 12.2 6H6a2 2 0 0 0-2 2v6.2a2 2 0 0 0 .6 1.4l7 7a2 2 0 0 0 2.8 0l6.2-6.2a2 2 0 0 0 0-2.8z" {...stroke} />
          <Circle cx="8.5" cy="8.5" r="1.4" fill={color} />
        </Svg>
      );
    case 'cigarettes':
      return (
        <Svg {...box}>
          <Rect x="3" y="10" width="18" height="9" rx="1.5" {...stroke} />
          <Path d="M9 10v9M14 10v9M3 16h18" {...stroke} />
        </Svg>
      );
    case 'bars':
      return (
        <Svg {...box}>
          <Rect x="4" y="13" width="3.6" height="6" rx="1" fill={color} />
          <Rect x="10.2" y="9" width="3.6" height="10" rx="1" fill={color} />
          <Rect x="16.4" y="5" width="3.6" height="14" rx="1" fill={color} />
        </Svg>
      );
    case 'heart':
      return (
        <Svg {...box}>
          <Path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill={color} />
        </Svg>
      );
    case 'bell':
      return (
        <Svg {...box}>
          <Path d="M18 9a6 6 0 1 0-12 0c0 7-2.5 9-2.5 9h17S18 16 18 9z" {...stroke} />
          <Path d="M13.7 21a2 2 0 0 1-3.4 0" {...stroke} />
        </Svg>
      );
    case 'globe':
      return (
        <Svg {...box}>
          <Circle cx="12" cy="12" r="9" {...stroke} />
          <Path d="M3 12h18" {...stroke} />
          <Path d="M12 3c2.5 2.6 2.5 15.4 0 18M12 3c-2.5 2.6-2.5 15.4 0 18" {...stroke} />
        </Svg>
      );
    case 'help':
      return (
        <Svg {...box}>
          <Circle cx="12" cy="12" r="9" {...stroke} />
          <Path d="M9.6 9.4a2.5 2.5 0 1 1 3.4 2.4c-.9.4-1.5 1-1.5 2.1" {...stroke} />
          <Circle cx="12" cy="17" r="1" fill={color} />
        </Svg>
      );
    case 'chat':
      return (
        <Svg {...box}>
          <Path d="M21 11.5a7.5 7.5 0 0 1-10.8 6.7L3.5 20l1.4-5.9A7.5 7.5 0 1 1 21 11.5z" {...stroke} />
        </Svg>
      );
    case 'info':
      return (
        <Svg {...box}>
          <Circle cx="12" cy="12" r="9" {...stroke} />
          <Path d="M12 11.5v5" {...stroke} />
          <Circle cx="12" cy="8" r="1" fill={color} />
        </Svg>
      );
    case 'trash':
      return (
        <Svg {...box}>
          <Path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6.5 7l.9 12a1 1 0 0 0 1 .9h7.2a1 1 0 0 0 1-.9l.9-12" {...stroke} />
        </Svg>
      );
    default:
      return null;
  }
}

// ── Modal bottom sheet générique ─────────────────────────────────────────────
function EditModal({ visible, onClose, title, currentValue, unit, onSave, step = 0.5 }) {
  const [val, setVal] = useState(currentValue);

  function handleSave() {
    const n = parseFloat(val);
    if (!isNaN(n) && n >= 0) { onSave(n); onClose(); }
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose} />
      <View style={styles.bottomSheet}>
        {/* Handle */}
        <View style={styles.sheetHandle} />

        <Text style={styles.sheetTitle}>{title}</Text>

        <Text style={styles.sheetCurrentLabel}>Valeur actuelle</Text>
        <Text style={styles.sheetCurrentValue}>{currentValue} {unit}</Text>

        {/* Stepper */}
        <View style={styles.sheetStepper}>
          <TouchableOpacity
            style={styles.stepBtn}
            onPress={() => setVal(v => Math.max(0, parseFloat(v || 0) - step).toFixed(step < 1 ? 2 : 0))}
          >
            <Text style={styles.stepBtnText}>−</Text>
          </TouchableOpacity>
          <View style={styles.stepCenter}>
            <Text style={styles.stepValue}>{val} {unit}</Text>
          </View>
          <TouchableOpacity
            style={styles.stepBtn}
            onPress={() => setVal(v => (parseFloat(v || 0) + step).toFixed(step < 1 ? 2 : 0))}
          >
            <Text style={styles.stepBtnText}>+</Text>
          </TouchableOpacity>
        </View>

        {/* OU saisie manuelle */}
        <Text style={styles.sheetOu}>OU</Text>
        <Text style={styles.sheetManuelLabel}>Saisir manuellement</Text>
        <View style={styles.sheetInputRow}>
          <TextInput
            style={styles.sheetInput}
            value={String(val)}
            onChangeText={setVal}
            keyboardType="decimal-pad"
          />
          <Text style={styles.sheetInputUnit}>{unit}</Text>
        </View>

        {/* Checkbox projections */}
        <View style={styles.sheetCheckRow}>
          <View style={styles.checkboxActive}><Text style={{ color: '#fff', fontSize: 12 }}>✓</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.checkLabel}>Mettre à jour mes projections</Text>
            <Text style={styles.checkSub}>Les statistiques seront recalculées avec cette nouvelle valeur.</Text>
          </View>
        </View>

        {/* Boutons */}
        <View style={styles.sheetBtns}>
          <TouchableOpacity style={styles.sheetBtnCancel} onPress={onClose}>
            <Text style={styles.sheetBtnCancelText}>Annuler</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.sheetBtnSave} onPress={handleSave}>
            <Text style={styles.sheetBtnSaveText}>Enregistrer</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ── Modal motivations (consultation + modification) ─────────────────────────
const MOTIVATIONS_CHOIX = [
  { key: 'health',     emoji: '❤️', label: 'Ma santé' },
  { key: 'family',     emoji: '👨‍👩‍👧', label: 'Ma famille' },
  { key: 'appearance', emoji: '✨', label: 'Mon apparence' },
  { key: 'money',      emoji: '💰', label: "Économiser de l'argent" },
  { key: 'breathing',  emoji: '🫁', label: 'Un meilleur souffle' },
  { key: 'fitness',    emoji: '🏃', label: 'Retrouver ma condition' },
];

function MotivationsModal({ visible, onClose, initial, initialPerso, initialNiveau, onSave }) {
  const [sel, setSel]       = useState(initial);
  const [perso, setPerso]   = useState(initialPerso ?? '');
  const [niveau, setNiveau] = useState(initialNiveau ?? 5);

  useEffect(() => {
    if (visible) { setSel(initial); setPerso(initialPerso ?? ''); setNiveau(initialNiveau ?? 5); }
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose} />
      <View style={styles.bottomSheet}>
        <View style={styles.sheetHandle} />
        <Text style={styles.sheetTitle}>Mes motivations</Text>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: spacing.md }}>
          {MOTIVATIONS_CHOIX.map(m => {
            const active = sel.includes(m.key);
            return (
              <TouchableOpacity
                key={m.key}
                style={[styles.motivChip, active && styles.motivChipActive]}
                onPress={() => {
                  if (active) setSel(sel.filter(k => k !== m.key));
                  else if (sel.length < 3) setSel([...sel, m.key]);
                }}
              >
                <Text style={{ fontSize: 14 }}>{m.emoji}</Text>
                <Text style={[styles.motivChipText, active && { color: colors.primary, fontWeight: '700' }]}>{m.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <TextInput
          style={styles.motivPersoInput}
          value={perso}
          onChangeText={setPerso}
          placeholder="Votre motivation personnelle…"
          placeholderTextColor="#B0B0B0"
          maxLength={120}
        />

        <Text style={[styles.sheetManuelLabel, { marginTop: spacing.md }]}>Niveau de motivation : {niveau} / 10</Text>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.lg, marginTop: 4 }}>
          {Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
            <TouchableOpacity
              key={n}
              style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: n <= niveau ? colors.primary : colors.grayBorder }}
              onPress={() => setNiveau(n)}
            />
          ))}
        </View>

        <View style={styles.sheetBtns}>
          <TouchableOpacity style={styles.sheetBtnCancel} onPress={onClose}>
            <Text style={styles.sheetBtnCancelText}>Annuler</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.sheetBtnSave}
            onPress={() => { onSave({ motivations: sel, motivationPerso: perso.trim() || null, niveauMotivation: niveau }); onClose(); }}
          >
            <Text style={styles.sheetBtnSaveText}>Enregistrer</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ── Écran Profil ─────────────────────────────────────────────────────────────
export default function ProfilScreen({ navigation }) {
  const { profile, stats, updateProfile, resetProfile } = useUser();

  const [notifs,       setNotifs]       = useState(true);
  const [modalPrix,    setModalPrix]    = useState(false);
  const [modalCig,     setModalCig]     = useState(false);
  const [modalConso,   setModalConso]   = useState(false);
  const [modalMotiv,   setModalMotiv]   = useState(false);

  const prixPaquet       = profile?.prixPaquet       ?? 11;
  const cigParPaquet     = profile?.cigarettesParPaquet ?? 20;
  const consoAvant       = stats?.consoAvant ?? 10;
  const consoEstimee     = stats?.consoEstimee ?? false;
  const argentEco        = stats?.argentEcoCumul ?? 0;
  const vieGagneeMin     = stats?.vieGagneeMinCumul ?? 0;
  const vieGagneeH       = Math.floor(vieGagneeMin / 60);
  const vieStr           = vieGagneeH > 0 ? `${vieGagneeH} h ${vieGagneeMin % 60} min` : `${vieGagneeMin} min`;
  const motivation       = profile?.niveauMotivation ?? 8;
  const diffJours        = stats?.diffJours ?? 0;
  const objectifCig      = stats?.objectifJour ?? 8;
  const reductionSem     = stats?.reductionSem ?? 0;
  const objectifLabel    =
    profile?.typeObjectif === 'stop'  ? 'Arrêt complet' :
    profile?.typeObjectif === 'libre' ? 'Objectif libre' : 'Réduction progressive';
  const objectifDetail   = reductionSem > 0
    ? `${objectifCig} cig./jour max. · −${reductionSem} par semaine`
    : `Objectif : ${objectifCig} cigarette${objectifCig > 1 ? 's' : ''} / jour`;

  // Formatage FR (virgule décimale)
  const eur = n => `${n.toFixed(2).replace('.', ',')} €`;

  async function handleDeleteAccount() {
    Alert.alert(
      'Supprimer mon compte',
      'Cette action est irréversible. Toutes vos données seront supprimées.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            await resetProfile();
            // La déconnexion Firebase ramène automatiquement à l'écran d'auth
          },
        },
      ]
    );
  }

  return (
    <SafeAreaView style={styles.safe}>

      {/* ── Header ── */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profil</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Carte utilisateur : grand compteur ── */}
        <View style={styles.userCard}>
          <View style={styles.userTop}>
            <View style={styles.avatar}>
              <Icon name="person" size={42} />
            </View>
            <View style={styles.dayBlock}>
              <View style={styles.dayRow}>
                <Text style={styles.dayNum}>{diffJours}</Text>
                <Text style={styles.dayUnit}>jours</Text>
              </View>
              <Text style={styles.daySub}>sans cigarette</Text>
              <View style={styles.userDivider} />
              <Text style={styles.userSince}>
                Membre depuis {profile?.createdAt
                  ? new Date(profile.createdAt).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
                  : 'mai 2024'}
              </Text>
            </View>
          </View>
        </View>

        {/* ── Statistiques clés (liste) ── */}
        <View style={styles.listCard}>
          <StatRow icon="wallet"   label="Économies réalisées" value={eur(argentEco)}    unit="économisés" />
          <View style={styles.listDivider} />
          <StatRow icon="clock"    label="Temps de vie gagné"  value={vieStr}            unit="de vie gagnées" />
          <View style={styles.listDivider} />
          <StatRow icon="target"   label="Motivation"          value={`${motivation}/10`} unit="motivation" />
          <View style={styles.listDivider} />
          <StatRow icon="calendar" label="Suivi actuel"        value={`${diffJours} jours`} unit="sans cigarette" />
        </View>

        {/* ── Mon objectif actuel ── */}
        <Text style={styles.sectionTitle}>Mon objectif actuel</Text>
        <TouchableOpacity
          style={[styles.listCard, styles.objectifCard]}
          onPress={() => navigation.navigate('ModifierObjectif')}
        >
          <View style={styles.listRow}>
            <View style={styles.listIconCircle}>
              <Icon name="target" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.listItemTitle} numberOfLines={1} adjustsFontSizeToFit>{objectifLabel}</Text>
              <Text style={styles.listItemSub} numberOfLines={1}>{objectifDetail}</Text>
            </View>
            <Text style={styles.listModifier}>Modifier ›</Text>
          </View>
        </TouchableOpacity>

        {/* ── Paramètres de consommation ── */}
        <Text style={styles.sectionTitle}>Paramètres de consommation</Text>
        <View style={styles.listCard}>
          <TouchableOpacity style={styles.listRow} onPress={() => setModalPrix(true)}>
            <View style={styles.listIconCircle}>
              <Icon name="tag" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.listItemTitle}>Prix du paquet</Text>
              <Text style={styles.listItemSub}>{eur(prixPaquet)}</Text>
            </View>
            <Text style={styles.listModifier}>Modifier ›</Text>
          </TouchableOpacity>

          <View style={styles.listDivider} />

          <TouchableOpacity style={styles.listRow} onPress={() => setModalCig(true)}>
            <View style={styles.listIconCircle}>
              <Icon name="cigarettes" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.listItemTitle}>Cigarettes par paquet</Text>
              <Text style={styles.listItemSub}>{cigParPaquet} cigarettes</Text>
            </View>
            <Text style={styles.listModifier}>Modifier ›</Text>
          </TouchableOpacity>

          <View style={styles.listDivider} />

          <TouchableOpacity style={styles.listRow} onPress={() => setModalConso(true)}>
            <View style={styles.listIconCircle}>
              <Icon name="bars" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.listItemTitle}>Ma consommation avant l'app</Text>
              <Text style={styles.listItemSub}>
                {consoAvant} cig./jour{consoEstimee ? '  ·  ⚠️ valeur estimée' : ''}
              </Text>
              <Text style={[styles.listItemSub, { fontSize: 10, color: '#B45309' }]}>
                Référence de toutes vos économies — vérifiez qu'elle est juste
              </Text>
            </View>
            <Text style={styles.listModifier}>Modifier ›</Text>
          </TouchableOpacity>
        </View>

        {/* ── Mes motivations ── */}
        <Text style={styles.sectionTitle}>Mes motivations</Text>
        <TouchableOpacity style={styles.listCard} onPress={() => setModalMotiv(true)}>
          <View style={styles.listRow}>
            <View style={styles.listIconCircle}>
              <Icon name="heart" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.listItemTitle} numberOfLines={1}>
                {(profile?.motivations ?? []).length > 0
                  ? (profile.motivations)
                      .map(k => MOTIVATIONS_CHOIX.find(m => m.key === k)?.label)
                      .filter(Boolean).join(' · ')
                  : 'Définir mes motivations'}
              </Text>
              <Text style={styles.listItemSub} numberOfLines={1}>
                Motivation {motivation}/10{profile?.motivationPerso ? `  ·  « ${profile.motivationPerso} »` : ''}
              </Text>
            </View>
            <Text style={styles.listModifier}>Modifier ›</Text>
          </View>
        </TouchableOpacity>

        {/* ── Préférences ── */}
        <Text style={styles.sectionTitle}>Préférences</Text>
        <View style={styles.listCard}>
          <View style={styles.listRow}>
            <View style={styles.listIconCircle}>
              <Icon name="bell" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.listItemTitle}>Notifications</Text>
              <Text style={styles.listItemSub}>Rappels, motivation, conseils</Text>
            </View>
            <Switch
              value={notifs}
              onValueChange={setNotifs}
              trackColor={{ false: colors.grayBorder, true: colors.primary }}
              thumbColor={colors.white}
            />
          </View>

          <View style={styles.listDivider} />

          <TouchableOpacity
            style={styles.listRow}
            onPress={() => navigation.navigate('UniteMonnaie')}
          >
            <View style={styles.listIconCircle}>
              <Icon name="globe" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.listItemTitle}>Unités</Text>
              <Text style={styles.listItemSub}>Euro (€) · Heures · Cigarettes</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        </View>

        {/* ── Aide & support ── */}
        <Text style={styles.sectionTitle}>Aide & support</Text>
        <View style={styles.listCard}>
          <TouchableOpacity style={styles.listRow} onPress={() => navigation.navigate('CentreAide')}>
            <View style={styles.listIconCircle}>
              <Icon name="help" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.listItemTitle}>Centre d'aide</Text>
              <Text style={styles.listItemSub}>FAQ, guides et ressources</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>

          <View style={styles.listDivider} />

          <TouchableOpacity
            style={styles.listRow}
            onPress={() => navigation.navigate('NousContacter')}
          >
            <View style={styles.listIconCircle}>
              <Icon name="chat" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.listItemTitle}>Nous contacter</Text>
              <Text style={styles.listItemSub}>Une question ? On est là pour vous</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>

          <View style={styles.listDivider} />

          <TouchableOpacity
            style={styles.listRow}
            onPress={() => Alert.alert(
              'Stopklop v1.0.0',
              'Stopklop vous accompagne pour réduire puis arrêter la cigarette, à votre rythme.\n\n'
              + '🌿 Suivi quotidien et statistiques détaillées\n'
              + '📉 Plan de réduction progressive personnalisé\n'
              + '🔥 Analyse de vos envies et déclencheurs\n\n'
              + 'Fait avec 💚 pour votre santé.'
            )}
          >
            <View style={styles.listIconCircle}>
              <Icon name="info" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.listItemTitle}>À propos de Stopklop</Text>
              <Text style={styles.listItemSub}>Version 1.0.0</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        </View>

        {/* ── Supprimer compte ── */}
        <TouchableOpacity style={styles.deleteBtn} onPress={handleDeleteAccount}>
          <View style={styles.deleteBtnLeft}>
            <Icon name="trash" size={18} color={colors.red} />
            <Text style={styles.deleteBtnText}>Supprimer mon compte</Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>

      </ScrollView>

      {/* ── Modals bottom sheet ── */}
      <EditModal
        visible={modalPrix}
        onClose={() => setModalPrix(false)}
        title="Modifier le prix du paquet"
        currentValue={prixPaquet}
        unit="€"
        step={0.5}
        onSave={v => updateProfile({ prixPaquet: v })}
      />
      <EditModal
        visible={modalCig}
        onClose={() => setModalCig(false)}
        title="Modifier le nombre de cigarettes par paquet"
        currentValue={cigParPaquet}
        unit="cigarettes"
        step={1}
        onSave={v => updateProfile({ cigarettesParPaquet: Math.round(v) })}
      />
      <MotivationsModal
        visible={modalMotiv}
        onClose={() => setModalMotiv(false)}
        initial={Array.isArray(profile?.motivations) ? profile.motivations.filter(k => MOTIVATIONS_CHOIX.some(m => m.key === k)) : []}
        initialPerso={profile?.motivationPerso}
        initialNiveau={profile?.niveauMotivation}
        onSave={changes => updateProfile(changes)}
      />
      <EditModal
        visible={modalConso}
        onClose={() => setModalConso(false)}
        title="Ma consommation avant l'app"
        currentValue={consoAvant}
        unit="cig / jour"
        step={1}
        onSave={v => updateProfile({ consoAvantApp: Math.round(v) })}
      />

    </SafeAreaView>
  );
}

// ── Sous-composant : ligne de statistique ─────────────────────────────────────
function StatRow({ icon, label, value, unit }) {
  return (
    <View style={styles.listRow}>
      <View style={styles.listIconCircle}>
        <Icon name={icon} />
      </View>
      <Text style={styles.statLabel}>{label}</Text>
      <View style={styles.statRight}>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statUnit}>{unit}</Text>
      </View>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: '#F7F8FA' },
  scroll: { padding: spacing.md, paddingBottom: 90 },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.sm,
    backgroundColor: colors.white,
    borderBottomWidth: 1, borderBottomColor: colors.grayBorder,
  },
  headerTitle: { fontSize: font.lg, fontWeight: '800', color: colors.black, flex: 1, textAlign: 'center' },

  // Carte utilisateur : grand compteur
  userCard: {
    backgroundColor: colors.white, borderRadius: radius.xl,
    padding: spacing.md, marginBottom: spacing.sm,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  userTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatar:  {
    width: 78, height: 78, borderRadius: 39,
    backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center',
  },
  dayBlock: { flex: 1 },
  dayRow:   { flexDirection: 'row', alignItems: 'flex-end' },
  dayNum:   { fontSize: 22, fontWeight: '900', color: colors.primary, lineHeight: 26 },
  dayUnit:  { fontSize: 13, fontWeight: '700', color: colors.primary, marginLeft: 4, marginBottom: 2 },
  daySub:   { fontSize: 12, fontWeight: '600', color: '#4B5563', marginTop: 2 },
  userDivider: { height: 1, backgroundColor: colors.grayBorder, marginTop: spacing.sm, marginBottom: spacing.sm },
  userSince: { fontSize: 13, color: colors.gray },

  chevron: { fontSize: 18, color: colors.gray, marginLeft: 4 },

  // Ligne de stat
  statLabel: { flex: 1, fontSize: font.md, fontWeight: '600', color: colors.black },
  statRight: { alignItems: 'flex-end' },
  statValue: { fontSize: font.md, fontWeight: '800', color: colors.primary },
  statUnit:  { fontSize: 12, color: colors.gray, marginTop: 1 },

  // Sections
  sectionTitle: { fontSize: font.md, fontWeight: '800', color: colors.black, marginTop: spacing.md, marginBottom: spacing.sm },

  // Listes
  listCard: {
    backgroundColor: colors.white, borderRadius: radius.xl, overflow: 'hidden',
    marginBottom: spacing.sm,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  objectifCard: { borderWidth: 1.5, borderColor: colors.primary },
  listRow: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, gap: spacing.sm },
  listDivider: { height: 1, backgroundColor: colors.grayBorder, marginLeft: 68 },
  listIconCircle: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primaryLight,
    alignItems: 'center', justifyContent: 'center',
  },
  listItemTitle: { fontSize: font.md, fontWeight: '600', color: colors.black },
  listItemSub:   { fontSize: 12, color: colors.gray, marginTop: 1 },
  listModifier:  { fontSize: 13, color: colors.primary, fontWeight: '700' },

  // Supprimer
  deleteBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: colors.white, borderRadius: radius.xl,
    padding: spacing.md, marginTop: spacing.sm,
    borderWidth: 1, borderColor: '#FEE2E2',
  },
  deleteBtnLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  deleteBtnText: { fontSize: font.sm, fontWeight: '600', color: '#EF4444' },

  // Modal / Bottom sheet
  modalOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  bottomSheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: colors.white,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: spacing.lg, paddingBottom: 40,
  },
  sheetHandle: {
    width: 40, height: 4, borderRadius: 2, backgroundColor: colors.grayBorder,
    alignSelf: 'center', marginBottom: spacing.lg,
  },
  sheetTitle:        { fontSize: font.lg, fontWeight: '800', color: colors.black, textAlign: 'center', marginBottom: spacing.md },
  sheetCurrentLabel: { fontSize: 12, color: colors.gray, textAlign: 'center' },
  sheetCurrentValue: { fontSize: 28, fontWeight: '900', color: colors.primary, textAlign: 'center', marginBottom: spacing.md },

  sheetStepper: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.md },
  stepBtn: {
    width: 52, height: 52, borderRadius: radius.md,
    borderWidth: 1.5, borderColor: colors.grayBorder,
    alignItems: 'center', justifyContent: 'center', flex: 0,
  },
  stepBtnText:  { fontSize: 28, color: colors.primary, fontWeight: '300', lineHeight: 32 },
  stepCenter:   { flex: 1, alignItems: 'center', backgroundColor: '#F7F8FA', borderRadius: radius.md, paddingVertical: 14 },
  stepValue:    { fontSize: font.lg, fontWeight: '800', color: colors.black },

  sheetOu:          { textAlign: 'center', color: colors.gray, fontSize: 12, marginBottom: spacing.sm },
  sheetManuelLabel: { fontSize: 12, color: colors.gray, marginBottom: 6 },
  sheetInputRow:    { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: colors.grayBorder, borderRadius: radius.md, paddingHorizontal: spacing.md, marginBottom: spacing.md },
  sheetInput:       { flex: 1, fontSize: font.lg, fontWeight: '700', paddingVertical: 12 },
  sheetInputUnit:   { fontSize: font.md, color: colors.gray },

  sheetCheckRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start', marginBottom: spacing.lg },
  checkboxActive: {
    width: 22, height: 22, borderRadius: 6,
    backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  checkLabel: { fontSize: 13, fontWeight: '600', color: colors.black },
  checkSub:   { fontSize: 11, color: colors.gray, marginTop: 2 },

  // Motivations
  motivChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderWidth: 1.5, borderColor: colors.grayBorder, borderRadius: radius.full,
    paddingHorizontal: 10, paddingVertical: 8,
  },
  motivChipActive: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  motivChipText:   { fontSize: 12, color: colors.black },
  motivPersoInput: {
    borderWidth: 1, borderColor: colors.grayBorder, borderRadius: radius.md,
    padding: spacing.sm, fontSize: font.sm, color: colors.black,
  },

  sheetBtns:        { flexDirection: 'row', gap: spacing.sm },
  sheetBtnCancel:   { flex: 1, borderWidth: 1.5, borderColor: colors.grayBorder, borderRadius: radius.full, paddingVertical: 14, alignItems: 'center' },
  sheetBtnCancelText: { color: colors.primary, fontWeight: '700', fontSize: font.md },
  sheetBtnSave:     { flex: 1, backgroundColor: colors.primary, borderRadius: radius.full, paddingVertical: 14, alignItems: 'center' },
  sheetBtnSaveText: { color: colors.white, fontWeight: '700', fontSize: font.md },
});
