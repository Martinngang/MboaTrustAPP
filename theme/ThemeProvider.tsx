import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { lightColors, darkColors, statusTonesLight, statusTonesDark, type ThemeColors, type StatusTone } from './tokens';

export type ThemePreference = 'light' | 'dark' | 'system';
const THEME_PREF_KEY = 'mboatrust:themePreference';
const SUNLIGHT_PREF_KEY = 'mboatrust:sunlightMode';

interface ThemeContextValue {
  colors: ThemeColors;
  statusTones: typeof statusTonesLight;
  mode: 'light' | 'dark';
  preference: ThemePreference;
  isSunlightMode: boolean;
  toggleSunlightMode: () => void;
  setPreference: (m: ThemePreference) => void;
  ready: boolean;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const system = useColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>('system');
  const [isSunlightMode, setIsSunlightMode] = useState(false);
  const [ready, setReady] = useState(false);
  const mode: 'light' | 'dark' = preference === 'system' ? (system === 'dark' ? 'dark' : 'light') : preference;

  useEffect(() => {
    (async () => {
      const saved = await AsyncStorage.getItem(THEME_PREF_KEY);
      if (saved === 'light' || saved === 'dark' || saved === 'system') setPreferenceState(saved);
      const savedSunlight = await AsyncStorage.getItem(SUNLIGHT_PREF_KEY);
      if (savedSunlight === 'true') setIsSunlightMode(true);
      setReady(true);
    })();
  }, []);

  const setPreference = (m: ThemePreference) => {
    setPreferenceState(m);
    AsyncStorage.setItem(THEME_PREF_KEY, m).catch(() => {});
  };

  const toggleSunlightMode = () => {
    setIsSunlightMode((prev) => {
      const next = !prev;
      AsyncStorage.setItem(SUNLIGHT_PREF_KEY, String(next)).catch(() => {});
      return next;
    });
  };

  const baseColors = mode === 'dark' ? darkColors : lightColors;
  const activeColors = isSunlightMode
    ? {
        ...baseColors,
        surface: '#FFFFFF',
        parchment: '#F2F2F2',
        parchmentDark: '#000000',
        ink: '#000000',
        inkMuted: '#000000',
        forest: '#055938',
        forestDark: '#002B18',
      }
    : baseColors;

  const value = useMemo<ThemeContextValue>(
    () => ({
      colors: activeColors,
      statusTones: mode === 'dark' ? statusTonesDark : statusTonesLight,
      mode,
      preference,
      isSunlightMode,
      toggleSunlightMode,
      setPreference,
      ready,
    }),
    [mode, preference, isSunlightMode, ready]
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
