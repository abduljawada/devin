import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { AnalyzeResult, FoodItem } from '../api';
import { FadeIn } from '../components/FadeIn';
import { Tap } from '../components/Tap';
import { useSettings } from '../settings';
import { colors, radius } from '../theme';

const MEALS = ['breakfast', 'lunch', 'dinner', 'snack'] as const;
const SCALES = [0.5, 1, 1.5, 2];

type Props = {
  photoUri: string;
  result: AnalyzeResult | null;
  analyzing: boolean;
  error: string | null;
  saving: boolean;
  onSave: (items: FoodItem[], meal: string) => void;
  onRetake: () => void;
};

const scaled = (item: FoodItem, factor: number): FoodItem => ({
  ...item,
  portion_g: Math.round(item.portion_g * factor),
  calories: Math.round(item.calories * factor),
  protein_g: Math.round(item.protein_g * factor * 10) / 10,
  carbs_g: Math.round(item.carbs_g * factor * 10) / 10,
  fat_g: Math.round(item.fat_g * factor * 10) / 10,
});

export const ResultScreen = ({
  photoUri,
  result,
  analyzing,
  error,
  saving,
  onSave,
  onRetake,
}: Props) => {
  const { t, rtl, locale } = useSettings();
  const [factors, setFactors] = useState<Record<number, number>>({});
  const [skipped, setSkipped] = useState<Record<number, boolean>>({});
  const [meal, setMeal] = useState<string>('lunch');

  const items = useMemo(
    () =>
      (result?.items ?? []).map((candidate, candidateIndex) =>
        scaled(candidate, factors[candidateIndex] ?? 1),
      ),
    [result, factors],
  );
  const picked = items.filter((_, candidateIndex) => !skipped[candidateIndex]);
  const totals = picked.reduce(
    (acc, entry) => ({
      calories: acc.calories + entry.calories,
      protein_g: Math.round((acc.protein_g + entry.protein_g) * 10) / 10,
      carbs_g: Math.round((acc.carbs_g + entry.carbs_g) * 10) / 10,
      fat_g: Math.round((acc.fat_g + entry.fat_g) * 10) / 10,
    }),
    { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 },
  );

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Image source={{ uri: photoUri }} style={styles.photo} />

      {analyzing ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.accent} size="large" />
          <Text style={styles.analyzing}>{t('analyzing')}</Text>
          <Skeleton />
          <Skeleton />
        </View>
      ) : null}

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {!analyzing && result && result.items.length === 0 ? (
        <Text style={styles.error}>{t('noFood')}</Text>
      ) : null}

      {items.length > 0 ? (
        <FadeIn style={styles.card}>
          <View style={[styles.totalHead, rtl && styles.itemHeadRtl]}>
            <Text style={[styles.sectionLabel, rtl && styles.rtlText]}>
              {t('total')}
              {result?.cached ? ` · ${t('cached')}` : ''}
            </Text>
            <View style={styles.badge}>
              <Ionicons
                name={result?.analyzer === 'barcode' ? 'barcode-outline' : 'sparkles-outline'}
                size={12}
                color={colors.accent}
              />
              <Text style={styles.badgeText}>
                {t(result?.analyzer === 'barcode' ? 'fromBarcode' : 'fromVision')}
              </Text>
            </View>
          </View>
          <Text style={styles.calories}>
            {Math.round(totals.calories)} <Text style={styles.caloriesUnit}>{t('kcal')}</Text>
          </Text>
          <View style={styles.macroRow}>
            <Macro label={t('protein')} value={totals.protein_g} color={colors.protein} />
            <Macro label={t('carbs')} value={totals.carbs_g} color={colors.carbs} />
            <Macro label={t('fat')} value={totals.fat_g} color={colors.fat} />
          </View>

          <Text style={[styles.sectionLabel, rtl && styles.rtlText]}>{t('meal')}</Text>
          <View style={styles.chipRow}>
            {MEALS.map((value) => (
              <Chip
                key={value}
                label={t(value)}
                active={meal === value}
                onPress={() => setMeal(value)}
              />
            ))}
          </View>
        </FadeIn>
      ) : null}

      {items.length > 0 ? (
        <Text style={[styles.sectionLabel, rtl && styles.rtlText]}>{t('detected')}</Text>
      ) : null}

      {items.map((entry, entryIndex) => {
        const off = !!skipped[entryIndex];
        return (
          <FadeIn
            key={`${entry.name}-${entryIndex}`}
            delay={80 + entryIndex * 70}
            style={[styles.card, off && styles.cardOff]}
          >
            <View style={[styles.itemHead, rtl && styles.itemHeadRtl]}>
              <View style={styles.itemHeadText}>
                <Text style={[styles.title, rtl && styles.rtlText]}>
                  {locale === 'ar' && entry.name_ar ? entry.name_ar : entry.name}
                </Text>
                <Text style={[styles.meta, rtl && styles.rtlText]}>
                  {Math.round(entry.confidence * 100)}% {t('confidence')} · {entry.portion_g} g ·{' '}
                  {Math.round(entry.calories)} {t('kcal')}
                </Text>
              </View>
              <Chip
                label={off ? t('include') : t('skip')}
                active={false}
                onPress={() => setSkipped({ ...skipped, [entryIndex]: !off })}
              />
            </View>

            <View style={styles.macroRow}>
              <Macro label={t('protein')} value={entry.protein_g} color={colors.protein} />
              <Macro label={t('carbs')} value={entry.carbs_g} color={colors.carbs} />
              <Macro label={t('fat')} value={entry.fat_g} color={colors.fat} />
            </View>

            <Text style={[styles.sectionLabel, rtl && styles.rtlText]}>{t('portion')}</Text>
            <View style={styles.chipRow}>
              {SCALES.map((value) => (
                <Chip
                  key={value}
                  label={`${value}×`}
                  active={(factors[entryIndex] ?? 1) === value}
                  onPress={() => setFactors({ ...factors, [entryIndex]: value })}
                />
              ))}
            </View>
          </FadeIn>
        );
      })}

      {result && result.alternatives.length > 0 ? (
        <View>
          <Text style={[styles.sectionLabel, rtl && styles.rtlText]}>{t('notRight')}</Text>
          <View style={styles.chipRow}>
            {result.alternatives.map((alternative) => (
              <Chip key={alternative} label={alternative} active={false} muted />
            ))}
          </View>
        </View>
      ) : null}

      <View style={[styles.actions, rtl && styles.itemHeadRtl]}>
        <Tap style={styles.secondary} onPress={onRetake}>
          <Ionicons name="camera-reverse-outline" size={17} color={colors.text} />
          <Text style={styles.secondaryText}>{t('retake')}</Text>
        </Tap>
        <Tap
          style={styles.primaryWrap}
          disabled={picked.length === 0 || saving}
          haptic={Haptics.ImpactFeedbackStyle.Medium}
          onPress={() => onSave(picked, meal)}
        >
          <LinearGradient
            colors={[colors.accent, '#8CF0B4']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.primary}
          >
            {saving ? (
              <ActivityIndicator color="#06240F" />
            ) : (
              <>
                <Ionicons name="add-circle" size={18} color="#06240F" />
                <Text style={styles.primaryText}>
                  {t('save')}
                  {picked.length > 1 ? ` (${picked.length})` : ''}
                </Text>
              </>
            )}
          </LinearGradient>
        </Tap>
      </View>
    </ScrollView>
  );
};

const Macro = ({ label, value, color }: { label: string; value: number; color: string }) => (
  <View style={styles.macro}>
    <View style={[styles.dot, { backgroundColor: color }]} />
    <Text style={styles.macroValue}>{value} g</Text>
    <Text style={styles.macroLabel}>{label}</Text>
  </View>
);

const Chip = ({
  label,
  active,
  muted,
  onPress,
}: {
  label: string;
  active: boolean;
  muted?: boolean;
  onPress?: () => void;
}) => (
  <Tap
    onPress={onPress}
    disabled={!onPress}
    scaleTo={0.93}
    haptic={Haptics.ImpactFeedbackStyle.Light}
    style={[styles.chip, active && styles.chipActive, muted && styles.chipMuted]}
  >
    <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
  </Tap>
);

/** Pulsing placeholder shown while the server is still reading the photo. */
const Skeleton = () => {
  const shimmer = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, {
          toValue: 0.9,
          duration: 700,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(shimmer, {
          toValue: 0.35,
          duration: 700,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [shimmer]);

  return <Animated.View style={[styles.skeleton, { opacity: shimmer }]} />;
};

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 60, gap: 14 },
  photo: { width: '100%', height: 220, borderRadius: radius.md, backgroundColor: colors.surfaceAlt },
  center: { alignItems: 'stretch', gap: 10, paddingVertical: 16 },
  analyzing: { color: colors.textDim, textAlign: 'center' },
  skeleton: {
    height: 64,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    gap: 10,
  },
  cardOff: { opacity: 0.45 },
  totalHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(55,214,122,0.12)',
  },
  badgeText: { color: colors.accent, fontSize: 11, fontWeight: '600' },
  itemHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  itemHeadRtl: { flexDirection: 'row-reverse' },
  itemHeadText: { flex: 1, gap: 2 },
  title: { color: colors.text, fontSize: 19, fontWeight: '700', textTransform: 'capitalize' },
  meta: { color: colors.textDim, fontSize: 12 },
  calories: { color: colors.accent, fontSize: 36, fontWeight: '800' },
  caloriesUnit: { fontSize: 14, color: colors.textDim, fontWeight: '600' },
  macroRow: { flexDirection: 'row', gap: 18 },
  macro: { alignItems: 'center', gap: 2 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  macroValue: { color: colors.text, fontWeight: '600' },
  macroLabel: { color: colors.textDim, fontSize: 11 },
  sectionLabel: { color: colors.textDim, fontSize: 12, marginTop: 6 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  chipMuted: { opacity: 0.55 },
  chipText: { color: colors.text, fontSize: 13, textTransform: 'capitalize' },
  chipTextActive: { color: '#06240F', fontWeight: '700' },
  actions: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  primaryWrap: { flex: 2 },
  primary: {
    flexDirection: 'row',
    gap: 7,
    paddingVertical: 15,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: { color: '#06240F', fontWeight: '700', fontSize: 15 },
  secondary: {
    flex: 1,
    flexDirection: 'row',
    gap: 6,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 15,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryText: { color: colors.text, fontWeight: '600' },
  disabled: { opacity: 0.45 },
  error: {
    color: colors.danger,
    backgroundColor: '#3A1B1F',
    padding: 12,
    borderRadius: radius.sm,
    fontSize: 13,
  },
  rtlText: { textAlign: 'right' },
});
