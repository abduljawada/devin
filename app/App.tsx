import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';

import {
  AnalyzeResult,
  DaySummary,
  Entry,
  FoodItem,
  HistoryPoint,
  Profile,
  api,
} from './src/api';
import { CaptureScreen } from './src/screens/CaptureScreen';
import { HistoryScreen } from './src/screens/HistoryScreen';
import { ResultScreen } from './src/screens/ResultScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { TodayScreen } from './src/screens/TodayScreen';
import { SettingsProvider, useSettings } from './src/settings';
import { colors, radius } from './src/theme';

type Tab = 'today' | 'history' | 'settings';
type Mode = { kind: 'tabs' } | { kind: 'capture' } | { kind: 'result'; photoUri: string };

const Shell = () => {
  const { t, rtl, baseUrl, ready } = useSettings();
  const [tab, setTab] = useState<Tab>('today');
  const [mode, setMode] = useState<Mode>({ kind: 'tabs' });

  const [summary, setSummary] = useState<DaySummary | null>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [history, setHistory] = useState<HistoryPoint[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [result, setResult] = useState<AnalyzeResult | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [nextSummary, nextEntries, nextHistory, nextProfile] = await Promise.all([
        api.summary(baseUrl),
        api.entries(baseUrl),
        api.history(baseUrl),
        api.profile(baseUrl),
      ]);
      setSummary(nextSummary);
      setEntries(nextEntries);
      setHistory(nextHistory);
      setProfile(nextProfile);
      setError(null);
    } catch {
      setError(t('connectionFailed'));
    } finally {
      setLoading(false);
    }
  }, [baseUrl, t]);

  useEffect(() => {
    if (ready) {
      void refresh();
    }
  }, [ready, refresh]);

  const analyze = async (photoUri: string) => {
    setMode({ kind: 'result', photoUri });
    setResult(null);
    setAnalyzeError(null);
    setAnalyzing(true);
    try {
      setResult(await api.analyze(baseUrl, photoUri));
    } catch {
      setAnalyzeError(t('analyzeFailed'));
    } finally {
      setAnalyzing(false);
    }
  };

  const saveItems = async (items: FoodItem[], meal: string) => {
    setSaving(true);
    try {
      for (const item of items) {
        await api.addEntry(baseUrl, {
          name: item.name,
          name_ar: item.name_ar,
          portion_g: item.portion_g,
          calories: item.calories,
          protein_g: item.protein_g,
          carbs_g: item.carbs_g,
          fat_g: item.fat_g,
          meal,
          photo_url: result?.photo_url ?? null,
        });
      }
      setMode({ kind: 'tabs' });
      setTab('today');
      await refresh();
    } catch {
      setAnalyzeError(t('connectionFailed'));
    } finally {
      setSaving(false);
    }
  };

  const removeEntry = async (id: number) => {
    await api.deleteEntry(baseUrl, id);
    await refresh();
  };

  if (mode.kind === 'capture') {
    return (
      <CaptureScreen onCaptured={analyze} onCancel={() => setMode({ kind: 'tabs' })} />
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={[styles.header, rtl && styles.headerRtl]}>
        <Text style={styles.brand}>{t('appName')}</Text>
        <Text style={styles.headerTab}>{t(mode.kind === 'result' ? 'snapFood' : tab)}</Text>
      </View>

      <View style={styles.body}>
        {mode.kind === 'result' ? (
          <ResultScreen
            photoUri={mode.photoUri}
            result={result}
            analyzing={analyzing}
            error={analyzeError}
            saving={saving}
            onSave={saveItems}
            onRetake={() => setMode({ kind: 'capture' })}
          />
        ) : tab === 'today' ? (
          <TodayScreen
            summary={summary}
            entries={entries}
            loading={loading}
            error={error}
            onRefresh={refresh}
            onDelete={removeEntry}
          />
        ) : tab === 'history' ? (
          <HistoryScreen points={history} />
        ) : (
          <SettingsScreen
            profile={profile}
            onSaveProfile={async (next) => {
              await api.saveProfile(baseUrl, next);
              await refresh();
            }}
          />
        )}
      </View>

      {mode.kind === 'tabs' ? (
        <View style={[styles.tabBar, rtl && styles.headerRtl]}>
          <TabButton label={t('today')} active={tab === 'today'} onPress={() => setTab('today')} />
          <Pressable style={styles.fab} onPress={() => setMode({ kind: 'capture' })}>
            <Text style={styles.fabIcon}>+</Text>
          </Pressable>
          <TabButton
            label={t('history')}
            active={tab === 'history'}
            onPress={() => setTab('history')}
          />
          <TabButton
            label={t('settings')}
            active={tab === 'settings'}
            onPress={() => setTab('settings')}
          />
        </View>
      ) : null}

      <StatusBar style="light" />
    </SafeAreaView>
  );
};

const TabButton = ({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) => (
  <Pressable onPress={onPress} style={styles.tabButton}>
    <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{label}</Text>
  </Pressable>
);

export default function App() {
  return (
    <SettingsProvider>
      <Shell />
    </SettingsProvider>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },
  headerRtl: { flexDirection: 'row-reverse' },
  brand: { color: colors.accent, fontSize: 20, fontWeight: '800' },
  headerTab: { color: colors.textDim, fontSize: 13 },
  body: { flex: 1 },
  tabBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingVertical: 10,
  },
  tabButton: { paddingHorizontal: 10, paddingVertical: 8 },
  tabLabel: { color: colors.textDim, fontSize: 13, fontWeight: '600' },
  tabLabelActive: { color: colors.text },
  fab: {
    width: 56,
    height: 56,
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -26,
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  fabIcon: { color: '#06240F', fontSize: 30, fontWeight: '800', marginTop: -3 },
});
