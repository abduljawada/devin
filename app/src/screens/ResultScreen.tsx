import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { AnalyzeResult, FoodItem } from '../api';
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
  onSave: (item: FoodItem, meal: string) => void;
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
  const [index, setIndex] = useState(0);
  const [factor, setFactor] = useState(1);
  const [meal, setMeal] = useState<string>('lunch');

  const base = result?.items[index];
  const item = useMemo(() => (base ? scaled(base, factor) : null), [base, factor]);
  const title = item ? (locale === 'ar' && item.name_ar ? item.name_ar : item.name) : '';

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Image source={{ uri: photoUri }} style={styles.photo} />

      {analyzing ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.accent} size="large" />
          <Text style={styles.analyzing}>{t('analyzing')}</Text>
        </View>
      ) : null}

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {!analyzing && result && result.items.length === 0 ? (
        <Text style={styles.error}>{t('noFood')}</Text>
      ) : null}

      {item ? (
        <View style={styles.card}>
          <Text style={[styles.title, rtl && styles.rtlText]}>{title}</Text>
          <Text style={[styles.meta, rtl && styles.rtlText]}>
            {Math.round(item.confidence * 100)}% {t('confidence')}
            {result?.cached ? ` · ${t('cached')}` : ''}
          </Text>

          <Text style={styles.calories}>
            {Math.round(item.calories)} <Text style={styles.caloriesUnit}>{t('kcal')}</Text>
          </Text>

          <View style={styles.macroRow}>
            <Macro label={t('protein')} value={item.protein_g} color={colors.protein} />
            <Macro label={t('carbs')} value={item.carbs_g} color={colors.carbs} />
            <Macro label={t('fat')} value={item.fat_g} color={colors.fat} />
          </View>

          <Text style={[styles.sectionLabel, rtl && styles.rtlText]}>
            {t('portion')} · {item.portion_g} g
          </Text>
          <View style={styles.chipRow}>
            {SCALES.map((value) => (
              <Chip
                key={value}
                label={`${value}×`}
                active={factor === value}
                onPress={() => setFactor(value)}
              />
            ))}
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

          {result && (result.items.length > 1 || result.alternatives.length > 0) ? (
            <>
              <Text style={[styles.sectionLabel, rtl && styles.rtlText]}>{t('notRight')}</Text>
              <View style={styles.chipRow}>
                {result.items.map((candidate, candidateIndex) => (
                  <Chip
                    key={`${candidate.name}-${candidateIndex}`}
                    label={locale === 'ar' && candidate.name_ar ? candidate.name_ar : candidate.name}
                    active={candidateIndex === index}
                    onPress={() => {
                      setIndex(candidateIndex);
                      setFactor(1);
                    }}
                  />
                ))}
                {result.alternatives.map((alternative) => (
                  <Chip key={alternative} label={alternative} active={false} muted />
                ))}
              </View>
            </>
          ) : null}
        </View>
      ) : null}

      <View style={styles.actions}>
        <Pressable style={styles.secondary} onPress={onRetake}>
          <Text style={styles.secondaryText}>{t('retake')}</Text>
        </Pressable>
        <Pressable
          style={[styles.primary, (!item || saving) && styles.disabled]}
          disabled={!item || saving}
          onPress={() => item && onSave(item, meal)}
        >
          <Text style={styles.primaryText}>{saving ? '…' : t('save')}</Text>
        </Pressable>
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
  <Pressable
    onPress={onPress}
    disabled={!onPress}
    style={[styles.chip, active && styles.chipActive, muted && styles.chipMuted]}
  >
    <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
  </Pressable>
);

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 60, gap: 14 },
  photo: { width: '100%', height: 220, borderRadius: radius.md, backgroundColor: colors.surfaceAlt },
  center: { alignItems: 'center', gap: 10, paddingVertical: 16 },
  analyzing: { color: colors.textDim },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    gap: 10,
  },
  title: { color: colors.text, fontSize: 22, fontWeight: '700', textTransform: 'capitalize' },
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
  actions: { flexDirection: 'row', gap: 12 },
  primary: {
    flex: 2,
    backgroundColor: colors.accent,
    paddingVertical: 15,
    borderRadius: radius.pill,
    alignItems: 'center',
  },
  primaryText: { color: '#06240F', fontWeight: '700', fontSize: 15 },
  secondary: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 15,
    borderRadius: radius.pill,
    alignItems: 'center',
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
