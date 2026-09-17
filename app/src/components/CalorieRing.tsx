import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

import { colors } from '../theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

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

  const eaten = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0.92)).current;
  const [shown, setShown] = useState(0);

  useEffect(() => {
    const id = eaten.addListener(({ value }) => setShown(value));
    return () => eaten.removeListener(id);
  }, [eaten]);

  useEffect(() => {
    Animated.timing(eaten, {
      toValue: consumed,
      duration: 900,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
    Animated.spring(pulse, { toValue: 1, useNativeDriver: true, friction: 5 }).start();
  }, [consumed, eaten, pulse]);

  const remaining = Math.round(goal - shown);
  const over = remaining < 0;
  const offset = eaten.interpolate({
    inputRange: [0, Math.max(goal, 1)],
    outputRange: [circumference, 0],
    extrapolate: 'clamp',
  });

  return (
    <Animated.View
      style={[styles.wrapper, { width: size, height: size, transform: [{ scale: pulse }] }]}
    >
      <Svg width={size} height={size}>
        <Defs>
          <LinearGradient id="ringFill" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={over ? colors.danger : colors.accent} />
            <Stop offset="1" stopColor={over ? '#FF9AA0' : '#8CF0B4'} />
          </LinearGradient>
        </Defs>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.surfaceAlt}
          strokeWidth={stroke}
          fill="none"
        />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#ringFill)"
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${circumference}`}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={styles.center} pointerEvents="none">
        <Text style={styles.value}>{Math.abs(remaining)}</Text>
        <Text style={styles.unit}>{unit}</Text>
        <Text style={styles.caption}>{over ? overLabel : remainingLabel}</Text>
        <Text style={styles.sub}>
          {Math.round(shown)} / {Math.round(goal)}
        </Text>
      </View>
    </Animated.View>
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
