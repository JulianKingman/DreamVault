import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme, AppState, AppStateStatus } from 'react-native';
import { storage } from '../utils/storage';

const THEME_KEY = 'theme_preference';

type ThemeMode = 'light' | 'dark' | 'midnight' | 'system' | 'auto';
type ResolvedTheme = 'light' | 'dark' | 'midnight';

interface ThemeContextValue {
  themeMode: ThemeMode;
  resolvedTheme: ResolvedTheme;
  setThemeMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

/**
 * Time-of-day theme for "auto" mode:
 *   09:00–20:00              -> light
 *   20:00–23:00, 05:00–09:00 -> twilight (internal name: 'dark')
 *   23:00–05:00              -> midnight
 */
export function resolveAutoTheme(date: Date): ResolvedTheme {
  const h = date.getHours();
  if (h >= 9 && h < 20) return 'light';
  if ((h >= 20 && h < 23) || (h >= 5 && h < 9)) return 'dark';
  return 'midnight';
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemColorScheme = useColorScheme();

  const [themeMode, setThemeModeState] = useState<ThemeMode>(() => {
    const stored = storage.getString(THEME_KEY);
    return (stored as ThemeMode) ?? 'dark';
  });

  // Ticks forward so "auto" mode re-resolves as the clock crosses thresholds.
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    if (themeMode !== 'auto') return;
    // Re-resolve immediately on entering auto, then once a minute, and
    // whenever the app comes back to the foreground.
    setNow(new Date());
    const interval = setInterval(() => setNow(new Date()), 60_000);
    const sub = AppState.addEventListener('change', (s: AppStateStatus) => {
      if (s === 'active') setNow(new Date());
    });
    return () => {
      clearInterval(interval);
      sub.remove();
    };
  }, [themeMode]);

  const resolvedTheme: ResolvedTheme =
    themeMode === 'system'
      ? (systemColorScheme ?? 'dark')
      : themeMode === 'auto'
        ? resolveAutoTheme(now)
        : themeMode;

  const setThemeMode = (mode: ThemeMode) => {
    storage.set(THEME_KEY, mode);
    setThemeModeState(mode);
  };

  return (
    <ThemeContext.Provider
      value={{ themeMode, resolvedTheme, setThemeMode }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
