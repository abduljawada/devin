import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

import { DEFAULT_BASE_URL } from './api';
import { Locale, StringKey, isRTL, translate } from './i18n';

const STORAGE_KEY = 'snapcal.settings';

type SettingsState = {
  baseUrl: string;
  locale: Locale;
};

type SettingsContextValue = SettingsState & {
  ready: boolean;
  rtl: boolean;
  t: (key: StringKey) => string;
  update: (patch: Partial<SettingsState>) => Promise<void>;
};

const SettingsContext = createContext<SettingsContextValue | null>(null);

export const SettingsProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, setState] = useState<SettingsState>({
    baseUrl: DEFAULT_BASE_URL,
    locale: 'en',
  });
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (stored) {
          setState((current) => ({ ...current, ...(JSON.parse(stored) as SettingsState) }));
        }
      })
      .catch(() => undefined)
      .finally(() => setReady(true));
  }, []);

  const value = useMemo<SettingsContextValue>(
    () => ({
      ...state,
      ready,
      rtl: isRTL(state.locale),
      t: (key: StringKey) => translate(state.locale, key),
      update: async (patch) => {
        const next = { ...state, ...patch };
        setState(next);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      },
    }),
    [state, ready]
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
};

export const useSettings = (): SettingsContextValue => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used inside SettingsProvider');
  }
  return context;
};
