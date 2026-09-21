import React from 'react';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';

// Pictos des trois gestes pour ajouter le widget (visite guidée).
const GREEN = '#0AA85B';
const DEEP = '#0B5135';

// Appui long : un doigt sur une zone, avec l'onde de l'appui maintenu.
export function IconAppuiLong({ size = 30 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <Rect x={3} y={3} width={26} height={26} rx={7} stroke={DEEP} strokeWidth={1.8} opacity={0.35} />
      <Circle cx={16} cy={16} r={7.5} stroke={GREEN} strokeWidth={1.6} opacity={0.5} />
      <Path
        d="M16 10.5 v6.2 M16 16.7 c-2.8 0 -4.4 1.6 -4.4 4 0 2.2 1.9 3.8 4.4 3.8 s4.6 -1.5 4.6 -4.1 v-3.3"
        stroke={DEEP} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" fill="none"
      />
    </Svg>
  );
}

// Le bouton + de l'écran d'accueil.
export function IconPlus({ size = 30 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <Circle cx={16} cy={16} r={12} fill={GREEN} />
      <Line x1={16} y1={10} x2={16} y2={22} stroke="#FFFFFF" strokeWidth={3} strokeLinecap="round" />
      <Line x1={10} y1={16} x2={22} y2={16} stroke="#FFFFFF" strokeWidth={3} strokeLinecap="round" />
    </Svg>
  );
}

// La vignette du widget à choisir dans la liste.
export function IconWidgetCarre({ size = 30 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <Rect x={4} y={4} width={24} height={24} rx={7} fill="#E7F2E8" stroke={DEEP} strokeWidth={1.6} />
      <Rect x={8} y={9} width={9} height={3} rx={1.5} fill={DEEP} />
      <Rect x={8} y={15} width={5} height={8} rx={1.5} fill={GREEN} />
      <Rect x={14.5} y={17.5} width={5} height={5.5} rx={1.5} fill={GREEN} />
      <Rect x={21} y={13} width={5} height={10} rx={1.5} fill={GREEN} opacity={0.55} />
    </Svg>
  );
}
