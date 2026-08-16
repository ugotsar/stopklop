// ── Direction graphique Stopklop v2 (kit UI selection) ─────────────────────
// Palette crème + vert sauge, grille 8px, boutons pilule, ombres douces.

import { Dimensions } from 'react-native';

// Largeur d'écran utilisée pour les calculs de mise en page (grilles, cartes…).
// Sur web, App.js centre l'app dans un cadre "téléphone" de 430px max — sans ce
// plafond, Dimensions.get('window').width renverrait la largeur de la fenêtre
// du navigateur (souvent > 1000px), et les grilles calculées à partir de cette
// valeur déborderaient largement du cadre visuellement contraint.
export function getScreenWidth() {
  return Math.min(Dimensions.get('window').width, 430);
}

export const colors = {
  // Fonds
  cream:        '#FBF9F1',   // fond global
  surface:      '#FFFDF8',   // cartes / sheets
  white:        '#FFFFFF',
  // Verts
  primary:      '#2F7A44',   // vert principal (boutons, valeurs positives)
  primaryDeep:  '#1E5530',   // vert profond (titres, focus)
  primaryLight: '#E8F0E2',   // vert sauge clair (fonds icônes, chips)
  // Neutres
  black:        '#173D26',   // texte principal (teinté vert)
  gray:         '#6F746F',   // texte secondaire
  grayLight:    '#F3F0E4',
  grayBorder:   '#EDE8D8',   // bordure douce
  // Sémantique
  success:      '#2F7A44',
  warning:      '#F4A000',
  danger:       '#E5484D',
  red:          '#E5484D',

  // ── Aliases rétrocompat (ancien thème) ────────────────────────────────────
  // Conservés temporairement pour ne pas casser les écrans encore non refondus.
  primaryMid:   '#2A7A4B',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  section: 32,   // entre grandes sections
  cardIn: 20,    // padding interne des cartes
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 20,       // cartes standards
  xl: 28,       // grandes cartes / sheets
  pill: 9999,
  full: 9999,
};

export const font = {
  xs: 11,
  sm: 14,
  md: 16,
  lg: 20,
  xl: 26,
  xxl: 32,
  display: 44,
};

export const shadow = {
  // Ombre carte douce
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  // Ombre modale
  modal: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
};
