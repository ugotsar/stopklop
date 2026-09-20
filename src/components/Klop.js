import React from 'react';
import Svg, { Circle, Defs, Ellipse, G, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

// Klop, debout et souriant. Vectoriel : net à toutes les tailles.
export default function Klop({ width = 100 }) {
  return (
    <Svg width={width} height={(width * 120) / 100} viewBox="0 0 100 120">
      <Defs>
        <LinearGradient id="kBody" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#BCD0B7" />
          <Stop offset="0.6" stopColor="#9EB699" />
          <Stop offset="1" stopColor="#86A082" />
        </LinearGradient>
        <LinearGradient id="kFeet" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#8CA588" />
          <Stop offset="1" stopColor="#6F8A6C" />
        </LinearGradient>
      </Defs>
      <Ellipse cx={50} cy={114} rx={36} ry={4.5} fill="#173D26" opacity={0.16} />
      <Rect x={27} y={94} width={17} height={18} rx={8} fill="url(#kFeet)" />
      <Rect x={56} y={94} width={17} height={18} rx={8} fill="url(#kFeet)" />
      <Rect x={10} y={10} width={80} height={90} rx={30} fill="url(#kBody)" />
      <Rect x={17} y={16} width={22} height={56} rx={11} fill="#fff" opacity={0.2} />
      <G transform="translate(12 26) scale(1.1875)">
        <Ellipse cx={22} cy={18} rx={4.6} ry={5.8} fill="#1B2620" />
        <Ellipse cx={42} cy={18} rx={4.6} ry={5.8} fill="#1B2620" />
        <Circle cx={23.7} cy={15.8} r={1.6} fill="#fff" />
        <Circle cx={43.7} cy={15.8} r={1.6} fill="#fff" />
        <Ellipse cx={12.5} cy={28} rx={5} ry={3} fill="#E7A39A" opacity={0.7} />
        <Ellipse cx={51.5} cy={28} rx={5} ry={3} fill="#E7A39A" opacity={0.7} />
        <Path d="M24 27.5 Q32 38 40 27.5 Q32 30.5 24 27.5 Z" fill="#3A2622" />
        <Path d="M28.5 33 Q32 35.4 35.5 33 Q32 31.6 28.5 33 Z" fill="#D97F7A" />
      </G>
    </Svg>
  );
}
