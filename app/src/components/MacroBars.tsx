import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors } from '../theme';

type Macro = { label: string; value: number; goal: number; color: string };

export const MacroBars = ({ macros, rtl }: { macros: Macro[]; rtl: boolean }) => (
  <View style={styles.row}>
    {macros.map((macro) => {
      const ratio = macro.goal > 0 ? Math.min(macro.value / macro.goal, 1) : 0;
      return (
        <View key={macro.label} style={styles.item}>
          <Text style={[styles.label, rtl && styles.rtlText]}>{macro.label}</Text>
          <View style={styles.track}>
            <View
              style={[
                styles.fill,
                { width: `${ratio * 100}%`, backgroundColor: macro.color },
                rtl && styles.fillRtl,
              ]}
            />
          </View>
          <Text style={[styles.value, rtl && styles.rtlText]}>
            {Math.round(macro.value)} / {Math.round(macro.goal)} g
          </Text>
        </View>
      );
    })}
  </View>
);

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 12 },
  item: { flex: 1 },
  label: { color: colors.textDim, fontSize: 12, marginBottom: 6 },
  track: {
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.surfaceAlt,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  fill: { height: 8, borderRadius: 4 },
  fillRtl: { alignSelf: 'flex-end' },
  value: { color: colors.text, fontSize: 12, marginTop: 6 },
  rtlText: { textAlign: 'right' },
});
