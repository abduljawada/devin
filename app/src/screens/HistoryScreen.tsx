import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { HistoryPoint } from '../api';
import { useSettings } from '../settings';
import { colors, radius } from '../theme';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const WEEKDAYS_AR = ['أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'];

export const HistoryScreen = ({ points }: { points: HistoryPoint[] }) => {
  const { t, locale, rtl } = useSettings();
  const goal = points[0]?.goal ?? 2000;
  const peak = Math.max(goal, ...points.map((point) => point.calories), 1);
  const logged = points.filter((point) => point.calories > 0);
  const average = logged.length
    ? Math.round(logged.reduce((sum, point) => sum + point.calories, 0) / logged.length)
    : 0;

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={[styles.heading, rtl && styles.rtlText]}>{t('last7')}</Text>

      <View style={styles.card}>
        <View style={styles.chart}>
          {points.map((point) => {
            const height = Math.max((point.calories / peak) * 150, 3);
            const over = point.calories > goal;
            return (
              <View key={point.day} style={styles.column}>
                <Text style={styles.barValue}>{point.calories ? Math.round(point.calories) : ''}</Text>
                <View
                  style={[
                    styles.bar,
                    { height, backgroundColor: over ? colors.danger : colors.accent },
                    point.calories === 0 && styles.barEmpty,
                  ]}
                />
                <Text style={styles.barLabel}>
                  {(locale === 'ar' ? WEEKDAYS_AR : WEEKDAYS)[new Date(point.day).getDay()]}
                </Text>
              </View>
            );
          })}
        </View>
        <View style={[styles.goalLine, { bottom: 34 + (goal / peak) * 150 }]} />
      </View>

      <View style={styles.card}>
        <Text style={[styles.statLabel, rtl && styles.rtlText]}>{t('avg')}</Text>
        <Text style={[styles.statValue, rtl && styles.rtlText]}>
          {average} {t('kcal')}
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 140, gap: 14 },
  heading: { color: colors.text, fontSize: 18, fontWeight: '700' },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    overflow: 'hidden',
  },
  chart: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 6 },
  column: { flex: 1, alignItems: 'center', gap: 6 },
  bar: { width: '70%', borderRadius: 6 },
  barEmpty: { backgroundColor: colors.surfaceAlt },
  barValue: { color: colors.textDim, fontSize: 10, height: 14 },
  barLabel: { color: colors.textDim, fontSize: 11 },
  goalLine: {
    position: 'absolute',
    left: 16,
    right: 16,
    height: 1,
    backgroundColor: colors.textDim,
    opacity: 0.35,
  },
  statLabel: { color: colors.textDim, fontSize: 12 },
  statValue: { color: colors.text, fontSize: 24, fontWeight: '700', marginTop: 4 },
  rtlText: { textAlign: 'right' },
});
