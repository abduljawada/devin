import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { Entry, mediaUrl } from '../api';
import { colors, radius } from '../theme';

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

  return (
    <View style={[styles.row, rtl && styles.rowRtl]}>
      {photo ? (
        <Image source={{ uri: photo }} style={styles.thumb} />
      ) : (
        <View style={[styles.thumb, styles.thumbEmpty]} />
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
        <Pressable onPress={() => onDelete(entry.id)} hitSlop={8}>
          <Text style={styles.delete}>{deleteLabel}</Text>
        </Pressable>
      </View>
    </View>
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
  thumb: { width: 48, height: 48, borderRadius: radius.sm, backgroundColor: colors.surfaceAlt },
  thumbEmpty: { borderWidth: 1, borderColor: colors.border },
  body: { flex: 1 },
  title: { color: colors.text, fontSize: 15, fontWeight: '600' },
  meta: { color: colors.textDim, fontSize: 12, marginTop: 3 },
  tail: { alignItems: 'flex-end' },
  kcal: { color: colors.accent, fontSize: 16, fontWeight: '700' },
  delete: { color: colors.textDim, fontSize: 11, marginTop: 4 },
  rtlText: { textAlign: 'right' },
});
