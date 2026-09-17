import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';

import { colors } from '../theme';

type Macro = { label: string; value: number; goal: number; color: string };

const Bar = ({ macro, rtl }: { macro: Macro; rtl: boolean }) => {
  const ratio = macro.goal > 0 ? Math.min(macro.value / macro.goal, 1) : 0;
  const grow = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(grow, {
      toValue: ratio,
      duration: 700,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [grow, ratio]);

  const width = grow.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  return (
    <View style={styles.item}>
      <View style={[styles.head, rtl && styles.headRtl]}>
        <View style={[styles.dot, { backgroundColor: macro.color }]} />
        <Text style={styles.label}>{macro.label}</Text>
      </View>
      <View style={[styles.track, rtl && styles.trackRtl]}>
        <Animated.View style={[styles.fill, { width, backgroundColor: macro.color }]} />
      </View>
      <Text style={[styles.value, rtl && styles.rtlText]}>
        {Math.round(macro.value)} / {Math.round(macro.goal)} g
      </Text>
    </View>
  );
};

export const MacroBars = ({ macros, rtl }: { macros: Macro[]; rtl: boolean }) => (
  <View style={styles.row}>
    {macros.map((macro) => (
      <Bar key={macro.label} macro={macro} rtl={rtl} />
    ))}
  </View>
);

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 12 },
  item: { flex: 1 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 6 },
  headRtl: { flexDirection: 'row-reverse' },
  dot: { width: 7, height: 7, borderRadius: 4 },
  label: { color: colors.textDim, fontSize: 12 },
  track: {
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.surfaceAlt,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  trackRtl: { flexDirection: 'row-reverse' },
  fill: { height: 8, borderRadius: 4 },
  value: { color: colors.text, fontSize: 12, marginTop: 6 },
  rtlText: { textAlign: 'right' },
});
