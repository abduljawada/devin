import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { colors } from '../theme';

type Props = {
  consumed: number;
  goal: number;
  remainingLabel: string;
  overLabel: string;
  unit: string;
  size?: number;
};

export const CalorieRing = ({
  consumed,
  goal,
  remainingLabel,
  overLabel,
  unit,
  size = 210,
}: Props) => {
  const stroke = 16;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const ratio = goal > 0 ? Math.min(consumed / goal, 1) : 0;
  const remaining = Math.round(goal - consumed);
  const over = remaining < 0;

  return (
    <View style={[styles.wrapper, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.surfaceAlt}
          strokeWidth={stroke}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={over ? colors.danger : colors.accent}
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${circumference}`}
          strokeDashoffset={circumference * (1 - ratio)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={styles.center} pointerEvents="none">
        <Text style={styles.value}>{Math.abs(remaining)}</Text>
        <Text style={styles.unit}>{unit}</Text>
        <Text style={styles.caption}>{over ? overLabel : remainingLabel}</Text>
        <Text style={styles.sub}>
          {Math.round(consumed)} / {Math.round(goal)}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: { alignItems: 'center', justifyContent: 'center' },
  center: { position: 'absolute', alignItems: 'center' },
  value: { color: colors.text, fontSize: 48, fontWeight: '700' },
  unit: { color: colors.textDim, fontSize: 13, marginTop: -4 },
  caption: { color: colors.textDim, fontSize: 13, marginTop: 4 },
  sub: { color: colors.textDim, fontSize: 12, marginTop: 6, opacity: 0.7 },
});
