import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { DaySummary, Entry } from '../api';
import { CalorieRing } from '../components/CalorieRing';
import { EntryRow } from '../components/EntryRow';
import { FadeIn } from '../components/FadeIn';
import { MacroBars } from '../components/MacroBars';
import { useSettings } from '../settings';
import { colors, radius } from '../theme';

type Props = {
  summary: DaySummary | null;
  entries: Entry[];
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
  onDelete: (id: number) => void;
};

export const TodayScreen = ({ summary, entries, loading, error, onRefresh, onDelete }: Props) => {
  const { t, rtl, locale, baseUrl } = useSettings();

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={onRefresh} tintColor={colors.accent} />
      }
    >
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <LinearGradient
        colors={['rgba(55,214,122,0.14)', 'transparent']}
        style={styles.ringCard}
      >
        {summary ? (
          <CalorieRing
            consumed={summary.totals.calories}
            goal={summary.goal.calories}
            remainingLabel={t('remaining')}
            overLabel={t('over')}
            unit={t('kcal')}
          />
        ) : (
          <ActivityIndicator color={colors.accent} size="large" />
        )}
      </LinearGradient>

      {summary ? (
        <FadeIn delay={120} style={styles.card}>
          <MacroBars
            rtl={rtl}
            macros={[
              {
                label: t('protein'),
                value: summary.totals.protein_g,
                goal: summary.goal.protein_g,
                color: colors.protein,
              },
              {
                label: t('carbs'),
                value: summary.totals.carbs_g,
                goal: summary.goal.carbs_g,
                color: colors.carbs,
              },
              {
                label: t('fat'),
                value: summary.totals.fat_g,
                goal: summary.goal.fat_g,
                color: colors.fat,
              },
            ]}
          />
        </FadeIn>
      ) : null}

      {entries.length === 0 && !loading ? (
        <FadeIn delay={180} style={styles.empty}>
          <View style={styles.emptyIcon}>
            <Ionicons name="camera-outline" size={26} color={colors.accent} />
          </View>
          <Text style={styles.emptyTitle}>{t('eatenNothing')}</Text>
          <Text style={styles.emptyHint}>{t('eatenNothingHint')}</Text>
        </FadeIn>
      ) : (
        <View style={styles.list}>
          {entries.map((entry, index) => (
            <FadeIn key={entry.id} delay={140 + index * 60}>
              <EntryRow
                entry={entry}
                baseUrl={baseUrl}
                locale={locale}
                rtl={rtl}
                deleteLabel={t('delete')}
                onDelete={onDelete}
              />
            </FadeIn>
          ))}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 140, gap: 14 },
  ringCard: { alignItems: 'center', paddingVertical: 14, borderRadius: radius.lg },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  list: { gap: 10 },
  empty: { alignItems: 'center', paddingVertical: 28, gap: 8 },
  emptyIcon: {
    width: 54,
    height: 54,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: { color: colors.text, fontSize: 16, fontWeight: '600' },
  emptyHint: { color: colors.textDim, fontSize: 13 },
  error: {
    color: colors.danger,
    backgroundColor: '#3A1B1F',
    padding: 12,
    borderRadius: radius.sm,
    fontSize: 13,
  },
});
