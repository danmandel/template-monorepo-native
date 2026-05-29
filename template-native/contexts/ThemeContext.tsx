import * as SecureStore from 'expo-secure-store';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Platform, useColorScheme as useRNColorScheme } from 'react-native';

import type { ColorScheme } from '@/constants/Colors';

export type ThemePreference = 'system' | 'dark' | 'light';
export type TimeFormatPreference = '12h' | '24h';

interface ThemeContextValue {
  themePreference: ThemePreference;
  setThemePreference: (pref: ThemePreference) => void;
  timeFormatPreference: TimeFormatPreference;
  setTimeFormatPreference: (pref: TimeFormatPreference) => void;
  colorScheme: ColorScheme;
}

const THEME_STORAGE_KEY = 'theme_preference_v1';
const TIME_FORMAT_STORAGE_KEY = 'time_format_preference_v1';

const ThemeContext = createContext<ThemeContextValue>({
  themePreference: 'system',
  setThemePreference: () => {},
  timeFormatPreference: '12h',
  setTimeFormatPreference: () => {},
  colorScheme: 'dark'
});

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const systemScheme = useRNColorScheme();
  const [themePreference, setThemePreferenceState] = useState<ThemePreference>('system');
  const [timeFormatPreference, setTimeFormatPreferenceState] =
    useState<TimeFormatPreference>('12h');

  useEffect(() => {
    (async () => {
      try {
        let storedTheme: string | null = null;
        let storedTimeFormat: string | null = null;
        if (Platform.OS === 'web') {
          storedTheme = globalThis.localStorage?.getItem(THEME_STORAGE_KEY) ?? null;
          storedTimeFormat = globalThis.localStorage?.getItem(TIME_FORMAT_STORAGE_KEY) ?? null;
        } else {
          storedTheme = await SecureStore.getItemAsync(THEME_STORAGE_KEY);
          storedTimeFormat = await SecureStore.getItemAsync(TIME_FORMAT_STORAGE_KEY);
        }
        if (storedTheme === 'dark' || storedTheme === 'light' || storedTheme === 'system') {
          setThemePreferenceState(storedTheme);
        }
        if (storedTimeFormat === '12h' || storedTimeFormat === '24h') {
          setTimeFormatPreferenceState(storedTimeFormat);
        }
      } catch {}
    })();
  }, []);

  const setThemePreference = useCallback((pref: ThemePreference) => {
    setThemePreferenceState(pref);
    try {
      if (Platform.OS === 'web') {
        globalThis.localStorage?.setItem(THEME_STORAGE_KEY, pref);
      } else {
        SecureStore.setItemAsync(THEME_STORAGE_KEY, pref);
      }
    } catch {}
  }, []);

  const setTimeFormatPreference = useCallback((pref: TimeFormatPreference) => {
    setTimeFormatPreferenceState(pref);
    try {
      if (Platform.OS === 'web') {
        globalThis.localStorage?.setItem(TIME_FORMAT_STORAGE_KEY, pref);
      } else {
        SecureStore.setItemAsync(TIME_FORMAT_STORAGE_KEY, pref);
      }
    } catch {}
  }, []);

  const colorScheme: ColorScheme = useMemo(() => {
    if (themePreference === 'system') return systemScheme ?? 'dark';
    return themePreference;
  }, [themePreference, systemScheme]);

  const value = useMemo(
    () => ({
      themePreference,
      setThemePreference,
      timeFormatPreference,
      setTimeFormatPreference,
      colorScheme
    }),
    [
      themePreference,
      setThemePreference,
      timeFormatPreference,
      setTimeFormatPreference,
      colorScheme
    ]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => useContext(ThemeContext);
