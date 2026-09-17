import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useRef } from 'react';
import { Animated, Easing, Image, StyleSheet, Text, View } from 'react-native';

import { Entry, mediaUrl } from '../api';
import { colors, radius } from '../theme';
import { Tap } from './Tap';

type Props = {
  entry: Entry;
  baseUrl: string;
  locale: 'en' | 'ar';
  rtl: boolean;
  deleteLabel: string;
  onDelete: (id: number) => void;
};

export const EntryRow = ({ entry, baseUrl, locale, rtl, deleteLabel, onDelete }: Props) => {
  const title = locale === 'ar' && entry.name_ar ? entry.name_ar : entry.name;
  const photo = mediaUrl(baseUrl, entry.photo_url);
  const exit = useRef(new Animated.Value(1)).current;

  const remove = () => {
    Animated.timing(exit, {
      toValue: 0,
      duration: 200,
      easing: Easing.in(Easing.quad),
      useNativeDriver: true,
    }).start(() => onDelete(entry.id));
  };

  return (
    <Animated.View
      style={{
        opacity: exit,
        transform: [
          { scale: exit.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1] }) },
          {
            translateX: exit.interpolate({
              inputRange: [0, 1],
              outputRange: [rtl ? -40 : 40, 0],
            }),
          },
        ],
      }}
    >
      <View style={[styles.row, rtl && styles.rowRtl]}>
        {photo ? (
          <Image source={{ uri: photo }} style={styles.thumb} />
        ) : (
          <View style={[styles.thumb, styles.thumbEmpty]}>
            <Ionicons name="restaurant-outline" size={18} color={colors.textDim} />
          </View>
        )}
        <View style={styles.body}>
          <Text style={[styles.title, rtl && styles.rtlText]} numberOfLines={1}>
            {title}
          </Text>
          <Text style={[styles.meta, rtl && styles.rtlText]}>
            {Math.round(entry.portion_g)} g · P {Math.round(entry.protein_g)} · C{' '}
            {Math.round(entry.carbs_g)} · F {Math.round(entry.fat_g)}
          </Text>
        </View>
        <View style={styles.tail}>
          <Text style={styles.kcal}>{Math.round(entry.calories)}</Text>
          <Tap
            onPress={remove}
            haptic={Haptics.ImpactFeedbackStyle.Medium}
            style={styles.deleteButton}
            hitSlop={8}
            scaleTo={0.85}
          >
            <Ionicons name="trash-outline" size={15} color={colors.danger} />
            <Text style={styles.delete}>{deleteLabel}</Text>
          </Tap>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rowRtl: { flexDirection: 'row-reverse' },
  thumb: {
    width: 48,
    height: 48,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbEmpty: { borderWidth: 1, borderColor: colors.border },
  body: { flex: 1 },
  title: { color: colors.text, fontSize: 15, fontWeight: '600' },
  meta: { color: colors.textDim, fontSize: 12, marginTop: 3 },
  tail: { alignItems: 'flex-end' },
  kcal: { color: colors.accent, fontSize: 16, fontWeight: '700' },
  deleteButton: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 4 },
  delete: { color: colors.textDim, fontSize: 11 },
  rtlText: { textAlign: 'right' },
});
