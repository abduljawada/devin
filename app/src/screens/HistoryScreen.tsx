import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, ScrollView, StyleSheet, Text, View } from 'react-native';

import { HistoryPoint } from '../api';
import { FadeIn } from '../components/FadeIn';
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

      <FadeIn style={styles.card}>
        <View style={styles.chart}>
          {points.map((point, index) => (
            <Bar
              key={point.day}
              index={index}
              calories={point.calories}
              height={Math.max((point.calories / peak) * 150, 3)}
              over={point.calories > goal}
              label={(locale === 'ar' ? WEEKDAYS_AR : WEEKDAYS)[new Date(point.day).getDay()]}
            />
          ))}
        </View>
        <View style={[styles.goalLine, { bottom: 34 + (goal / peak) * 150 }]} />
      </FadeIn>

      <FadeIn delay={160} style={[styles.card, styles.statCard]}>
        <View style={styles.statIcon}>
          <Ionicons name="trending-up" size={18} color={colors.accent} />
        </View>
        <View>
          <Text style={[styles.statLabel, rtl && styles.rtlText]}>{t('avg')}</Text>
          <Text style={[styles.statValue, rtl && styles.rtlText]}>
            {average} {t('kcal')}
          </Text>
        </View>
      </FadeIn>
    </ScrollView>
  );
};

const Bar = ({
  index,
  calories,
  height,
  over,
  label,
}: {
  index: number;
  calories: number;
  height: number;
  over: boolean;
  label: string;
}) => {
  const grow = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(grow, {
      toValue: height,
      duration: 600,
      delay: index * 70,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [grow, height, index]);

  return (
    <View style={styles.column}>
      <Text style={styles.barValue}>{calories ? Math.round(calories) : ''}</Text>
      <Animated.View
        style={[
          styles.bar,
          { height: grow, backgroundColor: over ? colors.danger : colors.accent },
          calories === 0 && styles.barEmpty,
        ]}
      />
      <Text style={styles.barLabel}>{label}</Text>
    </View>
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
  statCard: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(55,214,122,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statLabel: { color: colors.textDim, fontSize: 12 },
  statValue: { color: colors.text, fontSize: 24, fontWeight: '700', marginTop: 4 },
  rtlText: { textAlign: 'right' },
});
