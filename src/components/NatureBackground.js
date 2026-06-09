import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Svg, { Path, Ellipse, Circle, G } from 'react-native-svg';

const { width } = Dimensions.get('window');
const H = 320;

// Layered mountain + forest + hot air balloon SVG background
export default function NatureBackground({ height = H }) {
  return (
    <View style={[styles.container, { height }]}>
      <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        {/* Sky */}
        <Path d={`M0 0 L${width} 0 L${width} ${height} L0 ${height} Z`} fill="#EAF4EC" />

        {/* Far mountains */}
        <Path
          d={`M0 ${height * 0.55} Q${width * 0.15} ${height * 0.3} ${width * 0.3} ${height * 0.48}
             Q${width * 0.45} ${height * 0.25} ${width * 0.6} ${height * 0.45}
             Q${width * 0.75} ${height * 0.2} ${width * 0.9} ${height * 0.42}
             L${width} ${height * 0.4} L${width} ${height} L0 ${height} Z`}
          fill="#C8E6C9"
        />
        {/* Mid mountains */}
        <Path
          d={`M0 ${height * 0.65} Q${width * 0.2} ${height * 0.42} ${width * 0.38} ${height * 0.58}
             Q${width * 0.52} ${height * 0.35} ${width * 0.68} ${height * 0.55}
             Q${width * 0.82} ${height * 0.38} ${width} ${height * 0.52}
             L${width} ${height} L0 ${height} Z`}
          fill="#A5D6A7"
        />
        {/* Forest layer */}
        <Path
          d={`M0 ${height * 0.78} Q${width * 0.25} ${height * 0.62} ${width * 0.5} ${height * 0.75}
             Q${width * 0.75} ${height * 0.6} ${width} ${height * 0.72}
             L${width} ${height} L0 ${height} Z`}
          fill="#4CAF50"
          opacity="0.7"
        />
        {/* Dark forest foreground */}
        <Path
          d={`M0 ${height * 0.88} Q${width * 0.2} ${height * 0.75} ${width * 0.45} ${height * 0.85}
             Q${width * 0.7} ${height * 0.72} ${width} ${height * 0.82}
             L${width} ${height} L0 ${height} Z`}
          fill="#2E7D32"
        />

        {/* Tree silhouettes */}
        {[0.05, 0.12, 0.18, 0.72, 0.8, 0.88, 0.94].map((x, i) => (
          <G key={i} transform={`translate(${width * x}, ${height * 0.82})`}>
            <Path d={`M0 0 L-10 20 L10 20 Z`} fill="#1B5E20" />
            <Path d={`M0 -12 L-12 12 L12 12 Z`} fill="#1B5E20" />
            <Path d={`M0 -22 L-8 2 L8 2 Z`} fill="#1B5E20" />
          </G>
        ))}

        {/* Hot air balloon */}
        <G transform={`translate(${width / 2}, 70)`}>
          {/* Balloon body */}
          <Ellipse cx="0" cy="0" rx="40" ry="50" fill="#2E7D32" />
          {/* Stripes */}
          <Path d="M-20 -40 Q0 -52 20 -40 Q10 0 0 10 Q-10 0 -20 -40 Z" fill="#4CAF50" opacity="0.5" />
          <Path d="M-38 -15 Q-20 -45 -10 -48 Q-5 0 -8 12 Q-25 5 -38 -15 Z" fill="#4CAF50" opacity="0.3" />
          {/* Basket */}
          <Path d="M-12 48 L12 48 L10 62 L-10 62 Z" fill="#1B5E20" />
          {/* Ropes */}
          <Path d="M-12 48 L-8 42" stroke="#1B5E20" strokeWidth="1.5" />
          <Path d="M12 48 L8 42" stroke="#1B5E20" strokeWidth="1.5" />
        </G>

        {/* Birds */}
        {[
          { x: width * 0.15, y: height * 0.22 },
          { x: width * 0.25, y: height * 0.18 },
          { x: width * 0.72, y: height * 0.2 },
          { x: width * 0.82, y: height * 0.15 },
        ].map((b, i) => (
          <Path key={i} d={`M${b.x} ${b.y} Q${b.x + 5} ${b.y - 5} ${b.x + 10} ${b.y}`} stroke="#4CAF50" strokeWidth="1.5" fill="none" />
        ))}

        {/* Clouds */}
        {[
          { x: width * 0.05, y: height * 0.3 },
          { x: width * 0.6, y: height * 0.12 },
          { x: width * 0.75, y: height * 0.32 },
        ].map((c, i) => (
          <G key={i} transform={`translate(${c.x}, ${c.y})`}>
            <Ellipse cx="20" cy="0" rx="20" ry="10" fill="white" opacity="0.8" />
            <Ellipse cx="35" cy="-4" rx="14" ry="10" fill="white" opacity="0.8" />
            <Ellipse cx="8" cy="-2" rx="12" ry="8" fill="white" opacity="0.8" />
          </G>
        ))}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%', overflow: 'hidden' },
});
