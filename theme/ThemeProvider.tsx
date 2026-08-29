import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { lightColors, darkColors, statusTonesLight, statusTonesDark, type ThemeColors, type StatusTone } from './tokens';

export type ThemePreference = 'light' | 'dark' | 'system';
const THEME_PREF_KEY = 'mboatrust:themePreference';

interface ThemeContextValue {
  colors: ThemeColors;
  statusTones: typeof statusTonesLight;
  mode: 'light' | 'dark';
  preference: ThemePreference;
  /** UI preference, not a credential — plain AsyncStorage is the right tier
   * for this (see api/secureStorage.ts for what actually needs encryption). */
  setPreference: (m: ThemePreference) => void;
  ready: boolean;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const system = useColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>('system');
  const [ready, setReady] = useState(false);
  const mode: 'light' | 'dark' = preference === 'system' ? (system === 'dark' ? 'dark' : 'light') : preference;

  useEffect(() => {
    (async () => {
      const saved = await AsyncStorage.getItem(THEME_PREF_KEY);
      if (saved === 'light' || saved === 'dark' || saved === 'system') setPreferenceState(saved);
      setReady(true);
    })();
  }, []);

  const setPreference = (m: ThemePreference) => {
    setPreferenceState(m);
    AsyncStorage.setItem(THEME_PREF_KEY, m).catch(() => {});
  };

  const value = useMemo<ThemeContextValue>(
    () => ({
      colors: mode === 'dark' ? darkColors : lightColors,
      statusTones: mode === 'dark' ? statusTonesDark : statusTonesLight,
      mode,
      preference,
      setPreference,
      ready,
    }),
    [mode, preference, ready]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}

export function useStatusTone(tone: StatusTone) {
  const { statusTones } = useTheme();
  return statusTones[tone];
}
