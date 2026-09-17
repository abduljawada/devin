import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { Profile } from '../api';
import { FadeIn } from '../components/FadeIn';
import { Tap } from '../components/Tap';
import { Locale } from '../i18n';
import { useSettings } from '../settings';
import { colors, radius } from '../theme';

type Props = {
  profile: Profile | null;
  onSaveProfile: (profile: Profile) => Promise<void>;
};

export const SettingsScreen = ({ profile, onSaveProfile }: Props) => {
  const { t, rtl, locale, baseUrl, update } = useSettings();
  const [url, setUrl] = useState(baseUrl);
  const [goals, setGoals] = useState({
    calorie_goal: '2000',
    protein_goal_g: '130',
    carbs_goal_g: '220',
    fat_goal_g: '65',
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (profile) {
      setGoals({
        calorie_goal: String(Math.round(profile.calorie_goal)),
        protein_goal_g: String(Math.round(profile.protein_goal_g)),
        carbs_goal_g: String(Math.round(profile.carbs_goal_g)),
        fat_goal_g: String(Math.round(profile.fat_goal_g)),
      });
    }
  }, [profile]);

  const save = async () => {
    await update({ baseUrl: url.trim() });
    await onSaveProfile({
      calorie_goal: Number(goals.calorie_goal) || 2000,
      protein_goal_g: Number(goals.protein_goal_g) || 130,
      carbs_goal_g: Number(goals.carbs_goal_g) || 220,
      fat_goal_g: Number(goals.fat_goal_g) || 65,
      locale,
    });
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  };

  const field = (label: string, key: keyof typeof goals) => (
    <View style={styles.field}>
      <Text style={[styles.label, rtl && styles.rtlText]}>{label}</Text>
      <TextInput
        style={[styles.input, rtl && styles.rtlText]}
        keyboardType="number-pad"
        value={goals[key]}
        onChangeText={(value) => setGoals((current) => ({ ...current, [key]: value }))}
        placeholderTextColor={colors.textDim}
      />
    </View>
  );

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <FadeIn style={styles.card}>
        <View style={[styles.cardHead, rtl && styles.cardHeadRtl]}>
          <Ionicons name="language-outline" size={16} color={colors.textDim} />
          <Text style={styles.label}>{t('language')}</Text>
        </View>
        <View style={styles.row}>
          {(['en', 'ar'] as Locale[]).map((value) => (
            <Tap
              key={value}
              scaleTo={0.93}
              style={[styles.chip, locale === value && styles.chipActive]}
              onPress={() => update({ locale: value })}
            >
              <Text style={[styles.chipText, locale === value && styles.chipTextActive]}>
                {value === 'en' ? 'English' : 'العربية'}
              </Text>
            </Tap>
          ))}
        </View>
      </FadeIn>

      <FadeIn delay={90} style={styles.card}>
        {field(t('goal'), 'calorie_goal')}
        {field(t('proteinGoal'), 'protein_goal_g')}
        {field(t('carbsGoal'), 'carbs_goal_g')}
        {field(t('fatGoal'), 'fat_goal_g')}
      </FadeIn>

      <FadeIn delay={160} style={styles.card}>
        <View style={[styles.cardHead, rtl && styles.cardHeadRtl]}>
          <Ionicons name="cloud-outline" size={16} color={colors.textDim} />
          <Text style={styles.label}>{t('serverUrl')}</Text>
        </View>
        <TextInput
          style={styles.input}
          value={url}
          onChangeText={setUrl}
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="https://…"
          placeholderTextColor={colors.textDim}
        />
      </FadeIn>

      <Tap onPress={save} haptic={null}>
        <LinearGradient
          colors={saved ? ['#8CF0B4', colors.accent] : [colors.accent, '#8CF0B4']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.primary}
        >
          <Ionicons name={saved ? 'checkmark-circle' : 'save-outline'} size={17} color="#06240F" />
          <Text style={styles.primaryText}>{saved ? t('saved') : t('saveSettings')}</Text>
        </LinearGradient>
      </Tap>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 140, gap: 14 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    gap: 12,
  },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  cardHeadRtl: { flexDirection: 'row-reverse' },
  field: { gap: 6 },
  label: { color: colors.textDim, fontSize: 12 },
  input: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  row: { flexDirection: 'row', gap: 8 },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  chipText: { color: colors.text },
  chipTextActive: { color: '#06240F', fontWeight: '700' },
  primary: {
    flexDirection: 'row',
    gap: 7,
    paddingVertical: 15,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: { color: '#06240F', fontWeight: '700', fontSize: 15 },
  rtlText: { textAlign: 'right' },
});
