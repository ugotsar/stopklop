import React from 'react';
import Svg, { Circle, Ellipse, Line, Path } from 'react-native-svg';

// Pictos de l'écran d'abonnement : trait vert foncé, style ligne, taille 28.
const GREEN = '#0B5135';

export function IconCible({ size = 28 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <Circle cx={15} cy={17} r={11} stroke={GREEN} strokeWidth={2.4} />
      <Circle cx={15} cy={17} r={6} stroke={GREEN} strokeWidth={2.4} />
      <Circle cx={15} cy={17} r={1.9} fill={GREEN} />
      <Path d="M15 17 L27 5" stroke={GREEN} strokeWidth={2.4} strokeLinecap="round" />
      <Path d="M23 5 h5 v5" stroke={GREEN} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function IconLoupe({ size = 28 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <Circle cx={14} cy={14} r={9} stroke={GREEN} strokeWidth={2.6} />
      <Path d="M20.5 20.5 L28 28" stroke={GREEN} strokeWidth={2.8} strokeLinecap="round" />
    </Svg>
  );
}

// Trois pièces empilées, vues de trois quarts.
export function IconPieces({ size = 28 }) {
  const coin = (cy, opacity) => (
    <React.Fragment key={cy}>
      <Path
        d={`M4 ${cy} v3.4 c0 2.4 5.4 4.3 12 4.3 s12-1.9 12-4.3 V${cy}`}
        fill={GREEN}
        opacity={opacity}
      />
      <Ellipse cx={16} cy={cy} rx={12} ry={4.3} fill={GREEN} opacity={opacity} />
      <Ellipse cx={16} cy={cy} rx={12} ry={4.3} fill="none" stroke="#FFFFFF" strokeWidth={1.1} opacity={0.55} />
    </React.Fragment>
  );
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      {coin(21, 0.55)}
      {coin(15.5, 0.78)}
      {coin(10, 1)}
    </Svg>
  );
}
